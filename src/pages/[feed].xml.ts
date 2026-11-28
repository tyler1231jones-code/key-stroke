// /rss.xml: the blog as an RSS feed, written at build, each post in full.
// A dynamic route with one path, so no feed is written until there is a post
// to read (src/lib/blog.ts). Every page links it from its head once it exists.
import type { APIRoute } from 'astro';
import { site } from '../lib/data';
import { abs } from '../lib/seo';
import { posts, postHref, postHtml, person, categoryLabel } from '../lib/blog';

export async function getStaticPaths() {
  return (await posts()).length > 0 ? [{ params: { feed: 'rss' } }] : [];
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// A post's day, at the start of the day in Brisbane.
const rfc822 = (day: string) => new Date(`${day}T00:00:00+10:00`).toUTCString();
const cdata = (html: string) => `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export const GET: APIRoute = async () => {
  const list = await posts();
  const newest = list.reduce((d, p) => ((p.data.updated ?? p.data.date) > d ? (p.data.updated ?? p.data.date) : d), list[0].data.date);
  const items = list.map((p) => {
    const url = abs(postHref(p));
    return [
      '    <item>',
      `      <title>${esc(p.data.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${rfc822(p.data.date)}</pubDate>`,
      `      <dc:creator>${esc(person(p.data.author).name)}</dc:creator>`,
      `      <category>${esc(categoryLabel(p.data.category))}</category>`,
      `      <description>${esc(p.data.description)}</description>`,
      `      <content:encoded>${cdata(postHtml(p, { feed: true }))}</content:encoded>`,
      '    </item>',
    ].join('\n');
  });
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${esc(site.name)} blog</title>`,
    `    <link>${abs('/blog')}</link>`,
    `    <atom:link href="${abs('/rss.xml')}" rel="self" type="application/rss+xml" />`,
    `    <description>${esc(site.description)}</description>`,
    '    <language>en-AU</language>',
    `    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
