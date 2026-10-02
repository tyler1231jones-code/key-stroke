# Notes on the build

2 October 2026. This file covers revision 1 (`docs/revision-1.md`). The plan
it followed is `REVISION-PLAN.md`. The state before the revision is commit
`1d33a55`, "Before revision 1". **The revision itself is not committed**: it
is in the working folder, waiting for you to look at it.

The notes from the first build (machine and tools, packages, its decisions)
are in that commit: `git show 1d33a55:NOTES.md`.

## 1. Where things stand

- `npm run build`, `npm run check`, `npm run check:types` and `npm run qa` pass.
- The site has 25 pages: the homepage, `/services` and four service pages,
  `/cases` and twelve case pages, `/audit`, `/crew`, `/savers`, `/quiz`,
  `/counting` and the 404. The four old `/practice/*` addresses redirect.
- All content is still mock. The pages no longer say so. `npm run deploy`
  refuses to run until the mock content is replaced (section 6).
- Nothing was deployed, and nobody has logged in to Cloudflare.

## 2. What changed, page by page

**Homepage.** Was eight long sections, about 2,400 words. Now a short sales
page of about 490 words: hero, four proof figures, four service cards, the
audit in three steps with its price, three featured cases, the crew row,
three Savers plans, a quiz band, and "Australian owned and operated".

- Hero: the key is a K, in the 3D key, the drawn stand-in and every still.
  The supporting copy is the one-sentence description. The audience line is
  gone. Two 56px buttons: "Take the 90-second quiz" and "Book the audit".
  On first load in a browser session the header, the headline line by line,
  the sentence, the buttons and the key arrive over about 1.2 seconds.
- The hero scroll sequence is unchanged apart from the K. I compared ten
  frames at the same scroll positions before and after
  (`shots/hero-compare.png`): the pull-back, the typed field, the row-by-row
  drop, the counter rolling from 138,200 to 146,700 and the push back in all
  match. Two small consequences of the taller copy block are in section 4.
- Proof strip: the drum scene and the travelling reels are gone. Four
  counters sit in place and roll once when reached. Each has a label in
  words, such as "keystrokes a year a wholesale distributor no longer types".
- Removed: the ten full cases and their 3D objects, the two-row filter bar,
  the parallax interlude, the pinned audit sequence, the practice
  mechanisms, the punched tape, the tally marks, and "the two of us" with
  its K and T keys.

**Services** (was Practices). `/services` has four equal cards. Each service
page has one sentence, three examples, two cases, the three price ranges and
one button. Each keeps one small scroll moment in its hero: the forms stack
clears, the drums roll from before to after, the key field thins out, the
sheet squares up. The practice name stays as a small label.

**Cases.** `/cases` is a grid of twelve cards with one filter row by service.
Every card has five things: who, the problem, what we did, before and after
with units in words, and a service tag. The after figure rolls from the
before figure when the card is reached. `/cases/[id]` holds the depth: the
problem, what we built, the result, the illustration of the build running,
"What a build like this costs", and one button. Cases 011 (website) and 012
(capability statement) are added.

**Audit.** Four blocks in the order asked: what it is, how it works in three
steps, the sample report cut to three labelled parts and the quote, and the
price with one button and "What happens next". The stack of forms is the
set piece at the top, shortened from three screens of scrolling to under one.
The page ends on the booking block, `/audit#book`.

**Crew.** Five cards: a drawn avatar, the name, the tag `AI agent`, the role,
the line of character, when the agent works, and a running total labelled in
words. The punched tape, unit numbers, plate strip and "Not a person." are
gone.

**Savers.** One sentence, the foundation note beside its label, three plan
cards with price, hours and who each suits, then what every plan includes.

**Quiz.** In the header, and the primary button everywhere. The result is
three parts: the read, the items to fix in order, the next step. The size
wording and the under-five rule are gone; "Buy nothing yet" appears only
when no item qualifies. "Next" is hidden until a question is answered, so no
control is ever shown disabled.

**Counting.** Out of the header, linked from the footer. A three-part plain
summary comes first. The full method, word for word, is folded beneath it.
The ledger table follows, with the rounding notice.

**Every page.** New header (Services, Cases, Audit, Crew, Savers, Quiz, and a
key-shaped "Book the audit"). New footer: logotype and description, the four
services, company links, contact, "Australian owned and operated", copyright.
A closing band with one sentence and the two buttons. No demo plates, no
`TODO`, no stand-in notice, no case or unit numbers as headings.

### Words on each page

Counted from the built pages: text a visitor can read in `<main>`.

