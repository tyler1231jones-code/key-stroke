# Brief: client onboarding forms

8 October 2026. Replaces the earlier "client onboarding portal" prompt (a
separate Worker with D1, R2, Turnstile, Access and Email Routing). The
principals chose the simpler route below: no database, no admin area, no
change to anyone's email. Where this brief and the site's other documents
disagree about onboarding, this brief wins.

## What it is

A set of onboarding forms on the KEYSTROKE website, one per service. We send
a client the link for the service they have bought. They work through it step
by step. When they press send, Formspree emails every answer to us and keeps a
copy in the Formspree dashboard. That is the whole system.

- Pages: `/onboard` (a list of the forms, for us) and `/onboard/<service>`.
- One Formspree form, "Onboarding", receives every service. Its id goes in
  `site.json` as `forms.formspreeOnboardId`. Formspree sends from its own
  servers, so no DNS or mail setting on `key-stroke.com.au` changes, and our
  Microsoft 365 mail is untouched.
- The forms reuse the site's design tokens, type, voice, form styles and the
  existing reCAPTCHA v3 setup.
- Every onboarding page carries `noindex` whatever demo mode says, is left out
  of the sitemap, the menu, the footer links and the share images.
- While `formspreeOnboardId` is `TODO`, the onboarding pages are not built at
  all, so a client can never reach a form that would not send. Building them
  for a local look needs `npm run build:onboard`.

## How a client uses it

1. We copy the link from `/onboard` and send it ourselves.
2. The client sees what the form is for, roughly how long it takes, what they
   will need to hand, and a short privacy note.
3. One step at a time, with "Step 3 of 9" and a segmented strip (the design
   system allows no progress bars or percentages). Back and Next. Questions
   show or hide depending on earlier answers.
4. What they type is kept in their browser on that device, so they can close
   the page and come back. Files are not kept: they add them again.
5. The last step shows everything they entered, with a way back to each
   section, then the agreement, then Send.
6. After sending: what happens next, for that service.

## The services

One template file per service in `src/onboarding/templates/`. A template is a
list of steps; a step is a list of fields. Field types: text, long text, email,
phone, URL, date, colour, choice, multiple choice (both with an optional
"Other"), single tick, file upload, repeatable group (for example team
members), an access instruction block, and a note. Any field or step can be
shown only when an earlier answer matches.

Draft templates for: website build, website care, automation and AI agents,
reporting and dashboards, branding and design, the Keystroke Audit. The
principals edit the wording; the structure stays.

## Taking over a client's website: account for everything

The website build and website care forms must collect everything needed to
reach the back end of the current site, take control of the domain and DNS,
and redeploy the site ourselves, without breaking anything the client relies
on. At minimum:

- **The domain:** every domain they own, the registrar, whose name and ABN
  the licence is in (an .au domain belongs to an ABN), who holds the registrar
  login, renewal date, where DNS is managed, whether DNSSEC is on (it must be
  off before nameservers change), and how they will give us control: added as
  a user or delegate, a nameserver change, a transfer to an account in their
  name, or they make the changes when we ask.
- **Their email:** whether they use mail at the domain, who provides it (a web
  host's mailboxes disappear with the hosting), who administers it, every other
  system that sends mail as the domain (accounting, CRM, newsletters,
  bookings, job software), and any subdomain or service hanging off the DNS.
  Nothing about their mail may break when we move the site.
- **The current site:** address, platform, who built it, who maintains it and
  any contract or notice period, the host, who pays and when it renews (and a
  warning not to cancel until we say), admin access for the platform they are
  on, hosting access, what the site does (forms and where they go, bookings,
  shop and payments, logins, newsletters, integrations), addresses that must
  not change (ads, QR codes, print), whether they own the images, and our
  promise to take a full copy before touching anything.
- **Google and listings:** Analytics, Tag Manager, Search Console, Business
  Profile, Ads, pixels, with how to add us to each; social links.
- **The new site** (build only): which build they chose and who runs it after
  launch, goals, customers, services, pages, features, where enquiries go,
  integrations, industry rules about what a site must say, content, photos,
  brand files, colours, fonts, sites they like, dates.

## Security rule

Never ask for a password, PIN, authorisation code or API key, and never offer
a field for one. Where we need access, the form says how to add our access
address (`accessEmail` in `src/content/onboarding.json`) to the account, and
records only whether it is done, to be done later, or not possible. Anything
that needs a secret is handled by phone or a secure link. The last step
refuses to send if a password appears to have been typed into an answer.

## The agreement

Every form ends with the same agreement: the commercial terms from
`src/content/onboarding.json`, links to `/terms` and `/privacy`, a tick to
accept, a tick to confirm they may accept for the business, their full name,
position and the date. The submission records the time it was sent and the
address it came from (`/api/stamp`, a small route on the site's Worker).

The terms as confirmed by the principals on 9 October 2026: all prices
exclude GST, which is added at 10%; 50% deposit before work starts, 50% on
completion; additional work is $165 an hour, always proposed to the client
and approved by them before any of it is done; cancel any time with 30
days' notice. The Client Terms of Engagement are not final yet.

## What we receive

One email per submission, readable top to bottom:

1. Service, business, contact name, email and phone as their own fields.
2. "Access checklist": every access item and its status.
3. One field per step, in order, holding that step's questions and answers.
4. The agreement fields.
5. The files, as Formspree links.

Formspree limits: 10 files a submission, 25 MB each, 100 MB in all, and the
send must finish within 30 seconds. Every upload has a "or paste a link to a
shared folder" alternative for anything larger. Uploads need a paid Formspree
plan.

## Done when

- `npm run build:onboard`, `npm run check` and `npm run check:types` pass.
- Each form has been filled in and sent end to end in development mode, and
  the payload read.
- Screenshots at desktop and phone size have been read.
- `README.md` says how to add or change a form, in plain steps.
- Nothing is pushed until `formspreeOnboardId` is set.
