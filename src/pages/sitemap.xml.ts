// sitemap.xml, written at build. Every page a visitor can land on, by its
// canonical address. The 404 and the redirects are not in it. Addresses are
// absolute once the domain is set in site.json, which `npm run deploy`
// requires.
import type { APIRoute } from 'astro';
import { services, cases, serviceHref } from '../lib/data';
import { abs } from '../lib/seo';

export const GET: APIRoute = () => {
  const paths = [
    '/',
    '/services',
    ...services.map(serviceHref),
    '/cases',
    ...cases.map((c) => `/cases/${c.id}`),
    '/audit',
    '/crew',
    '/savers',
    '/quiz',
    '/contact',
    '/counting',
    '/privacy',
    '/terms',
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${abs(p)}</loc></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
