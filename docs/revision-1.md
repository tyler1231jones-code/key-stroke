# Revision 1: clearer, simpler, built to convert

2 October 2026 / for Fable 5.1 in Claude Code, run from the project folder / follows `docs/build-brief.md`

## 0. What this is

You built the KEYSTROKE site from `docs/build-brief.md`. The principals have reviewed it. The build is good and the hero scroll sequence in particular is liked. This is a revision of that build, not a rebuild: keep the look, the tokens, the type, the stack and the hero sequence, and change what is listed here.

One problem runs through all of the feedback: **the site is overwhelming.** There is too much text, too much happening at once, and too many labels a first-time visitor cannot decode. A business owner who has never heard of KEYSTROKE has to understand what it is and what it sells within a few seconds, and then be led to one next step. Every change below serves that. Where this file does not cover something, decide by that test.

Where this file disagrees with the build brief or the design system, this file wins. Add one line to `CLAUDE.md` under "Where things are" saying so (adding a line is fine; do not rewrite the file).

Rules from earlier documents that this revision lifts:

- "No button in the hero." The hero now has two.
- "Nothing fades in" and "no entrance animation." A load-in sequence is now required.
- "No human names, faces, avatars, personas" for the crew, and the `Not a person.` line. The crew now has names and avatars (section 7).
- "Eight sections, one scroll." The homepage is now a short sales page and the detail lives on separate pages.
- The demo labels and notices on the page. See section 10.

## 1. Before you change anything

1. Commit the current state so it can be restored: `git add -A && git commit -m "Before revision 1"`. If the folder is not a git repository, make it one first.
2. Screenshot every page at 1440×900 and 390×844, top to bottom, and read the screenshots. You need to see what the reviewer saw.
3. Write `REVISION-PLAN.md`: each numbered item in this file, the files it touches, and the order you will do them in. Then start; do not wait for approval.

## 2. Site structure and navigation

Each item in the header is its own page. The homepage no longer contains those sections in full; it carries a short teaser for each and sends the visitor there.

Header, in this order: **Services, Cases, Audit, Crew, Savers, Quiz**, then a key-shaped button, **Book the audit**.

| Page | Route | What it is now |
|---|---|---|
| Home | `/` | A short sales page. Section 3 |
| Services | `/services`, with the four service pages beneath it | Was "Practices". Section 5 |
| Cases | `/cases`, and `/cases/[id]` for each case | Section 4 |
| Audit | `/audit` | Section 6 |
| Crew | `/crew` | Section 7 |
| Savers | `/savers` | Section 8 |
| Quiz | `/quiz` | Unchanged in how it works. Section 9 |
| Counting method | `/counting` | Out of the header. Linked from the footer |

Redirect the old `/practice/*` routes to the new service pages. The `live` underline still marks the current page.

## 3. The homepage

A high-converting homepage does three things in order: says what this is, shows it is real, and offers one next step. Build it in this order. Every section below the hero is one idea, a headline of eight words or fewer, at most two sentences, and one link or button.

**3.1 Hero**

- **Load-in.** On first load the hero assembles: the header, then the headline line by line, the supporting sentence, the two buttons, and the key settling into place. Use rises, clipped reveals and fades. About 1.2 seconds in total, eased, nothing bouncing. Play it once per browser session; on later visits within the session show the hero already in place. With reduced motion, show it in place with no animation.
- **The key is a K.** Change the legend from V to K everywhere it appears: the opening key, the key that remains when the scroll sequence ends, the SVG stand-in shown before the canvas is ready, and any still or render. Search the project for every V legend. K for KEYSTROKE.
- **The scroll sequence stays as it is.** It is the part the principals like most. Change only the legend.
- **Say what KEYSTROKE is, fast.** Keep the headline `LET US PUSH THE BUTTONS FOR YOU.` Replace the supporting copy with one plain sentence that covers the whole offer, along these lines: "We find the admin your team does by hand and rebuild it so it runs itself. Then we build the software, the website and the brand to go with it." A visitor should be able to repeat what KEYSTROKE does after reading only the headline and that sentence.
- **Remove the audience line.** Delete "for Australian businesses of 5 to 50 staff" and any other wording, on any page, that limits who the service is for. The site should read as open to any business.
- **Two buttons, large.** Key-shaped controls at least 56px tall. Primary: **Take the 90-second quiz**. Secondary: **Book the audit**. They are part of the load-in and are visible without scrolling at both screen sizes.

