// robots.txt, written at build. Crawling is allowed in both modes. While demo
// mode is on, every page carries a noindex tag, and a crawler has to be able
// to fetch a page to see that tag: blocking it here would hide the tag, not
// the page. The sitemap is named once the site is live and the domain is set.
import type { APIRoute } from 'astro';
import { site, origin } from '../lib/data';

export const GET: APIRoute = () => {
  const lines = ['User-agent: *', 'Allow: /'];
  if (!site.demo && origin) lines.push('', `Sitemap: ${origin}/sitemap.xml`);
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
