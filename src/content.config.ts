// Content collections. One: the blog, a Markdown file per post in
// src/content/blog/ (README, "Blog"). Files whose name starts with an
// underscore, such as _template.md, are not posts.
//
// BLOG_FIXTURES=1 swaps in the test posts in tools/fixtures/blog/, so the
// layout and the checks can be tried before any real post exists. Nothing
// built that way is ever pushed: the share images it makes are replaced by
// the next ordinary `npm run og`.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import people from './content/people.json';
import services from './content/services.json';

const base = process.env.BLOG_FIXTURES === '1' ? './tools/fixtures/blog' : './src/content/blog';
// YAML reads an unquoted 2026-12-01 as a date at midnight UTC; keep it as the day written.
const day = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'a date written YYYY-MM-DD'),
);
const authors = people.map((p) => p.id) as [string, ...string[]];
const serviceIds = services.map((s) => s.id) as [string, ...string[]];

const blog = defineCollection({
  loader: glob({ pattern: '[!_]*.md', base }),
  schema: ({ image }) => z.object({
    /** 60 characters or fewer. " | KEYSTROKE" is added when it fits. */
    title: z.string().min(10).max(60),
    /** 155 characters or fewer: the reason to click, shown in search results and under the title. Keep prices out of it. */
    description: z.string().min(70).max(155),
    /** The day it was first published. */
    date: day,
    /** The day it was last changed in substance. Not for a typo. */
    updated: day.optional(),
    author: z.enum(authors),
    category: z.enum(['guides', 'news', 'work-notes']),
    /** The service the post is about, by its id in services.json. */
    service: z.enum(serviceIds).optional(),
    /** The content pillar, 1 to 5, from the plan. */
    pillar: z.number().int().min(1).max(5).optional(),
    /** The search the post is written to answer, if any. */
    term: z.string().optional(),
    /** One sentence: what this post adds that the current top results lack. Not shown on the page. */
    adds: z.string().min(20),
    /** Where the line at the foot of the post sends the reader. */
    cta: z.enum(['consultation', 'audit']).default('consultation'),
    /** Up to two posts to show beside it, by file name. Otherwise they are chosen by service, then category. */
    related: z.array(z.string()).max(2).optional(),
    /** A draft shows in `npm run dev` and in `npm run blog:build -- --drafts`, never in an ordinary build. */
    draft: z.boolean().default(false),
    /**
     * The post's art, kept in covers/ beside the posts: ./covers/<post>.png.
     * At least 1200 by 630 and that shape, with no words in it. Shown above
     * the post, beside it in every list, and as its share image.
     */
    cover: image().optional(),
    /** What the cover shows, for a reader who cannot see it. Needed with a cover. */
    coverAlt: z.string().min(10).max(160).optional(),
  }).refine((d) => !d.cover || d.coverAlt, { message: 'a cover needs coverAlt: what the image shows', path: ['coverAlt'] }),
});

export const collections = { blog };
