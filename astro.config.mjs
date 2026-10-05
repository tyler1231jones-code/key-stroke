// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';

const site = JSON.parse(readFileSync(new URL('./src/content/site.json', import.meta.url), 'utf8'));
const domain = typeof site.domain === 'string' && site.domain !== '' && site.domain !== 'TODO' ? site.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '') : null;

// https://astro.build/config
export default defineConfig({
  // Set once the domain in site.json is known: canonical addresses and the sitemap need it.
  site: domain ? `https://${domain}` : undefined,
  // Each page is one file (audit.html, served at /audit), so an address never
  // ends in a slash and an internal link never costs a redirect.
  build: { format: 'file' },
  trailingSlash: 'never',
  // Old addresses. Cloudflare answers these with a 301 from
  // public/_redirects; the pages Astro writes here are the fallback for any
  // other host and for local preview.
  redirects: {
    '/practice': '/services',
    '/practice/clear': '/services/automation-and-ai-agents',
    '/practice/count': '/services/reporting-and-dashboards',
    '/practice/build': '/services/websites-and-software',
    '/practice/face': '/services/branding-and-graphic-design',
    '/services/automation': '/services/automation-and-ai-agents',
    '/services/reporting': '/services/reporting-and-dashboards',
    '/services/web-software': '/services/websites-and-software',
    '/services/brand-design': '/services/branding-and-graphic-design',
  },
});