| Page | Before | After | Fewer |
|---|---|---|---|
| Home | 2,413 | 492 | 80% |
| Automation (was Clear) | 604 | 191 | 68% |
| Reporting (was Count) | 668 | 203 | 70% |
| Websites and software (was Build) | 470 | 181 | 61% |
| Branding (was Face) | 375 | 165 | 56% |
| Counting, as first seen | 746 | 360 | 52% |
| Quiz result, same answers | 265 | 208 | 22% |
| 404 | 46 | 31 | 33% |

Two pages miss the "at least half" target. The quiz result is mostly the
visitor's own answers read back, plus up to three item names; I cut the
estimate, the cost lines and the closing paragraph and stopped there. The
404 has 15 words of its own; the other 16 are the closing band.

## 3. What each page is for, and the one thing it asks

Answered after reading the after screenshots (`shots/after/`) beside the
before set (`shots/before/`), at 1440×900 and 390×844.

| Page | A first-time visitor would say it is for | The one thing it asks |
|---|---|---|
| Home | "They take the admin work off a business, then build its software, website and brand." | Take the 90-second quiz |
| Services | "The four things they do." | Pick the one that sounds like your problem |
| A service page | "What this service is, what it looks like, and what it costs." | Book the audit |
| Cases | "Jobs they have done, with the number before and after." | Open a case |
| A case | "What was wrong for one business, what they built, and what changed." | Book the audit |
| Audit | "How I start: they count one process and give me a report and a quote for $1,500." | Book the audit |
| Crew | "The AI agents that do the overnight work." | Start with the quiz, or book the audit (closing band) |
| Savers | "A monthly plan to keep what they built running." | Start with the quiz, or book the audit (closing band) |
| Quiz | "Nine questions to find out what I should fix first." | Answer the question on screen; on the result, book the audit |
| Counting | "How they count, so I can check their figures." | Start with the quiz, or book the audit (closing band) |
| 404 | "That address has no page." | Go to the homepage |

Crew, Savers and Counting inform rather than sell, so their only action is
the closing band. That is deliberate, not an omission.

## 4. Decisions where the revision left room

1. **The hero sentence names all four services.** Section 11 of the revision
   gives the description as "...Then we build the software, the website and
   the brand to go with it." Section 5 says to name all four services in the
   hero sentence, and that wording leaves out reporting. I added two words:
   "Then we build **the reports,** the software, the website and the brand to
   go with it." To go back, edit `description` in `src/content/site.json`.
2. **Featured cases:** 002 (automation, electrical contractor), 003
   (reporting, accounting practice) and 011 (website, landscape supplier).
   Three services, three kinds of business. Change `featuredCases` in
   `site.json`.
3. **Book the audit goes to `/audit#book`.** That block is the audit page's
   closing band. It shows a "Choose a time" button once `bookingUrl` is set
   and the email address once `email` is set. Until then it shows the
   sentence and the quiz button only, so today it is a dead end for someone
   ready to book. The deploy guard does not let the site go live in that state.
4. **The closing band** is on every page except two. The homepage ends as
   section 3 of the revision sets out (quiz band, origin line). The quiz has
   no band, because a "take the quiz" button on the quiz makes no sense and
   its result already ends on the next step.
5. **Quiz exits are no longer equal.** The build brief asked for three exits
   at equal weight. The revision asks for one next step, so "Book the audit"
   is primary and "Email me this" is secondary. "Ask a question about it"
   needs the email address, so it is left out until `email` is set.
