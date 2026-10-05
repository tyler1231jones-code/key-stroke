# Revision 2: the offer, the forms, the showcases, and three audits

2 October 2026 / for Fable 5.1 in Claude Code, run from the project folder / follows `docs/revision-01.md`

## 0. What this is

This is the second revision of the KEYSTROKE site. It changes the commercial offer, connects the forms, adds an animated showcase to each service, and then audits the whole site three ways: motion, mobile and search.

It follows revision 1. If `docs/revision-01.md` has not been carried out yet, do that first, then this. Where this file disagrees with revision 1, the build brief or the design system, this file wins. Add one line to `CLAUDE.md` saying so.

The aim of the site has sharpened. It exists to win clients: a visitor should understand what KEYSTROKE does, see it demonstrated, and book a free first conversation. Judge every decision by whether it makes that more likely.

Work in this order, because the audits should examine the site as it will be, not as it is now:

1. Pricing and the offer (section 2)
2. Forms (section 3)
3. Service showcases and product lists (section 4)
4. Motion audit (section 5)
5. Mobile audit (section 6)
6. SEO audit (section 7)

## 1. Before you change anything

1. Commit the current state: `git add -A && git commit -m "Before revision 2"`.
2. Screenshot every page at 1440×900 and 390×844 and read the screenshots.
3. Write `REVISION-2-PLAN.md`: each item below, the files it touches, the order. Then start; do not wait for approval.

## 2. Pricing and the offer

Two things change. The first step is now free, and prices are shown in one place only.

**The first step is free.** The first consultation and the Keystroke Audit cost nothing. Jobs after that are quoted individually.

- The button label everywhere becomes **Book a free consultation**. That covers the header, the hero, the closing band on every page and the quiz result.
- On `/audit`, replace the price block with the word "Free" and one sentence: what happens, how long it takes, and that there is no obligation. Remove `$1,500` from the whole site.
- Do not say "free for now", "limited time" or anything that implies a deadline.
- Remove "one working tool included" from the page. Whether the free audit still includes it is for the principals; list the question in `NOTES.md`.

**Prices appear on `/savers` and nowhere else.** The three retainer plans keep their prices on that page. Remove every other price from the site:

- The homepage. The Savers section there shows each plan's name and who it suits, no figures, and links to "See plans and pricing".
- The audit price, the three build ranges, and "What happens next" pricing.
- The cost range on case cards and case pages, and the "What a build like this costs" block.
- The quote range in the sample report on `/audit`. That line now reads "Quoted after the audit".
- Price ranges in the quiz result.
- Service pages.

Where a price used to sit and a visitor would expect one, say: "Every job is quoted individually after a free consultation."

**Keep it reversible.** This pricing will be revised. Leave the figures in the content files and control what is shown with one block in `products.json`:

```json
{
  "display": {"audit": false, "builds": false, "cases": false, "quiz": false, "savers": true},
  "audit": {"offer": "Free", "note": "No cost and no obligation."}
}
```

Templates read `display`; turning a price back on later is a one-word change.

Update `npm run check`: a dollar figure in the rendered text of any page other than `/savers` is a failure.

## 3. Forms: Formspree and reCAPTCHA v3

Every enquiry now goes through a form. Forms post to Formspree, and every submission, including the quiz, carries a Google reCAPTCHA v3 token. Read Formspree's current documentation on JavaScript submissions and on reCAPTCHA v3 before you write this.

**Where forms appear**

| Form | Where | Notes |
|---|---|---|
| Free consultation | A new `/contact` page, and the booking block on `/audit` | Every "Book a free consultation" button leads to one of these |
| Savers enquiry | `/savers` | The same form with the chosen plan filled in |
| Quiz result | The end of `/quiz` | Below the result, never in front of it |

Build one form component and reuse it. Remove the mail links and the booking link that the buttons used before.

