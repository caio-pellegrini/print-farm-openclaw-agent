# Distribution Strategy — 3D Print Farm OpenClaw Agent

## Purpose

This document defines the initial distribution strategy for the **3D Print Farm OpenClaw Agent**.

The objective is not to maximize page views, waitlist signups, or superficial installs.

The objective is to find **small 3D-printing businesses and print farms with real customer jobs, help them install the agent, reach first value quickly, and genuinely use it**. They may be operated by one person or a team.

Hackathon qualification depends on real usage, and the official rules explicitly prohibit spam and artificial usage.

---

# 1. Distribution Principle

Product development and distribution must happen in parallel.

We should not wait until the product is finished to start finding users.

The desired sequence is:

```text
Identify qualified prospects
→ create interest before launch
→ collect a small list of committed testers
→ finish the first usable deploy
→ onboard testers personally
→ observe activation and friction
→ improve onboarding
→ expand distribution
→ only then consider paid traffic
```

The initial goal is not hundreds of people.

The immediate goal is:

```text
5 real testers
→ 5 successful installs
→ 5 users reaching first value
→ feedback
→ retention / repeated usage
```

After that, expand toward 10+ real users.

---

# 2. Ideal Tester Profile

Do not target everyone who owns a 3D printer.

The best early tester is likely:

- an owner/operator or team member in a small 3D-printing business or print farm;
- running the business solo or with a team, with one or more printers;
- accepts custom STL jobs;
- manually prepares quotes or opens a slicer to estimate work;
- manages queues/jobs manually or semi-manually;
- cares about utilization, costs, margins, or production organization;
- comfortable installing technical/open-source software or willing to receive onboarding help.

Customer, Operator, and Owner are roles, not required separate people. A solo owner may hold both Owner and Operator responsibilities; a team may split or combine them. Qualify prospects by their real business workflow, not employee or printer count.

Useful qualification signals:

```text
one or more printers
+
custom orders
+
real customers
+
manual quoting / production coordination pain
```

A person with a printer but no real or emerging business workflow is not the primary ICP. A one-printer business that receives and quotes customer jobs is in scope.

A very large industrial farm may already have internal systems and more complex requirements.

---

# 3. Core Positioning

Do not position the project as:

> An AI slicer.

Do not position it as:

> An STL calculator.

Do not lead with:

> OpenClaw agent.

Lead with the operational outcome:

> **Your first operations hire for your 3D-printing business — whether you run it solo or with a team.**

Suggested product description:

> Customers send STL files. Your AI employee estimates the job, prepares quotes, coordinates production, and keeps you updated on your farm.

A more complete message:

> An open-source AI operations employee for small 3D-printing businesses and print farms. It helps handle custom STL requests, estimate production, prepare quotes, coordinate print jobs, and give the people running the business visibility into the operation.

---

# 4. Distribution Funnel

## Before the deploy is ready

```text
Direct outreach / communities / content
                ↓
Simple landing page
                ↓
Early access / tester form
                ↓
Qualified tester list
                ↓
Personal follow-up
```

## After the deploy is ready

```text
Direct outreach / communities / content
                ↓
Landing page
                ↓
Deploy / Agent Index
                ↓
Guided onboarding
                ↓
First STL processed
                ↓
First real job / useful result
                ↓
Repeated usage
```

For people who have already explicitly agreed to test, do not force them through a marketing funnel.

Send them the direct deploy/install link and help them onboard.

---

# 5. Landing Page

The landing page must be intentionally simple.

Do not spend significant engineering time on design, authentication, dashboards, or marketing infrastructure.

Its job is to answer:

1. What is this?
2. Who is it for?
3. What problem does it solve?
4. What does it actually do?
5. Can I test/install it?

## Suggested Hero

### Headline

> **Your first operations hire for your 3D-printing business — whether you run it solo or with a team.**

### Subheadline

> Customers send STL files. Your AI employee estimates the job, prepares quotes, coordinates production, and keeps you updated on your farm.

## Main pain points

Examples:

> Stop opening your slicer just to answer every quote.

> Stop losing track of custom print jobs.

> Know what's printing, what's waiting, and what your farm is producing.

## How it works

```text
1. Customer sends an STL
2. Agent analyzes and estimates the job
3. Quote is prepared
4. Operator receives production instructions
5. The owner tracks jobs, costs, and farm activity (the owner may also be the operator)
```

