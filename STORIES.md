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

**Next id: `REQ-010`**

## Legend

| Field      | Values                                                      |
| ---------- | ----------------------------------------------------------- |
| **Status** | 🔲 Not started · 🚧 In progress · ✅ Done · ⏸️ Parked · ❌ Dropped |
| **Impact** | `frontend` · `backend` · `both` · `infra`                    |
| **Effort** | XS · S · M · L · XL (relative, not hours)                    |

## Definition of done

Applies to every story unless it says otherwise. These reflect how this project
actually works — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

- **Frontend tests: 100% coverage.** `vitest.config.ts` enforces 100% on
  branches/functions/lines/statements, and coverage runs even on `npm test`. New
  code needs tests or the build fails.
- **Frontend ships no data.** Every screen is fed by the API via redux-saga. New
  data means a backend change first, plus a fixture in `src/test/fixtures.ts`.
- **Per-environment data.** Seed lives in the backend's `src/data/seed.ts`
  (`envSeeds`): dev 5 / test 10 / prod 15 students. Keep environments distinct.
- **Contract changes are backend-first.** If a story adds or changes an endpoint,
  the API must deploy before the frontend, or the frontend 404s in prod.
- **Verify at the surface.** Drive the real screens against real API data — see
  [`.claude/skills/verify/SKILL.md`](.claude/skills/verify/SKILL.md).
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

