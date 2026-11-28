// sitemap.xml, written at build. Every page a visitor can land on, by its
// canonical address. The 404 and the redirects are not in it. Addresses are
// absolute once the domain is set in site.json, which `npm run deploy`
// requires. Blog posts carry the day they last changed.
import type { APIRoute } from 'astro';
import { services, cases, crew, serviceHref } from '../lib/data';
import { products, productHref } from '../lib/catalogue';
import { abs } from '../lib/seo';
import { posts, postHref, PAGE_SIZE, listHref } from '../lib/blog';

export const GET: APIRoute = async () => {
  const blog = await posts();
  const pages: { path: string; lastmod?: string }[] = [
    '/',
    '/services',
    ...services.map(serviceHref),
    // Live products only: the catalogue leaves the rest out.
    '/products',
    ...products.map(productHref),
    '/cases',
    ...cases.map((c) => `/cases/${c.id}`),
    '/audit',
    // The crew page once an agent runs for clients; until then it is noindex.
    ...(crew.length > 0 ? ['/crew'] : []),
    '/savers',
    '/quiz',
    '/contact',
    '/about',
    '/counting',
    '/privacy',
    '/terms',
  ].map((path) => ({ path }));
  // The blog once a post is published. Drafts never reach an ordinary build.
  if (blog.length) {
    pages.push({ path: '/blog', lastmod: blog.map((p) => p.data.updated ?? p.data.date).sort().at(-1) });
    for (let n = 2; n <= Math.ceil(blog.length / PAGE_SIZE); n++) pages.push({ path: listHref(n) });
    for (const p of blog.filter((p) => !p.data.draft)) pages.push({ path: postHref(p), lastmod: p.data.updated ?? p.data.date });
  }
  const url = ({ path, lastmod }: { path: string; lastmod?: string }) =>
    `  <url><loc>${abs(path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(url).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