The workflow adapts to the business: in a solo operation, the owner can review the quote, prepare the printer, and track activity; in a team, those responsibilities can be shared across people. Roles represent capabilities and may be combined.

## CTA before public deploy

> **I run a print farm — I want to test it**

## CTA after deploy is ready

Primary:

> **Deploy the agent**

Secondary:

> **Need help installing? Join the beta**

## Languages

Default language:

```text
English
```

Provide a visible switch for:

```text
Português
```

The English version is the primary version because distribution is expected to be international.

---

# 6. Early Tester Form

Keep the form short.

Suggested fields:

```text
Preferred contact (required)
Number of printers (required)
Name (optional)
Printer brands/models (optional)
Do you accept custom STL jobs? (optional)
What is your biggest pain with custom orders? (optional)
```

The goal is qualification, not collecting as many leads as possible.

---

# 7. Initial Distribution Channels

Priority order:

## 1. Direct outreach

Find individual business owners and operators who clearly match the ICP, including solo owner/operators.

Good evidence:

- posts discussing print farm operations;
- multiple machines visible;
- custom-print services;
- questions about quoting;
- workflow problems;
- queue-management problems;
- scaling problems.

Do not mass-message generic 3D-printing users.

## 2. Reddit

Relevant print farm / 3D printing communities.

Start with personalized participation and direct conversations.

Public posts can follow once there is a usable demo.

## 3. Discord communities

Look for:

- print farm communities;
- 3D-printing business communities;
- slicer communities;
- manufacturer communities;
- maker communities.

Respect each community's self-promotion rules.

## 4. Facebook Groups

Look specifically for:

- 3D printing businesses;
- print farm owners;
- custom-print sellers;
- local maker/business communities.

## 5. Instagram / social profiles

Find small commercial print farms and custom-print businesses.

Prefer personalized outreach based on something visible about their operation.

## 6. Etsy / marketplaces

Identify shops clearly selling custom 3D-printed work.

Do not violate marketplace messaging or solicitation rules.

Use publicly available business/contact channels where appropriate.

## 7. Existing network

Use existing personal/business relationships when there is a genuine fit.

Do not pressure unrelated clients to install something only to increase hackathon metrics.

---

# 8. Outreach Message

Do not start with the hackathon.

Start with the user's problem.

Suggested first message:

> **Do you handle custom STL jobs in your print farm?**
>
> I'm building an open-source AI operations employee for small 3D-printing businesses and print farms. Customers can send it an STL, it estimates print time/material, prepares the quote, coordinates the production queue, and keeps the person running the business updated. It is designed for a solo owner/operator as well as a team that splits those responsibilities.
>
> I'm looking for a few people running real customer-job workflows to help test it during early access. It's free and designed to run on your own OpenClaw instance.
>
> Interested in trying it?

If relevant, follow with:

> I'm building it for the OpenClaw First Hire Hackathon, so I'm actively looking for feedback from real business owners and operators.

Do not frame the ask as:

> Please install this so I can win.

The test must provide genuine value to the operator.

---

# 9. Public Demo Content

As soon as the real OpenClaw flow works, record a short demo.

Target:

```text
20–30 seconds for distribution content
60+ seconds for official hackathon demo
```

Example short demo:

```text
Customer:
"4 of these in black PLA."

[STL uploaded]

Agent:
Dimensions: ...
Estimated material: ...
Estimated time: ...
Estimated price: ...

Operator:
A1 #2 is available.

Agent:
Job added to A1 #2 queue.

Owner:
How's today?

Agent:
7 jobs completed...
```

The demo should show work being done.

Do not spend the first seconds explaining architecture, models, Docker, or OpenClaw internals.

---

# 10. Outreach Tracking

Maintain a simple distribution tracker.

Suggested fields:

```text
Name
Business / profile
Country
Source
Contact URL
Number of printers
Printer brands/models
Slicer
Custom jobs?
Evidence of ICP fit
Contacted?
Date contacted
Responded?
Interested?
Tester commitment?
Deploy sent?
Installed?
Activated?
First value achieved?
Returned after first use?
Feedback
Notes
```

---

# 11. Prospecting Agent

A separate research agent can help with distribution.

Its job should be:

> Find qualified potential testers and collect evidence that they operate a real print farm.

It should NOT automatically spam prospects.

Good prospecting-agent responsibilities:

- search public communities;
- discover print farm businesses;
- identify relevant posts;
- identify likely number of printers;
- identify slicer/printer stack when publicly visible;
- find public business contact channels;
- summarize visible operational pain;
- rank prospects by fit;
- draft personalized outreach.

