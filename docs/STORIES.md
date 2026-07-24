# Requirements / Stories

Sequential, full-stack requirements for Teaching Tracker. A single story may
touch the **frontend** ([TeachingTracker](https://github.com/budhap-dev/TeachingTracker)),
the **backend** ([func-teaching-tracker](https://github.com/budhap-dev/func-teaching-tracker)),
or both — this file is the source of truth for both repos.

> Older, completed work lives in [REQUIREMENTS.md](REQUIREMENTS.md). Add new work
> here.

## How this works

1. You describe a story (in any shape — a sentence is fine).
2. It gets appended here as the next `REQ-NNN`, with acceptance criteria and the
   impacted side(s) filled in.
3. Implementation follows the order in this file, top to bottom — the backlog is
   sorted easiest-first, so the top is always the next sensible thing to pick up.
4. A story is only ticked ✅ once it meets the [Definition of done](#definition-of-done).

**Next id: `REQ-030`**

## Legend

| Field      | Values                                                      |
| ---------- | ----------------------------------------------------------- |
| **Status** | 🔲 Not started · 🚧 In progress · ✅ Done · ⏸️ Parked · ❌ Dropped |
| **Impact** | `frontend` · `backend` · `both` · `infra`                    |
| **Effort** | XS · S · M · L · XL (relative, not hours)                    |

## Definition of done

Applies to every story unless it says otherwise. These reflect how this project
actually works — see [DEPLOYMENT.md](DEPLOYMENT.md).

- **Frontend tests: 100% coverage.** `vitest.config.ts` enforces 100% on
  branches/functions/lines/statements, and coverage runs even on `npm test`. New
  code needs tests or the build fails.
- **Frontend ships no data.** Every screen is fed by the API via redux-saga. New
  data means a backend change first, plus a fixture in `src/test/fixtures.ts`.
- **Per-environment data.** Seed lives in the backend's `src/data/seed.ts`
  (`envSeeds`): dev 5 / prod 15 students. Keep environments distinct.
- **Contract changes are backend-first.** If a story adds or changes an endpoint,
  the API must deploy before the frontend, or the frontend 404s in prod.
- **Verify at the surface.** Drive the real screens against real API data — see
  [`.claude/skills/verify/SKILL.md`](../.claude/skills/verify/SKILL.md).
- **Lint + build clean** in each repo touched.

## Template

```markdown
## REQ-NNN — <short title>

**Status:** 🔲 Not started  ·  **Impact:** frontend | backend | both | infra

**Story**
As a teacher, I want <capability>, so that <benefit>.

**Acceptance criteria**
- [ ] <observable, checkable outcome>
- [ ] <observable, checkable outcome>

**Notes** _(optional — API shape, data/model changes, edge cases, open questions)_
```

---

# Backlog

Ordered **easiest first** — implementation runs top to bottom. Effort is relative:
XS is an afternoon, XL is a project.

| # | Status | Story | Effort | Impact | Blocked by |
| - | ------ | ----- | ------ | ------ | ---------- |
| 1 | ✅ | [REQ-007 — Contact us page](#req-007--public-contact-us-page) | XS | frontend | — |
| 2 | ✅ | [REQ-006 — Offerings page](#req-006--public-offerings-page) | S | frontend | — |
| 3 | ✅ | [REQ-002 — Student fields editable + saved](#req-002--every-student-field-except-the-id-is-editable-and-persists-via-the-api) | M | both | — |
| 4 | ✅ | [REQ-010 — Cancel a class](#req-010--a-class-can-be-cancelled-and-a-cancelled-class-is-never-billed) | M | both | — |
| 5 | ✅ | [REQ-001 — Fees per session, billed on classes taught](#req-001--fees-are-per-session-and-a-month-bills-for-classes-actually-taught) | L | both | REQ-010 |
| 6 | ✅ | [REQ-003 — Public / teacher split](#req-003--public-portal-with-no-login-the-teachers-area-is-private) | L | both | REQ-004 to enforce |
| 7 | ✅ | [REQ-004 — Entra ID sign-in](#req-004--teacher-signs-in-with-microsoft-entra-id) | L | both + infra | — |
| 8 | 🔲 | [REQ-029 — Forms mark required fields and show inline validation](#req-029--forms-mark-required-fields-and-show-inline-validation) | M | frontend | — (prioritised 2026-07-24) |
| 9 | 🔲 | [REQ-009 — Real database](#req-009--replace-the-in-memory-store-with-a-real-database) | L | backend + infra | — |
| 10 | 🔲 | [REQ-008 — Teacher edits the public site](#req-008--the-teacher-edits-the-public-site-from-the-portal-with-a-preview) | XL | both | REQ-009 |
| 11 | ❌ | [REQ-005 — Google Calendar sync](#req-005--scheduled-classes-sync-to-google-calendar) | XL | both + infra | — (dropped) |
| 12 | ✅ | [REQ-013 — Archive a student (Alumni)](#req-013--archive-a-student-with-a-closing-note-alumni-section) | M | both | — (shipped) |
| 13 | ✅ | [REQ-014 — Progress per subject](#req-014--progress-is-tracked-per-subject) | M | both | — (shipped) |
| — | | **Growth epics — turn the public pages into a way to win students** (added 2026-07-21) | | | |
| 14 | ✅ | [REQ-015 — Offerings hero and a single call-to-action](#req-015--offerings-hero-and-a-single-call-to-action) | S | frontend | — |
| 15 | ✅ | [REQ-016 — Subjects as rich cards](#req-016--subjects-as-rich-cards) | M | both | — |
| 16 | ✅ | [REQ-017 — How it works, as a numbered journey](#req-017--how-it-works-as-a-numbered-journey) | XS | frontend | — |
| 17 | 🔲 | [REQ-018 — Public enquiry form](#req-018--public-enquiry-form) | M | both | REQ-009 |
| 18 | 🔲 | [REQ-019 — Leads inbox](#req-019--leads-inbox) | M | both | REQ-018 |
| 19 | 🔲 | [REQ-020 — Testimonials and outcomes](#req-020--testimonials-and-outcomes) | M | both | REQ-008, REQ-009 |
| 20 | 🔲 | [REQ-021 — Tutor bio and safeguarding](#req-021--tutor-bio-and-safeguarding) | S | both | REQ-008 |
| 21 | 🔲 | [REQ-022 — Transparent pricing](#req-022--transparent-pricing) | S | both | REQ-008 |
| 22 | 🔲 | [REQ-023 — Public pages are discoverable (SEO / OG)](#req-023--public-pages-are-discoverable-seo--og) | M | frontend | — |
| 23 | 🔲 | [REQ-024 — Public Home landing page](#req-024--public-home-landing-page) | M | frontend | REQ-003 |
| 24 | 🔲 | [REQ-025 — FAQ](#req-025--faq) | S | both | REQ-008 |
| 25 | 🔲 | [REQ-026 — Refer a family](#req-026--refer-a-family) | S | both | REQ-009 |
| 26 | ✅ | [REQ-027 — Families submit testimonials; teacher moderates](#req-027--families-submit-testimonials-teacher-moderates-approved-show-as-cards) | L | both | REQ-009 |
| 27 | 🚧 | [REQ-028 — Profanity screen flags reviews for moderation](#req-028--profanity-screen-flags-reviews-for-moderation) | S | both | REQ-027 |

**Next up: [REQ-029](#req-029--forms-mark-required-fields-and-show-inline-validation) — required-field markers + inline validation** (prioritised by the owner 2026-07-24; frontend-only, no deps, so it can ship immediately). Then finish [REQ-009](#req-009--replace-the-in-memory-store-with-a-real-database) — prod cutover only. Reconciled 2026-07-24 against the code: REQ-003/REQ-004 completed (prod enforces sign-in), and REQ-013/014/015/016/017/027 are all **shipped** — the backlog had them as 🚧/🔲. REQ-028 is **half-built** (frontend flag display shipped; the backend profanity screen was never written — small, unblocked backend work). REQ-009 is *nearly* done: its plan (`func-teaching-tracker/docs/PLAN-req-009-database.md`) shows dev fully on durable Table Storage (Phases 0–5); only **Phase 6, the prod data cutover** (UK South move + seed prod tables empty + verify), remains — operational infra work. ⚠️ Prod's live `DATA_STORE` app setting is already `tables` (as is `variables.tf`), so this needs reconciling like the REQ-004 flag drift did. What's genuinely unbuilt from here: REQ-023 (SEO/OG) and REQ-024 (public Home) — frontend, no deps; the enquiry/leads path (REQ-018/019/026) waits on REQ-009; the content-driven pieces (REQ-008/020/021/022/025) land through **REQ-008**'s in-app editor.

**Three things this order is trying to respect:**

1. **The first seven are ✅ done.** REQ-007 → REQ-006 → REQ-002 → REQ-010 → REQ-001,
   then REQ-003 + REQ-004 together; the next unblocked story is **REQ-009**. REQ-001
   followed REQ-010 because billing for classes taught is only correct once a
   cancelled class can be told apart from a taught one.
2. **REQ-003 and REQ-004 shipped together.** The split is the requirement; sign-in is
   the mechanism. Gating routes without identity produces a fake lock — and the
   API stays open regardless, which is the part that matters. Prod enforcement
   landed 2026-07-24, closing both.
3. **REQ-009 is the real gate for the rest.** It was parked as "not needed
   now"; REQ-008 and REQ-005 both quietly depend on it. Doing them first would mean
   building on storage that forgets. It is now all-but-done — dev runs on durable
   Table Storage; only the prod cutover is left.

> **Reconciliation note (2026-07-24).** Several stories had shipped without the
> backlog being ticked. Verified in code and marked ✅ here: REQ-013 (`AlumniView`),
> REQ-014 (`progressBySubject`), REQ-015/016/017 (`OfferingsView` hero + CTA, rich
> subject cards, numbered journey — all in `siteContent`, 8 tests), REQ-027
> (`ReviewsView` + `ReviewModerationView` + testimonial API). REQ-028 is newly
> written up below as **🚧 half-built**: its frontend flag display shipped with
> REQ-027, but the backend profanity screen was never written, so the flag is
> dead code today. Keep the backlog ticked as work merges — a stale 🔲 sends the
> next session to rebuild what exists, and a mis-ticked ✅ hides a real gap.

<!-- Stories go below, in order. Newest at the bottom; work proceeds top-down. -->

## REQ-007 — Public "Contact us" page

**Status:** ✅ Done · **Impact:** frontend · **Effort:** XS · **Delivered:** frontend #7

**Story**
As a prospective parent or student, I want to find the right contact details, so
that I can reach out.

**Acceptance criteria**

- [x] New **public** menu item, "Contact us", reachable without signing in.
- [x] Shows the contact email address and phone number.
- [x] Email and phone are actionable (`mailto:` / `tel:` links).
- [x] A decent, uncluttered layout — responsive and themed.

**Notes**

- ❓ **Content needed from you** — the actual email address and phone number.
- Open: display-only, or a contact **form** that sends a message? You described
  "the right contact information", so assumed **display-only** (a form would need a
  mail-sending backend).
- ⚠️ Publishing an email/phone on a public page invites spam. Worth considering an
  obfuscated address or a form later.
- Content is **not hardcoded** — it's edited by the teacher and stored in the API.
  See REQ-008.

## REQ-006 — Public "Offerings" page

**Status:** ✅ Done · **Impact:** frontend · **Effort:** S · **Delivered:** frontend #7

**Story**
As a prospective parent or student, I want to see what's taught and how, so that I
can decide whether to get in touch.

**Acceptance criteria**

- [x] New **public** menu item, "Offerings", reachable without signing in.
- [x] Lists the subjects taught.
- [x] Explains the teaching approach: how students are organised/grouped, how they
      are taught, and what is taken care of along the way.
- [x] Presented as clear selling points, not a wall of text.
- [x] Responsive, and consistent with the existing theme.

**Notes**

- ❓ **Content needed from you** — the real subject list and the points you want to
  make. I can draft placeholder copy for you to correct.
- Open: is the copy hardcoded for now, or does it need to be editable without a
  deploy? Assumed **hardcoded** initially.

## REQ-002 — Every student field except the id is editable and persists via the API

**Status:** ✅ Done · **Impact:** both · **Effort:** M · **Delivered:** frontend #8

**Story**
As a teacher, I want to edit any detail on a student record — and have it saved —
so that records stay accurate as circumstances change (e.g. a student who studied
Chemistry starts taking Physics and Maths).

**Acceptance criteria**

- [x] Editable on the student page: `firstName`, `lastName`, `dob`, `subjects`,
      `school`, `year`, `progress`, `mode`, `fees`, `notes`, `parentName`,
      `contactNumber`, `address`.
- [x] `subjects` is edited as a multi-select, so a student can gain/lose subjects.
- [x] The same fields can be set when **adding** a student.
- [x] `id` and `studentId` (the generated code, e.g. `DEV-0001`) are read-only;
      every other field is editable.
- [x] Saving sends the change to the API (`PUT /students/{id}`), rather than
      updating Redux only.
- [x] The store reflects the server's response, so the UI matches what was stored.
- [x] **Edits survive a page reload** (they are re-fetched from the API).
- [x] A failed save surfaces an error and does not silently discard the edit.
- [x] Frontend coverage stays at 100%.

**Notes**

- Closes the known gap: student edits are currently **local-only** — no request is
  sent and they revert on reload.
- Backend already supports this: `PUT /students/{id}` and `POST /students` upsert
  and accept every field including `fees`; validation covers `mode`, `progress`,
  and `fees`. Likely **no backend change needed** beyond REQ-001.
- Decided: `studentId` stays **locked**. It's a generated identifier, so only `id`
  and `studentId` are read-only — everything else is editable.
- Payment edits are a separate gap and are **not** in scope here.

## REQ-010 — A class can be cancelled, and a cancelled class is never billed

**Status:** ✅ Done · **Impact:** both · **Effort:** M · **Delivered:** frontend #10, backend #5

**Story**
As a teacher, I want to cancel a scheduled class, so that a lesson that never
happened doesn't appear in what a family owes.

**Acceptance criteria**

- [x] A scheduled class has a status: **Scheduled** or **Cancelled**.
- [x] The teacher can cancel a class, and can un-cancel one cancelled by mistake.
- [x] Cancelling is persisted via the API and survives a reload.
- [x] A cancelled class is still **visible** — clearly marked, not deleted, so
      there's a record of what was planned.
- [x] Cancelled classes are excluded from "booked classes" counts and from the
      dashboard's upcoming sessions.
- [x] **Cancelled classes are never billed** (consumed by REQ-001).
- [x] Per-environment seed includes some cancelled classes, so the state is
      visible without creating one by hand.

**Notes**

- Prerequisite for **REQ-001**: billing for classes actually taught is only
  correct if a cancelled class can be told apart from a taught one. Without this,
  a cancelled lesson is silently charged for — a billing error against a parent.
- "Held" stays **derived** (not cancelled + date has passed) rather than a third
  state the teacher must tick after every lesson. Only the exception needs an
  action, which is the point.
- ❓ Open: does cancelling need a reason, and does it matter *who* cancelled
  (teacher vs family)? Assumed **no** for a first cut — it may matter later if a
  late family cancellation should still be chargeable.
- ❓ Open: should a cancelled class be re-schedulable to a new date, or is that
  just cancel + book a new one? Assumed the latter.

## REQ-001 — Fees are per session, and a month bills for classes actually taught

**Status:** ✅ Done · **Impact:** both · **Effort:** L · **Blocked by:** REQ-010 (done) · **Delivered:** frontend #11, backend #6

**Story**
As a teacher, I want each student's fee to price a **single session**, and what
they owe for a month to build up from the classes that have **actually taken
place**, so that a bill is always a list of lessons I really taught — and I can
mark a student as paid once the month is done.

**Acceptance criteria**

- [x] `Student.fees` means the price of **one session** (backend model + seed).
- [x] Every place the fee is shown reads as per-session, not `/month` — student
      detail page, student form, payment tracker "Fee" column.
- [x] **Amount due to date = `student.fees` × the student's classes that have
      already taken place in that month** — a session whose date is today or
      earlier **and which was not cancelled**. Classes still to come are not
      billed, and cancelled classes are never billed (REQ-010).
- [x] The current month therefore **accrues**: it grows as classes are taught.
- [x] A past month bills for all of its classes; a future month bills £0.
- [x] The payment record carries the **session count it was derived from**, so the
      figure is explainable rather than a bare number ("4 classes × £120").
- [x] Payment tracker per-month totals (due / received / outstanding) follow the
      new calculation.
- [x] **The teacher can mark a student as paid for a month, and it sticks** —
      persisted via the API, surviving a reload (see ⚠️ below).
- [x] **Marking paid settles that month**: the amount due to date is recorded as
      received and the month's outstanding clears to £0.
- [x] Each month is settled independently — the next month starts from £0 and
      accrues on its own.
- [x] If a further class is later taught in a settled month, that month shows
      outstanding again for the difference (it does not silently stay at £0).
- [x] **Sessions are seeded recurring** (weekly per student, across the seed year)
      so past months have real classes to bill against.
- [x] Environments keep distinct per-session fees (dev £100 / prod £120
      base) and distinct volumes.

**Notes**

- Decided: bill for **delivered** lessons, not scheduled ones. A bill is a list of
  classes that actually happened, which is defensible to a parent and handles a
  quiet month with no manual adjustment.
- ⚠️ **This makes the API time-dependent.** "Already taken place" is relative to
  today, so `/payments` responses change as days pass. Tests must control the
  clock rather than read it, and the figure can't be cached indefinitely.
- Decided: **a cancelled class is never billed.** That needs a cancellation model,
  which doesn't exist today — split out as **REQ-010**, which this story depends
  on. A class counts as taught when it is not cancelled and its date has passed;
  "held" is derived rather than ticked off by hand, so there is nothing extra to
  do for the normal case.
- ⚠️ **Marking paid needs the payment write that doesn't exist yet.** Payment
  edits are currently local-only: nothing is sent, and they revert on reload. The
  API already has `POST /payments`; no saga calls it. That gap has to close for
  this story to mean anything.
- ⚠️ **Forces a seed-data change.** Each env has only a few one-off sessions near
  today (dev 4 / prod 8), so almost every month would bill **£0**.
  Sessions must become recurring — assumption: **one per student per week**
  through the seed year (2026), ~4–5 classes/student/month.
- ⚠️ Knock-on: "Booked classes" and the scheduling calendar will show far more
  entries than today's 4/6/8. Expected, but a visible change.
- `PaymentRecord.monthlyFee` stops being a flat monthly fee and becomes derived —
  rename to `amountDue` so it doesn't lie.
- ❓ Open: should the tracker also show a **projected** month total (all classes
  scheduled, not just taught)? "Due to date" answers *what do they owe now*;
  projection answers *what will this month be worth*. Assumed **due-to-date only**
  for a first cut.

## REQ-003 — Public portal with no login; the teacher's area is private

**Status:** ✅ Done (prod enforcement flipped 2026-07-24) · **Impact:** both · **Effort:** L

**Story**
As a visitor, I want to browse the portal without signing in, so that I can learn
what's offered and get in touch. As the teacher, I want my student records to be
visible only to me, so that families' details stay private.

**Acceptance criteria**

- [x] **Public, no login:** landing page (leads with Offerings / Contact us;
      teacher sign-in is a quiet afterline), Offerings (REQ-006), Contact us
      (REQ-007).
- [x] **Teacher only:** Dashboard, Students, Student detail, Study snapshot,
      Payment tracker, Class scheduling — every route wrapped in
      `RequireTeacher` (REQ-004 T3).
- [x] A visitor opening a teacher route is sent to sign-in — never shown the data,
      not even briefly while loading (MSAL templates render nothing until the
      auth state is known).
- [x] Navigation only shows teacher menu items when signed in — the sidebar is
      auth-aware; visitors see Offerings and Contact us only.
- [x] **The API rejects unauthenticated requests** for teacher data — hiding it in
      the UI is not sufficient. _(dev enforced 2026-07-17; prod enforced 2026-07-24
      — REQ-004 T4. Verified: prod `/students`, `/payments`, `/sessions` return 401
      `Missing bearer token`; public `/contact`, `/testimonials` stay 200.)_
- [x] Public and teacher areas share the same hosted URL per environment.

**Notes**

- ⚠️ **Today everything is open.** All six screens are public, and every Function
  App endpoint is `authLevel: 'anonymous'` — anyone with the URL can read students,
  payments, and sessions. Only *seed* data is exposed right now, so nothing real
  has leaked, but this must be closed before any real student is entered.
- The gate must live in the API. A frontend-only check is cosmetic — the data is
  one `curl` away.
- The sign-in mechanism is decided: Entra ID single-tenant — see REQ-004 and
  [docs/PLAN-req-004-entra-signin.md](PLAN-req-004-entra-signin.md).

## REQ-004 — Teacher signs in with Microsoft Entra ID

**Status:** ✅ Done (T1–T4 complete; dev enforced 2026-07-17, prod 2026-07-24) · **Impact:** both + infra · **Effort:** L
· **Plan:** [docs/PLAN-req-004-entra-signin.md](PLAN-req-004-entra-signin.md)

**Story**
As the teacher, I want to sign in with an account only I control, so that only I
(and anyone I explicitly allow) can reach the student data — without managing
another password, and without paying for an auth tier.

**Acceptance criteria**

- [x] Teacher signs in via Microsoft Entra ID (single-tenant; MSAL in the SPA).
- [x] **Only allow-listed emails get in** — authenticating with *any* other
      account in the tenant must not grant access.
- [x] The allow-list holds **multiple emails**, lives in **Key Vault**
      (`teacher-emails`), and is editable without a code deploy.
- [x] The Function App reads the secret via **managed identity** — no connection
      string or key in app settings.
- [x] The session persists across reloads, and there is a clear way to sign out.
- [x] The API validates the JWT (signature / issuer / audience / expiry) on every
      teacher request and rejects anything unsigned, expired, or not allow-listed
      — auth lives in Function code, not in the platform.
- [x] Works identically across dev/prod, with per-environment client config.
- [x] Total added cost ≈ £0 (SWA stays Free; Key Vault pennies).

**Notes**

- **Decided (2026-07-16): Entra ID workforce single-tenant, not Google.** Google
  as a direct SWA provider needs the Standard tier (~$9/app/month); Entra ID is a
  preconfigured provider and free. The Google-federation route (External ID)
  stays possible later if a Gmail-branded login ever matters.
- **Decided: allow-list = emails in Key Vault**, read via managed identity —
  deliberately the same pattern REQ-009 needs for the database connection.
- ⚠️ **Easy Auth is not available on Flex Consumption**, and SWA Free auth
  doesn't protect a separate cross-origin Function App anyway — both confirmed;
  hence in-code JWT validation. Details, snippets and Terraform in the plan doc.
- Supersedes the old "Google sign-in" shape of this story; REQ-003 (public /
  teacher split) consumes this as its sign-in mechanism, and REQ-005's Calendar
  scope would ride on a Google *federation*, not on this workforce login.

## REQ-009 — Replace the in-memory store with a real database

**Status:** 🔲 Not started · **Impact:** backend + infra · **Effort:** L

**Story**
As the teacher, I want everything I enter to survive a restart, so that student
records, payments and published words don't quietly disappear.

**Acceptance criteria**

- [ ] Students, payments and sessions are stored in Cosmos DB (or Table Storage)
      instead of memory.
- [ ] Data survives a restart, a redeploy, and scale-out.
- [ ] Each environment has its own isolated database/container (dev/prod).
- [ ] Writes actually persist: upsert student, save payments, create session.
- [ ] Seeding becomes a deliberate one-off step, not a value rebuilt on every
      module load — and per-env volumes stay distinct (5 / 10 / 15).
- [ ] Terraform provisions the account per environment.
- [ ] The connection is secured with a managed identity or Key Vault — **not** a
      connection string sitting in app settings.
- [ ] Services and functions keep their current shape; only the data layer changes.

**Notes**

- This is the "later, not needed now" Cosmos work. It has since become a hard
  prerequisite for **REQ-008** (published content would silently revert) and
  **REQ-005** (Google refresh tokens can't live in memory).
- The codebase is already shaped for it: `src/data/store.ts` is the only module
  that needs replacing — services and functions never touch storage directly.
- ⚠️ **Cost.** Azure's Cosmos free tier is **one account per subscription**, so at
  most **one** of the two environments can be free. The other would need
  serverless (cheap, per-request — but not £0). This is the second place the
  "everything free" goal meets a wall, after REQ-004.
- Open: Cosmos DB or Table Storage? Table Storage is far cheaper and enough for
  this shape of data; Cosmos is the better fit if querying grows.

## REQ-008 — The teacher edits the public site from the portal, with a preview

**Status:** 🔲 Not started · **Impact:** both · **Effort:** XL

**Story**
As the teacher, I want to change what the public site says — subjects, selling
points, testimonials, contact details — from inside the portal, so that I can keep
it current **without a developer or a deploy**. And I want to see exactly how it
will look before anyone else does.

**Acceptance criteria**

- [ ] A teacher-only "Public site" area with **proper fields per content type** —
      structured where the layout depends on it, free-form where it doesn't:
  - [ ] Hero: headline, sub-headline, availability line.
  - [ ] **Subjects**: add / rename / remove / reorder individual subjects.
  - [ ] Selling points ("How we work"): add / edit / remove / reorder.
  - [ ] **Testimonials**: quote, attribution name, context, rating; add / edit /
        remove / reorder.
  - [ ] Contact: email address and phone number.
  - [ ] The public-facing site name (e.g. "Harbour Tuition").
  - [ ] **A free-form rich-text section** with an editable heading, for information
        that has no field of its own (an "about", a notice, term dates) — so new
        content doesn't require a new field, or a developer.
- [ ] Rich text supports headings, bold, italic, bulleted/numbered lists and links.
- [ ] Rich text is restricted to a **safe allow-list** of tags/attributes; pasted
      content is reduced to plain text so external styling can't break the page.
- [ ] **The API sanitises on write** — not just the browser (see ⚠️ below).
- [ ] Saving publishes the change — **live, with no rebuild or redeploy**.
- [ ] **Preview**: the teacher can see the public site exactly as a visitor will,
      including unsaved edits, before publishing.
- [ ] The public site reads this content from the API; nothing public is hardcoded.
- [ ] `GET` of site content is **public** (visitors aren't signed in); `PUT`/write
      is **teacher-only**.
- [ ] Content survives a restart and is per-environment.
- [ ] If content is unavailable, the public page degrades gracefully rather than
      rendering blank.

**Notes**

- ⚠️ **Blocked on durable storage.** The API's store is in-memory and resets on
  restart/scale-out, so published content would silently vanish — worse than
  hardcoding, because it looks saved. This needs Cosmos DB (or Table Storage)
  first. Hardcoding REQ-006/007 as an interim step is viable; this story replaces it.
- ⚠️ Interacts with REQ-003's access matrix: this adds the first endpoint that is
  **publicly readable but teacher-writable**. Most others are teacher-only.
- Open: **preview mechanism** — a draft/publish split (safer: edit freely, publish
  when ready) or a live "view as public" of already-saved content (simpler, but no
  safety net). Draft/publish is the honest reading of "see how it looks *after the
  changes*".
- Open: does content need versioning / undo? Assumed **no** for a first cut.
- ⚠️ **Rich text is an XSS vector by construction** — teacher-authored HTML rendered
  on a public page. The sanitiser must live **in the API**, on write. A browser-side
  sanitiser is a UX nicety, not a control: once `PUT /site-content` exists, anything
  can post to it directly, bypassing the frontend entirely.
- ❓ **Open — store rich text as HTML or Markdown?** The mockup uses HTML +
  an allow-list sanitiser. **Markdown sidesteps the sanitising problem** (render it
  yourself, never trust stored HTML) at the cost of a less friendly editor.
  Recommendation: **Markdown** unless the toolbar experience matters more.
- The mockup's editor uses `document.execCommand`, which is deprecated — fine to
  demonstrate, but a real build wants a maintained editor (TipTap / Lexical) or a
  Markdown field.
- ⚠️ Testimonials must be real and used with permission — the seeded ones in the
  mockup are invented placeholders, and publishing invented reviews would mislead
  prospective families.
- Mockup of this story (editor + live preview + draft/publish):
  https://claude.ai/code/artifact/606a7556-bba2-4d56-86ea-40efa23dd1f0

## REQ-005 — Scheduled classes sync to Google Calendar

**Status:** ❌ Dropped (2026-07-17) · **Impact:** both + infra · **Effort:** XL

> **Dropped.** The plan is shelved for now; the dashboard's disabled
> "Connect Google Calendar" placeholder and its "coming soon" note were
> removed the same day. The story stays here for the record — if it ever
> comes back, the notes below (OAuth consent, durable refresh-token
> storage) still apply.

**Story**
As the teacher, I want classes I schedule to appear in my Google Calendar, so that
I get reminders and notifications directly without checking the portal.

**Acceptance criteria**

- [ ] Scheduling a class creates a matching event in the teacher's Google Calendar.
- [ ] The event carries the student name, subject, date/time, and notes.
- [ ] A "Connect Google Calendar" control lets the teacher link their account
      (the old disabled placeholder was removed when the story was dropped).
- [ ] The teacher can connect and disconnect their calendar.
- [ ] Reminders/notifications are handled by Google Calendar, not built here.
- [ ] A calendar failure does not lose the scheduled class in the portal.

**Notes**

- Needs its own Google OAuth consent (Calendar scope). REQ-004 is now an **Entra
  ID** login, so this story brings the Google connection itself — a bigger lift
  than when sign-in was going to be Google-native.
- ⚠️ **Needs durable storage for refresh tokens.** The API's store is in-memory and
  resets on restart/scale-out, so a connection wouldn't survive. Effectively blocked
  on the Cosmos DB migration, or another secure store (Key Vault).
- Open: is sync one-way (portal → Google) or two-way? Editing/cancelling a class —
  in scope? Assumed **one-way, create-only** for a first cut.

## REQ-011 — Group sessions: several students attend one class

**Status:** 🚧 In progress · **Impact:** both · **Effort:** L

**Story**
As a teacher, I want to book one class that several students attend together,
so that group lessons live on the calendar as one slot — while each student's
attendance, cancellation and bill stay their own.

**Decisions** _(made 2026-07-17)_

- **Linked rows, not a new entity**: a group class is one session row per
  attending student sharing a `groupId` + date/time/duration. Billing stays
  the REQ-001 arithmetic untouched — **each attendee is billed their own
  per-session fee** (group discounts are just lower fees on those students).
- **Cancellation is per student, with a cancel-for-everyone convenience** —
  one sick student is excused (and not billed) without touching the rest.

**Acceptance criteria**

- [ ] The planner's student picker takes **multiple students**; one Save books
      the class for all of them (API: `POST /sessions` with `studentIds[]`
      creates the linked rows and returns them).
- [ ] The calendar shows a grouped slot as **one chip**, not one per student;
      hover and the day modal name every attendee.
- [ ] Editing a grouped class's shared fields (subject, date, time, duration,
      notes) applies to **every linked row** — the group moves as one.
- [ ] A single attendee can be cancelled (and restored) without affecting the
      others; **Cancel for everyone** cancels every linked row, behind the
      same are-you-sure confirmation.
- [ ] A cancelled attendee is **never billed** for that class; the others
      still are (REQ-010/REQ-001 semantics per row).
- [ ] Dashboard week-load hours count a group hour **once**, not once per
      attendee.
- [ ] Seed includes a weekly group class in every environment, so the state
      is visible without booking one by hand.
- [ ] Frontend coverage stays at 100%; API deploys before the frontend.

**Notes**

- A solo class simply has no `groupId` — nothing changes for existing data,
  and older records keep working.
- Changing a group's *membership* is cancel-a-row / book-again, not an edit —
  same reasoning as REQ-010's "cancel + rebook" for moving a class.
- Named, reusable groups ("Year 8 Physics circle") would be a separate story
  on top of this model if ever wanted.

## REQ-012 — Class planner: subject is a multi-select

**Status:** 🚧 In progress · **Impact:** frontend · **Effort:** S

**Story**
As a teacher, I want to tag a class with more than one subject (a combined
Maths + Physics session, say), picking from the subjects I already teach,
so that the class record reflects what was actually covered.

**Decisions** _(made 2026-07-17)_

- **The wire format stays one string.** Selected subjects join as
  `"Mathematics, Physics"` — the API, calendar chips, tooltips, upcoming
  lists and billing all keep working untouched, and existing records load
  back into chips by splitting on `", "`.
- **Options come from the roster** — every distinct subject across all
  students — but the field stays `freeSolo`, so a brand-new subject can
  still be typed and committed with Enter (nothing regresses from the old
  free-text field).

**Acceptance criteria**

- [ ] The planner's Subject field is a chip-based multi-select with the
      roster's distinct subjects as its dropdown options.
- [ ] A typed subject not in the list can still be committed (freeSolo).
- [ ] Picking the first student still seeds their first subject — as a chip,
      and never overwriting subjects already chosen.
- [ ] Editing a class splits its stored subject string back into chips;
      saving joins them again.
- [ ] Booking is blocked while no subject chip is committed.
- [ ] Frontend coverage stays at 100%.

## REQ-013 — Archive a student with a closing note; Alumni section

**Status:** ✅ Done (shipped) · **Impact:** both · **Effort:** M

**Story**
As a teacher, I want to archive a student who has finished tutoring — with a
closing note — so that the active roster stays clean while their history stays
intact, and I can find past students in a teacher-only **Alumni** section.

**Decisions** _(proposed 2026-07-17 — say so if any should change)_

- **Archive is a state, not a deletion.** New optional student fields
  (`isArchived`, `archivedOn`, `archiveNotes`) — additive, so existing rows and
  older deployed frontends are unaffected (same back-compat pattern as
  `groupId`). GDPR erasure stays REQ-009's DELETE; `archivedOn` is the anchor
  the REQ-009 §10.3 retention window measures from.
- **No archiving with future classes on the books.** The API refuses (409)
  while the student has future non-cancelled sessions — otherwise a leaver
  keeps generating bills. Cancel or hold those classes first; the UI says so.
- **Reversible.** Restore returns them to the active roster; the closing note
  is kept either way.
- **UI naming:** the model says "archived"; the menu says **Alumni**.

**Acceptance criteria**

- [x] Archive from the student's page — future classes are auto-cancelled on confirmation (changed 2026-07-19 from a block to a cancel-and-archive), the dialog warns how many., behind an are-you-sure step, with a
      **required closing note**; blocked with a clear message while future
      scheduled classes exist.
- [x] Archived students leave the active surfaces: student list, dashboard
      stats and charts, study snapshot, and the class planner's student picker.
- [x] **Alumni** appears in the nav — teacher-only (rides REQ-003's gating) —
      listing archived students with archive date and closing note.
- [x] Opening an alumni record shows the full student page with an "Archived"
      banner and a **Restore to active** action.
- [x] History is untouched in both directions: past sessions and billed months
      stay exactly as they were; restoring changes no history either.
- [x] API enforces the state rules (409 guard, required note); frontend
      coverage stays 100% (266 tests).

**Notes**

- Sequencing: buildable against the in-memory store, but **best after
  REQ-009** — archived flags on real durable rows, one data-model change
  instead of two, and the retention sweep gains its anchor immediately.
- Payments: months already billed keep the alumni's rows (classes happened);
  future months naturally show nothing because the 409 guard means no future
  sessions exist at archive time.

## REQ-014 — Progress is tracked per subject

**Status:** ✅ Done (shipped) · **Impact:** both · **Effort:** M

**Story**
As a teacher, I want to record progress for each subject a student studies —
a student can be at 85% in Maths and 60% in Physics — so that the record
reflects where they actually are, not one blended number.

**Decisions** _(proposed 2026-07-17 — say so if any should change)_

- **Additive field, no breakage:** `progressBySubject?: Record<subject, 0–100>`
  joins the model (same optional-field pattern as `groupId`). The existing
  `progress` number stays and becomes the **rounded average** of the
  per-subject values, maintained by the API on save — old records without
  the map keep behaving exactly as today, and the dashboard's average-progress
  stat needs no change.
- **Subject list changes keep the map honest:** adding a subject to a student
  seeds its progress at their current overall (not a jarring 0); removing a
  subject drops its entry; the API rejects keys that aren't in `subjects`.
- **UI:** the student page's single slider becomes one slider per subject
  (label + %), with the overall shown as a read-only derived figure.

**Acceptance criteria**

- [x] The student page's meta card shows a small labelled **progress bar per
      subject** in read mode; in edit mode each bar becomes its slider. The
      overall figure is derived and read-only.
- [x] Per-subject bars stay off the Study Snapshot and roster — those remain
      summary-level (decided 2026-07-17: bars there would be noise).
- [x] `PUT /students/{id}` accepts `progressBySubject`, validates each value
      0–100 and each key against the student's subjects, and recomputes the
      stored `progress` average.
- [x] Seed data carries per-subject values so every environment demonstrates
      the feature.
- [x] Records without `progressBySubject` still work — one blended value,
      exactly as today (plus a **Track per subject** opt-in while editing).
- [x] Dashboard average-progress and every other consumer of `progress` are
      unchanged.
- [x] Frontend coverage stays 100% (238 tests); API deploys before frontend.

**Notes**

- Built 2026-07-17 against the in-memory store at the owner's request; the
  additive field slots into REQ-009's Table entities as one more column-ish
  property when that lands.
- Same day: "Mode" renamed to **"Study mode"** everywhere user-facing, and
  the 'Both' value displays as **"Online + F2F"** (stored API value stays
  'Both' — display only).

<!-- ── Growth epics (added 2026-07-21) ────────────────────────────────────────
     Turn the two thin public pages (Offerings, Contact) into a way to win new
     students: a conversion-shaped Offerings page, lead capture, proof, pricing
     and discoverability. Companion brief (promotion playbook + section map +
     wireframe): https://claude.ai/code/artifact/c4340d52-d54b-4ca2-8693-28f5ed2faa41
     Reuses REQ-008 (in-app content editor) and REQ-009 (durable store) as deps. -->

## REQ-015 — Offerings hero and a single call-to-action

**Status:** ✅ Done (shipped) · **Impact:** frontend · **Effort:** S · **Depends on:** REQ-006 (done)

**Story**
As a visiting parent, I want the Offerings page to open with a clear value
proposition and one obvious call-to-action, so that I understand the offer and
know exactly how to start.

**Acceptance criteria**

- [ ] Hero at the top of Offerings: headline value proposition, one-line
      sub-head, primary CTA "Book a free assessment", secondary "See subjects".
- [ ] The primary CTA is above the fold on mobile and routes to the enquiry
      flow (REQ-018); until that exists, it links to Contact us (REQ-007).
- [ ] The CTA repeats as a sticky/again-at-the-bottom action so the page never
      dead-ends.
- [ ] Responsive and themed, consistent with the rest of the app.
- [ ] Frontend coverage stays 100%.

**Notes**

- Hero copy is content, so it belongs in the site-content payload (REQ-008
  shape), not hardcoded markup — but a placeholder string is fine to ship first.

## REQ-016 — Subjects as rich cards

**Status:** ✅ Done (shipped) · **Impact:** both · **Effort:** M

**Story**
As a parent, I want each subject shown as a card with the level and exam boards
covered, so that I can see my child's specific needs are catered for.

**Acceptance criteria**

- [ ] Each subject renders as a card: subject, key stage(s) (KS3 / GCSE), exam
      boards, and delivery mode(s) — replacing the flat pill list.
- [ ] The extra per-subject metadata is served by the API (model + seed), not
      hardcoded — a subject with no metadata still renders cleanly.
- [ ] The empty / "coming soon" state is preserved.
- [ ] Frontend coverage stays 100%; API deploys before the frontend.

**Notes**

- Adds fields to the offerings content shape; folds naturally into REQ-008's
  "subjects: add / rename / remove / reorder" editor when that lands.

## REQ-017 — How it works, as a numbered journey

**Status:** ✅ Done (shipped) · **Impact:** frontend · **Effort:** XS

**Story**
As a parent, I want a clear "how it works" journey, so that I know what happens
after I get in touch.

**Acceptance criteria**

- [ ] The existing four "approach" points are reframed as a numbered path:
      Enquire → Free assessment → Matched plan → Weekly sessions with notes.
- [ ] Reuses the current approach-point content; no new data needed.
- [ ] Responsive and themed.
- [ ] Frontend coverage stays 100%.

## REQ-018 — Public enquiry form

**Status:** 🔲 Not started · **Impact:** both · **Effort:** M · **Blocked by:** REQ-009 (durable store)

**Story**
As a parent, I want to submit an enquiry from the site, so that I can start
without having to compose a cold email.

**Acceptance criteria**

- [ ] Form fields: name, child's year, subject(s), goal, preferred mode, and a
      contact (email or phone) — with validation and clear errors.
- [ ] Lives at a public `/enquire` route; every CTA on the public pages targets it.
- [ ] Submitting creates a lead via `POST /leads` and shows a success confirmation.
- [ ] Basic spam protection (honeypot field and/or rate limit).
- [ ] `POST /leads` is **public**; reading leads is teacher-only (REQ-019).
- [ ] Frontend coverage stays 100%; API deploys before the frontend.

**Notes**

- ⚠️ **Needs durable storage** (REQ-009) or leads vanish on restart/scale-out.
  Interim option: have the endpoint **email** the enquiry to the teacher instead
  of persisting it, so the form is useful before REQ-009 lands.
- A lead is not a student — it's a prospect. Converting one is REQ-019.

## REQ-019 — Leads inbox

**Status:** 🔲 Not started · **Impact:** both · **Effort:** M · **Blocked by:** REQ-018

**Story**
As the teacher, I want new enquiries to appear in a Leads inbox, so that I can
follow them up and convert the good ones into students.

**Acceptance criteria**

- [ ] Teacher-only `/leads` route (rides REQ-003 gating), newest first.
- [ ] Each lead shows what was submitted and a status: New · Contacted · Converted.
- [ ] "Convert to student" pre-fills the add-student form from the lead's details.
- [ ] The open-enquiry count surfaces on the dashboard.
- [ ] `GET /leads` and status updates are teacher-only and rejected when unauthenticated.
- [ ] Frontend coverage stays 100%; API deploys before the frontend.

## REQ-020 — Testimonials and outcomes

**Status:** 🔲 Not started · **Impact:** both · **Effort:** M · **Depends on:** REQ-008 (content), REQ-009 (store)

**Story**
As a parent, I want to see testimonials and real outcomes, so that I trust this
tutor with my child.

**Acceptance criteria**

- [ ] Testimonials section: quote, attribution (name / relation), optional result.
- [ ] An outcomes strip: e.g. students taught, sessions delivered, average
      progress — sourced from real app data where possible, not invented.
- [ ] Testimonial content is teacher-editable via REQ-008; nothing hardcoded.
- [ ] Frontend coverage stays 100%.

**Notes**

- ⚠️ **Testimonials must be real and used with permission** — publishing invented
  reviews would mislead prospective families (same caveat noted on REQ-008).
- **Split:** the *testimonial* half of this story is superseded by **REQ-027**,
  which lets families submit their own reviews for teacher moderation (a stronger
  source of real, permissioned testimonials than teacher-typed copy). What remains
  here is the **outcomes strip** (students taught / sessions / average progress
  from live data). Keep this story for that; REQ-027 owns the testimonial cards.

## REQ-021 — Tutor bio and safeguarding

**Status:** 🔲 Not started · **Impact:** both · **Effort:** S · **Depends on:** REQ-008 (content)

**Story**
As a parent, I want a tutor bio with credentials and safeguarding information,
so that I feel safe choosing this service.

**Acceptance criteria**

- [ ] Bio section: who the tutor is, qualifications, experience, optional photo.
- [ ] A DBS-checked indicator and a short safeguarding statement.
- [ ] Content is teacher-editable via REQ-008.
- [ ] Frontend coverage stays 100%.

## REQ-022 — Transparent pricing

**Status:** 🔲 Not started · **Impact:** both · **Effort:** S · **Depends on:** REQ-008 (content)

**Story**
As a parent, I want to see pricing up front, so that I can decide whether to
enquire without having to ask.

**Acceptance criteria**

- [ ] A pricing section showing the per-session and monthly-retainer options —
      mirroring the app's existing fee types — with from-prices and what's included.
- [ ] Optional bursary / concession note.
- [ ] Pricing is teacher-editable via REQ-008.
- [ ] Frontend coverage stays 100%.

**Notes**

- The fee types (per-session / monthly / none) already exist in the model, so the
  public pricing language and the billing behaviour stay consistent.

## REQ-023 — Public pages are discoverable (SEO / OG)

**Status:** 🔲 Not started · **Impact:** frontend (+ infra if prerendered) · **Effort:** M

**Story**
As a family searching online, I want the public pages to have proper titles,
descriptions and share previews, so that they rank locally and links look good
when shared.

**Acceptance criteria**

- [ ] Per-page `<title>`, meta description, and Open Graph / Twitter card tags
      on every public route (Home, Offerings, Pricing, Contact, Enquire).
- [ ] `sitemap.xml` and `robots.txt` present.
- [ ] Local, intent-led keywords in public headings and copy.
- [ ] Public routes are crawlable — SSR/prerender, or static meta injection at
      build, so the tags aren't only set after the SPA hydrates.

**Notes**

- The app is a client-rendered SPA; crawlers and link unfurlers may not run JS,
  so meta injected only at runtime can be missed — hence the prerender note.

## REQ-024 — Public Home landing page

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** M · **Relates to:** REQ-003

**Story**
As a visitor, I want a public Home landing page, so that arriving at the site
root shows the pitch, not the teacher dashboard behind a sign-in.

**Acceptance criteria**

- [ ] The unauthenticated root renders a marketing home (hero, proof, CTA); the
      teacher dashboard moves behind auth (e.g. `/app`).
- [ ] Home links onward to Offerings, Pricing, Testimonials and Enquire.
- [ ] A signed-in teacher still lands on their dashboard.
- [ ] Frontend coverage stays 100%.

**Notes**

- Fits REQ-003's public/teacher split — this is the public front door that split
  currently lacks (today `*` redirects to the teacher dashboard).

## REQ-025 — FAQ

**Status:** 🔲 Not started · **Impact:** both · **Effort:** S · **Depends on:** REQ-008 (content)

**Story**
As a parent, I want an FAQ, so that the usual questions are answered before I
have to ask them.

**Acceptance criteria**

- [ ] An accordion FAQ on the public pages, content-driven (teacher-editable via
      REQ-008).
- [ ] Each answer can link to the enquiry CTA.
- [ ] Frontend coverage stays 100%.

## REQ-026 — Refer a family

**Status:** 🔲 Not started · **Impact:** both · **Effort:** S · **Blocked by:** REQ-009 (store)

**Story**
As a current parent, I want to refer another family in one tap, so that
recommending Springboard is effortless.

**Acceptance criteria**

- [ ] A shareable referral link, and a gentle "know another family?" prompt after
      a positive touchpoint.
- [ ] Referred enquiries are attributable back to the referrer (feeds REQ-019).
- [ ] Frontend coverage stays 100%; API deploys before the frontend.

**Notes**

- Word of mouth is the strongest channel in tutoring; this makes it a one-tap
  action instead of a favour a parent has to remember to do.

## REQ-027 — Families submit testimonials; teacher moderates; approved show as cards

**Status:** ✅ Done (shipped) · **Impact:** both · **Effort:** L · **Blocked by:** REQ-009 (durable store) · **Relates to:** REQ-003 (moderation gating), REQ-020 (supersedes its testimonial half)

**Story**
As a past or ongoing parent or student, I want to share my experience for the
teacher to review, so that prospective families can read real, permissioned
reviews. And as the teacher, I want to approve or reject each submission before
anything is shown publicly, so that only genuine, appropriate reviews appear on
the portal.

**Decisions** _(made 2026-07-21)_

- **A review carries a 1–5 star rating and a written quote.** Cards show both.
- **Attribution:** name + role (**Parent** / **Student**), with **optional**
  subject and year — e.g. "Sarah — Parent of a Year 10 Maths student", degrading
  gracefully to "Sarah — Parent" when the optional detail is left blank.
- **One dedicated public `/reviews` page** holds *both* the approved cards and
  the submit form — no separate entry on Offerings.
- **Moderation is the gate:** every submission starts `Pending` and is invisible
  publicly until the teacher sets it `Approved`; `Rejected` never shows.
- **User-generated, so not part of REQ-008.** These live in their own store and
  moderation flow, separate from the teacher-authored site content.

**Model** — new `Testimonial`

- `id`, `authorName` (required), `role` (`Parent` | `Student`, required),
  `subject?`, `year?`, `rating` (integer 1–5, required), `quote` (required,
  length-capped, **plain text only**), `status` (`Pending` | `Approved` |
  `Rejected`, default `Pending`), `submittedOn`, `moderatedOn?`.
- No link to a real student record — attribution is only what the submitter types.

**Endpoints**

- `POST /testimonials` — **public**; creates a `Pending` review (honeypot +
  validation + rate limit). Responds with a thank-you, not the stored record.
- `GET /testimonials` — **public**; returns **`Approved` only**.
- `GET /testimonials?status=pending` — **teacher-only**; moderation queue.
- `PUT /testimonials/{id}` — **teacher-only**; set `Approved` / `Rejected`
  (stamps `moderatedOn`).
- `DELETE /testimonials/{id}` — **teacher-only**; remove spam/abuse entirely.

**Acceptance criteria**

_Submission (public)_

- [ ] A public `/reviews` page shows approved reviews as cards **and** holds a
      "Share your experience" form.
- [ ] Form fields: name (required), role Parent/Student (required), subject
      (optional), year (optional), 1–5 star rating (required), quote (required,
      max length) — validated with clear inline errors.
- [ ] Submitting `POST`s to `/testimonials`, stores `Pending`, and shows a
      thank-you explaining it appears once the teacher approves it.
- [ ] Honeypot field + basic rate limiting; a consent-to-publish line in the copy.

_Display (public)_

- [ ] Approved reviews render as cards: quote, star rating, and attribution that
      composes from role + optional subject/year, degrading gracefully.
- [ ] `GET /testimonials` returns approved only; pending/rejected are never
      publicly retrievable.
- [ ] A friendly empty state before any review is approved.

_Moderation (teacher)_

- [ ] Teacher-only Reviews queue (rides REQ-003 gating), newest first, showing
      each pending submission in full with **Approve** / **Reject** / **Delete**.
- [ ] Approving publishes it (stamps `moderatedOn`); rejecting/deleting keeps it
      off the public page.
- [ ] A pending-count badge (dashboard or nav) so new submissions get noticed.
- [ ] The pending queue and all approve/reject/delete calls are teacher-only and
      rejected by the **API** when unauthenticated — not merely hidden in the UI.

_Cross-cutting_

- [ ] Persisted durably (survives restart/scale-out), per environment; seed
      carries a couple of approved reviews + one pending so the state is visible.
- [ ] OpenAPI updated; backend lint/tsc clean; **API deploys before the frontend**.
- [ ] Frontend coverage stays 100%.

**Notes**

- ⚠️ **Needs durable storage (REQ-009).** Pending/approved reviews must not vanish
  on restart. The backend's `TableStore` already exists, so this can land on Table
  Storage now (a new `testimonials` table) without waiting on a wider DB migration
  — build against `MemoryStore` for dev, `TableStore` for prod, same as today.
- ⚠️ **Public write is an abuse surface.** Moderation is the primary control
  (nothing shows unapproved); back it with a honeypot, a rate limit, a quote
  length cap, and **plain-text-only** storage/rendering (no HTML) to rule out
  stored XSS on a public page.
- **GDPR:** a review is personal data the submitter volunteered; the `DELETE`
  endpoint is the erasure path, and the form must state that submitting grants
  permission to publish. No PII beyond the quote text is collected.
- Supersedes the *testimonial* half of **REQ-020** (teacher-typed) with real,
  user-submitted, moderated reviews; REQ-020 retains only the outcomes strip.
- Nav: a public **Reviews** item, and a teacher-only **Reviews** moderation view
  (or fold moderation into a shared "inbox" alongside REQ-019 leads).
- ❓ Open: may the teacher lightly edit an approved review (fix a typo) before it
  publishes, or is it approve-as-submitted? Assumed **approve-as-submitted** for a
  first cut — deletion handles anything not publishable.

## REQ-028 — Profanity screen flags reviews for moderation

**Status:** 🚧 In progress (frontend display built; **backend screen not built**) · **Impact:** both · **Effort:** S · **Blocked by:** REQ-027

**Story**
As the teacher, I want a submitted review that trips a profanity screen to be
flagged in my moderation queue, so that a possibly-offensive submission stands
out and I can reject or delete it before it ever publishes.

**Acceptance criteria**

- [x] The frontend `Testimonial` type carries `flagged?: boolean`, and the
      moderation queue highlights a flagged submission (amber warning strip and
      a warm-tinted card, `.testimonial-card.flagged` / `.testimonial-flag`).
- [ ] **The backend `Testimonial` model carries `flagged`** — currently absent
      (`func-teaching-tracker/src/models/testimonial.ts`), so the API never
      returns it and the frontend highlight never fires against real data.
- [ ] **`POST /testimonials` runs the name and quote through a profanity screen**;
      a match sets `flagged: true` on the stored (still `Pending`) review — not
      built; no screen exists in the API.
- [ ] Flagging does **not** change visibility — a hint only; nothing publishes
      unapproved either way.
- [ ] Seed carries one flagged pending review so the queue state is visible.
- [ ] Frontend coverage stays 100%; API deploys before the frontend.

**Notes**

- ⚠️ **Half-built, discovered 2026-07-24.** The *display* side shipped with
  REQ-027 — the `flagged` field on the frontend type and the moderation card
  styling — but the API side (model field + profanity screen on write) was never
  written, so the flag is dead code today: nothing ever sets it. This story
  captures the remaining backend work to make the feature real.
- Suggested screen: a simple word-list match — cheap, no external service, and
  false positives are harmless because the teacher makes the final call. Backend
  is the source of truth (a public write surface must screen server-side; a
  browser check would be bypassable), matching REQ-027's plain-text-only stance.

## REQ-029 — Forms mark required fields and show inline validation

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** M · **Priority:** raised by the owner 2026-07-24 — moved ahead of REQ-009 as the next pickup

**Story**
As anyone filling in a form — the teacher adding a student or booking a class,
a visitor leaving a review or the teacher editing contact details — I want
required fields marked with a `*`, and a clear inline error (red border + a
short message) on any field I miss, so that I know what's needed up front and,
when a save is refused, exactly which field to fix and why.

**Acceptance criteria**

- [ ] Every required field across the app's forms shows a `*` on its label:
      **Add / Edit student** (`StudentFormModal` / `StudentDetailsView`),
      **Schedule / edit class** (`ClassSchedulingView`), **Leave a review**
      (`ReviewsView`), and **Edit contact details** (`ContactView`).
- [ ] Submitting (or blurring) a field that fails validation gives it a **red
      border and a short message beneath it** naming the problem ("First name is
      required", "Rating is required"), not just a disabled Save button.
- [ ] The message clears as soon as the field becomes valid.
- [ ] Errors are announced accessibly: the field is `aria-invalid` and tied to
      its message via `aria-describedby` (MUI `TextField` `error` + `helperText`
      already do this; the custom controls — subject chips, star rating,
      honeypot-adjacent inputs — must match).
- [ ] Optional fields are never marked or errored — only genuinely required ones.
- [ ] The review form keeps its single top-level error as a summary, but each
      failing field now also shows its own inline error (today only the one
      `.review-error` line exists, so a user can't tell which field it means).
- [ ] Consistent look: one required-marker and one error treatment, themed and
      working in light/dark, reused across every form (a shared field wrapper or
      a small `requiredMark` / error convention rather than per-form CSS).
- [ ] Frontend coverage stays 100%.

**Notes**

- **Current state (2026-07-24):** no form marks required fields — there is no
  `required`/`*` anywhere in `src/components` — and validation is mostly a
  *disabled Save button* with no per-field feedback. Only `ReviewsView` shows an
  error at all, and it's a single top-level `.review-error` line, not per-field.
  So this is additive polish over existing gating, not a rewrite of it.
- Decision needed: **when do errors appear** — on submit only, or on blur once a
  field has been touched? Recommend **on blur after touch, plus on submit** — it
  avoids screaming at a half-typed form while still catching a straight-to-Save.
- MUI `TextField` gives `*` for free with the `required` prop and `error` +
  `helperText` for the red border/message, so the standard fields are cheap; the
  work is the **custom controls** (Autocomplete subject chips, the star-rating
  buttons) and doing it **once, consistently** rather than five slightly different
  ways.
- Keep it frontend-only: the API already validates on write (REQ-002/027) and
  returns messages; this story is about surfacing problems *before* submit, not
  changing server validation.
- ❓ Open: should the `*` carry a legend ("* required") on longer forms, or is the
  marker self-evident? Assumed self-evident for a first cut.