6. **Quiz estimate kept, shortened.** It is one figure with its label
   ("hours a year a business your size typically loses to typing things
   twice. An estimate."). It still depends on the size answer, but no longer
   says who the service is for.
7. **Crew avatars are keycap-headed characters.** A keycap for a head makes
   them friendly and plainly not people, which is the limit the business
   plan sets. Each differs by one prop tied to the job: Tilly's eyeshade,
   Ivy's clip and form, Paige's glasses and chart, Drew's pencil, Link's
   aerial and chain. The tag `AI agent` is on every card and the check fails
   without it. None of the crew copy uses "he", "she" or "it".
8. **One sentence per case card.** Several `built` fields are two sentences,
   so each case has a new `summary` field for the card (listed in section 5).
9. **Service pages show two cases, not three,** to keep each page under half
   its old length. "See all cases" opens `/cases` filtered to that service.
10. **The counting method is folded, not cut.** The published text is intact
    inside "The full counting method". A visitor sees the short summary first.
11. **Reveals and figure rolls play once.** Before, most motion undid itself
    when scrolling back up. Only the hero sequence still scrubs both ways.
12. **The audit page has no scroll reveals.** The revision says nothing on
    that page moves except the set piece and rolling figures, so its blocks
    are simply there.
13. **Two consequences of the taller hero copy.** The headline and its two
    buttons take more room than the old headline alone. (a) The field keeps
    clear of the copy, so a few keys at the lower left of the field no longer
    appear. (b) On a window shorter than 860px the headline is set at 64px
    instead of 88px, and the pinned sequence now needs a window at least
    700px tall (it was 600px); below that the hero flows as it does on a
    phone.
14. **Build-brief rules that still hold:** blank counter cells are not
    zeros, totals round down, and the running mark never shows for demo data.
15. **`npm run check` no longer rations the word "automation" inside the
    service's own name,** "Automation and AI agents". Elsewhere it is still
    allowed once a page.
16. **Unused 3D removed:** the drum scene on the homepage, the case scenes,
    the K and T keys, and the keypad and mouse objects.

## 5. Copy awaiting approval

Everything below is new or changed in this revision. The files are
`src/content/*.json` unless a page is named.

**Supplied in the revision, used as given**

- Crew names, roles and character lines: Tilly, Ivy, Paige, Drew, Link (`crew.json`).
- Savers "suits" lines and the foundation note (`products.json`).
- The audit sentence, the Savers sentence, the crew sentence, the cases sentence.

**Supplied, then changed by me**

- Hero sentence: "the reports," added (decision 1).

**Written by me**

- Homepage (`src/pages/index.astro`):
  - Counter label: "keystrokes our clients have not had to type in 2026"
  - "We counted." / "A keystroke is one thing a person had to type or click.
    Each figure is what one business stopped typing after we rebuilt one job."
  - Figure labels: "keystrokes a year a wholesale distributor no longer types"
    (and the same for the other three businesses)
  - "Four things we do." / "It starts with one audit." / "Meet the crew." /
    "Five AI agents do the overnight work, and we check it."
  - "Not sure where to start?" / "Answer nine questions and we will tell you
    what to fix first."
  - Links: "See how we count", "See how the audit works", "See all cases",
    "Meet the crew", "Compare the plans"
- Closing band: "Start with the quiz, or book the audit."
- Booking block: "Book the audit." / "One process, counted in 1–2 weeks, for
  $1,500." / "Choose a time" / "Or write to us:"
- Services (`services.json`):
  - Automation and AI agents: "We take the work your team does by hand every
    week and rebuild it so it runs on its own." Examples: Forms that write the
    job and the invoice; Approvals that route themselves; Systems that update
    each other overnight.
  - Reporting and dashboards: "We connect your systems so your reports build
    themselves and arrive while you can still act on them." Examples: Monthly
    reporting packs; Job costing while the job is running; Dashboards the
    whole team can read.
  - Websites and software: "We build websites you can edit yourself and
    software shaped to the way your business runs." Examples as given.
  - Branding and graphic design: "We design the brand, the documents and the
    print your business sends out." Examples as given.
  - Page copy: "We do four things. Pick the one that sounds like your
    problem." / "What we build." / "Jobs like this." / "What it costs." /
    "Every job starts with the audit, at $1,500. After the audit we quote the
    build, inside one of three ranges."
  - Reporting page caption: "What three clients typed in a year to build
    their reports: 127,200 keystrokes before, 4,600 after."
- Case summaries (`cases.json`, `summary`):
  - 001: The job-cost report now builds itself overnight from the job system and the accounts.
  - 002: The completed job form now writes the invoice draft and sends it for approval.
  - 003: Bank lines are matched overnight and the client packs build from the result.
  - 004: One quote record now writes the PDF and tells the other three systems.
  - 005: Hours are entered once on the floor and feed payroll and job costing.
  - 006: The tenant fills in one form, which writes the work order, the booking and the owner notice.
  - 007: A daily report of project hours now lands before work starts.
  - 008: The three systems are kept in step overnight, with a list of anything that does not match.
  - 009: A tender system the business owns: structure, messaging, page templates and a library of answers.
  - 010: One identity and one set of templates, all drawn from the same rules.
  - 011 and 012 use their `built` sentence as given.
- Case page: "The problem" / "What we built" / "The result" / "An
  illustration of the build running, with sample data." Sample rows for the
  two new cases are in `artefacts.json`.
- Audit (`products.json`, `audit`): the three step titles are from the
  revision. Their supporting lines are mine: "Someone does the job once, the
  usual way, while we record it." / "Every keystroke in it, and how often it
  happens in a year." / "What it costs you, what to fix first, and what the
  fix would cost." Also: "A short report and a fixed quote. This is a
  sample." / "After the audit we quote the build, inside one of three
  ranges." Report labels: "typed by hand", "of someone's time", "to rebuild
  this process".
- Crew card labels: "Works" / "Keystrokes Tilly has saved clients in 2026".
- Savers: "a month" / "hours of our time each month" / "Every plan includes"
  / "A reply within 1 business day".
- Quiz (`quiz.json`):
  - Estimate: "hours a year a business your size typically loses to typing
    things twice. An estimate. We would count yours to be sure."
  - The five closing paragraphs, each cut to one or two sentences:
    - Trust: "You do not have to trust us yet. The audit ends with a figure you can check against your own records."
    - Cost: "The audit is $1,500, fixed. What follows is quoted inside a range we publish before you ask."
    - Time: "The audit takes 1–2 weeks. Your part is to do the task once while we record it."
    - Failed before: "Most attempts fail by fitting the business to a platform. We count one process first, then build for the business as it is."
    - Not sure: "Then count it before deciding. If the number is small, you can stop there."
  - Result labels: "What we would fix, in order" / "is the usual cost" /
    "See one we built for a mechanical contractor" / "The next step"
- Counting summary: "How we count." and the three short blocks under it,
  plus "One row for each job we have cleared. The counter on the homepage is
  the sum of these rows."
- 404: "There is no page at this address." / "Go to the homepage"

## 6. Publishing guard

`npm run deploy` now runs `tools/predeploy.mjs` first. Today it stops with
this list, which is the work left before the site can go live:

- `site.json`: `demo` is true; `email` and `bookingUrl` are `TODO`
- `cases.json`: 12 demo records
- `crew.json`: 5 demo records
- `ledger.json`: 8 demo records
- `products.json`: 7 demo records (six quiz items and the estimates)
- `shiftReport.json`: the sample report

`npm run ready` prints the same list without deploying. I ran the guard on
its own and confirmed it exits with an error. I did not run `npm run deploy`.

## 7. What was checked, and what was not

Checked:

- Every page at 1440×900 and 390×844, top to bottom, after the revision.
  The hero also at 1280×720 and 768×1024.
- The hero sequence against the before build, frame by frame.
- `npm run check` against a deliberately broken page: it caught a banned
  word, `TODO`, a demo label, "5–50 staff", "ledger", a unit number, a
  disabled button, an invented dollar figure and keystroke figure, and a
  crew card with its `AI agent` tag removed.
- A build with `demo` set to false: 13 pages, no `noindex`, check passes.
  Restored to true afterwards.
- `npm run qa`: no sideways scroll, no body line over 66 characters,
  contrast, keyboard reach on five pages, and 3D memory steady over two
  passes of the homepage.
- Reduced motion on the homepage, the audit page and a service page:
  everything is in place and nothing animates.

Not checked:

- **A real phone or tablet.** Phone layouts were checked in emulated
  Chromium only.
- **Frame rate.** Everything ran on a software WebGL renderer.
- **Safari and Firefox.** Only Chromium was used.
- **A screen reader.**
- **The redirects on Cloudflare.** `public/_redirects` follows Cloudflare's
  format but has not been served by Cloudflare. The fallback pages Astro
  writes were built and are in `dist/practice/`.
- **`wrangler deploy`.** Not run, by instruction.

One number moved the wrong way. On the throttled phone profile the largest
paint is now at 1.8 seconds, up from under 1 second, because the load-in
holds the hero sentence back for half a second. It is inside the 2.5 second
limit. Layout shift is zero.

## 8. Open items for the principals

1. **Contact email** and **booking link**: `email` and `bookingUrl` in
   `site.json`. Until both are set, "Book the audit" leads to a block with no
   way to book.
2. **Years of experience**: `yearsExperience` in `site.json`. The line stays
   off the page until it is a number.
3. **Copy approval**: section 5, and the hero sentence in decision 1.
4. **Avatar artwork**, if you want to supply it: see README, "Crew avatars".
5. **Real content**: section 6 is the list. Cases 011 and 012 have no ledger
   row, as instructed.
6. **Domain**: `domain` in `site.json`, after the first deploy.
7. **Commit**: the revision is uncommitted. `git add -A` and commit when you
   are happy with it.
8. Still open from the first build: licensed fonts, offline renders (Blender
   and ffmpeg are not installed), and the duplicate PDFs and kit zip at the
   top of the folder.

`PLAN.md` describes the first build and is now out of date in places. It is
kept as the record of that build.
