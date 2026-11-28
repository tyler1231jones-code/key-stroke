// The blog: the posts in order, who wrote them, and what every page that
// shows a post needs (its address, reading time, related posts, its HTML and
// its structured data). The posts are Markdown files in src/content/blog/;
// the rules for them are in the README, "Blog".
//
// Rules this file keeps:
//   - A draft is shown in `npm run dev` and in a drafts build
//     (`npm run blog:build -- --drafts`), never in an ordinary build.
//   - With no published post there is no /blog page, no feed and no link to
//     either: an empty blog looks worse than none.
//   - The blog joins the main menu once there are MENU_AT posts; until then
//     the footer, the service pages and the homepage link to it.
import { getCollection, type CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import peopleJson from '../content/people.json';
import { services, serviceHref, type Service } from './data';
import { abs, shareKey, ORG } from './seo';
import { figureRuns } from './format';

export type Post = CollectionEntry<'blog'>;
export type Person = (typeof peopleJson)[number];

export const MENU_AT = 6;
/** Posts on each page of /blog: three rows of three. Later pages are /blog/2, /blog/3 and so on. */
export const PAGE_SIZE = 9;
export const listHref = (n: number): string => (n <= 1 ? '/blog' : `/blog/${n}`);
export const people: Person[] = peopleJson;
export const BLOG_ID = abs('/blog#blog');

export const CATEGORIES = [
  { id: 'guides', label: 'Guides' },
  { id: 'news', label: 'News' },
  { id: 'work-notes', label: 'Work notes' },
] as const;

export const categoryLabel = (id: string): string => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const person = (id: string): Person => {
  const found = people.find((p) => p.id === id);
  if (!found) throw new Error(`blog: no person "${id}" in people.json`);
  return found;
};
export const personHref = (p: Person): string => `/about#${p.id}`;
export const postHref = (post: Post): string => `/blog/${post.id}`;
export const serviceOf = (post: Post): Service | undefined => services.find((s) => s.id === post.data.service);

const showDrafts = import.meta.env.DEV || process.env.BLOG_DRAFTS === '1';

function load(): Promise<Post[]> {
  return getCollection('blog', ({ data }) => showDrafts || !data.draft).then((list) => {
    list.sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
    for (const post of list) {
      // /blog/2 is the second page of the list, so a post cannot be named with a number alone.
      if (/^\d+$/.test(post.id)) throw new Error(`blog: a post cannot be named "${post.id}"; /blog/${post.id} is a page of the list`);
      const c = post.data.cover;
      // A cover is shown wide above the post and cut to 1200 by 630 to share, so it has to be at least that, and that shape.
      if (c && (c.width < 1200 || Math.abs(c.width / c.height - 1200 / 630) > 0.04)) {
        throw new Error(`blog: ${post.id}'s cover is ${c.width} by ${c.height}; it needs to be at least 1200 by 630, and that shape`);
      }
      for (const id of post.data.related ?? []) {
        if (!list.some((p) => p.id === id)) throw new Error(`blog: ${post.id} lists "${id}" as related, but there is no such post`);
      }
    }
    return list;
  });
}

let cache: Promise<Post[]> | null = null;
/** Every post a visitor can read, newest first. */
export function posts(): Promise<Post[]> {
  if (import.meta.env.DEV) return load();
  cache ??= load();
  return cache;
}

/** The newest posts about one service, for its service page. */
export async function postsFor(serviceId: string, n = 3): Promise<Post[]> {
  return (await posts()).filter((p) => p.data.service === serviceId).slice(0, n);
}

/** Words a reader reads: the body without its Markdown and HTML. */
export function wordCount(post: Post): number {
  const text = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\^[^\]]+\]/g, ' ')
    .replace(/\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`|[\]-]/g, ' ');
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

/** Minutes to read at 220 words a minute, never less than 1. */
export const readingMinutes = (post: Post): number => Math.max(1, Math.ceil(wordCount(post) / 220));

/** Two posts to read next: those the post names, then the same service, then the same kind, newest first. */
export function relatedTo(post: Post, all: Post[]): Post[] {
  const others = all.filter((p) => p.id !== post.id);
  const named = (post.data.related ?? []).map((id) => others.find((p) => p.id === id)).filter((p): p is Post => Boolean(p));
  const score = (p: Post) => (post.data.service && p.data.service === post.data.service ? 2 : 0) + (p.data.category === post.data.category ? 1 : 0);
  const rest = others.filter((p) => !named.includes(p)).sort((a, b) => score(b) - score(a) || b.data.date.localeCompare(a.data.date));
  return [...named, ...rest].slice(0, 2);
}

// Every numeral in running copy is set in the data family. Code and entities are left alone.
function withFigures(html: string): string {
  let inCode = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith('<')) {
        if (/^<(code|pre)\b/i.test(part)) inCode++;
        else if (/^<\/(code|pre)>/i.test(part)) inCode = Math.max(0, inCode - 1);
        return part;
      }
      if (inCode || !/\d/.test(part)) return part;
      return part
        .split(/(&#?\w+;)/)
        .map((t) => (t.startsWith('&') ? t : figureRuns(t).map((r) => (r.fig ? `<span class="fig">${r.text}</span>` : r.text)).join('')))
        .join('');
    })
    .join('');
}

/**
 * The post's body as HTML. Footnotes, which Markdown labels "Footnotes" for
 * screen readers only, are shown as the post's sources. For the feed, links
 * are made absolute and numerals are left as text.
 */
export function postHtml(post: Post, opts: { feed?: boolean } = {}): string {
  let html = post.rendered?.html ?? '';
  html = html.replace(/<h2([^>]*?)\s*class="sr-only"([^>]*)>Footnotes<\/h2>/, '<h2$1$2>Sources</h2>');
  // The link back from a source to its place in the text says so in words: the site uses no symbols as icons.
  html = html.replace(/(<a [^>]*data-footnote-backref[^>]*>)↩(<sup>\d+<\/sup>)?<\/a>/g, '$1Back$2</a>');
  if (opts.feed) return html.replace(/(href|src)="\/(?!\/)/g, `$1="${abs('/')}`);
  // Tables in the site's own frame, which scrolls sideways on a phone.
  html = html.replace(/<table>/g, '<div class="table-frame"><table class="table">').replace(/<\/table>/g, '</table></div>');
  return withFigures(html);
}