**3.2 Proof strip.** The three or four cleared figures stay, each with a plain label saying what it is. Remove the animation in which the number reels travel in from the right, and remove the large scene behind them. The reels are simply there; when the strip scrolls into view the digits roll and settle in place.

**3.3 What we do.** Four cards, one per service, with equal weight. See section 5 for names and copy. This replaces the old practices section and its "three clear the desk, one builds what goes on it" framing, which did not land. Each card links to its service page.

**3.4 How it starts.** The audit in three numbered steps and a price, nothing more: we watch one process; we count it; you get a report and a fixed quote. `$1,500`, fixed. Link: "See how the audit works".

**3.5 Featured cases.** Three cases as simple cards: who the business is, the problem as a short headline, and one before-and-after figure with its unit in words. Choose three that cover different services, one of them a website or design case. Link: "See all cases". No filter bar, no artefacts, no tally bars here.

**3.6 Meet the crew.** A row of the five avatars with their names and a five-word role under each. One sentence above them. Link: "Meet the crew".

**3.7 Keystroke Savers.** Three tier cards, each with its name, price, hours and one plain line saying what it is for (section 8). Link: "Compare the plans".

**3.8 Not sure where to start?** A band with one sentence and the quiz button.

**3.9 Australian owned and operated.** A short trust line in place of the "two of us" section, which is removed along with the K and T keycaps. Read the wording from `site.json` (section 11). Do not name the principals on the homepage.

**3.10 Footer.** Section 10.

## 4. Cases

The reviewer could not tell what each part of a case meant. Simplify hard.

**The case card**, used on the homepage and on `/cases`, has five things and no others:

1. Who: the descriptor line.
2. The problem: the headline.
3. What we did: one sentence.
4. The result: before and after, each with its unit spelled out. "Before: 41,900 keystrokes a year. After: 400."
5. A service tag.

Remove from the card: the tally bar, the crew unit, scope, go-live date, the case number as a heading, the artefact, the 3D object behind it, and the demo plate. One motion only: the before figure rolls to the after figure when the card enters.

**`/cases`** opens with one sentence that explains the unit, once: "A keystroke is one thing a person had to type or click. We count them before we start and again after." Then a grid of cards with one row of filters, by service. No sticky two-row filter bar.

**`/cases/[id]`** is where the depth goes: the story in three short blocks (the problem, what we built, the result), the artefact, the cost range labelled "What a build like this costs", and a button to book the audit.

**Show the full range of work.** KEYSTROKE also designs brands and builds websites, and the cases should show it. Add the two cases in section 11 and make sure the featured three on the homepage are not all automation.

## 5. Services

The four practices become four services with names a customer already uses. The practice name stays as a small label.

| Service name | Was | One line |
|---|---|---|
| Automation and AI agents | Clear | The work happens without anyone doing it. |
| Reporting and dashboards | Count | See how the business is doing in time to act. |
| Websites and software | Build | A site or a tool built for how you actually work. |
| Branding and graphic design | Face | Look like the business you have become. |

Under each, three examples in plain words, drawn from the plan's capability lists. For instance, under Branding and graphic design: logos and rebrands, tender and capability documents, brochures and stationery. Under Websites and software: websites you can edit yourself, online stores, custom apps.

Design and websites are not an afterthought. Give the four services equal size and weight on the homepage and on `/services`, and name all four in the hero sentence and the footer.

Each service page: one sentence on what it is, the three examples, two or three case cards, the indicative price ranges, one button. Keep one small scroll moment per page; cut the rest.

## 6. The audit page

The reviewer likes the audit and could not follow the page. Rebuild it as four short blocks in this order.

1. **What it is**, in one sentence: "We watch one of your processes from start to finish, count every keystroke in it, and tell you what it costs and what to fix."
2. **How it works**, in three numbered steps.
3. **What you get**: the sample report, simplified to three labelled parts (the count, what it costs you in hours, what to fix first) and the quote. Label every figure in words.
4. **The price and one button**: `$1,500`, fixed, 1–2 weeks, one working tool included. Then "What happens next" in one sentence with the three build ranges.

