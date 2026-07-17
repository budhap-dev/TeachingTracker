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

**Next id: `REQ-013`**

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
| 6 | 🚧 | [REQ-003 — Public / teacher split](#req-003--public-portal-with-no-login-the-teachers-area-is-private) | L | both | REQ-004 to enforce |
| 7 | 🚧 | [REQ-004 — Entra ID sign-in](#req-004--teacher-signs-in-with-microsoft-entra-id) | L | both + infra | — (planned) |
| 8 | 🔲 | [REQ-009 — Real database](#req-009--replace-the-in-memory-store-with-a-real-database) | L | backend + infra | — |
| 9 | 🔲 | [REQ-008 — Teacher edits the public site](#req-008--the-teacher-edits-the-public-site-from-the-portal-with-a-preview) | XL | both | REQ-009 |
| 10 | ❌ | [REQ-005 — Google Calendar sync](#req-005--scheduled-classes-sync-to-google-calendar) | XL | both + infra | — (dropped) |

**Next up: [REQ-009](#req-009--replace-the-in-memory-store-with-a-real-database)** — rows 1–5 are done; REQ-003/REQ-004 are in flight (prod enforcement after the dev soak).

**Three things this order is trying to respect:**

1. **The first five are ✅ done.** REQ-007 → REQ-006 → REQ-002 → REQ-010 → REQ-001
   shipped in that order; the next unblocked story is **REQ-003**. REQ-001 followed
   REQ-010 because billing for classes taught is only correct once a cancelled class
   can be told apart from a taught one.
2. **REQ-003 and REQ-004 ship together.** The split is the requirement; sign-in is
   the mechanism. Gating routes without identity produces a fake lock — and the
   API stays open regardless, which is the part that matters.
3. **REQ-009 is the real gate for the last two.** It was parked as "not needed
   now"; REQ-008 and REQ-005 both quietly depend on it. Doing them first would mean
   building on storage that forgets.

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

**Status:** 🚧 In progress (built; prod enforcement pending REQ-004 T4 soak) · **Impact:** both · **Effort:** L

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
      the UI is not sufficient. _(dev enforced 2026-07-17; prod flips after the
      dev soak — REQ-004 T4)_
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

**Status:** 🚧 In progress (T1–T3 done; T4: dev enforced 2026-07-17, prod after soak) · **Impact:** both + infra · **Effort:** L
· **Plan:** [docs/PLAN-req-004-entra-signin.md](PLAN-req-004-entra-signin.md)

**Story**
As the teacher, I want to sign in with an account only I control, so that only I
(and anyone I explicitly allow) can reach the student data — without managing
another password, and without paying for an auth tier.

**Acceptance criteria**

- [ ] Teacher signs in via Microsoft Entra ID (single-tenant; MSAL in the SPA).
- [ ] **Only allow-listed emails get in** — authenticating with *any* other
      account in the tenant must not grant access.
- [ ] The allow-list holds **multiple emails**, lives in **Key Vault**
      (`teacher-emails`), and is editable without a code deploy.
- [ ] The Function App reads the secret via **managed identity** — no connection
      string or key in app settings.
- [ ] The session persists across reloads, and there is a clear way to sign out.
- [ ] The API validates the JWT (signature / issuer / audience / expiry) on every
      teacher request and rejects anything unsigned, expired, or not allow-listed
      — auth lives in Function code, not in the platform.
- [ ] Works identically across dev/prod, with per-environment client config.
- [ ] Total added cost ≈ £0 (SWA stays Free; Key Vault pennies).

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
