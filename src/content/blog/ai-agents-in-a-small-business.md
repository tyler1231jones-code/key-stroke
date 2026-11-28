---
title: "AI agents for small business: what they can and cannot do"
description: The jobs an AI agent does well in a small business, the decisions it should never make, and where a person approves before anything goes out.
date: 2026-11-28
author: kieran
category: guides
service: automation
pillar: 1
term: AI agent for small business
adds: Real jobs with what each agent hands back, the decisions it must stop short of, and the Australian privacy and consumer law points, not a list of AI hype.
cta: consultation
cover: ./covers/ai-agents-in-a-small-business.jpg
coverAlt: A paper aeroplane straining to take off, held back by a chain tied to a heavy rubber stamp.
draft: false
---

An AI agent is software that does one set job without being asked each time:
it reads what comes in, works out what it is, and does the next step, such as
filing a bill, matching a bank line or writing a first draft. In a small
business the useful ones take the typing out of work that follows the same
steps every week. They should stop short of the decision. An agent drafts,
matches and lists. A person approves, sends or pays.

Most small businesses are not running agents yet, and the ones holding back
say why.

<p class="stat"><strong>43%</strong> <span class="stat-text">of Australian small and medium businesses reported some use of AI from December 2025 to February 2026, with agents still largely untapped, in the National AI Centre's <a href="https://www.ai.gov.au/news-and-insights/blog/ai-adoption-insights-december-2025-february-2026">survey of SMEs</a>.</span></p>