Keep the stack-of-forms sequence as the page's one set piece, shortened, at the top. Nothing else on the page moves except figures rolling when they enter.

## 7. The crew

The principals want the crew to have personalities: names, faces, a line of character each. Build that, with one limit that is not negotiable because the business plan identifies it as a legal exposure: the crew must never read as human staff. They are AI agents with names, and the site says so.

- **Names and roles** are in section 11. Use the name; never "he" or "she", and not "it" either. Repeat the name.
- **Avatars.** A head-and-shoulders illustrated character for each, drawn as SVG components in one consistent style, in the Instrument tokens. Friendly, distinct from one another, and clearly illustrations: no photographs, no photorealistic or generated human faces. Load each from `src/assets/crew/` so supplied artwork can replace the drawn version later.
- **Each card:** avatar, name, the tag `AI agent`, a one-line role in plain words, when it works, and its running total with a label in words. Remove the punched tape, the unit numbers, the plate strip and the `Not a person.` line.
- **The `/crew` page** opens with one sentence that says plainly what the crew is: "Our crew is five AI agents. They do the overnight work, and we check it."
- The running mark and its rules are unchanged.

## 8. Keystroke Savers

The tiers and prices are right. What each one is was not clear.

- One sentence at the top says what Savers is: "We keep what we built running, fix it when something changes, and improve it every month."
- Each tier card has its name, monthly price, hours, and one plain line from section 11 saying who it suits.
- Below the cards, one short list of what every plan includes.
- Say what "Foundation pricing" means in one short sentence beside the label.

## 9. Quiz

- Add it to the header and make it the primary button in the hero and in section 3.8.
- Remove the wording about business size from the result: delete the "Over 50" sentence and the rule that sends businesses under five staff to "buy nothing yet". "Buy nothing yet" now applies only when no item qualifies.
- Cut the text on each result screen to what the visitor needs: the read, the recommended items, the next step.

## 10. Footer, and text that is not for customers

The footer is unfinished and carries internal notes. Rebuild it as a proper footer:

- The logotype and the one-line description of what KEYSTROKE does.
- Services: the four service pages.
- Company: Cases, Audit, Crew, Savers, Quiz, Counting method.
- Contact: the email address and the booking link.
- The line "Australian owned and operated."
- A copyright line with the current year.

Remove from every page anything written for the builder or the principals rather than the customer: demo plates and "demonstration figure" labels, "figures illustrative", the stand-in notice, the rounding notice (move it to `/counting`), anything that prints `TODO`, case numbers and unit numbers used as headings, scope and date strings under counters, and any stray developer text. Go through every page's rendered text and read it as a customer would.

Nothing on the site may display `TODO` or a disabled control. If a value in `site.json` is still `TODO`, leave that item out of the page. Every "Book the audit" button links to the booking block at the foot of `/audit`; that block shows the booking link and the email address once they are set.

**The mock content is still mock.** The page no longer says so, so the protection moves to the point of publishing:

- While `site.demo` is true, every page keeps `noindex`.
- `npm run deploy` must stop with a clear message while `site.demo` is true, any record carries `"demo": true`, or the email and booking link are still `TODO`, listing what has to be replaced. Invented cases and figures must not go live presented as real work.
- Update `npm run check` to match: drop the checks that require demo labels, keep the rest.

## 11. Content changes

Apply these to `src/content/`.

`site.json`: add these keys. Leave the `TODO` values for the principals.

```json
{
  "tagline": "Let us push the buttons for you.",
  "description": "We find the admin your team does by hand and rebuild it so it runs itself. Then we build the software, the website and the brand to go with it.",
  "origin": "Australian owned and operated.",
  "yearsExperience": "TODO",
  "experienceLine": "{years} years building systems, software and brands for Australian businesses."
}
```

Show `experienceLine` only when `yearsExperience` is a number. Do not invent one.

`crew.json`: add to the existing five records, matched by `unit`. The existing fields stay.

