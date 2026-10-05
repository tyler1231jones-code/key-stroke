# Motion audit

2 October 2026. Revision 2, section 5. The hero scroll sequence on the
homepage was measured but not changed.

## How it was done

Two things, because motion cannot be judged from a table alone.

1. **Measured.** `tools/audit-motion.mjs` (`npm run audit:motion`) opens
   every page at 1440×900 and 390×844 with the processor slowed four times,
   scrolls from top to bottom in 200px steps, and records at every step what
   is moving (CSS transitions and animations, GSAP tweens, and whether the 3D
   canvas drew a frame), the slowest frame, and any layout shift. From that
   it reports:
   - **dead stretches**: more than one screen of scrolling where nothing moved
   - **competition**: steps where two separate things were moving at once
   - **jank**: frames over 50ms, and layout shift
   - controls that do not respond to the pointer, and sections with no
     arrival of any kind
2. **Looked at.** `npm run tour` makes one contact sheet a page and size, top
   to bottom. I read the full set before (`shots/r2-before/`) and after
   (`shots/r2-after/`), and frame sequences of each demonstration and of the
   hero.

The measurements are in `shots/audit/motion-before.json` and
`motion-after.json`. "Before" is the site with this revision's offer, forms
and demonstrations in place and the motion untouched, which is the state the
brief asks the audit to examine.

A browser on this machine draws 3D in software, with no graphics card. Frame
times for the two 3D scenes are therefore far worse here than on any real
device, and say nothing about a real phone. They are useful only for
comparing before with after.

## What moved before, section by section

Trigger "reached" means the block entering the viewport, once. Nothing below
a hero undoes itself on the way back up.

### Homepage

| Section | What moved | Trigger | Duration | What was wrong |
|---|---|---|---|---|
| Hero, on first load | Header drops in, headline rises line by line, sentence, buttons, then the key | First visit in a browser session | 1.2s in all: 0.35s, 0.5s, 0.45s and 0.7s pieces | Four durations used nowhere else on the site |
| Hero, scrolling | The key pulls back, a field of keys types, rows drop, the counter rolls, the camera pushes back in | Scroll, pinned for about 4 screens | Follows the scroll | Nothing. Not changed |
| Proof | Heading rises; four figures roll | Reached | 0.4s; 180ms a digit, with a spin on the way | Figures were still spinning when the next section's heading and cards arrived |
| Four services | Heading and four cards rise, 60ms apart; the four small demonstrations play in turn | Reached | 0.4s; 4 to 7s each | On a phone, one demonstration kept playing after it had scrolled off the screen, underneath the arrival of the next three sections |
| Audit in three steps | Heading and three steps rise | Reached | 0.4s | Nothing |
| Three cases | Heading and cards rise; each "after" figure rolls from its "before" | Reached | 0.4s; 180ms a digit | Nothing |
| Crew | Heading and five avatars rise | Reached | 0.4s | The avatars are characters, and were as still as pictures |
| Savers | Three cards rise | Reached | 0.4s | Nothing |
| Quiz band, origin line, footer | Nothing | | | **Dead stretch:** the last 1,060px on a desktop and 1,470px on a phone had no motion at all |

Layout shift on a phone: 0.042. The weekly change under the hero counter
wrapped to a second line when its figure arrived and pushed the buttons down.

### Services

| Section | What moved | Trigger | Duration | What was wrong |
|---|---|---|---|---|
| Heading | Heading and sentence rise | Load | 0.4s | Nothing |
| Four cards | Rise, 60ms apart | Reached | 0.4s | Nothing |
| Closing band | Rises | Reached | 0.4s | Nothing |
| Footer | Nothing | | | **Dead stretch** on a phone: the last 1,290px |

### Each service page

| Section | What moved | Trigger | Duration | What was wrong |
|---|---|---|---|---|
| Hero | Heading rises; the demonstration faded in, then played | Load | 0.4s, then 4 to 7s | The demonstration started empty and faded in late, which made it the last thing painted. On the reporting page one frame took 730 to 920ms as its timeline was built |
| What we offer | Heading and product cards rise | Reached | 0.4s | Arrived while the demonstration was still playing on a short screen |
| Two cases | Cards rise; figures roll | Reached | 0.4s; 180ms a digit | Nothing |
| Questions, closing band | Rise | Reached | 0.4s | Nothing |
| Footer | Nothing | | | **Dead stretch** on a phone: the last 1,220 to 1,320px |

### Cases, and a case

