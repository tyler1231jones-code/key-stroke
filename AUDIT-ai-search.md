# Audit: search and AI search

9 October 2026. What stops key-stroke.com.au appearing when people search
Google or ask an AI tool (ChatGPT, Perplexity, Claude, Gemini, Copilot), what
was fixed, and what only the principals can do.

## The short version

The site is well built for search: every page is plain HTML that a crawler
reads without running scripts, titles and descriptions are written for
search, there is structured data, a sitemap and questions with answers. One
setting undoes all of it: **every page tells search engines not to list it**,
because demo mode is still on. Until that changes, nothing else in this
audit makes much difference.

## Findings, most important first

### 1. Every page says "noindex, nofollow"

`site.demo` is `true` in `src/content/site.json`, so every page carries
`<meta name="robots" content="noindex, nofollow">`. Google and Bing honour it
and leave the site out. Most AI search tools find pages through Google's or
Bing's index (ChatGPT search and Copilot lean on Bing; Google's AI Overviews
and Gemini on Google), so they leave it out too. Submitting the sitemap to
Google Search Console works, but every page will be reported as "Excluded by
'noindex' tag".

Demo mode was a guard so that invented content was never presented as real.
The cases are now marked real. Still marked demo: the five crew agents, the
eight ledger rows behind the homepage counter and the "We counted" figures,
the sample audit report, and the six quiz items with their estimates.
Setting `demo` to `false` removes every record still marked demo from the
site. So the decision is, for each of those: is it real (set its `demo` to
`false`), or should it come off the site? Then set `site.demo` to `false`.
The onboarding forms stay unlisted either way; they carry their own
`noindex`.

### 2. The business is hard to pin down as an entity

AI tools answer "who is KEYSTROKE, where are they, how do I reach them" from
consistent facts across the web. The site gives none yet: `email`,
`location` and `serviceArea` are `TODO`, there is no phone or address, the
principals are not named on any page, and there are no links to profiles
elsewhere. "Keystroke" is also a common word and the name of other
products, so the engines need help telling this business apart.

### 3. No presence anywhere else

Nothing points at the site from Google Business Profile, LinkedIn, business
directories or industry listings. AI tools weigh what other sources say
about a business, not only what its own site says.

### 4. Crawlers are let in

`robots.txt` allows every crawler. Requests made under the names of GPTBot,
OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot,
Google-Extended, Googlebot, Bingbot, Applebot and others all got the page.
Cloudflare can also block AI crawlers by recognising the real ones rather
than their names, which a test from this computer cannot show. Check the
setting (below).

### 5. Twelve questions are held back

`src/content/faqs.json` has twelve questions with no answer yet (minimum
term, unused hours, changing plans, ownership of code and files, how
recordings are made and kept, data handling). Questions and answers are
what AI tools quote most readily. Some can now be answered from the terms
confirmed for onboarding; they are commercial statements, so they wait for
the principals.

## Fixed in this change

- **/llms.txt and /llms-full.txt.** Plain Markdown for AI tools, written at
  build from the same content files as the pages, so they never drift. The
  short file says what KEYSTROKE is and links every service, the audit,
  Savers, the quiz and each case with one line each. The full file holds
  every service with its products and answered questions, the audit, Savers
  and every case in full. Nothing still marked demo is in them, and no
  prices: they point to /savers. `npm run check` reads both files for the
  same voice and price rules as the pages.
- **Structured data.** The organisation now states the country it serves
  (Australia, which the site already says; no town is guessed), its tagline,
  and the services and products it offers (`knowsAbout`), which gives search
  engines and AI tools words to match questions to.
- **Savers prices** now say "excluding GST" beside each figure and in the
  note under the list, and the plans' structured data says the same.

A note on llms.txt: it is a proposal, not a standard. Some AI tools and
agents read it; Google has said its search does not use it. It costs
nothing and helps the tools that do, but finding 1 matters far more.

## For the principals

1. **Decide demo mode** (finding 1), then set `site.demo` to `false`. Turning
   it off also makes `robots.txt` name the sitemap.
2. **Fill in `site.json`**: `email`, `location`, `serviceArea`. They go into
   the footer, the structured data and the AI files automatically.
3. **Google Search Console**: add the domain property `key-stroke.com.au`
   (a TXT record in Cloudflare DNS; it does not affect email), then submit
   `https://key-stroke.com.au/sitemap.xml`.
4. **Bing Webmaster Tools**: import the site from Search Console. Bing's
   index feeds ChatGPT search and Copilot.
5. **Cloudflare dashboard**: check that AI crawlers are not blocked
   (Security, then Bots; and AI Crawl Control if shown), and turn on
   Crawler Hints, which tells Bing and others when a page changes.
6. **Google Business Profile** and a **LinkedIn company page**, with the same
   name, description and web address as the site. Send the links and they
   go into the structured data as `sameAs`.
7. **Answer the held-back questions** in `src/content/faqs.json`.
8. **Consider naming the principals** on a page (an About page, or the
   contact page), with roles and the ABN once known. Revision 1 took the
   names off the homepage; search engines and AI tools trust a business
   more when they can see who runs it.

## What was not checked

- Whether Cloudflare blocks verified AI crawlers (the dashboard setting).
- How any AI tool currently describes KEYSTROKE: with every page on
  `noindex`, there is little for them to have seen.