**Fields.** Name, email, phone (optional), business name (optional), "What do you need help with?" (the four services and "Not sure yet"), message (optional). Keep it this short. Hidden fields: the page it was sent from, the plan if one was chosen, and for the quiz the answers and the recommended items.

**The quiz.** The result is still shown without asking for anything. Beneath it, one form: "Send me this and get in touch." Submitting it sends the answers and the result with the contact details. Nothing is sent to Formspree unless the visitor submits the form.

**How a submission works**

1. On submit, call `grecaptcha.execute(siteKey, { action })` to get a token. Do it at submit time, not on page load: a token expires after two minutes. Use a different action name per form (`consultation`, `savers`, `quiz`).
2. `POST` to `https://formspree.io/f/{formId}` with the header `Accept: application/json`. Send the token in a field named exactly `g-recaptcha-response`, which is the name Formspree looks for.
3. Include Formspree's honeypot field, hidden from people.
4. Show the result in place, with no page reload: a sending state on the button, then a short thank-you that says what happens next, or an error that keeps what they typed and offers the email address instead.

**Configuration.** Add to `site.json`:

```json
{
  "forms": {
    "formspreeContactId": "TODO",
    "formspreeQuizId": "TODO",
    "recaptchaSiteKey": "TODO"
  }
}
```

- The reCAPTCHA **secret** key never goes in this project. The principal enters it in each Formspree form's settings.
- While any of the three values is `TODO`, the forms run in a development mode: they validate, then show the payload they would have sent in the browser console and the success state. `npm run deploy` refuses to run until all three are set. This replaces the booking link in the deploy check from revision 1; the contact email is still required, as the fallback shown when a submission fails.
- reCAPTCHA does not accept `localhost` unless it is added to the key's domains. Say so in the README, with the steps the principal follows to create the key, add the domain, and paste the secret into Formspree.

**Performance and privacy**

- Load the reCAPTCHA script only when a form comes near the viewport or is focused, never on page load. It must not affect the loading speed of pages or parts of pages without a form.
- Hide the floating reCAPTCHA badge, and under every form show the disclosure Google requires when the badge is hidden, with its links to Google's Privacy Policy and Terms of Service. Copy the current wording from Google's reCAPTCHA FAQ.
- The site now collects personal details, so it needs a privacy page. Add `/privacy`, linked from the footer and from under every form. Write it plainly and factually: what the forms collect, that Formspree processes submissions, that reCAPTCHA is used, how to ask for details to be removed. List it in `NOTES.md` for the principals to approve before launch.

**Form quality.** Real labels, `type="email"` and `type="tel"`, `autocomplete` attributes, inline error messages, 16px input text so phones do not zoom, and a submit button at least 56px tall. Test the whole flow with the keyboard alone.

## 4. Service showcases and product lists

Each of the four services gets two things on its page: a signature animated demonstration that turns something poor into something good in front of the visitor, and a short list of the products that service offers. The demonstrations are the new centrepiece of the site after the hero.

**4.1 The four demonstrations**

| Service | Before | What happens | After |
|---|---|---|---|
| Websites and software | A dated business website: cramped, tiny text, clip-art, broken on a phone | It rebuilds itself section by section, in a desktop frame and a phone frame side by side | A clean, fast, modern site that works on both |
| Reporting and dashboards | A wall of raw spreadsheet rows | Cells lift out, sort and collapse into shapes | A one-page executive summary: three headline figures, a trend line, a bar chart, a short list of what needs attention |
| Automation and AI agents | An email arrives in an inbox | The key details are picked out (who, what, by when) and carried across | A task in a task board, assigned and dated, with a calendar entry and a drafted reply |
| Branding and graphic design | A tired logo: stretched, mismatched fonts, clip-art | The mark is redrawn and refined, then rolls out across a business card and a letterhead | A coherent identity. Then a second beat: a worn shopfront with a faded sign is repainted in the new brand, bright and fresh |

