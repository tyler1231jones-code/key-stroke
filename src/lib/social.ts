// The latest social posts, for the grid on /blog and the homepage. They are
// saved into the site by `npm run social:save` (README, "Social grid"): each
// post's link, date and alt text in src/content/social.json, its picture in
// public/social/. Nothing is loaded from Instagram or TikTok when a page is read.
//
// Rules this file keeps:
//   - The grid shows the newest six posts, and only while the newest is less
//     than 30 days old on the day the site is built: an old feed makes the
//     business look quiet.
//   - A post whose picture is missing stops the build, rather than leaving a gap.
//   - With BLOG_FIXTURES=1 the test posts in tools/fixtures/social.json are
//     shown instead, their pictures written into the page and their dates moved
//     so the newest is today. Nothing from them is ever saved into public/.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import socialJson from '../content/social.json';

export const NETWORKS = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', linkedin: 'LinkedIn' } as const;
export type Network = keyof typeof NETWORKS;
export interface SocialPost {
  network: Network;
  /** The post on the network. */
  url: string;
  /** The day it went out, YYYY-MM-DD. */
  date: string;
  /** Its picture's file name in public/social/. */
  image: string;
  /** What the picture shows. */
  alt: string;
}
interface SocialFile {
  profiles: Partial<Record<Network, string>>;
  posts: SocialPost[];
}

const SHOW = 6;
const FRESH_DAYS = 30;
const FIXTURES = process.env.BLOG_FIXTURES === '1';
const root = process.cwd();

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const daysFrom = (a: string, b: string) => Math.round((day(b) - day(a)) / 86_400_000);
const shift = (iso: string, n: number) => new Date(day(iso) + n * 86_400_000).toISOString().slice(0, 10);

function load(today: string): SocialFile {
  if (!FIXTURES) return socialJson as SocialFile;
  const file: SocialFile = JSON.parse(readFileSync(join(root, 'tools/fixtures/social.json'), 'utf8'));
  const newest = file.posts.map((p) => p.date).sort().at(-1);
  const by = newest ? daysFrom(newest, today) : 0;
  return { ...file, posts: file.posts.map((p) => ({ ...p, date: shift(p.date, by) })) };
}

function srcOf(p: SocialPost): string {
  if (!(p.network in NETWORKS)) throw new Error(`social: "${p.network}" is not a network the grid knows (${Object.keys(NETWORKS).join(', ')})`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error(`social: ${p.url} has the date "${p.date}"; write it YYYY-MM-DD`);
  if (!p.alt?.trim()) throw new Error(`social: ${p.url} has no alt text`);
  const file = FIXTURES ? join(root, 'tools/fixtures/social', p.image) : join(root, 'public/social', p.image);
  if (!existsSync(file)) throw new Error(`social: ${p.url} names the picture ${p.image}, which is not in ${FIXTURES ? 'tools/fixtures/social' : 'public/social'}/`);
  return FIXTURES ? `data:image/webp;base64,${readFileSync(file).toString('base64')}` : `/social/${p.image}`;
}

/** The profiles to link to, by network: only those set in social.json. */
export const profiles = (socialJson as SocialFile).profiles;

/** The posts the grid shows today, newest first, each with its picture's address. Empty when the newest is 30 days old or more. */
export function socialGrid(today: string): (SocialPost & { src: string })[] {
  const list = load(today)
    .posts.map((p) => ({ ...p, src: srcOf(p) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.url.localeCompare(b.url))
    .slice(0, SHOW);
  if (list.length === 0 || daysFrom(list[0].date, today) >= FRESH_DAYS) return [];
  return list;
}