| Section | What moved | Trigger | Duration | What was wrong |
|---|---|---|---|---|
| Case cards | Each "after" figure rolls from its "before" as its card is reached | Reached | 180ms a digit | Nothing. This is the best motion on the inner pages: it is the proof |
| A case: the illustration | Its rows fill in, in order | Reached | Stepped | Nothing |
| Filter chips | Nothing | Pointer | | **No response to the pointer** |
| Closing band | Rises | Reached | 0.4s | Nothing |
| Footer | Nothing | | | **Dead stretch** on a phone: 1,220 to 1,270px |

### Audit

| Section | What moved | Trigger | Duration | What was wrong |
|---|---|---|---|---|
| Hero | The stack of forms clears as you scroll | Scroll, pinned for under one screen | Follows the scroll | Nothing |
| How it works, the report, the price, the questions | Blocks rise | Reached | 0.4s | "How it works" arrives while the stack is finishing. Kept: see "What is left" |
| The form, footer | Nothing | | | **Dead stretch:** 1,270px on a desktop, 1,870px on a phone |

### Crew, Savers, Quiz, Counting, Contact, Privacy, 404

| Page | What moved | What was wrong |
|---|---|---|
| Crew | Cards rise; each agent's total rolls; the closing band rises | Avatars still. **Dead stretch** on a phone: 1,380px, across the footer |
| Savers | Cards and questions rise | **Dead stretch:** 1,170px on a desktop, 1,910px on a phone, across the form and the footer |
| Quiz | A question rolls out and the next rolls in, 270ms, linear | The page itself never moved: no arrival on the question, the result or the footer. The result was 1,950px of still page on a desktop and 3,000px on a phone |
| Counting | Heading rises; the closing band rises | The summary, the method and the ledger table had no arrival. **Dead stretch** from the top on both sizes |
| Contact | Heading and form rise on load | **Dead stretch** on a phone: the whole page below the first screen |
| Privacy | Heading rises; the closing band rises | Five sections with no arrival. **Dead stretch** on a phone: 1,360px |
| 404 | Heading rises | Nothing else on the page to move |

### Every page

- **No easing on any response.** Buttons, cards, links, questions and the
  demonstration controls changed state instantly on hover: the change was
  there, but it snapped. Footer links and filter chips did not respond at all.
- **The footer never moved.** On every page the last screen or more was
  still. That is where most of the dead stretches come from.
- **Timing was scattered.** Durations, distances and stagger were written
  out in three stylesheets: 0.25s, 0.35s, 0.4s, 0.45s, 0.5s and 0.7s were
  all in use, rises were 16px in one place and 12px in another, and stagger
  was 60ms or 90ms.
- **Page to page:** a hard cut, with the header redrawn each time.

## What was changed

**One motion system, in one file.** `src/styles/motion.css`:

| | Value | Used for |
|---|---|---|
| `--dur-1` | 0.15s | A response: hover, press, focus, the cross-fade between pages |
| `--dur-2` | 0.4s | An arrival: a block entering the viewport, the hero's pieces, the phone bar |
| `--dur-3` | 0.7s | A set piece: the key arriving in the hero |
| `--ease-out` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Arriving and settling, never past the target |
| `--ease-inout` | `cubic-bezier(0.65, 0, 0.35, 1)` | Travelling between two resting places |
| `--stagger` | 70ms | Between cards in a row |

Three standard arrivals: text rises 12px and fades in; cards rise 24px and
fade in, 70ms apart; figures roll to their value. Every page uses these and
nothing else for arrivals.

Mechanisms keep the design system's own timing and are never eased: a digit
rolls in 180ms, linear; a key press is 90ms down and 120ms back. A
demonstration is one GSAP timeline that uses the same two curves
(`power2.out`, `power2.inOut`); the lengths of its moves are set by the scene.

**Responses.** Every control now responds to the pointer, to focus and to a
tap, in 0.15s:

- Key-shaped buttons sink 1px on hover and 2px when pressed, as before, now
  eased.
- A card that is a link lifts 2px and its "more" mark steps 4px forward.
- Text links with a mark do the same step. Footer links underline.
- Filter chips take an ink border on hover and sink when pressed.
- Questions change colour on hover. Form fields ease their border on focus.

**Dead stretches filled, with motion that carries meaning:**

- The footer's four columns rise 70ms apart, on every page.
- After the closing band has risen, its main button is pressed once, on its
  own, the way the key in the hero is pressed. It is the site's one idea,
  restated at the point of asking.