The shopfront beat matters: it shows that the brand work reaches the physical business (signage, the building, vehicles), not only the logo.

**4.2 Rules for the demonstrations**

- **Built in HTML, CSS and SVG, animated with GSAP.** Not video and not the WebGL canvas. They must be sharp at any size, light, and readable by search engines and screen readers.
- **Colour is allowed inside the demonstration frame.** The site itself stays in the Instrument tokens. Inside a frame, the "before" is drab and the "after" may be bright and colourful, because it shows a client's brand, not KEYSTROKE's. Solid colours, no gradients. The contrast between a monochrome site and a colourful result is the point.
- **Invented businesses only.** Give each demonstration a made-up business name. Do not use or imitate a real company, a real logo, or the interface of a real product; the task board and the inbox are generic. Search each invented name before using it and change it if a real business has it.
- **They are illustrations, not client results.** No client wording and no performance figures in or around them.
- **How they play.** Each plays once when it scrolls into view, at a pace a person can follow (four to seven seconds). It has a **Before / After** toggle and a replay control, so the visitor can flip between the two states. On desktop the first pass may be tied to scroll.
- **Reduced motion:** show the after state with the toggle, no animation.
- **Phones:** the before and after stack or swap in one frame; the toggle is a large tap target; nothing overflows the screen.
- Only animate while on screen.

**4.3 Where they appear**

- Each service page opens with its demonstration at full size, in place of the scroll sequence that page had.
- The homepage "What we do" section shows the four as compact versions, one per card, each playing as its card enters and looping slowly. This replaces static cards.

**4.4 Product lists.** Under the demonstration on each service page, list what the service offers, from `services.json` below: a name and one line each, no prices. Lay them out as a simple grid; each item reveals as it enters. The list ends with the free consultation button.

`services.json`:

```json
[
  {"id":"automation","name":"Automation and AI agents","line":"The work happens without anyone doing it.","products":[
    {"name":"Email to task","line":"An email comes in. The task, the owner and the due date are created for you."},
    {"name":"Quote and invoice automation","line":"Enter the details once. The quote, the invoice and the accounts are written from it."},
    {"name":"Approvals and routing","line":"Requests go to the right person and come back approved, without the chasing."},
    {"name":"Document generation","line":"Contracts, reports and letters produced from your own data."},
    {"name":"System integration","line":"Systems that do not talk to each other, made to."},
    {"name":"Overnight agents","line":"AI agents that do the scheduled work while the office is closed."}
  ]},
  {"id":"reporting","name":"Reporting and dashboards","line":"See how the business is doing in time to act.","products":[
    {"name":"Executive dashboards","line":"The numbers that matter on one screen, current every morning."},
    {"name":"Monthly reporting packs","line":"The month-end pack, built and checked without the copying."},
    {"name":"Job costing","line":"What each job is making while it is still running."},
    {"name":"Project and timesheet analytics","line":"Where the hours went, by project, person and week."},
    {"name":"Spreadsheets that hold","line":"The one spreadsheet everything depends on, rebuilt so anyone can use it."}
  ]},
  {"id":"web-software","name":"Websites and software","line":"A site or a tool built for how you actually work.","products":[
    {"name":"Business websites","line":"Fast, clear and built to bring in enquiries."},
    {"name":"Websites you can edit","line":"Change your own pages, prices and products without a developer."},
    {"name":"Online stores","line":"Sell online, with stock and orders in step with your systems."},
    {"name":"Custom applications","line":"Software made for one job your business does every day."},
    {"name":"Invoicing and time tracking","line":"Hours and invoices entered once, where the work happens."},
    {"name":"Dashboards and portals","line":"A place for your clients or your team to see what they need."}
  ]},
  {"id":"brand-design","name":"Branding and graphic design","line":"Look like the business you have become.","products":[
    {"name":"Logo and identity","line":"A mark, colours and type that belong to you."},
    {"name":"Rebrands","line":"An existing brand brought up to date without losing what people recognise."},
    {"name":"Signage and shopfront","line":"Your premises, vehicles and signs in the new brand."},
    {"name":"Tender and capability documents","line":"Bids that look as capable as the business behind them."},
    {"name":"Brochures and stationery","line":"Everything you hand over or send out, as one family."},
    {"name":"Messaging and content","line":"What to say and how to say it, written down once."}
  ]}
]
```

