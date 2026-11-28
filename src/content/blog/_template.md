---
# Copy this file to a new name in this folder: the name is the address,
# so what-goes-in-a-month-end-pack.md is /blog/what-goes-in-a-month-end-pack.
# A file whose name starts with an underscore, like this one, is not a post.
title: What goes in a month-end reporting pack   # 60 characters or fewer
description: The reason to read it, as it should read in search results. 70 to 155 characters, and no prices.
date: 2026-12-01            # the day it is published, YYYY-MM-DD
# updated: 2027-03-01       # only when the substance changes, not for a typo
author: tyler               # tyler or kieran (src/content/people.json)
category: guides            # guides, news or work-notes
service: reporting          # automation, reporting, web-software or brand-design
pillar: 2                   # 1 automation and AI, 2 reporting, 3 websites, 4 branding, 5 the cost of admin by hand
term: month end reporting pack   # the search it answers, if any
adds: One sentence on what this adds that the current top results lack.
cta: consultation           # consultation or audit: where the line at the foot sends the reader
# related: [another-post, a-third-post]   # optional; otherwise chosen by service, then kind
# cover: ./covers/what-goes-in-a-month-end-reporting-pack.jpg   # 2400 by 1260, no words in it (README, "A post's cover")
# coverAlt: What the cover shows, for a reader who cannot see it.
draft: true                 # shows in `npm run dev` only, until set to false
---

Lead with the answer in the first two sentences. Then the detail.

## A heading in sentence case

Every figure needs its source in the same paragraph: a link to where it
comes from, or a footnote.[^1] A figure already on the site, such as a
case, links to that page.

<div data-sample>

**Sample figures**, made up to show the method.

| Step | Keystrokes |
| --- | --- |
| Before | 40 |
| After | 4 |

</div>

[^1]: [The name of the source, and its date](https://example.com).