- The homepage quiz band and origin line rise.
- The crew avatars blink, each on its own beat, once every 5.5 seconds.
  They are characters; before, they were pictures.
- The counting summary, the ledger table and the privacy sections rise as
  they are reached. The ledger's total rolls.
- The quiz result arrives in three parts, in reading order.
- A demonstration on a service page is now painted in its finished state from
  the first frame, then rewinds and plays. Nothing fades in late.

**Competition removed:**

- The four small demonstrations on the homepage still take turns, and now
  only among the ones on screen. One plays while the others rest in their
  finished state; a demonstration less than 45% on screen stops and rests.
- Proof figures take a shorter spin on the way to their value, so they
  settle sooner.
- Demonstration timelines are built one at a time as a page nears them, not
  all at load.

**Jank:**

- The reporting demonstration's rows were rebuilt as plain elements with
  small travelling chips in place of forty measured cells. Its worst frame
  under a four-times-slowed processor fell from 767ms to 17ms.
- The weekly change under the hero counter no longer takes space in the
  layout on a phone. Layout shift on the homepage went from 0.042 to 0.

**Page to page.** Moving between pages is a 0.15s cross-fade with the header
held still. This is the browser's own cross-document view transition (two
lines of CSS), not Astro's client router. The router keeps one document alive
across pages, which would mean tearing down and rebuilding the canvas, the
smooth scrolling and every scroll trigger on each navigation, and the hero
sequence depends on all three starting clean. A browser without view
transitions gets the hard cut it had before.

**The hero load-in** keeps its order and its 1.2 seconds. Its pieces now use
the system's durations (0.4s, and 0.7s for the key) in place of 0.35s, 0.45s
and 0.5s. The phone bar slides in 0.4s, not 0.25s. I watched the load-in
again afterwards at both sizes (`shots/intro-desktop.png`,
`shots/intro-phone.png`).

**The hero scroll sequence is untouched.** I compared frames at the same
scroll positions before and after (`shots/hero-compare-desktop.png`,
`shots/hero-compare-phone.png`).

**Reduced motion.** Nothing above runs. Every block is in place, figures show
their values, demonstrations show their finished state, avatars do not blink
and pages do not cross-fade.

## Results

Measured again after the changes, same script, same settings.

### Dead stretches, long frames and layout shift

"Dead" is the length of any stretch longer than one screen where nothing
moved. "Worst frame" is under a four-times-slowed processor.

| Page | Size | Dead, before | Dead, after | Worst frame, before | after | Layout shift, before | after |
|---|---|---|---|---|---|---|---|
| Home | desktop | 1,058px | none | 300ms | 317ms | 0 | 0 |
| Home | phone | 1,466px | none | 300ms | 167ms | 0.042 | 0 |
| Services | desktop | none | none | 17ms | 17ms | 0.001 | 0.001 |
| Services | phone | 1,294px | none | 17ms | 17ms | 0 | 0 |
| Automation and AI agents | desktop | none | none | 67ms | 17ms | 0 | 0 |
| Automation and AI agents | phone | 1,221px | none | 50ms | 17ms | 0 | 0 |
| Reporting and dashboards | desktop | none | none | 83ms | 17ms | 0 | 0 |
| Reporting and dashboards | phone | 1,320px | none | 767ms | 17ms | 0 | 0 |
| Websites and software | desktop | none | none | 33ms | 17ms | 0.001 | 0.001 |
| Websites and software | phone | 1,227px | none | 50ms | 17ms | 0 | 0.002 |
| Branding and graphic design | desktop | none | none | 17ms | 17ms | 0 | 0.001 |
| Branding and graphic design | phone | 1,267px | none | 33ms | 17ms | 0 | 0.001 |
| Cases | desktop | none | none | 17ms | 17ms | 0.001 | 0.001 |
| Cases | phone | 1,215px | none | 17ms | 17ms | 0 | 0 |
| A case | desktop | none | none | 17ms | 17ms | 0.001 | 0.001 |
| A case | phone | 1,269px | none | 33ms | 33ms | 0 | 0 |
| Audit | desktop | 1,266px | none | 33ms | 17ms | 0 | 0 |
| Audit | phone | 1,867px | 1,000px | 17ms | 17ms | 0 | 0 |
| Crew | desktop | none | none | 50ms | 50ms | 0 | 0 |
| Crew | phone | 1,375px | none | 17ms | 33ms | 0 | 0 |
| Savers | desktop | 1,172px | none | 17ms | 17ms | 0.001 | 0.001 |
| Savers | phone | 1,913px | 1,000px | 17ms | 17ms | 0 | 0 |
| Quiz | desktop | none | none | 17ms | 17ms | 0 | 0 |
| Quiz | phone | 1,179px | none | 17ms | 17ms | 0 | 0 |
| Quiz result | desktop | 1,948px | 1,000px | 17ms | 17ms | 0 | 0 |
| Quiz result | phone | 3,004px | 1,200px | 17ms | 17ms | 0 | 0 |
| Counting | desktop | 1,000px | none | 17ms | 17ms | 0 | 0 |
| Counting | phone | 1,200px and 1,374px | none | 17ms | 17ms | 0 | 0 |
| Contact | desktop | none | none | 17ms | 17ms | 0 | 0 |
| Contact | phone | 1,809px | none | 17ms | 17ms | 0 | 0 |
| Privacy | desktop | none | none | 17ms | 17ms | 0 | 0 |
| Privacy | phone | 1,359px | none | 17ms | 17ms | 0 | 0 |
| 404 | desktop | none | none | 17ms | 17ms | 0 | 0 |
| 404 | phone | 1,088px | 1,337px | 17ms | 17ms | 0 | 0 |