These names and lines are new copy; list them in `NOTES.md` for approval.

## 5. Motion audit

Revision 1 asked for less at once. The aim now is the other half of the same idea: the site should be **engaging the whole way down, and never overwhelming.** Something should always be happening as a visitor moves, and only one thing should be asking for their attention at a time.

**Audit.** For every page, at desktop and phone size, record a slow scroll from top to bottom (Playwright video, or screenshots every 200px) and review it. Write `AUDIT-motion.md` with a table per page: section, what moves, what triggers it, how long it takes, and what is wrong. Look for:

- Dead stretches: more than one screen of scrolling where nothing moves or responds.
- Competition: two or more things animating for attention in the same view.
- Inconsistency: the same kind of element arriving in different ways or at different speeds on different pages.
- Jank: dropped frames, layout shift, anything that stutters under a 4× CPU slowdown.
- Things that play once and leave the section lifeless afterwards.
- Interactive elements with no response to hover, focus or tap.

**Fix.**

- Define one small motion system in a single file and use it everywhere: three durations, two easings, one standard reveal for text, one for cards, one for figures. Mechanisms (digits, keys, strikes) keep their linear timing.
- Every section gets a reveal as it enters. Every button, card and link responds to hover, focus and tap; key-shaped buttons press.
- Fill each dead stretch with something small and relevant: a figure that rolls, a key that presses, a line that draws, a demonstration that loops.
- Where two things compete, stagger them or cut one.
- Movement between pages should feel continuous. If Astro's view transitions can be added without breaking the canvas or the scroll triggers, add them; if not, give every page the same short load-in and record why in the audit.
- Re-record after fixing and confirm each finding is closed.

The hero scroll sequence is not to be changed by this audit.

## 6. Mobile audit

A large share of visitors will be on phones. The phone version is not a reduced copy of the desktop site; it should be the best version of the site for a phone.

**Audit.** Test every page at 360, 390 and 430 wide, and at 768, with touch emulation and a 4× CPU slowdown on a throttled connection. Write `AUDIT-mobile.md` with findings and fixes. Check:

- **First screen:** the headline, the one-sentence description and the main button are all visible without scrolling on a 360×740 screen.
- **Touch:** every tap target is at least 48px with space around it. Nothing depends on hover. Before/After toggles, filters and the menu work with a thumb.
- **Reading:** body text at least 16px, comfortable line length, no text over busy imagery, nothing cut off.
- **Layout:** no sideways scrolling anywhere; nothing overlaps; pinned sections do not trap or fight the scroll; the address bar showing and hiding does not make sections jump.
- **The hero sequence** runs smoothly on a mid-range phone, or uses a lighter version that keeps the idea.
- **Forms:** correct keyboards, autofill, no zoom on focus, errors visible above the keyboard, the submit button reachable.
- **Weight:** Three.js loads only on pages that use it, and after the first paint. Images are sized for the screen. Fonts are subset and preloaded. Demonstrations and sequences use lighter settings on phones.
- **Speed:** on the throttled phone profile, Largest Contentful Paint under 2.5 seconds, Interaction to Next Paint under 200ms, Cumulative Layout Shift under 0.1. Lighthouse mobile performance 90 or above on every page. Use the `web-perf` skill.

**Add.** A slim bar fixed to the bottom of the screen on phones, carrying the **Book a free consultation** button. It appears after the hero has scrolled past, and hides while a form or the footer is on screen.

Fix what the audit finds, then test again and record the before and after scores.

## 7. SEO audit

