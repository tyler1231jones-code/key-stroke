# SEO audit

2 October 2026. Revision 2, section 7.

## How it was done

`tools/audit-seo.mjs` (`npm run audit:seo`) reads the built HTML files, not a
browser. What is in those files is what a crawler gets without running any
script. For every page it checks the title, the description, the headings,
`lang`, the canonical address, the robots tag, the share tags and that the
share image exists, the structured data, image alt text, every internal link,
and how many words and links a crawler can read. Then it checks the sitemap,
`robots.txt`, and that every page is linked from somewhere.

It was run three times:

| Run | Build | Result |
|---|---|---|
| Before | The site at commit `5564510`, "Before revision 2" | 213 problems across 24 pages |
| After | The site now, demo mode on | No problems, 26 pages plus the 404 |
| Live check | A build with demo mode off and a stand-in domain, made into a temporary folder and deleted afterwards | No problems (see "The demo-off check") |

No tool with search volumes was available, so no claim here rests on how
often a term is searched. The terms in the keyword map are the plain names
people use for these services. Check them against Search Console once the
site has been live for a month.

## What was found

On the site as it stood before this revision:

- **No share tags.** No Open Graph or Twitter tags on any page, and no share
  image. A link pasted into a message showed a bare address.
- **No structured data** of any kind.
- **No canonical address, no sitemap and no `robots.txt`.**
- **Titles too long.** Ten of the twelve case pages had titles of 63 to 84
  characters, which a results page cuts off. Every title used the form
  "Page / KEYSTROKE".
- **Titles that said nothing.** "Services", "Cases", "The crew", "Nine
  questions": names of pages, not what a person searches for.
- **Descriptions too long.** Nine case pages ran from 158 to 206 characters,
  and the homepage was one over at 156. Several other descriptions were under
  90 characters and gave no reason to click.
- **The homepage title had no service in it.** "KEYSTROKE. Let us push the
  buttons for you."
- **Service addresses were short codes**: `/services/web-software`,
  `/services/brand-design`.
- **Thin service pages.** 167 to 210 words each. Nothing answered the
  questions a buyer types into a search box.
- **`lang` was already `en-AU`**, there was one `h1` on every page, no heading
  level was skipped, and every image had alt text. Those needed no change.

## What was changed

**Every page**

- A title of 60 characters or fewer, written as "what this page is |
  KEYSTROKE". When the name will not fit inside 60, the name is dropped
  rather than the title cut (four case pages).
- A description of 155 characters or fewer that gives a reason to click.
  Case descriptions are cut at the end of a sentence, never mid-word.
- A canonical address, once `domain` is set in `site.json`.
- `lang="en-AU"`, and `og:locale` of `en_AU`.
- Open Graph and Twitter card tags, with a share image made for that page:
  the logotype, the page's headline and its description, 1200 by 630, in the
  site's own type and colour. `npm run og` makes them: one for each of the 26
  pages, and the logo for the organisation data.
- `noindex, nofollow` while demo mode is on. The 404 keeps `noindex` always,
  and carries no share tags.

**Site files**

- `sitemap.xml`, written at build: the 26 pages a visitor can land on. Not
  the 404, not the redirects.
- `robots.txt`, written at build. It allows crawling in both modes. A page
  marked `noindex` has to be fetched for the tag to be seen, so blocking the
  crawl in demo mode would hide the tag, not the page. Once the site is live
  it names the sitemap.

**Addresses**

- The four service pages are named after the services:
  `/services/automation-and-ai-agents`, `/services/reporting-and-dashboards`,
  `/services/websites-and-software`, `/services/branding-and-graphic-design`.
- The four short addresses from revision 1 and the four `/practice/*`
  addresses from the first build redirect with a 301 (`public/_redirects`),
  with fallback pages for any host that does not read that file.
- No address ends in a slash, and no internal link goes through a redirect.

**Structured data** (JSON-LD, built in `src/lib/seo.ts`)

| Type | Where |
|---|---|
| `Organization`, `WebSite` | Every page |
| `ProfessionalService` | The homepage and `/contact`. `areaServed` and the address are added when `serviceArea` and `location` are set |
| `Service` | Each of the four service pages, with its products as an offer catalogue |
| `Service` with three `Offer`s | `/savers`: the three plans, each with its monthly price |
| `FAQPage` | `/audit`, `/savers` and the four service pages |
| `BreadcrumbList` | Every inner page |

There is no review or rating data of any kind. The cases are mock, so they
carry nothing that presents them as real work: no `Review`, no
`CreativeWork` about a client, no `Article`. They have a breadcrumb trail and
nothing else.

The Savers offers give their price in Australian dollars (`AUD`). The plan
states prices in dollars for Australian clients; say so if that is wrong.

**Content**

- Each service page now has its list of products with one line each, two
  cases, and four to six questions with answers. They read 431 to 775 words,
  up from 167 to 210.
- `/audit` and `/savers` have six questions each.
- Every answer is 50 words or fewer and states only what the brief, the
  business plan or the content files already say.
- Service cards on the homepage and `/services` link to the service pages by
  name. Each case links to its service, each service to two of its cases and
  to the filtered case list, and the quiz result links each recommended item
  to a case like it. The footer lists the four services on every page. No
  page is an orphan.

**Measurement**

- Cloudflare Web Analytics is wired in behind `analyticsToken` in
  `site.json`. No script loads until the token is set. It uses no cookies.