Around 65% of the businesses not using AI told the same
[survey](https://www.ai.gov.au/news-and-insights/blog/ai-adoption-insights-december-2025-february-2026)
that they did not trust its decisions or wanted people to stay in control.
Keeping a person on every decision answers that worry.

## What counts as an agent

A chatbot answers when someone types a question. An automation follows fixed
rules: when a form is submitted, create a task. An agent sits between them. It
uses a language model to read things that do not arrive in a fixed shape, such
as an email, a PDF invoice or a supplier's quote, and decides which of a small
set of steps to take next.

Anthropic, which makes the Claude models, draws the same line in its guide to
[building effective agents](https://www.anthropic.com/engineering/building-effective-agents):
a workflow follows steps fixed in code, while an agent lets the model choose
its own steps and tools. Its advice is to start with the simplest thing that
works, because more freedom brings higher costs and mistakes that compound.
Most jobs in a small business need a narrow agent inside a fixed workflow.

For a small business, the practical test is simpler. If the work needs
someone to read something and type what they read somewhere else, an agent
can probably do the reading and the typing. If it needs someone to decide,
the agent can prepare the decision, and a person makes it.

<div class="split">
<div>
<p class="split-h">The agent</p>
<ul>
<li>Reads the email and its attachment</li>
<li>Files the document where it belongs</li>
<li>Matches, codes and drafts</li>
<li>Lists what it could not do</li>
</ul>
</div>
<div>
<p class="split-h">A person</p>
<ul>
<li>Checks the draft</li>
<li>Approves, sends or pays</li>
<li>Sorts out what the agent listed</li>
<li>Decides anything about a customer or a staff member</li>
</ul>
</div>
</div>

## Five jobs an agent does well

These are the kinds of jobs we build agents for. Each one ends in a draft or
a list that a person checks. Here is the first of them, from the email
arriving to the bill being approved:

<ol class="flow">
<li><strong>A bill arrives</strong> By email, with the PDF attached.</li>
<li><strong>The agent reads it</strong> The supplier, the amount, the due date and the job.</li>
<li><strong>It files and drafts</strong> The PDF is filed and a draft bill waits in Xero.</li>
<li class="flow-person"><strong>A person checks it</strong> Then approves it, or fixes it first.</li>
</ol>

The five, and what each one hands back:

1. **Bills and enquiries that arrive by email.** The agent reads each email
   and its attachment, pulls out the supplier, the amount, the due date and the
   job it belongs to, files the PDF where it should go, and creates a draft
   bill in Xero for someone to check. Enquiries become draft job requests the
   same way.
2. **Matching the bank overnight.** The agent matches each bank line to an
   invoice or a bill while the office is closed, and leaves a short list of
   what it could not match for the morning. The bookkeeper starts on the
   exceptions instead of the whole feed.
3. **First drafts of documents.** Quotes, contracts, safety documents and
   reports are written from the job record into the business's own template,
   named and filed. Someone reads the draft and sends it.
4. **Keeping systems in step.** When a customer changes their address in the
   CRM, the job system and the accounting system get the change too. Anything
   that does not match is listed, not guessed.
5. **Research.** An agent can look up businesses, read their websites, score
   them against what you sell and draft a first email to each. We use this for
   our own prospecting: an agent does the research and the drafts, and one of
   us reads every email before it goes.

## Five things an agent should never do

Most of what goes wrong with AI in a business comes from an agent that was
allowed to act where it should only have drafted. So write down what each
agent does not do, as plainly as what it does. These are the lines we hold
to:

- **It does not approve or make a payment.** It can prepare the bill, match
  the line and flag the overdue invoice. A person releases the money.
- **It does not send anything to a customer.** Drafts go to a person. An email
  from your business is a statement your business makes, and it should be one
  a person has read.
- **It does not change a figure in the accounts.** It can suggest a match or
  a code. A person posts it.
- **It does not resolve an exception.** The things it cannot match are exactly
  the things that need someone who knows the business.
- **It does not decide about a person.** Hiring, credit and complaints stay
  with people.

The reason is the cost of a mistake. A wrong draft costs the minute it takes
to fix. A wrong payment, a wrong email to a customer or a wrong figure in the
accounts costs much more, and it may not be noticed until the end of the
quarter.

The Australian Government's
[Guidance for AI adoption](https://www.ai.gov.au/staying-safe-and-responsible/essential-ai-practices/guidance-ai-adoption-foundations)
says the same: match the oversight to how much the system can do and what is
at stake, have a person review high-stakes decisions, and build in points where
someone can pause it, override it or undo what it did. OpenAI's
[guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
names payments and large refunds among the actions that should go to a person.

## Where the person comes in

The approval should be quick or people will stop doing it. The agent's output
should land where the team already works, such as Outlook or Teams, with the
source document beside it and a way to approve it in one step. Every approval
and every change a person makes is logged, so you can see what the agent got
wrong and fix the cause.

Give the agent its own account, with access to the folders and systems its
job needs and nothing more. If it only drafts bills, it should not be able to
approve them, even by mistake.

The National AI Centre puts four questions to any agent before it goes live
([its notes on agentic AI and risk](https://www.ai.gov.au/news-and-insights/blog/five-takeaways-industry-discussions-agentic-ai-and-risk)).
If you cannot answer one of them in a sentence, the agent is not ready.

<div class="split">
<div>
<p class="split-h">Access</p>
<p>What can it read, and where?</p>
</div>
<div>
<p class="split-h">Actions</p>
<p>What can it do with what it reads?</p>
</div>
<div>
<p class="split-h">Authority</p>
<p>What can it approve, send or change without a person?</p>
</div>
<div>
<p class="split-h">Accountability</p>
<p>Which person answers for what it does?</p>
</div>
</div>

## The law still applies to your agent

An agent acts for your business, so what it does is your business's
responsibility. If an agent talks to customers, the Australian Consumer Law
applies to what it says, and the ACCC said so plainly in November 2026:

<blockquote class="pull">
<p>"Businesses are responsible for the actions their AI chatbots and agents take."</p>
<cite>The ACCC, <a href="https://www.accc.gov.au/media-release/think-and-check-before-letting-ai-shop-on-your-behalf">media release, November 2026</a></cite>
</blockquote>

The ACCC also expects customers to be able to reach a person when the AI
cannot sort out their problem.

Many small businesses are exempt from the Privacy Act because of their
turnover, but not all of them: health service providers, for one, are covered
whatever their size, as the [OAIC explains](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business).
The OAIC's [guidance on AI products](https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/guidance-on-privacy-and-the-use-of-commercially-available-ai-products)
recommends keeping personal information, and sensitive information above all,
out of publicly available AI tools, using customer information only for the
purpose it was collected for, and having a person check what the AI produces
about anyone. From 10 December 2026, businesses covered by the Act must also
say in their privacy policy when a computer program makes, or substantially
helps make, decisions that could significantly affect someone
([OAIC](https://www.oaic.gov.au/news/media-centre/new-resources-on-transparency-for-use-of-ai-and-automated-decision-making)).

Before an agent reads customer or staff information, check what the AI
provider does with it: where the data is processed, how long it is kept, and
whether it can be used to train the provider's models. Choose the business
terms that rule that out, and write down which tool sees which data.

## Picking the first job for an agent

The best first job has four things going for it:

- It follows the same steps every time.
- It comes round often, every day or every week.
- Its output can be checked quickly.
- A mistake in it is cheap to catch before it leaves the business.

Supplier bills, bank matching and first drafts of quotes usually pass all
four. Payroll and anything that talks to customers do not, at least not as a
first job.

Then count the job before you automate it. Our [Keystroke Audit](/audit)
records the job once, the usual way, and counts every keystroke in it, so you
know what the agent will take off your team before anything is built.

## Questions people ask

### Will an AI agent replace staff?

That is not what we build them for. An agent takes the copying and the first
drafts out of someone's week. The person who used to type the bills now
checks them, and has the rest of the morning for work that needs them.

### Can an agent work with Xero, MYOB and Microsoft 365?

Yes, where the system lets software read and write its data, which Xero, MYOB
and Microsoft 365 all do. We check what your systems allow before anything is
quoted.

### Is an AI agent the same as ChatGPT?

No. ChatGPT is a chat tool a person types into. An agent uses a similar model
behind the scenes, but it runs on its own, on one job, with access only to
what that job needs, and it hands its work to a person instead of to a chat
window.

### Do we have to tell customers they are dealing with AI?

Yes, if they are. The OAIC's guidance says a chatbot that talks to the public
should be identified as AI, and the ACCC expects a way through to a person. An
agent that only drafts for your team never reaches a customer, so there is
nothing to disclose to them, though a business covered by the Privacy Act may
still need to describe it in its privacy policy.

### What does it cost?

It depends on the job and the systems it has to work with. We quote each
build at a fixed price after a free consultation.