/* ---------- Structured data ---------- */

export const personId = (p: Person): string => abs(`${personHref(p)}`);

function personNode(p: Person) {
  return { '@type': 'Person', '@id': personId(p), name: p.name, jobTitle: p.role, url: abs(personHref(p)), worksFor: { '@id': ORG } };
}

/** The post's sections, from its second-level headings, for the contents beside it. The footnotes' heading is left out. */
export function contentsOf(post: Post): { id: string; text: string }[] {
  const html = post.rendered?.html ?? '';
  const plain = (s: string) =>
    s.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
  return [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)]
    .filter(([, id]) => id !== 'footnote-label')
    .map(([, id, inner]) => ({ id, text: plain(inner) }));
}

/** How a share image is cut: the size every network expects. */
const SHARE = { width: 1200, height: 630 };

/** The post's share image: its cover cut to 1200 by 630, or else the page's own from `npm run og`. */
export async function shareOf(post: Post): Promise<{ src: string; width: number; height: number }> {
  const { cover } = post.data;
  if (!cover) return { src: `/og/${shareKey(postHref(post))}.png`, ...SHARE };
  const img = await getImage({ src: cover, ...SHARE, fit: 'cover', format: 'jpg', quality: 82 });
  return { src: img.src, ...SHARE };
}

/** `image` is the share image from shareOf(). */
export function postSchema(post: Post, image: string) {
  const url = abs(postHref(post));
  const s = serviceOf(post);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: post.data.title,
    description: post.data.description,
    url,
    mainEntityOfPage: url,
    datePublished: post.data.date,
    dateModified: post.data.updated ?? post.data.date,
    inLanguage: 'en-AU',
    author: personNode(person(post.data.author)),
    publisher: { '@id': ORG },
    image: abs(image),
    articleSection: categoryLabel(post.data.category),
    wordCount: wordCount(post),
    isPartOf: { '@id': BLOG_ID },
    ...(s ? { about: { '@type': 'Service', name: s.name, url: abs(serviceHref(s)) } } : {}),
  };
}

export function blogSchema(list: Post[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': BLOG_ID,
    name: 'KEYSTROKE blog',
    url: abs('/blog'),
    inLanguage: 'en-AU',
    publisher: { '@id': ORG },
    blogPost: list.map((p) => ({
      '@type': 'BlogPosting',
      '@id': `${abs(postHref(p))}#post`,
      headline: p.data.title,
      url: abs(postHref(p)),
      datePublished: p.data.date,
      author: { '@id': personId(person(p.data.author)) },
    })),
  };
}

/** The two principals, for the About page. */
export function peopleSchema() {
  return people.map((p) => ({
    '@context': 'https://schema.org',
    ...personNode(p),
    description: p.line,
    knowsAbout: p.knows.map((id) => services.find((s) => s.id === id)?.name).filter(Boolean),
  }));
}