The site has to be found, and the people who find it have to enquire. Go through every page. Write `AUDIT-seo.md` with what you found, what you changed, and what is left for the principals.

**7.1 Indexing.** The site keeps `noindex` while the content is mock; do not remove that. Make everything else ready, so that turning demo mode off produces a fully indexable site. Verify by building once with demo mode off into a temporary folder and inspecting the output, then discard it.

**7.2 Technical**

- Every page: a unique title of 60 characters or fewer, a unique meta description of 155 or fewer that reads as a reason to click, one `h1`, headings in order, a canonical URL, `lang="en-AU"`.
- All content is in the built HTML. Check by reading the built files, not the browser: every heading, paragraph, product name and FAQ must be there without JavaScript.
- `sitemap.xml` and `robots.txt`, generated at build. A proper 404.
- Open Graph and Twitter card tags on every page, with a share image generated per page in the site's style.
- Structured data as JSON-LD: `Organization` and `WebSite` site-wide; `ProfessionalService` on the homepage and contact page; `Service` on each service page; `FAQPage` wherever there are FAQs; `BreadcrumbList` on inner pages; the three Savers plans as offers on `/savers`. No review or rating markup of any kind, and no markup presenting the mock cases as real work.
- Clear, descriptive URLs. Rename the service routes to match the service names (for example `/services/websites-and-software`) and redirect the old ones.
- Descriptive `alt` text on meaningful images; empty `alt` on decoration. Link text that says where the link goes.
- Internal links: each service page links to its cases, the quiz and the consultation form; each case links to its service; the homepage links to everything important within one click.
- Speed is a ranking factor. The targets in section 6 apply.

**7.3 Content**

- Build a keyword map in the audit: for each page, one primary phrase and two or three supporting ones, in the words an Australian business owner would type. If you have web search, use it to check how people phrase these and what competing pages cover; say in the audit whether you did.
- Each page's title, `h1` and opening sentence say plainly what the page offers, using its primary phrase naturally. The brand headlines stay as the visual headlines; where one says nothing about the offer (the hero tagline, for instance), carry the descriptive phrase in the `h1` alongside it or in the line directly beneath, whichever keeps the design intact.
- Add a short FAQ to each service page, `/audit` and `/savers`: four to six questions people ask before they enquire, each answered in 50 words or fewer in the brand voice. Do not invent facts, prices or timeframes; where an answer needs one, write the question, mark the answer for the principals, and leave it off the page until it is supplied.
- Do not stuff keywords, hide text, or create near-duplicate pages for different towns.

**7.4 Local search.** Add `location` and `serviceArea` to `site.json` as `TODO`. When they are supplied, they feed the structured data and the footer. Do not guess them.

**7.5 Conversion**

- Every page has one primary action, the free consultation, visible near the top and repeated at the end.
- The path from any page to a submitted form is two taps or fewer.
- Nothing asks for more information than section 3 allows.
- Enquiries cannot be improved if they are not measured. Add Cloudflare Web Analytics, which uses no cookies, behind a `site.json` value, `analyticsToken`, left as `TODO`, and record form submissions and quiz completions as events if the product supports it. Load nothing until the token is set.

## 8. Finish

1. Screenshot every page again at both sizes and compare with the first set.
2. Run the build, `npm run check`, and Lighthouse on every page at the phone profile. Put the scores in the audits.
3. Confirm: no dollar figure outside `/savers`; every button reads "Book a free consultation" and reaches a form; every form produces the right payload in development mode; the hero scroll sequence is unchanged.
4. Report what changed page by page, what you decided where this file left room, and the open items for the principals:
   - Two Formspree form IDs, and a reCAPTCHA v3 site key (the secret goes into Formspree, not here)
   - Approval of the privacy page, the FAQ answers, and the product names and lines
   - Whether the free audit includes the initial tool
   - Location and service area
   - A Cloudflare Web Analytics token

Do not deploy.
