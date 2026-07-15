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
3. Implementation follows the order in this file, top to bottom.
4. A story is only ticked ✅ once it meets the [Definition of done](#definition-of-done).

**Next id: `REQ-009`**

## Legend

| Field      | Values                                                      |
| ---------- | ----------------------------------------------------------- |
| **Status** | 🔲 Not started · 🚧 In progress · ✅ Done · ⏸️ Parked · ❌ Dropped |
| **Impact** | `frontend` · `backend` · `both` · `infra`                    |

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

<!-- Stories go below, in order. Newest at the bottom; work proceeds top-down. -->

## REQ-001 — Student fees are charged per session, not per month

**Status:** 🔲 Not started · **Impact:** both

**Story**
As a teacher, I want each student's fee to represent the cost of a **single
session** rather than a flat monthly charge, so that what I bill reflects the
lessons actually taught.

**Acceptance criteria**

- [ ] `Student.fees` means the price of one session (backend model + seed).
- [ ] Every place the fee is shown reads as per-session, not `/month` — student
      detail page, student form, payment tracker "Fee" column.
- [ ] **A month's expected amount = `student.fees` × that student's sessions in
      that month.** Decided: true per-session billing.
- [ ] A month with no sessions for a student expects £0 for them.
- [ ] Payment tracker per-month totals (expected / received / outstanding) follow
      the new calculation.
- [ ] The payment record carries the session count it was derived from, so the
      figure is explainable rather than a bare number.
- [ ] **Sessions are seeded recurring** (weekly per student, across the seed year)
      so every month has realistic sessions to bill against.
- [ ] Environments keep distinct fee values (dev £100 / test £110 / prod £120 base)
      and distinct volumes.

**Notes**

- Decided: `expected = fees × sessions that month`. This deliberately couples
  payments to scheduled sessions — scheduling a class now changes what's owed.
- ⚠️ **This forces a seed-data change.** Today each env has only a few one-off
  sessions near today's date (dev 4 / test 6 / prod 8), so `fees × sessions` would
  show **£0 for ~11 of 12 months**. Sessions must become recurring — assumption:
  **one session per student per week** through the seed year (2026), giving
  ~4–5 sessions/student/month. Adjustable per env if you want different cadences.
- ⚠️ Knock-on: "Booked classes" on the Class Scheduling screen and the calendar
  will show far more entries than today's 4/6/8. Expected, but a visible change.
- `PaymentRecord.monthlyFee` becomes a derived figure; consider renaming it to
  something honest (e.g. `amountDue`) since it's no longer a flat monthly fee.

## REQ-002 — Every student field except the id is editable and persists via the API

**Status:** 🔲 Not started · **Impact:** both

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

## REQ-003 — Public portal with no login; the teacher's area is private

**Status:** 🔲 Not started · **Impact:** both

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

**Status:** 🔲 Not started · **Impact:** both + infra · **Future**

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

## REQ-005 — Scheduled classes sync to Google Calendar

**Status:** 🔲 Not started · **Impact:** both + infra · **Future**

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

## REQ-006 — Public "Offerings" page

**Status:** 🔲 Not started · **Impact:** frontend

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

## REQ-007 — Public "Contact us" page

**Status:** 🔲 Not started · **Impact:** frontend

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

## REQ-008 — The teacher edits the public site from the portal, with a preview

**Status:** 🔲 Not started · **Impact:** both

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
