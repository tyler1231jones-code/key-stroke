// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The old practice pages. Cloudflare answers these with a 301 from
  // public/_redirects; the pages Astro writes here are the fallback for any
  // other host and for local preview.
  redirects: {
    '/practice/clear': '/services/automation',
    '/practice/count': '/services/reporting',
    '/practice/build': '/services/web-software',
    '/practice/face': '/services/brand-design',
    '/practice': '/services',
  },
});