```json
[
  {"unit":"01","name":"Tilly","role":"Matches your accounts overnight","character":"Tilly checks every bank line against the books before anyone is awake. Tilly likes things to add up."},
  {"unit":"02","name":"Ivy","role":"Turns forms into jobs and invoices","character":"Ivy takes each form your team submits and writes the job, the invoice draft or the work order from it."},
  {"unit":"03","name":"Paige","role":"Builds your reports by morning","character":"Paige puts the reporting pack together overnight, so it is waiting when you sit down."},
  {"unit":"04","name":"Drew","role":"Writes the first draft","character":"Drew drafts every quote and document from one record. You read it and press send."},
  {"unit":"05","name":"Link","role":"Keeps your systems in step","character":"Link keeps your systems matching each other and lists anything that does not."}
]
```

`cases.json`: add two cases, and add a `service` field to every case (`automation` for Clear, `reporting` for Count, `web-software` for Build, `brand-design` for Face). Neither new case has a ledger row or a crew unit.

```json
[
  {"id":"011","practice":"build","service":"web-software","businessType":"Trades and construction","descriptor":"Landscape supplier · 16 staff · Sunshine Coast","headline":"EVERY WEBSITE CHANGE WAITS ON A DEVELOPER.","wrong":"Prices and products were out of date because nobody in the office could edit the site.","built":"A new website on Cloudflare with a product catalogue the office edits itself.","before":{"value":9,"unit":"days to change a page","note":"Sent to a developer, then chased."},"after":{"value":1,"unit":"day","note":"Changed in the office."},"crewUnit":null,"costRange":"$6,000–$12,000","scope":"Website and product catalogue","goLive":"2026-08-10","artefact":"site-editor","object":"sheet","demo":true},
  {"id":"012","practice":"face","service":"brand-design","businessType":"Trades and construction","descriptor":"Civil contractor · 45 staff · Rockhampton","headline":"4 CAPABILITY STATEMENTS IN CIRCULATION. NONE CURRENT.","wrong":"Each estimator kept a different version of the capability statement and edited it for every bid.","built":"One capability statement, a brochure and a set of project sheets, designed as a family and kept in one place.","before":{"value":4,"unit":"versions in circulation","note":"All different."},"after":{"value":1,"unit":"version","note":"Everyone sends the same one."},"crewUnit":null,"costRange":"$2,500–$4,000","scope":"Capability statement and collateral","goLive":"2026-08-24","artefact":"collateral-set","object":"sheet","demo":true}
]
```

`products.json`: add to each Savers tier.

```json
[
  {"name":"Watch","suits":"One or two automations that need to keep running."},
  {"name":"Run","suits":"Several systems, with regular changes each month."},
  {"name":"Own","suits":"We run and improve your admin systems as an ongoing job."}
]
```

Add `"foundationNote": "Foundation pricing is our launch rate for early clients."` to `savers`.

The crew names, the `suits` lines, the foundation note and the hero sentence are new commercial copy. List them in `NOTES.md` for the principals to approve.

## 12. Simplify every page

Apply these across the whole site, including pages this file does not mention.

**Words**
- One idea per section. A headline, at most two sentences, one action.
- Cut the total word count of each page by at least half. If a sentence does not help a visitor understand or decide, delete it.
- Every number has a label in plain words saying what it is.
- Explain a term the first time it appears on a page, or do not use it. "Keystroke" gets one sentence. Internal terms (ledger, unit, practice, scope, baseline) stay off customer pages except `/counting`.
- The design system's voice still applies: plain, exact, no hype, no banned words.

**Motion**
- One moving thing per viewport. If a section has a scene behind it, a mechanism in it and text arriving, keep one.
- The hero sequence is the site's one large set piece. Every other page gets at most one smaller one.
- Everything else arrives with a quiet reveal as it enters the viewport: a short rise or fade, about 400ms, once.
- No 3D behind sections that carry a lot of text.
- Inner pages get a light load-in: the heading and first block only.

**Layout**
- More space between sections, fewer things per screen.
- Every page ends with the same closing band: one sentence and the two buttons.

## 13. Finish

1. Screenshot every page again at both sizes and compare with the first set. For each page, answer in `NOTES.md`: what would a first-time visitor say this page is for, and what is the one thing it asks them to do?
2. Run `npm run check` and the build.
3. Confirm the hero scroll sequence behaves exactly as before apart from the K.
4. Report what changed, page by page, what you decided where this file left room, and the open items for the principals: contact email, booking link, years of experience, the copy awaiting approval, avatar artwork if they want to supply it.

Do not deploy.