| # | Story | Effort | Impact | Blocked by |
| - | ----- | ------ | ------ | ---------- |
| 1 | [REQ-007 — Contact us page](#req-007--public-contact-us-page) | XS | frontend | — |
| 2 | [REQ-006 — Offerings page](#req-006--public-offerings-page) | S | frontend | — |
| 3 | [REQ-002 — Student fields editable + saved](#req-002--every-student-field-except-the-id-is-editable-and-persists-via-the-api) | M | both | — |
| 4 | [REQ-001 — Fees per session, billed on classes taught](#req-001--fees-are-per-session-and-a-month-bills-for-classes-actually-taught) | L | both | — |
| 5 | [REQ-003 — Public / teacher split](#req-003--public-portal-with-no-login-the-teachers-area-is-private) | L | both | REQ-004 to enforce |
| 6 | [REQ-004 — Google sign-in](#req-004--teacher-signs-in-with-a-google-account) | L | both + infra | a cost decision |
| 7 | [REQ-009 — Real database](#req-009--replace-the-in-memory-store-with-a-real-database) | L | backend + infra | — |
| 8 | [REQ-008 — Teacher edits the public site](#req-008--the-teacher-edits-the-public-site-from-the-portal-with-a-preview) | XL | both | REQ-009 |
| 9 | [REQ-005 — Google Calendar sync](#req-005--scheduled-classes-sync-to-google-calendar) | XL | both + infra | REQ-004, REQ-009 |

**Three things this order is trying to respect:**

1. **The first four have no blockers.** REQ-007 → REQ-001 can start today, in that
   order, and each ships something visible on its own.
2. **REQ-003 and REQ-004 ship together.** The split is the requirement; sign-in is
   the mechanism. Gating routes without identity produces a fake lock — and the
   API stays open regardless, which is the part that matters.
3. **REQ-009 is the real gate for the last two.** It was parked as "not needed
   now"; REQ-008 and REQ-005 both quietly depend on it. Doing them first would mean
   building on storage that forgets.

<!-- Stories go below, in order. Newest at the bottom; work proceeds top-down. -->

## REQ-007 — Public "Contact us" page

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** XS

**Story**
As a prospective parent or student, I want to find the right contact details, so
that I can reach out.

**Acceptance criteria**

- [ ] New **public** menu item, "Contact us", reachable without signing in.
- [ ] Shows the contact email address and phone number.
- [ ] Email and phone are actionable (`mailto:` / `tel:` links).
- [ ] A decent, uncluttered layout — responsive and themed.

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

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** S

**Story**
As a prospective parent or student, I want to see what's taught and how, so that I
can decide whether to get in touch.

**Acceptance criteria**

- [ ] New **public** menu item, "Offerings", reachable without signing in.
- [ ] Lists the subjects taught.
- [ ] Explains the teaching approach: how students are organised/grouped, how they
      are taught, and what is taken care of along the way.
- [ ] Presented as clear selling points, not a wall of text.
- [ ] Responsive, and consistent with the existing theme.

**Notes**

- ❓ **Content needed from you** — the real subject list and the points you want to
  make. I can draft placeholder copy for you to correct.
- Open: is the copy hardcoded for now, or does it need to be editable without a
  deploy? Assumed **hardcoded** initially.

## REQ-002 — Every student field except the id is editable and persists via the API

**Status:** 🔲 Not started · **Impact:** both · **Effort:** M

**Story**
As a teacher, I want to edit any detail on a student record — and have it saved —
so that records stay accurate as circumstances change (e.g. a student who studied
Chemistry starts taking Physics and Maths).

**Acceptance criteria**

- [ ] Editable on the student page: `firstName`, `lastName`, `dob`, `subjects`,
      `school`, `year`, `progress`, `mode`, `fees`, `notes`, `parentName`,
      `contactNumber`, `address`.
- [ ] `subjects` is edited as a multi-select, so a student can gain/lose subjects.
- [ ] The same fields can be set when **adding** a student.
- [ ] `id` and `studentId` (the generated code, e.g. `DEV-0001`) are read-only;
      every other field is editable.
- [ ] Saving sends the change to the API (`PUT /students/{id}`), rather than
      updating Redux only.
- [ ] The store reflects the server's response, so the UI matches what was stored.
- [ ] **Edits survive a page reload** (they are re-fetched from the API).
- [ ] A failed save surfaces an error and does not silently discard the edit.
- [ ] Frontend coverage stays at 100%.

**Notes**

- Closes the known gap: student edits are currently **local-only** — no request is
  sent and they revert on reload.
- Backend already supports this: `PUT /students/{id}` and `POST /students` upsert
  and accept every field including `fees`; validation covers `mode`, `progress`,
  and `fees`. Likely **no backend change needed** beyond REQ-001.
- Decided: `studentId` stays **locked**. It's a generated identifier, so only `id`
  and `studentId` are read-only — everything else is editable.
- Payment edits are a separate gap and are **not** in scope here.

## REQ-001 — Fees are per session, and a month bills for classes actually taught

**Status:** 🔲 Not started · **Impact:** both · **Effort:** L

**Story**
As a teacher, I want each student's fee to price a **single session**, and what
they owe for a month to build up from the classes that have **actually taken
place**, so that a bill is always a list of lessons I really taught — and I can
mark a student as paid once the month is done.

**Acceptance criteria**

- [ ] `Student.fees` means the price of **one session** (backend model + seed).
- [ ] Every place the fee is shown reads as per-session, not `/month` — student
      detail page, student form, payment tracker "Fee" column.
- [ ] **Amount due to date = `student.fees` × the student's classes that have
      already taken place in that month** (a session whose date is today or
      earlier). Classes still to come are not billed.
- [ ] The current month therefore **accrues**: it grows as classes are taught.
- [ ] A past month bills for all of its classes; a future month bills £0.
- [ ] The payment record carries the **session count it was derived from**, so the
      figure is explainable rather than a bare number ("4 classes × £120").
- [ ] Payment tracker per-month totals (due / received / outstanding) follow the
      new calculation.
- [ ] **The teacher can mark a student as paid for a month, and it sticks** —
      persisted via the API, surviving a reload (see ⚠️ below).
- [ ] Marking paid settles the amount due to date for that month.
- [ ] **Sessions are seeded recurring** (weekly per student, across the seed year)
      so past months have real classes to bill against.
- [ ] Environments keep distinct per-session fees (dev £100 / test £110 /
      prod £120 base) and distinct volumes.

**Notes**

- Decided: bill for **delivered** lessons, not scheduled ones. A bill is a list of
  classes that actually happened, which is defensible to a parent and handles a
  quiet month with no manual adjustment.
- ⚠️ **This makes the API time-dependent.** "Already taken place" is relative to
  today, so `/payments` responses change as days pass. Tests must control the
  clock rather than read it, and the figure can't be cached indefinitely.
- ⚠️ **No attendance or cancellation model exists.** A class is assumed to have
  happened purely because its date has passed — so a cancelled or missed lesson
  would still be billed. That's a real billing error waiting to happen. Either
  accept it for now, or add a "class happened / cancelled" mark (its own story).
- ⚠️ **Marking paid needs the payment write that doesn't exist yet.** Payment
  edits are currently local-only: nothing is sent, and they revert on reload. The
  API already has `POST /payments`; no saga calls it. That gap has to close for
  this story to mean anything.
- ⚠️ **Forces a seed-data change.** Each env has only a few one-off sessions near
  today (dev 4 / test 6 / prod 8), so almost every month would bill **£0**.
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

**Status:** 🔲 Not started · **Impact:** both · **Effort:** L

**Story**
As a visitor, I want to browse the portal without signing in, so that I can learn
what's offered and get in touch. As the teacher, I want my student records to be
visible only to me, so that families' details stay private.

**Acceptance criteria**

- [ ] **Public, no login:** landing page, Offerings (REQ-006), Contact us (REQ-007).
- [ ] **Teacher only:** Dashboard, Students, Student detail, Study snapshot,
      Payment tracker, Class scheduling.
- [ ] A visitor opening a teacher route is sent to sign-in — never shown the data,
      not even briefly while loading.
- [ ] Navigation only shows teacher menu items when signed in.
- [ ] **The API rejects unauthenticated requests** for teacher data — hiding it in
      the UI is not sufficient.
- [ ] Public and teacher areas share the same hosted URL per environment.

**Notes**

- ⚠️ **Today everything is open.** All six screens are public, and every Function
  App endpoint is `authLevel: 'anonymous'` — anyone with the URL can read students,
  payments, and sessions. Only *seed* data is exposed right now, so nothing real
  has leaked, but this must be closed before any real student is entered.
- The gate must live in the API. A frontend-only check is cosmetic — the data is
  one `curl` away.
- Depends on a decision in REQ-004 for the actual sign-in mechanism.

## REQ-004 — Teacher signs in with a Google account

**Status:** 🔲 Not started · **Impact:** both + infra · **Future** · **Effort:** L

**Story**
As the teacher, I want to sign in with my Google account, so that only I can reach
the student data, without managing another password.

**Acceptance criteria**

- [ ] Teacher signs in with Google (Google email ID).
- [ ] **Only allow-listed Google accounts get in** — signing in with *any* Google
      account must not grant access.
- [ ] The session persists across reloads, and there is a clear way to sign out.
- [ ] The API validates the token on every teacher request and rejects anything
      unsigned, expired, or not on the allow-list.
- [ ] Works identically across dev/test/prod, with per-environment client config.

**Notes**

- ⚠️ **Cost tension with "everything must be free".** Static Web Apps' built-in
  auth only supports *custom* providers (i.e. Google) on the **Standard** tier —
  Free won't do Google. Options:
  1. **SWA Standard** (~$9/env/month) — built-in, least code, but no longer free.
  2. **Google Identity Services in the app** + validate the Google JWT in the
     Function App — stays on the Free tier, more code to own.
  3. **Entra ID** instead of Google — available without Standard, but not a Google
     email login.
- Whatever we pick, the allow-list is the security boundary — decide where it
  lives (app setting vs Key Vault vs config).

## REQ-009 — Replace the in-memory store with a real database

**Status:** 🔲 Not started · **Impact:** backend + infra · **Effort:** L

**Story**
As the teacher, I want everything I enter to survive a restart, so that student
records, payments and published words don't quietly disappear.

**Acceptance criteria**

- [ ] Students, payments and sessions are stored in Cosmos DB (or Table Storage)
      instead of memory.
- [ ] Data survives a restart, a redeploy, and scale-out.
- [ ] Each environment has its own isolated database/container (dev/test/prod).
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
  most **one** of the three environments can be free. The other two would need
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

**Status:** 🔲 Not started · **Impact:** both + infra · **Future** · **Effort:** XL

**Story**
As the teacher, I want classes I schedule to appear in my Google Calendar, so that
I get reminders and notifications directly without checking the portal.

**Acceptance criteria**

- [ ] Scheduling a class creates a matching event in the teacher's Google Calendar.
- [ ] The event carries the student name, subject, date/time, and notes.
- [ ] The existing **"Connect Google Calendar"** placeholder becomes functional
      (currently disabled — `DashboardView.tsx:175`, "coming soon").
- [ ] The teacher can connect and disconnect their calendar.
- [ ] Reminders/notifications are handled by Google Calendar, not built here.
- [ ] A calendar failure does not lose the scheduled class in the portal.

**Notes**

- Builds on REQ-004 — needs Google OAuth consent with the Calendar scope, which is
  a broader permission than sign-in alone.
- ⚠️ **Needs durable storage for refresh tokens.** The API's store is in-memory and
  resets on restart/scale-out, so a connection wouldn't survive. Effectively blocked
  on the Cosmos DB migration, or another secure store (Key Vault).
- Open: is sync one-way (portal → Google) or two-way? Editing/cancelling a class —
  in scope? Assumed **one-way, create-only** for a first cut.