Human review should happen before outreach, at least during the early distribution phase.

---

# 12. Paid Traffic

Do not start with paid traffic.

Paid traffic should be considered only after there is evidence that direct acquisition converts into real usage.

Example validation threshold:

```text
10 qualified people contacted
→ 5 interested
→ 3 install
→ 2+ reach real value
```

If people will not activate after personal outreach and guided onboarding, ads are unlikely to solve the underlying problem.

Paid traffic should amplify a working funnel, not discover whether the product is usable.

---

# 13. First User Onboarding

The first testers are highly valuable.

Offer manual onboarding help.

If someone says:

> I couldn't install it.

Treat that as product research.

Help them install it and record:

- where they got stuck;
- missing dependency;
- unclear instruction;
- permission issue;
- profile setup confusion;
- slicer problem;
- time-to-first-value.

The goal is to progressively reduce the need for manual help.

---

# 14. Activation

A successful install is not enough.

The important moment is:

> the user gets a useful result from a real print-farm workflow.

Potential activation event:

```text
Agent successfully receives/analyzes a real STL
AND
produces a useful slice/quote result
```

Future stronger activation:

```text
real customer request
→ quote
→ approved order
→ production workflow
```

Track time-to-first-value.

---

# 15. Financial Incentives — Important Hackathon Risk

An idea considered was:

> Pay R$50 to the top 10 users to encourage usage.

Do NOT execute this strategy yet.

The official hackathon rules explicitly prohibit:

> spam or artificial usage

and top entries are subject to verification to confirm that they are solving real problems for users.

The rules reviewed so far do **not explicitly state** whether compensating research participants/testers is allowed.

However, directly paying the "top users" based on usage volume could reasonably be perceived as incentivizing leaderboard activity rather than genuine product usage.

## Official Hackathon Prize — Secondary Incentive

The hackathon organizers' official prize includes a Mac Mini for the top user of the winning agent. This is an organizer-provided award, not a reward created, funded, or guaranteed by our project; it only applies if our project wins. Mention it as a small secondary reason to try the product, after the real print-farm value and free early access.

Invite operators to use the agent on real 3D-printing work and share feedback. Do not encourage or reward spam, artificial activity, token farming, leaderboard manipulation, or unnecessary workloads. Usage should come from genuine farm jobs, and all messaging must remain clear that the organizers provide the prize.

Therefore the current decision is:

```text
DO NOT offer usage-based cash rewards without written organizer approval.
```

If incentives are later considered, safer structures to ask organizers about include:

- fixed user-research honorarium unrelated to token usage;
- reimbursement for legitimate test costs;
- reward for completing a structured feedback interview;
- reward independent of leaderboard position or usage volume.

Even these should be confirmed with organizers before launch if they may affect reported hackathon usage.

Never:

- pay users per token;
- pay per repeated artificial action;
- create fake accounts;
- ask users to run unnecessary workloads;
- reward users specifically for inflating leaderboard metrics.

---

# 16. Question for Hackathon Organizers

Before introducing financial incentives, ask:

> We're recruiting real 3D print farm operators to test our agent. Are we allowed to offer a small fixed user-research honorarium (for example, R$50 / ~US$10) for completing onboarding and giving genuine product feedback, provided the payment is not tied to token usage, install count, leaderboard position, or artificial activity?

Save the organizer's written response in this folder.

---

# 17. Immediate Distribution Targets

While product development continues:

## Prospect list

Build a list of at least:

```text
50 qualified potential testers
```

## Personalized outreach

Contact at least:

```text
20 qualified prospects
```

## Early commitments

Aim for:

```text
5 people explicitly willing to test
```

before or immediately when deploy is available.

## First installs

Personally onboard the first:

```text
3–5 real owner/operators or team members
```

## Expansion

After fixing onboarding friction:

```text
10+ genuine active users
```

---

# 18. Sequence From Here

## Phase 1 — Now

- build the simple bilingual landing page;
- create tester form;
- create outreach tracker;
- begin identifying prospects;
- collect 5 tester commitments.

## Phase 2 — First usable OpenClaw deploy

- replace waitlist CTA with deploy CTA;
- contact committed testers immediately;
- personally onboard them;
- record onboarding friction.

## Phase 3 — Product works for first testers

- publish short demo;
- post in relevant communities;
- increase personalized outreach;
- gather testimonials/feedback where permission exists.

## Phase 4 — Proven activation