- It records page views only. Cloudflare Web Analytics has no custom events,
  so it cannot count form submissions. Count those in Formspree, which keeps
  every submission with the `page` it came from. If you want enquiries in
  the same place as visits, that needs a different analytics product, which
  is a decision for you.

## Keyword map

One primary term a page. No two pages aim at the same term.

| Page | Primary term | Also covers | Title |
|---|---|---|---|
| `/` | business automation | websites, branding, admin by hand | KEYSTROKE \| Business automation, websites and branding |
| `/services` | business services: automation, reporting, web, design | the four service names | Services: automation, reporting, web and design |
| `/services/automation-and-ai-agents` | automation and AI agents for business | email to task, quote and invoice automation, approvals, system integration | Automation and AI agents for business |
| `/services/reporting-and-dashboards` | business reporting and dashboards | executive dashboards, month-end packs, job costing | Business reporting and dashboards |
| `/services/websites-and-software` | websites and custom software | websites you can edit, online stores, custom applications | Websites and custom software for business |
| `/services/branding-and-graphic-design` | branding and graphic design | logo design, rebrands, signage, tender documents | Branding, logo and graphic design |
| `/audit` | free process audit | keystroke audit, what manual work costs | Free Keystroke Audit: we count one process |
| `/savers` | monthly support plans and pricing | Keystroke Savers, plan prices | Keystroke Savers: monthly plans and pricing |
| `/cases` | case studies: automation, reporting, web, branding | before and after figures | Cases: what we built and what it changed |
| `/cases/[id]` | the problem, as the client would say it | the kind of business | The case headline |
| `/crew` | AI agents that work overnight | the five agents by role | The crew: five AI agents that work overnight |
| `/quiz` | what should my business fix first | 90-second quiz | 90-second quiz: what should your business fix? |
| `/contact` | book a free consultation | free audit, no obligation | Book a free consultation |
| `/counting` | how keystrokes are counted | the method, the ledger | How we count keystrokes: the method and ledger |
| `/privacy` | privacy | what the forms collect | Privacy |

None of these terms names a place. That is the largest gap, and it is yours
to fill: see "Left for the principals".

## Questions on each page

Shown on the page and in `FAQPage` data:

| Page | Shown | Held back |
|---|---|---|
| `/audit` | 6 | 2 |
| `/savers` | 6 | 3 |
| Automation and AI agents | 5 | 2 |
| Reporting and dashboards | 5 | 1 |
| Websites and software | 5 | 2 |
| Branding and graphic design | 4 | 2 |

The twelve held back are questions buyers will ask that I could not answer
without inventing a fact. Each is in `src/content/faqs.json` with `"a":
"TODO"` and a note saying what is needed. They stay off the page until
answered:

- Audit: Do you record on site or remotely? Who sees the recording, and how
  long do you keep it?
- Savers: Is there a minimum term? Can we change plans? What happens to hours
  we do not use?
- Automation: How long does an automation build take? Is our data used to
  train AI models?
- Reporting: Who can see our figures?
- Websites and software: Who owns the website or the software? How long does
  a website take?
- Branding: Do you arrange printing and sign installation? Do we get the
  logo files?

## The demo-off check

While the content is mock, every page carries `noindex`, and the build you
have is in that state. To see what will go live, I set `demo` to `false` and
`domain` to a stand-in in `site.json`, built into a temporary folder, ran the
audit on it, and then deleted the folder and put `site.json` back.

In that build:

- No page except the 404 carried `noindex`.
- Every page had a canonical address on the domain, and absolute addresses
  for its share image and in its structured data.
- The sitemap listed absolute addresses, and `robots.txt` named the sitemap.
- The mock cases, and everything computed from them, were gone, which is what
  demo mode off is meant to do: 15 pages were built, not 27.
- The audit found no problems.

Lighthouse on that build, phone profile:

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| Home | 98 | 100 | 100 | 100 |
| Services | 98 | 100 | 100 | 100 |
| Automation and AI agents | 98 | 100 | 100 | 100 |
| Audit | 99 | 100 | 100 | 100 |
| Savers | 99 | 100 | 100 | 100 |
| Contact | 99 | 100 | 100 | 100 |

On the build you have, with `noindex` on, the SEO score is 63 on every
page, and the one failing check is "page is blocked from indexing". That is
the tag doing its job.

## Left for the principals

1. **Where you are and where you serve.** `location` and `serviceArea` in
   `site.json` are `TODO`, and I have not guessed them. Without them the site
   cannot rank for "automation Ballarat" or any other search with a place in
   it, and `ProfessionalService` has no address or area. For a business that
   sells to local firms this matters more than anything else in this audit.
   Once set, both appear in the footer and the structured data. Consider
   adding the place to the homepage title and the service descriptions too.
2. **The twelve questions held back**, above.
3. **The domain.** Canonical addresses, the sitemap and share images need it
   before the first deploy.
4. **A Cloudflare Web Analytics token**, and a decision on whether counting
   enquiries in Formspree is enough.
5. **Search Console.** After going live, add the domain, submit
   `sitemap.xml`, and after a month compare the terms people actually used
   with the keyword map above.
6. **A Google Business Profile**, if you want to appear in local results and
   on maps. That is an account only you can create.
7. **Real cases.** Case pages are the natural place to earn search traffic
   ("job costing for electrical contractors"). They can carry richer
   structured data once the work in them is real.