- **Dead stretches:** 23 before, 5 after. Those that remain
  are forms and the 404 (see "What is left").
- **Long frames outside the 3D scenes:** the worst was 767ms, on the
  reporting page. No inner page now has a frame over 50ms. One remains on the
  desktop homepage: a single frame of about 300ms, slowed, at the moment the
  four small demonstration timelines are built, one screen before their cards
  arrive. Unslowed it is about 75ms, once. It is the cost of not building
  them during page load, where the same work was delaying the first tap. I
  judged that the better trade and left it.
- **Layout shift:** the largest is now 0.002.

### Competition

| | Before | After |
|---|---|---|
| Homepage on a phone: steps with two things moving | 14 | 7 |
| All pages, both sizes | 39 | 43 |

The number that mattered fell: on the phone homepage a demonstration no
longer plays under the sections that follow it. The total did not fall,
because every arrival added to fill a dead stretch creates a moment where it
overlaps the end of the one before. Those are the hand-overs described under
"What is left".

A note on the measurement. My first count of competition before the changes
was 71. It was too high: the script was counting a section's heading and the
same section's cards as two separate things. The figures above count before
and after by the same, corrected rule.

### Responses to the pointer

| Control | Before | After |
|---|---|---|
| Key-shaped buttons | Respond, no easing | Respond, eased |
| Cards | Respond, no easing | Respond, eased |
| Text links, inline links, tags | Respond, no easing | Respond, eased |
| Questions | Respond, no easing | Respond, eased |
| Demonstration controls | Respond, no easing | Respond, eased |
| Footer links | No response on any of 17 pages | Respond, eased |
| Filter chips | No response | Respond, eased |
| Header links | Respond, no easing | Respond, eased |

The script reports the first header link as not responding on the five
service pages. That link is "Services", which is the page the visitor is on,
so it is already in its marked state.

## What is left, and why

- **Forms stay still.** Four of the five stretches that remain are the
  screens a form occupies: `/audit` and `/savers` on a phone, and the quiz
  result at both sizes. A form that moves while someone is filling it in is
  worse than a form that does not.
- **The 404 on a phone.** Fifteen words and a link. Nothing was added.
- **The full counting method stays still.** It is folded away until someone
  opens it, and it is reference text. The summary above it and the ledger
  below it arrive.
- **Hand-overs counted as competition.** What the script still counts are
  moments where one thing is finishing as the next begins: the hero's camera
  settling as the proof heading rises; the stack of forms settling as "How it
  works" rises; a demonstration in its last second as the next section's
  heading arrives; a closing band or a form rising just after the last
  question. On a phone the four proof figures are stacked, so the last of
  them is still rolling as the services heading arrives. I looked at each.
  None has two things asking for attention at once, and delaying the second
  would leave a visible gap.
- **Long frames in the 3D scenes.** The homepage's worst frames (about 300ms
  slowed, in the row-by-row drop of the key field) are the software renderer
  (see "How it was done"), are the same before and after, and are inside the
  hero sequence, which this audit may not change. They need checking on a
  real phone.
- **Not seen on a real device.** Everything here was judged in emulated
  Chromium. Timing that feels right at 60 frames a second on a desk can feel
  slow on a phone; if anything feels heavy, `--dur-2` is the one number to
  shorten.