- evaluate paid traffic;
- expand community distribution;
- optimize landing/deploy onboarding.

---

# 19. Working Notes

## Prospecting Notes

```text
Date:
Agent:

Communities found:

Strong ICP signals:

Common pains observed:

Useful language/phrasing from users:

Potential prospects:

Distribution restrictions/community rules:

Recommendations:
```

## Landing Page Notes

```text
Date:
Agent:

Implementation:

CTA:

Form destination:

Analytics:

English copy changes:

Portuguese copy changes:

Issues:

Next step:
```

### Landing implementation — 2026-09-27

Implementation: `distribution/landing/` is a dependency-free static HTML/CSS/JavaScript site with a small Node.js built-in HTTP server for submissions. English is the default; the visible EN/PT control switches the page copy and document language. The page separates capabilities exercised locally with sample jobs from customer intake, quote approval, operator handoff, and production workflow still coming next. Print-time accuracy remains under validation.

CTA: Pre-release mode opens the early tester form. A single `ctaMode` and `deployUrl` setting in `public/config.js` supports switching to deployment when a real URL exists.

Form destination: `POST /api/testers` on the landing server. Valid submissions are appended to `distribution/landing/data/tester-submissions.jsonl` and forwarded to the configured Discord webhook. The webhook secret stays in the ignored local `.env` file/server environment, never in frontend code. The operator must secure and back up the data directory and restrict access to the Discord channel.

Analytics: No analytics script or invasive tracking was added. Add privacy-respecting visit, CTA, form-start, and submission counts after a host/analytics choice is made.

English copy changes: Describes STL analysis, Cura slicing/material estimates, quote calculation, and saved estimates as locally exercised with sample jobs. It says print-time accuracy is under validation and does not present customer intake, production coordination, or printer integration as completed.

Portuguese copy changes: Natural Brazilian Portuguese translation; language choice updates visible copy, page language, title, and description.

Issues: Production hosting still needs a persistent writable private data directory and an operator process for tester follow-up. The agent itself does not yet provide the complete customer-to-production flow.

Next step: Choose the public host, set a persistent storage location and deployment URL, then switch `ctaMode` to `deploy` once installation is ready.

### Product presentation revision — 2026-09-27

The landing now uses a stronger black/green visual system, DM Sans typography, compact cards, and a customer-to-farm visual. A compact “Working today / Coming next” section presents progress without internal project terminology. A customer, agent, and operator conversation is presented as an illustrative example with sample values and is clearly labeled; it does not claim that this full handoff is implemented. The copy focuses on small print farms, including solo operators and teams, and retains the bilingual tester form and beta CTA. The hackathon remains secondary to product value and free early access. A compact note near the final tester CTA describes the organizers' Mac Mini prize for the top user of the winning agent, makes clear that the organizers provide it, and asks for real usage only. Tester messaging offers a short form plus configurable direct-contact links.

## Outreach Notes

```text
Date:
Agent:

Prospects contacted:

Responses:

Interested:

Common objections:

Common questions:

Install concerns:

Product insights:

Next adjustment:
```

## Activation Notes

```text
Tester:
Date:

Install successful:

Time to install:

First value achieved:

Time to first value:

Workflow tested:

Problems:

Feedback:

Returned for another use:

Follow-up:
```

---

# 20. Core Principle

The distribution strategy should optimize for:

> **people in real 3D-printing businesses doing customer work with the agent, solo or as a team**

not:

> clicks, fake installs, forced token usage, or leaderboard manipulation.

The product should be valuable enough that testers keep using it because it improves their operation.


### Conversion and contact revision — 2026-09-27

The final CTA now leads with a free early-access tester path and a short form. The required fields are preferred contact and printer count; name, printer models, custom-job answer, and biggest pain are optional. Country is not collected. Submissions continue to append to private JSONL storage and forward server-side to Discord when configured. Public Discord, email, and WhatsApp destinations are configured separately in `public/config.js`. Email and WhatsApp link directly; Discord opens the app with `@caiopellegrini` shown because a personal profile link needs a numeric user ID or invite URL. WhatsApp is available in either language, with the contact links kept secondary to testing.

The hero copy is more concrete in English and Brazilian Portuguese. Workflow cards explain quote, order, and production; a separate progress panel names local sample-job exercises and the next workflows. The conversation mockup keeps estimated time and material on the operator side, labels the printer as a suggested next step, and says the order is ready to enter production rather than implying an actual queue integration.
