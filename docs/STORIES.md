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
| 8 | ✅ | [REQ-029 — Forms mark required fields and show inline validation](#req-029--forms-mark-required-fields-and-show-inline-validation) | M | frontend | — (shipped: PR #51 + contact format follow-up) |
| 9 | ✅ | [REQ-009 — Real database](#req-009--replace-the-in-memory-store-with-a-real-database) | L | backend + infra | — (verified 2026-07-24: prod on UK South tables; dump tool added) |
| 10 | ✅ | [REQ-008 — Teacher edits the public site](#req-008--the-teacher-edits-the-public-site-from-the-portal-with-a-preview) | XL | both | REQ-009 (shipped: backend PR #49 + frontend PRs #56–58 — editor, reorder, preview, publish) |
| 11 | ❌ | [REQ-005 — Google Calendar sync](#req-005--scheduled-classes-sync-to-google-calendar) | XL | both + infra | — (dropped) |
| 12 | ✅ | [REQ-013 — Archive a student (Alumni)](#req-013--archive-a-student-with-a-closing-note-alumni-section) | M | both | — (shipped) |
| 13 | ✅ | [REQ-014 — Progress per subject](#req-014--progress-is-tracked-per-subject) | M | both | — (shipped) |
| — | | **Growth epics — turn the public pages into a way to win students** (added 2026-07-21) | | | |
| 14 | ✅ | [REQ-015 — Offerings hero and a single call-to-action](#req-015--offerings-hero-and-a-single-call-to-action) | S | frontend | — |
| 15 | ✅ | [REQ-016 — Subjects as rich cards](#req-016--subjects-as-rich-cards) | M | both | — |
| 16 | ✅ | [REQ-017 — How it works, as a numbered journey](#req-017--how-it-works-as-a-numbered-journey) | XS | frontend | — |
| 17 | ✅ | [REQ-018 — Public enquiry form](#req-018--public-enquiry-form) | M | both | REQ-009 (shipped 2026-07-25) |
| 18 | ✅ | [REQ-019 — Leads inbox](#req-019--leads-inbox) | M | both | REQ-018 (shipped 2026-07-25) |
| 19 | ✅ | [REQ-020 — Testimonials and outcomes](#req-020--testimonials-and-outcomes) | M | both | — (landed as the reviews pages + hero trust chips; numeric tallies dropped by owner 2026-08-04) |
| 20 | ✅ | [REQ-021 — Tutor bio and safeguarding](#req-021--tutor-bio-and-safeguarding) | S | both | — (landed inside the About page: bio, owner-set DBS badge, safeguarding line) |
| 21 | ✅ | [REQ-022 — Transparent pricing](#req-022--transparent-pricing) | S | both | — (pricing page shipped: per-level rates, edited in place — PR #75) |
| 22 | ✅ | [REQ-023 — Public pages are discoverable (SEO / OG)](#req-023--public-pages-are-discoverable-seo--og) | M | frontend | — (static meta + per-route titles + sitemap/robots; prerender deferred) |
| 23 | ✅ | [REQ-024 — Public Home landing page](#req-024--public-home-landing-page) | M | frontend | REQ-003 |
| 24 | ✅ | [REQ-025 — FAQ](#req-025--faq) | S | both | — (its own menu page, inline teacher editing) |
| 25 | ❌ | [REQ-026 — Refer a family](#req-026--refer-a-family) | S | both | — (dropped 2026-08-02, owner: not needed) |
| 26 | ✅ | [REQ-027 — Families submit testimonials; teacher moderates](#req-027--families-submit-testimonials-teacher-moderates-approved-show-as-cards) | L | both | REQ-009 |
| 27 | ✅ | [REQ-028 — Profanity screen flags reviews for moderation](#req-028--profanity-screen-flags-reviews-for-moderation) | S | both | REQ-027 (backend screen merged 2026-07-24) |
| — | | **Privacy & GDPR — make the app defensibly hostable** (REQ-030 epic, split 2026-07-28) | | | |
| 28 | ✅ | [REQ-030 — Privacy policy and GDPR compliance (epic)](#req-030--privacy-policy-and-gdpr-compliance) | M | both + docs/ops | — (all four slices shipped 2026-07-31; owner actions listed below) |
| 29 | ✅ | [REQ-031 — Public privacy page + collection notices](#req-031--public-privacy-policy-page-and-point-of-collection-notices) | S | frontend | — (shipped: frontend PR #59) |
| 30 | ✅ | [REQ-032 — Erasure end-to-end: delete an enquiry](#req-032--erasure-works-end-to-end-delete-an-enquiry) | S | both | — (shipped: frontend PR #59 + backend PR #48) |
| 31 | ✅ | [REQ-033 — Retention schedule and purge routine](#req-033--retention-schedule-and-purge-routine) | S | docs/ops (+ small backend if automated) | — (shipped 2026-07-31: `docs/PRIVACY-RETENTION.md`) |
| 32 | ✅ | [REQ-034 — Privacy operations records: ROPA, breach plan, ICO fee](#req-034--privacy-operations-records-ropa-breach-plan-ico-fee) | S | docs/ops | — (shipped 2026-07-31: `docs/PRIVACY-ROPA.md`) |
| — | | **Planner stories** (drafted 2026-07-17; missed by the table until 2026-08-02) | | | |
| 33 | ✅ | [REQ-011 — Group sessions](#req-011--group-sessions-several-students-attend-one-class) | L | both | — (shipped with the planner UX pack, merged 2026-07-30) |
| 34 | ✅ | [REQ-012 — Planner subject multi-select](#req-012--class-planner-subject-is-a-multi-select) | S | frontend | — (shipped with the planner UX pack; see deviations in the story) |
| 35 | ✅ | [REQ-035 — Custom domain for the production app](#req-035--custom-domain-for-the-production-app) | S | infra + both | — (LIVE 2026-08-04: https://abhitutor.co.uk, registered → padlock same day) |
| 36 | ⏸️ | [REQ-036 — "Ask us": a grounded FAQ chat box](#req-036--ask-us-a-grounded-faq-chat-box) | M | both | — (parked by owner 2026-08-04; accordion stays the source of truth) |
| 37 | ✅ | [REQ-037 — "About the teacher": a CV-style public page, edited in place](#req-037--about-the-teacher-a-cv-style-public-page-edited-in-place) | M | both | — (shipped PR #76 + polish arc: icons, photo crop, live preview) |
| 38 | ✅ | [REQ-038 — Hero highlights: the selling points that close](#req-038--hero-highlights-the-selling-points-that-close) | S | both | — |
| 39 | ✅ | [REQ-039 — The teacher door: sign-in behind five taps](#req-039--the-teacher-door-sign-in-behind-five-taps) | XS | frontend | — |
| 40 | 🚧 | [REQ-040 — Security hardening: headers, rate limits, dependency alerts](#req-040--security-hardening-headers-rate-limits-dependency-alerts) | S | both + infra | — (code pieces shipped 2026-08-09; Cloudflare rate rules = owner action) |
| 41 | ✅ | [REQ-041 — Student and payment edits persist via the API](#req-041--student-and-payment-edits-persist-via-the-api) | M | both | — (verified 2026-08-09: the gap no longer exists — see the story) |
| 42 | ✅ | [REQ-042 — Keyboard-accessible subject cards](#req-042--keyboard-accessible-subject-cards) | XS | frontend | — (shipped 2026-08-09) |
| 43 | 🔲 | [REQ-043 — LocalBusiness structured data for search](#req-043--localbusiness-structured-data-for-search) | S | frontend | — |
| 44 | 🔲 | [REQ-044 — The installed app degrades gracefully offline](#req-044--the-installed-app-degrades-gracefully-offline) | M | frontend | — |
| 45 | 🔲 | [REQ-045 — Default-content drift check between the repos](#req-045--default-content-drift-check-between-the-repos) | S | both | — (the emoji copy drifted 2026-08-06; make it structural) |
| 46 | 🔲 | [REQ-046 — One edited-in-place hook for About, FAQ and Pricing](#req-046--one-edited-in-place-hook-for-about-faq-and-pricing) | M | frontend | — (the dirty-check bug was fixed three times on 2026-08-06) |
| 47 | 🔲 | [REQ-047 — Split the stylesheet and route monoliths](#req-047--split-the-stylesheet-and-route-monoliths) | S | frontend | — |
| 49 | ✅ | [REQ-049 — The visitors' phone tab bar](#req-049--the-visitors-phone-tab-bar) | M | both | — (Option C picked from design candidates, 2026-08-10) |
| 50 | 🔲 | [REQ-050 — Frontend toolchain migration: React 19, Vite 8, TS 6+, hooks lint](#req-050--frontend-toolchain-migration-react-19-vite-8-ts-6-hooks-lint) | L | frontend | — (all majors held in dependabot.yml until this lands) |
| 51 | 🔲 | [REQ-051 — Subject chips play on tap](#req-051--subject-chips-play-on-tap) | S | frontend | — (owner idea, 2026-08-11) |
| 52 | 🔲 | [REQ-052 — Class notes, read date-wise](#req-052--class-notes-read-date-wise) | S | frontend | — (owner ask, 2026-08-11) |
| 53 | 🔲 | [REQ-053 — The phone says when an enquiry or a review lands](#req-053--the-phone-says-when-an-enquiry-or-a-review-lands) | M | both + infra | — (REQ-044 shipped 2026-08-14, so the worker exists) |
| 54 | 🔲 | [REQ-054 — The visitor's phone: give the first screen to the pitch](#req-054--the-visitors-phone-give-the-first-screen-to-the-pitch) | M | frontend | — (owner ask, 2026-08-14) |
| 55 | 🔲 | [REQ-055 — A month's statement per student, as a PDF](#req-055--a-months-statement-per-student-as-a-pdf) | M | frontend | — (owner ask, 2026-08-15) |
| 56 | 🔲 | [REQ-056 — The dashboard counts what is waiting](#req-056--the-dashboard-counts-what-is-waiting) | S | frontend | — (owner ask, 2026-08-15) |
| 57 | 🔲 | [REQ-057 — The teacher's own reminders](#req-057--the-teachers-own-reminders) | M | both | — (owner ask, 2026-08-15) |
| 58 | 🔲 | [REQ-058 — Which pages visitors actually reach](#req-058--which-pages-visitors-actually-reach) | M | both | — (owner ask, 2026-08-15) |

**Next up: the content stories — [REQ-020](#req-020--testimonials-and-outcomes) (outcomes strip), [REQ-021](#req-021--tutor-bio-and-safeguarding), [REQ-022](#req-022--transparent-pricing), [REQ-025](#req-025--faq) — then [REQ-026](#req-026--refer-a-family).** Their gates have all shipped: REQ-008's editor + preview (backend PR #49, frontend PRs #56–58) and REQ-009's durable store. Each content story adds fields/sections to the site-content model (both repos), an editor section, and the public rendering — the *structure* is buildable now; the real copy (bio, DBS details, prices, FAQ answers) is the owner's to type into the editor.

Reconciled 2026-07-31 against both repos. **The GDPR epic is closed:** REQ-031 and REQ-032 shipped (frontend PR #59, backend PR #48), and REQ-033/034 landed as `docs/PRIVACY-RETENTION.md` and `docs/PRIVACY-ROPA.md`. ⚠️ Three owner actions remain and are *not* code: confirm the ICO data protection fee, confirm the retention values marked _(default)_, and decide the payment-history conflict recorded in [PRIVACY-RETENTION.md §4](./PRIVACY-RETENTION.md) — erasing a student currently deletes their settlement rows, so the policy's tax-law carve-out was removed to keep the public page honest.

Earlier reconciliation (2026-07-24) is now history: REQ-029, REQ-009 (prod on UK South tables), REQ-018/019, REQ-023, REQ-024 and REQ-028's backend screen have all since shipped. Reconciled again 2026-08-02: **REQ-008 is done** (editor, reorder, preview, publish — the 2026-07-31 note above predated PRs #57/58 landing), and **REQ-011/REQ-012 shipped** with the planner UX pack merged 2026-07-30 — verified against the code and the 490-test suite (98.5% coverage). What is genuinely unbuilt from here: the content pieces (REQ-020/021/022/025) plus REQ-026.

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

**Status:** ✅ Done (verified 2026-07-24 — dev and prod on durable Table Storage, prod on UK South; see the backlog table) · **Impact:** backend + infra · **Effort:** L

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

**Status:** ✅ Done (reconciled 2026-08-02) · **Impact:** both · **Effort:** XL · **Delivered:** backend PR #49 (site content served + published by the API) and frontend PRs #56–58 — `SiteEditorView` with per-section forms, drag-to-reorder (`SortableList`), a visitor-accurate preview including unsaved edits, one Publish, and the free-form noticeboard section

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

**Status:** ✅ Done (shipped with the planner UX pack, merged 2026-07-30; every criterion below verified in code 2026-08-02) · **Impact:** both · **Effort:** L

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

- [x] The planner's student picker takes **multiple students**; one Save books
      the class for all of them (API: `POST /sessions` with `studentIds[]`
      creates the linked rows and returns them).
- [x] The calendar shows a grouped slot as **one chip**, not one per student;
      hover and the day modal name every attendee.
      _(`groupDaySessions`/`entryTitle` in `src/utils/sessionGroups.ts`)_
- [x] Editing a grouped class's shared fields (subject, date, time, duration,
      notes) applies to **every linked row** — the group moves as one.
- [x] A single attendee can be cancelled (and restored) without affecting the
      others; **Cancel for everyone** cancels every linked row, behind the
      same are-you-sure confirmation. _(Plus "Restore for everyone", and
      membership edits: dropping an attendee cancels their row, adding one
      joins them via `POST /sessions/{id}/members`.)_
- [x] A cancelled attendee is **never billed** for that class; the others
      still are (REQ-010/REQ-001 semantics per row).
- [x] Dashboard week-load hours count a group hour **once**, not once per
      attendee. _(`getWeekLoad` counts entries, not rows; the upcoming list
      folds groups the same way.)_
- [x] Seed includes a weekly group class in every environment, so the state
      is visible without booking one by hand. _(`grp-seed-*` Saturday rows.)_
- [x] Frontend coverage stays at 100%; API deploys before the frontend.
      _(Thresholds are 90% since REQ-029/PR #51; the suite sits at ~98.5%.)_

**Notes**

- A solo class simply has no `groupId` — nothing changes for existing data,
  and older records keep working.
- Changing a group's *membership* is cancel-a-row / book-again, not an edit —
  same reasoning as REQ-010's "cancel + rebook" for moving a class.
- Named, reusable groups ("Year 8 Physics circle") would be a separate story
  on top of this model if ever wanted.

## REQ-012 — Class planner: subject is a multi-select

**Status:** ✅ Done (shipped with the planner UX pack; reconciled 2026-08-02) · **Impact:** frontend · **Effort:** S

> **Deviations from the 2026-07-17 decisions**, made deliberately in the
> implementation: the dropdown offers the **picked students' registered
> subjects** (their union), not the whole roster's, and **freeSolo was
> dropped** — a class can only be tagged with subjects its attendees are
> registered for, so a picked subject can never be one they don't take.
> Consequently there is no auto-seeding of the first student's subject;
> the field simply unlocks once a student is picked. New subjects are added
> on the student, not typed ad hoc into a class.

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

- [x] The planner's Subject field is a chip-based multi-select ~~with the
      roster's distinct subjects as its dropdown options~~ — offering the
      **picked students' subjects** instead (see deviation note above).
- [x] ~~A typed subject not in the list can still be committed (freeSolo).~~
      Dropped (deviation note): subjects are constrained to what the
      attendees are registered for; removing a student prunes any chip
      they alone justified.
- [x] ~~Picking the first student still seeds their first subject~~ Dropped
      with freeSolo: the Subject field unlocks on the first student pick
      and offers exactly their subjects — no silent seeding.
- [x] Editing a class splits its stored subject string back into chips;
      saving joins them again. _(`splitSubjects` / `subjects.join(', ')` —
      the wire format stays one string, as decided.)_
- [x] Booking is blocked while no subject chip is committed. _(REQ-029
      required-field error: "Pick at least one subject".)_
- [x] Frontend coverage stays at 100%. _(Thresholds are 90% since PR #51;
      the suite sits at ~98.5%.)_

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

**Status:** ✅ Done (2026-07-25) · **Impact:** both · **Effort:** M · **Blocked by:** REQ-009 (durable store — landed first) · **Delivered:** public `/enquire` route (`EnquireView`) with name, contact (email or phone — at least one, format-checked), child's year, subject multi-select, goal and preferred mode; REQ-029 validation conventions; honeypot; a thanks card on success. `POST /leads` public, validated server-side; the Offerings/Home "Book a free assessment" CTAs now target it.

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

**Status:** ✅ Done (2026-07-25) · **Impact:** both · **Effort:** M · **Blocked by:** REQ-018 · **Delivered:** teacher-only `/leads` (`LeadsView`) — newest first, status pills New · Contacted · Converted with working transitions; "Convert to student" marks the lead Converted and opens the add-student form pre-filled via router state (goal + email fold into notes); the dashboard hero shows an open-enquiries pill linking to the inbox. `GET/PUT /leads` teacher-gated.

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

**Status:** 🚧 In review (PRs raised 2026-08-02: frontend #64, backend #50) ·
**Impact:** both · **Effort:** M · **Depends on:** REQ-008 (content, done),
REQ-009 (store, done) · **Delivered:** a record strip on the public Home
with two tiles: a teacher-stated "20+ years of tutoring experience"
(owner-entered via the site editor's Hero section — `hero.experienceYears`,
sanitised 1–99 on write; blank hides it) and the approved-review star
rating, averaged in the browser from the reviews the page already loads
(REQ-027) — no new endpoint. ⚠️ If a published site-content document
already exists, the experience field is absent from it — set it in the
editor and publish once to show the tile. _(The app-data tallies — students
taught, classes delivered, hours, average progress — were first built as a
public `GET /outcomes`, then **dropped by the owner 2026-08-02**: the
numbers didn't sell the service, and average progress invites misreading.
The endpoint went with them; the PR history keeps the code if a future
story wants tallies back.)_

**Story**
As a parent, I want to see testimonials and real outcomes, so that I trust this
tutor with my child.

**Acceptance criteria**

- [x] ~~Testimonials section: quote, attribution (name / relation), optional
      result.~~ Superseded by REQ-027 (families submit, teacher moderates) —
      see the split note below.
- [x] An outcomes strip: e.g. students taught, sessions delivered, average
      progress — sourced from real app data where possible, not invented.
      _(Delivered as the record strip — stated experience + review rating.
      The app-data tallies were built and then dropped by the owner; see the
      status note.)_
- [x] ~~Testimonial content is teacher-editable via REQ-008; nothing
      hardcoded.~~ Owned by REQ-027's moderation flow.
- [x] Frontend coverage stays 100%. _(Thresholds are 90% since PR #51; the
      suite sits at ~98.6% with the strip's tests in.)_

**Notes**

- ⚠️ **Testimonials must be real and used with permission** — publishing invented
  reviews would mislead prospective families (same caveat noted on REQ-008).
- **Split:** the *testimonial* half of this story is superseded by **REQ-027**,
  which lets families submit their own reviews for teacher moderation (a stronger
  source of real, permissioned testimonials than teacher-typed copy). What remains
  here is the **outcomes strip** (students taught / sessions / average progress
  from live data). Keep this story for that; REQ-027 owns the testimonial cards.

## REQ-021 — Tutor bio and safeguarding

**Status:** 🚧 Built (2026-08-02, in review) · **Impact:** both · **Effort:** S · **Depends on:** REQ-008 (content, done) · **Delivered:** a `bio` site-content section (heading, Markdown body, qualification pills, DBS badge, safeguarding line) — editable in the site editor, rendered on Offerings in the teacher-chosen order. **Ships empty**: the public section hides until the owner writes it, and the DBS badge only ever appears when the owner ticks it — nothing is invented on their behalf. The optional photo from the criteria is deferred (no asset storage yet). ⚠️ Owner action: fill the Bio section in the site editor and publish.

**Story**
As a parent, I want a tutor bio with credentials and safeguarding information,
so that I feel safe choosing this service.

**Acceptance criteria**

- [ ] Bio section: who the tutor is, qualifications, experience, optional photo.
- [ ] A DBS-checked indicator and a short safeguarding statement.
- [ ] Content is teacher-editable via REQ-008.
- [ ] Frontend coverage stays 100%.

## REQ-022 — Transparent pricing

**Status:** 🚧 Unparked 2026-08-04 (owner set the anchor) · **Impact:**
both · **Effort:** S · **Pattern:** the FAQ page (own menu, edited in
place)

**Story**
As a parent, I want to see pricing up front, so that I can decide whether to
enquire without having to ask.

**Owner's facts** _(2026-08-04)_: pricing must be CLEAR to parents; it
varies by criteria; it **generally starts from £20 per hour, per
student**.

**Decisions**

- **Own public page** (`/pricing`, own menu item) — the FAQ-page pattern:
  public rendering + the teacher editing IN PLACE with one Publish.
- **Honest shape**: a big from-price (£/hour · per student), the *named*
  factors that shape the exact rate (level, one-to-one vs small group,
  online vs in person — named, not fake-quantified), and a note that the
  exact rate is agreed at the free assessment. No invented price tables.
- **The from-price also joins the Home band's trust chips** ("From
  £20/hr") — price clarity is a selling point.
- Older published documents normalise to a **hidden** pricing page body
  (no from-price → "not published yet") — never-invent, as ever.

**Acceptance criteria**

- [ ] Public `/pricing` + menu + sitemap: from-price hero, factor list,
      the free-assessment note, enquiry CTA.
- [ ] All of it published content: number + rows + note editable on the
      page; site editor keeps a pointer card; publishes pass pricing
      through untouched.
- [ ] Home band shows "From £N/hr" only when published.
- [ ] API sanitises (whole pounds, sane cap) and validates; older
      documents normalise empty on both sides.
- [ ] Coverage holds in both repos.

**Notes**

- The fee types (per-session / monthly / none) already exist in the model, so the
  public pricing language and the billing behaviour stay consistent.

## REQ-023 — Public pages are discoverable (SEO / OG)

**Status:** ✅ Done (first cut, 2026-07-24) · **Impact:** frontend (+ infra if prerendered) · **Effort:** M · **Delivered:** static title/description/OG/Twitter tags in index.html (seen by crawlers that skip JS), per-route titles + descriptions via `useDocumentMeta` on Home/Offerings/Reviews/Contact, `sitemap.xml` + `robots.txt` (teacher routes disallowed). **Deferred:** build-time prerender of per-route tags — an SWA/infra job; today non-JS crawlers see the site-wide defaults on every route.

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

**Status:** ✅ Done (2026-07-24) · **Impact:** frontend · **Effort:** M · **Relates to:** REQ-003 · **Delivered:** `HomeView`/`HomeLanding` — a signed-out visitor at the root gets the marketing landing (hero + availability, proof strip of approved reviews, how-it-works journey, CTAs to Contact/Offerings/Reviews) with teacher sign-in as a quiet afterline; it replaced the thinner `SignInView`. A signed-in teacher (and auth-less local dev) still lands on the dashboard at the same path — no `/app` move was needed, since `RequireTeacher` already splits the root by auth.

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

**Status:** 🚧 Built (2026-08-02, in review) · **Impact:** both · **Effort:** S · **Depends on:** REQ-008 (content, done) · **Delivered:** a `faq` site-content section — question/answer rows in the site editor (add, remove, drag to reorder), rendered on Offerings as a native details/summary accordion closing on the enquiry CTA. **Moved 2026-08-04 (owner call): the FAQ now lives on its own public page (`/faq`, own menu item) and is edited IN PLACE there — the site editor keeps only a pointer card, and Offerings no longer renders the section.** A drafted starter set ships in the bundled defaults and behind an "Add the starter questions" button for the owner to review and edit; **an already-published document gains an empty FAQ**, so nothing unapproved ever goes live. _(Owner asked whether the FAQ could be a chatbot (2026-08-02): decided accordion-first — a grounded "ask a question" box that answers only from published content could be a separate later story; a freeform public chatbot was advised against.)_

**Story**
As a parent, I want an FAQ, so that the usual questions are answered before I
have to ask them.

**Acceptance criteria**

- [ ] An accordion FAQ on the public pages, content-driven (teacher-editable via
      REQ-008).
- [ ] Each answer can link to the enquiry CTA.
- [ ] Frontend coverage stays 100%.

## REQ-026 — Refer a family

**Status:** ❌ Dropped (2026-08-02) — owner call: not needed. Word of mouth
already flows through the existing contact channels; revisit only if
enquiry volume makes attribution worth tracking. · **Impact:** both ·
**Effort:** S · **Blocked by:** REQ-009 (store)

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

**Status:** ✅ Done (frontend flag display shipped with REQ-027; backend profanity screen merged 2026-07-24) · **Impact:** both · **Effort:** S · **Blocked by:** REQ-027 (done)

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

**Status:** ✅ Done · **Impact:** frontend · **Effort:** M · **Delivered:** frontend PR #51 (shared `requiredFieldProps`, applied to the student, class and review forms) + a follow-up adding email/phone **format** validation to the contact editor (its two fields are optional by design, so they get format errors, never required markers). Note: PR #51 also moved the coverage thresholds from 100% to 90%.

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

## REQ-030 — Privacy policy and GDPR compliance

**Status:** ✅ Done (2026-07-31) — **epic**, split 2026-07-28 into
[REQ-031](#req-031--public-privacy-policy-page-and-point-of-collection-notices)
(policy page + notices),
[REQ-032](#req-032--erasure-works-end-to-end-delete-an-enquiry) (erasure),
[REQ-033](#req-033--retention-schedule-and-purge-routine) (retention) and
[REQ-034](#req-034--privacy-operations-records-ropa-breach-plan-ico-fee)
(operational records). The acceptance criteria below are the epic's
definition of done; each sub-story carries its slice — **all four have now
shipped.** ⚠️ What remains is not code: the owner must confirm the ICO fee
position ([ROPA §8](./PRIVACY-ROPA.md)), sign off the retention values marked
_(default)_, set the quarterly purge reminder, and settle the payment-history
conflict in [PRIVACY-RETENTION.md §4](./PRIVACY-RETENTION.md). ·
**Impact:** both + docs/ops · **Effort:** M · **Depends on:** — (unblocked)

**Story**
As the teacher (the data controller), I want a clear public privacy policy and
the working practices behind it, so that families know exactly what happens to
the details they hand over — and so the business can answer a GDPR/UK-GDPR
challenge with evidence, not improvisation.

**What we actually process** (the policy must describe *this app*, not a template):

| Data | Where it enters | Lawful basis (proposed) |
| --- | --- | --- |
| Student records — name, DOB, school, year, progress, notes, **home address** | Teacher adds/edits students | Contract (delivering tuition) |
| Parent name + phone (per student) | Same | Contract |
| Enquiries — parent name, email, phone, child's year, goal | Public `/enquire` form | Legitimate interest (responding), then contract |
| Reviews — name, quote, context, rating | Public `/reviews` form | Consent (freely submitted for publication) |
| Payment records per student | Teacher records payments | Contract / legal obligation (accounts) |
| Teacher sign-in | Microsoft Entra ID | Legitimate interest (securing the portal) |

⚠️ **Most of the student data is children's data.** It is supplied *by parents*,
not collected from children directly — the policy must say so plainly, and the
tone/clarity bar is higher (UK GDPR expects notices children's parents can
actually read).

**Acceptance criteria**

- [x] A public **`/privacy` page**, linked from the footer of every public page
      and from the portal, written in plain English: who the controller is, what
      is collected (the table above), why, the lawful basis for each purpose,
      how long it is kept, who it is shared with, and how to exercise rights.
      → REQ-031, `PrivacyView.tsx`.
- [x] **Point-of-collection notices:** the `/enquire` and `/reviews` submit
      buttons carry a one-line notice linking to the policy ("We use these
      details to reply to you — privacy policy"). No pre-ticked boxes; the
      review form's notice states the review is for publication.
      → REQ-031.
- [x] **Data minimisation pass:** review every stored field against need —
      e.g. does the roster genuinely need the child's full home address and
      DOB, or would year-group and an area suffice? Drop or justify each.
      → [ROPA §2.2](./PRIVACY-ROPA.md) — every field justified, with three
      ⚠️ challenges recorded rather than waved through: **DOB** (school year
      already conveys age), **home address** (needed for face-to-face
      students, not online-only ones), and the **student name denormalised
      onto every payment row**. Owner decisions; each is minimisation debt,
      not a blocker.
- [x] **Rights handling:** a documented route (the contact page) for access,
      correction, deletion, portability and objection requests, answered within
      one month. **Erasure must actually work end-to-end:** deleting a student
      removes their classes and payment rows too (archive is *not* erasure),
      and enquiries/reviews can be deleted on request — today leads have no
      delete at all (only status updates), so a small backend piece is needed.
      → REQ-032 shipped `DELETE /api/leads/{id}`; all three erasure paths are
      listed in [ROPA §3.1](./PRIVACY-ROPA.md).
- [x] **Retention schedule**, stated in the policy and honoured in practice:
      how long alumni records, closed enquiries and payment history are kept
      (payment records typically 6 years for HMRC; the rest much shorter), and
      a periodic purge — documented as a manual routine at minimum.
      → REQ-033, [`PRIVACY-RETENTION.md`](./PRIVACY-RETENTION.md).
- [x] **Security statement** backed by what's true: HTTPS everywhere, Entra
      sign-in on every teacher endpoint (REQ-003/004), Azure Table Storage
      encryption at rest, data held in the **UK South** region, access limited
      to the teacher.
      → [ROPA §3.1](./PRIVACY-ROPA.md), which also states what is **not**
      true: no independent or off-site backups beyond the monthly dumps.
- [x] **Processor list** in the policy and a record of each DPA: Microsoft
      Azure (hosting + storage) and Microsoft Entra (sign-in) under Microsoft's
      standard Data Protection Addendum; GitHub (code, no personal data). No
      analytics or email providers exist today — the policy says so, and adding
      one later means updating this list *first*.
      → [ROPA §3](./PRIVACY-ROPA.md), with the "no new processor without
      paperwork first" rule now also a review step in `CONTRIBUTING.md`.
- [x] **Cookie/tracker audit, written down:** the app sets no analytics or
      marketing trackers; MSAL's token storage is strictly necessary for
      sign-in. Conclusion: **no consent banner is required** — and the policy
      commits to adding consent *before* any non-essential tracker ever ships.
      → REQ-031's Cookies section; [ROPA §2.3](./PRIVACY-ROPA.md) records the
      absence as a deliberate position.
- [x] **Records of processing (Art. 30):** a short `docs/PRIVACY-ROPA.md`
      (or equivalent) recording purposes, categories, recipients, retention and
      security measures — kept current as stories add data.
      → REQ-034.
- [x] **Breach plan:** a documented procedure — contain, assess, notify the
      ICO within 72 hours where required, inform affected families where the
      risk is high — with the ICO contact details written down *before* they
      are ever needed.
      → [ROPA §4](./PRIVACY-ROPA.md), plus the §7 breach log.
- [ ] Owner action (not code): confirm whether the **ICO data protection fee**
      applies and register if so.
      → ⚠️ **Still open.** [ROPA §8](./PRIVACY-ROPA.md) has the
      self-assessment link and the blanks to fill in.

**Notes**

- ⚠️ The original checklist for this story missed four things this app makes
  acute: **children's data** (the tone and DPIA question below), a **retention
  schedule**, a **breach-notification plan**, and the **ICO fee**. It also
  listed cookie consent — which this app resolves by *having no non-essential
  cookies*, a cheaper and stronger position than a banner.
- ✅ **Answered (2026-07-31): no DPIA required.** The screening and its
  reasoning are written down and dated in [ROPA §5](./PRIVACY-ROPA.md) — not
  large scale, no profiling, no special-category data, no sharing — together
  with explicit **review triggers** that would force a re-screen.
- ✅ **Answered: bundled.** The policy ships as `PrivacyView.tsx`, not through
  REQ-008's editor — legal text changes deliberately, via review.
- The `/enquire` form already stores the goal free-text; the policy should warn
  against putting sensitive details (health, SEN) in it, or the minimisation
  pass should add guidance text to the field itself.
- UK framing throughout (UK GDPR + ICO): the site is UK-facing — KS3/GCSE, £,
  UK South hosting. EU visitors are incidental; the same controls cover them.

## REQ-031 — Public privacy policy page and point-of-collection notices

**Status:** ✅ Done — shipped in frontend PR #59 (merged 2026-07-28). The
retention section was made concrete on 2026-07-31 by REQ-033. ·
**Impact:** frontend · **Effort:** S ·
**Depends on:** — (first slice of the REQ-030 epic)

**Story**
As a parent handing over my family's details — mine and my child's — I want to
read, before I submit anything, what this site collects and why, so that I can
trust it with an enquiry; and as the teacher I want that page to exist so a
GDPR question has a written answer to point at.

**Acceptance criteria**

- [ ] A public **`/privacy` route** (no auth), linked from the sidebar's
      External group and reachable signed out, with `useDocumentMeta` title
      and description like the other public pages.
- [ ] The content is the **app-specific policy**: controller identity, the
      data inventory table from REQ-030 (students incl. children's data
      supplied by parents, enquiries, reviews, payments, teacher sign-in),
      lawful basis per purpose, retention summary, processor list (Microsoft
      Azure / Entra; no analytics), rights and how to exercise them via the
      Contact page, and the ICO as the complaints route.
- [ ] **Cookie statement:** no analytics or marketing trackers; MSAL sign-in
      storage is strictly necessary; consent will be added before any
      non-essential tracker ever ships. No consent banner.
- [ ] **Point-of-collection notices:** one line beside the submit button on
      `/enquire` ("We use these details to reply about tutoring — see our
      privacy policy") and `/reviews` (adds: reviews are published once
      approved), each linking to `/privacy`.
- [ ] The enquiry goal field gains helper text steering families away from
      sensitive details (health, SEN) — the cheap half of data minimisation.
- [ ] **Enrolment practice — reaching the parents who never browse the
      site:** most student data (roster, DOB, address, notes) is given to the
      teacher offline and typed in by them, so the notice must travel with
      onboarding, not wait to be found. The teacher's welcome message to a
      new family includes the `/privacy` link as standard practice
      (documented in REQ-034's records), and the leads inbox's **Convert
      flow shows a one-line reminder** of it — a nudge in the UI at exactly
      the enrolment moment, never a blocker.
- [ ] Policy text ships **bundled** (a content module like
      `data/privacyPolicy.ts`), not through the site editor — legal text
      changes deliberately, via review.
- [ ] Plain-English register throughout — readable by the parents it covers.

**Notes**

- Two collection routes, two duties: details a parent types into the public
  forms are covered by the on-page notices at the moment of collection;
  details the teacher records *about* a family (the larger share) still
  require the parent to be informed — that is what the enrolment-practice
  criterion exists for. A public policy page nobody is pointed at would not
  discharge it.
- Keep the page walkable in one screen-read: headings per section, short
  paragraphs, the data table, no legalese padding.
- The policy must not claim anything untrue about the build (e.g. don't claim
  "encrypted backups" unless they exist) — REQ-034's records must match it.

## REQ-032 — Erasure works end-to-end: delete an enquiry

**Status:** ✅ Done — shipped in frontend PR #59 and backend PR #48 (merged
2026-07-28). · **Impact:** both · **Effort:** S ·
**Depends on:** — (unblocked)

**Story**
As the teacher, when a parent asks to be forgotten — or an enquiry is spam — I
want to delete their enquiry outright from the Leads inbox, so that the
"deletion on request" promise in the privacy policy is one I can actually keep.

**Acceptance criteria**

- [ ] **API:** `DELETE /api/leads/{id}` — teacher-only, mirroring
      `DELETE /testimonials/{id}`: `deleteLead` on the `DataStore` interface,
      both adapters (memory filter; table `deleteEntity`, idempotent on 404),
      service returns false → 404 for an unknown id, OpenAPI documented.
- [ ] **Inbox UI:** a Delete action on each lead card behind a confirm (the
      testimonial moderation pattern), removing the card and toasting.
- [ ] **Student cascade verified:** `DELETE /students/{id}` already erases
      the student with their sessions and settlements — cover the cascade
      with a service test and reference it from the policy/ROPA rather than
      rebuilding it.
- [ ] Review deletion (already shipped, REQ-027) is referenced as the third
      erasure path; nothing new to build.
- [ ] Frontend + backend tests for the new path; coverage thresholds hold.

**Notes**

- Deleting is distinct from Converted/closed **status** — a status keeps the
  record; erasure removes it. The inbox should make that difference obvious
  (destructive styling + confirm copy).
- Bulk purge (old leads past retention) belongs to REQ-033, not here — this
  story is the per-request path.

## REQ-033 — Retention schedule and purge routine

**Status:** ✅ Done (2026-07-31) — delivered as
[`docs/PRIVACY-RETENTION.md`](./PRIVACY-RETENTION.md), with the schedule
mirrored into the public policy page. ⚠️ The values marked _(default)_ in it
still need the owner's confirmation, and §4 records three gaps the owner must
decide. · **Impact:** docs/ops (+ small backend if
automated) · **Effort:** S · **Depends on:** REQ-032 (the erasure paths it
uses must exist)

**Story**
As the teacher, I want a written retention schedule and a routine that
honours it, so that data leaves the system when its purpose ends — not
whenever someone remembers.

**Acceptance criteria**

- [x] A **schedule** in the policy and ops doc, per category:
      payment/settlement records ~6 years (HMRC); alumni student records N
      months after archiving (owner to set N); closed/converted enquiries N
      months after last touch; published reviews until removed or on request;
      unpublished (rejected) reviews promptly.
      → §1; N = **24 months** alumni, **12 months** enquiries (**6** once
      converted), all marked _(default)_ pending owner sign-off.
- [x] A **purge routine** that applies it — first cut may be a documented
      manual checklist run on a recurring date (calendar reminder), using the
      REQ-032 erasure endpoints; an automated timer function is a follow-up,
      not a requirement.
      → §3, a quarterly checklist (1 Feb / May / Aug / Nov). ⚠️ Owner still
      needs to create the recurring calendar reminder.
- [x] The routine covers **all stores**: live tables and the seeded dev data
      (dev fixtures are invented people, note that in the ROPA and move on).
      → §2. It also caught a store the story missed: the **monthly JSON
      dumps**, which outlive a live erasure by up to 12 months.
- [x] Each purge run is **logged** (date, categories, counts) — the evidence
      a challenge asks for.
      → §5, counts only, so the log never becomes a record of the people it
      erased.

**Notes**

- ❓ Owner decisions needed: the two N values above, and whether alumni
  records deserve a longer "returning student" grace period. The story is
  blocked on nothing technical — the decisions are the work.
- Azure Table Storage has no TTL; automation would be a timer-triggered
  function iterating with date filters. Keep it out of scope until the manual
  routine has run at least once and the values have settled.

## REQ-034 — Privacy operations records: ROPA, breach plan, ICO fee

**Status:** ✅ Done (2026-07-31) — delivered as
[`docs/PRIVACY-ROPA.md`](./PRIVACY-ROPA.md). ⚠️ One owner action is still
open inside it: the ICO data protection fee self-assessment (§8). ·
**Impact:** docs/ops · **Effort:** S ·
**Depends on:** REQ-031 (the records must match what the policy claims)

**Story**
As the data controller, I want the operational paperwork — processing
records, a breach plan, registration — done and versioned, so that a GDPR
challenge is answered by opening a file, not by reconstruction.

**Acceptance criteria**

- [x] **`docs/PRIVACY-ROPA.md`** — Article-30-style record: purposes,
      categories (children's data flagged), recipients/processors (Microsoft
      Azure UK South, Entra ID, GitHub for code only), retention (from
      REQ-033), security measures (HTTPS, Entra auth on teacher endpoints,
      encryption at rest, single-teacher access). Updated whenever a story
      adds or changes personal data — noted as a review step in CONTRIBUTING.
      → §2 (five processing records), §3 (processors + security). The review
      step is now a section in `CONTRIBUTING.md`.
- [x] **Breach plan** in the same doc: contain → assess risk → notify the ICO
      within 72h where required → inform affected families where risk is
      high; the ICO's reporting contact written down now; a named severity
      call ("who decides"— the owner).
      → §4, with the ICO breach line (0303 123 1113) and the report form
      written down before they are needed; §7 is the breach log.
- [x] **DPIA screening note**: children's data, single-tutor scale, the
      reasoning for (almost certainly) not needing a full DPIA — written
      down, dated.
      → §5, dated 2026-07-31, with explicit **review triggers** that would
      force a re-screen (roster past ~100, a second person with access, any
      special-category data, profiling or AI touching student records).
- [ ] **ICO registration**: owner confirms whether the data protection fee
      applies and records the outcome (registration number or the exemption
      reasoning) in the doc.
      → ⚠️ **Owner action, still open.** §8 carries the self-assessment link,
      the likely tier (£52/year) and the blanks to fill in.
- [x] Processor DPAs referenced by link (Microsoft's DPA covers Azure +
      Entra); a rule stated: **no new processor** (analytics, email, backups)
      without adding it here and to the policy first.
      → §3, including the owner's own dump storage as a fourth row.

**Notes**

- This is deliberately a docs story: none of it blocks on code, and it makes
  REQ-031's policy honest — every claim on the public page traces to a line
  here.
- UK framing (ICO, UK GDPR); EU visitors are covered by the same controls.

## REQ-035 — Custom domain for the production app

**Status:** ✅ **Cutover complete — the site is LIVE on
https://abhitutor.co.uk** (2026-08-04 evening). Registered on Cloudflare
that morning (`.co.uk` only — owner call; the `.com` deliberately
skipped, check its availability later if the brand takes off), runbook
executed the same day: www CNAME → backend apply (CORS + Entra redirect
in one list) → frontend apply + apex TXT (validated in ~18 minutes) →
apex CNAME. Both hostnames answer 200 with valid Azure-managed
certificates; the API preflight-accepts the new origin (verified);
`/version.json` confirms prod. The old `*.azurestaticapps.net` URL keeps
working as secondary. **Two follow-throughs, not part of this story's
plumbing:** prod promotion (the domain served pre-rebrand `1.0.86` at
cutover — the merged sitemap/OG/branding go live with it) and the prod
site-editor republish; teacher sign-in on the new domain gets its first
real test right after. · **Impact:** infra + both · **Effort:** S

**Story**
As the owner, I want the production site on a proper domain instead of the
generated `*.azurestaticapps.net` address, so that the site looks
legitimate to parents and is easy to say out loud — at no running cost
beyond the domain itself.

**Chosen name** _(owner, 2026-08-03)_: **`abhitutor.co.uk`** or
**`abhitutor.com`**. Both checked and **unregistered** as of 2026-08-03
(WHOIS "No match", no DNS) — availability is not a reservation, so register
before announcing anything; ideally take both (~£15/yr total) and redirect
one to the other.

**Name research** _(2026-08-03)_

- **"Learn with Abhi" was considered and rejected**: `learnwithabhi.com` is
  an active education site ("LearnWithAbhi — Learn. Build. Grow",
  registered 2025-07) — same name, same sector; trading as Learn with Abhi
  would mean living in their shadow even on a `.co.uk`.
- **"AbhiTutor" is clean**: no site, no search presence. Nearest neighbour
  is "AB Tutor" (abtutor.com, UK classroom-management *software*) —
  different name and product, low risk, noted for awareness.

**The rename** _(agreed 2026-08-03)_ — the brand becomes **"AbhiTutor"**:
one word, capital A and T, exactly matching the domain (never "Abhi
Tutor"). The tagline is **"Where confidence takes off."** everywhere
(owner call 2026-08-03 — replacing "one-to-one tutoring that builds
confidence", and matching the line the sidebar always had).

**Applied 2026-08-03 (in review, uncommitted)** — the owner decoupled the
rename from the domain and had the brand applied immediately: every
"Springboard Tutoring" string renamed in both repos (title/OG tags,
meta defaults, privacy page, Reviews/Enquire copy, bundled site-content
defaults); the **lockup** built as `BrandLogo.tsx` (Alex Brush bundled
~22 KB, brand CSS variables with dark-theme + pale-sidebar overrides) and
mounted in the sidebar (compact, no pen) and the signed-out topbar (full,
with pen); the **badge favicon** generated as `public/badge.svg` with the
Alex Brush "A" traced to a path (favicons can't load fonts) over the navy
disc + sky ring + green tick; `theme-color` now brand sky. Suites green:
499 frontend / 110 backend. Still domain-gated: sitemap/OG URLs and the
site-editor siteName publish (the live published document still says
Springboard Tutoring until the owner republishes).
"Learn with Abhi" may appear only as a small strapline (e.g. in the hero
subhead), never as the brand. Rename and domain cutover happen together,
after the domain is registered. Where each "Springboard Tutoring" goes:

| Surface | Becomes |
|---|---|
| Site name (site editor → headings like "Why families choose …") | AbhiTutor |
| Topbar visitor headline (`TopbarAuth.tsx`, hardcoded) | AbhiTutor |
| Browser tab / OG title (`index.html`, `useDocumentMeta.ts`) | AbhiTutor — Where confidence takes off. |
| Privacy page + collection notices (`PrivacyView.tsx`) | AbhiTutor |
| Bundled content defaults (`data/siteContent.ts`, both repos) | AbhiTutor |
| Sidebar, Enquire, Reviews copy (grep `Springboard`) | AbhiTutor |

**The logo** _(owner-approved 2026-08-03 after eight design rounds; mock-up:
claude.ai/code/artifact/cad8952e-8feb-4ff9-9282-6fe5e67ee4c5)_

- **Wordmark**: "Abhi" in **Alex Brush** (OFL, ~22 KB woff2, bundled — no
  Google request) in the Summer sky (`#0284c7`; `#7dd3fc` on dark) +
  **"Tutor" in Inter 800, white everywhere** (owner call 2026-08-03 — the
  lockup lives on the dark sidebar/topbar bands; the two pale-chrome
  themes swap `--brand-tutor` to their band ink so it never sits
  white-on-pale). The pen's barrel wears Tutor's colour.
- **The mark**: a fountain-pen ink stroke (hairline in → pressured swell →
  fine tail, with a small pool at touch-down) tucked just beneath the
  lettering, in **bright green** (`#22c55e`; `#4ade80` on dark) — the
  teacher's tick under the name.
- **The pen**: a slim fountain pen resting after "Tutor", nib pointing back
  at the word — **green nib + green grip/band/clip**, barrel in ink
  (flips near-white on dark grounds). Ships as one SVG with the mark.
- **The short mark** _(owner-approved 2026-08-03, from ten drafts → three
  finalists → the dark badge)_: a **circular badge** — navy disc
  (`#0b1f33 → #123152` gradient), **sky ring** (`#0284c7`, ~3 px at 92,
  thinning with size), sky-light Alex Brush "A" (`#7dd3fc`), and a
  **solid white T — no border** (owner call 2026-08-03, superseding the
  earlier bordered-ink pick: "Tutor is white everywhere, and the logo
  won't need the white border"), with the green tick + nib beneath.
  Scale behaviour: full badge
  at ≥48 px; at 32 px the tick shrinks; **at 16 px the
  badge reduces to the sky "A" alone**. On dark grounds the badge adds a
  faint sky outer glow to separate.
- **Favicon**: the badge, per the scale behaviour above (16 px = sky "A"
  in the ringed disc).
- Rejected on the way (recorded so it isn't relitigated): mortarboard/tile
  concepts (round 1–3), gold ink (round 6 — replaced by green), grafted or
  restyled "b" (rounds 5–6), Satisfy/Yellowtail/Sacramento/Norican/Style
  Script/Grand Hotel (rounds 7–8 — Alex Brush won the rematch), and **Fave
  Script Pro** (commercial, Aerotype — not licensed; do not ship without
  purchase).

**What "free" gets us** _(researched 2026-08-03)_

- Azure Static Web Apps **Free tier includes custom domains (2 per app) with
  free managed TLS certificates** — no plan upgrade, no cert to buy or renew.
- The **only unavoidable cost is the domain registration** (~£5–15/year;
  genuinely free registrars are gone). Keep DNS at the registrar or on
  Cloudflare's free tier — Azure DNS is not required.
- `www.<domain>` is a plain CNAME to the SWA hostname; the apex (naked)
  domain needs a registrar that supports ALIAS/ANAME/CNAME-flattening, or
  TXT validation + the registrar's redirect to `www`.

**Acceptance criteria**

- [x] Prod answers on the custom domain with a valid managed certificate;
      the `*.azurestaticapps.net` host redirects or is treated as secondary.
      _(Live 2026-08-04: apex + www both 200 with valid certs; the old
      host stays as secondary.)_
- [x] Entra sign-in still works: the SPA app registration gains the new
      redirect URI (REQ-004) — teacher sign-in tested on the new domain.
      _(Redirect URI applied via Terraform — derived from the CORS list.
      ⚠️ The live sign-in test happens right after prod promotion.)_
- [x] The API accepts the new origin: Function App CORS updated in
      Terraform, not by hand in the portal. _(Preflight verified:
      `Access-Control-Allow-Origin: https://abhitutor.co.uk`.)_
- [x] SEO artifacts follow the domain (REQ-023): canonical/OG URLs,
      `sitemap.xml` and `robots.txt` name the custom domain. _(Merged;
      serves live with the next prod promotion. Deviation: `og:url` on
      the root, no per-route `rel=canonical` — a root canonical on an SPA
      would mislabel deep routes.)_
- [x] ~~The privacy policy/ROPA name the new domain where they reference
      the site~~ — checked: neither document cites a URL; nothing to
      change.
- [x] Terraform holds the custom-domain resource, so the binding is
      reproducible — nothing click-configured. _(Module `custom_domain`
      var; only prod sets it. The two DNS records live in Cloudflare —
      recorded in RUNBOOK-domain-cutover.md.)_
- [x] The public branding matches the domain: the site name (site editor),
      topbar and meta/OG tags say AbhiTutor, not Springboard Tutoring —
      or the owner has explicitly decided they differ. _(In code since the
      2026-08-03 rebrand; the published-document siteName flips with the
      owner's one-time prod republish.)_

**Notes**

- Do **not** put the dev environment on a custom domain — the generated
  hostname is a feature there (obviously not production).
- Domain choice is the owner's call; UK families read `.co.uk` as local and
  established. Once registered, the cutover is an afternoon.
- If email on the domain is ever wanted (enquiries@…), that's a separate
  paid product (e.g. Zoho free tier / Google Workspace) — out of scope here.

## REQ-036 — "Ask us": a grounded FAQ chat box

**Status:** ⏸️ Parked (owner call, 2026-08-04 — twice considered, twice
parked; revisit if enquiry volume suggests parents aren't finding answers) ·
**Impact:** both · **Effort:** M · **Depends on:** REQ-025 (FAQ, shipped)

**Story**
As a parent, I want to ask a question in my own words and get an answer
drawn from what the site already says, so that I don't have to hunt
through the FAQ — and as the owner, I want it incapable of inventing
policies, prices or promises on my behalf.

**The agreed shape (when unparked)**

- The **accordion stays** — SEO-visible, zero-cost, the canonical answers.
  The chat box sits on top of it, never replaces it.
- **Grounded-only**: a new API endpoint calls a small Claude model with the
  published site content (FAQ, subjects, bio, privacy) as its entire
  world. Anything unanswerable from that gets a polite handoff to the
  enquiry CTA — no freeform improvisation, ever.
- **Cost/ops guardrails**: ~£0.003/question at Haiku-class pricing; public
  endpoint needs rate limiting per IP, a monthly spend cap with alerting,
  and the API key as a Function App secret via Terraform.
- **GDPR**: visitor questions transiting an AI provider is a disclosure —
  one line in the privacy policy + ROPA entry (REQ-031/034 kept true).
- Cheaper fallback considered: a no-AI fuzzy matcher over the FAQ
  (search in a chat costume) — free, riskless, ~80% of the value.


## REQ-037 — "About the teacher": a CV-style public page, edited in place

**Status:** 🚧 Built (2026-08-04, owner's real content received and
shipped as the prepared copy behind a load button — nothing appears on an
already-published site until the owner loads + publishes it on the page) ·
**Impact:** both · **Effort:** M · **Builds on:** REQ-021 · **Pattern:**
the FAQ page. Delivered: `/about` + menu + sitemap; CV layout (intro
Markdown, qualification pills, experience/education timelines,
expectations tick-grid, free sections for philosophy/promise, trust row
with the strictly-owner-set DBS badge); edited in place with one Publish;
Offerings drops the bio section; the site editor keeps a pointer.
Deviation: no photo (unchanged from the story's deferral).

**Story**
As a parent, I want a proper "About the teacher" page — who they are, their
qualifications and experience laid out like a well-set CV — so that I can
judge who will be teaching my child. As the teacher, I want to edit that
page on the page itself, the way the FAQ works.

**Shape**

- **Own public menu item + route** (e.g. `/about`), SEO'd and in the
  sitemap. The REQ-021 bio section moves OFF Offerings to this page (same
  move the FAQ made; `bio` stays valid in `sectionOrder`).
- **CV-style layout**, not a wall of text: intro paragraph (Markdown, the
  existing `bio.body`), then structured sections —
  - **Experience**: dated entries (role / place / years / one line).
  - **Education & qualifications**: dated entries; the existing
    `qualifications` pills fold in here.
  - **The trust row**: DBS badge (existing strictly-boolean flag),
    safeguarding statement, experience-years — reused, not duplicated.
- **Model change**: `bio` gains `experience: CvEntry[]` and
  `education: CvEntry[]` (`{ years, title, place?, detail? }`), sanitised
  like every list; older documents normalise to empty lists (same
  never-invent rule as REQ-021 — the page shows only what the owner wrote).
- **Edited in place**: signed-in teacher gets the editor on the page —
  rows with add/remove/drag per section + one Publish, exactly the FAQ
  page's mechanics. The site editor keeps only a pointer card.

**Acceptance criteria**

- [ ] Public `/about` with menu item; renders only owner-written content;
      empty sections hide; DBS badge remains strictly owner-set.
- [ ] CV entries read in reverse-chronological order, dates styled quietly.
- [ ] Teacher edits and publishes on the page; site editor points here.
- [ ] Offerings no longer renders the bio section.
- [ ] Older published documents normalise (frontend + API) with empty
      CV lists; sitemap + per-route meta updated; coverage holds.

## REQ-038 — Hero highlights: the selling points that close

**Status:** ✅ Built (2026-08-06) · **Impact:** both · **Effort:** S

**How the decisions landed** _(2026-08-06)_: (1) the overlapping progress /
communication items merged into "Clear communication with parents" +
"Regular progress reports"; the approach list (Offerings-only) is untouched
— no claim repeats on a page. (2) "Proven results" links to /reviews, its
evidence. (3) "Personalised". (4) Placement settled (owner calls,
2026-08-06) as **a "Why AbhiTutor" card sitting 50/50 with the journey
card** — the hero's rating record (5.0 + distribution meter) and the
parent lead quote were both retired the same day; the trust chips' ★
average carries the number and the Reviews page owns the quotes.
Content-driven: `highlights: string[]` on the document (both repos,
sanitised + validated, prepared defaults owner-approved by provision),
icons keyword-matched.

**Story**
As a parent skimming the first screen, I want the handful of reasons this
tutor fits my child — visible without scrolling — so the Hero sells harder
than headline + subhead alone.

**The owner's candidate list** _(2026-08-04)_

Flexible scheduling · Regular progress updates / clear communication with
parents · Regular progress reports · Online convenience · Personalized
learning · Confidence-building approach · Exam and assessment preparation ·
Proven results

**Decisions to make before building** _(recorded so the build is an
afternoon, not a debate)_

1. **Dedupe against the published "approach" list** — "Progress recorded
   every session" and "Parents kept in the loop" already say the
   progress/communication items. One list must own each claim: either these
   highlights REPLACE the approach section on the first screen, or the two
   lists are merged in the editor. Duplicated claims on one page read as
   padding.
2. **The evidence rule**: "Proven results" goes live only when something on
   the site backs it (the reviews' outcomes, or REQ-020-style tallies if
   ever revived). Same honesty bar as the DBS badge — claims are
   owner-set, but load-bearing ones need visible support.
3. **Spelling**: "Personalised" (UK) — the audience is UK parents.
4. **Where**: a compact icon-grid strip directly under the Brand Band's
   trust chips (two rows of four on desktop, 2-up on phones) — punchier
   than more chips, quieter than more cards.

**Shape (once decided)**

- Content-driven like everything public: a `highlights: { icon?, title,
  detail? }[]` list on the document (or the repurposed `approach` list),
  edited where it renders or in the site editor — owner's call at build
  time, given the FAQ-page precedent.
- Icons from a small curated set (calendar, chat, report, laptop, target,
  heart, exam, trophy) matched by keyword, book fallback — the
  subjectIcons pattern.

**Acceptance criteria**

- [ ] The first screen shows the highlight grid without scrolling on a
      laptop and within one swipe on a phone.
- [ ] Every highlight is published content; none are hardcoded; empty list
      hides the strip.
- [ ] No claim appears twice on the page (approach dedupe resolved).
- [ ] "Proven results" (if kept) links to or sits beside its evidence.
- [ ] Coverage holds; the band's layout does not regress at 320px.

## REQ-039 — The teacher door: sign-in behind five taps

**Status:** ✅ Built (2026-08-06) · **Impact:** frontend · **Effort:** XS

**Story**
As the owner, I want "Sign in with Microsoft" hidden from visitors — the
public Home should carry no teacher chrome — revealed only by five quick
taps/clicks on the hero badge (the Android developer-mode pattern).

**How it landed**
- The Home afterline (the only public sign-in affordance — verified) is
  hidden until five taps on the hero BrandBadge, each within 2 seconds of
  the last; a slow tap restarts the count so accidental pokes never open
  it.
- The reveal persists for the browser session (sessionStorage), so
  navigating away and back does not close the door.
- The tap wrapper is `display: contents` — no layout change, no pointer
  cursor, nothing hinting the badge is a control.
- This is UX tidiness, not security: sign-in remains Microsoft-gated;
  discovering the taps grants nothing.

**Acceptance criteria**
- [x] No sign-in chrome anywhere on the public site by default.
- [x] Five quick badge taps reveal the usual quiet afterline (no
      auto-popup of the Microsoft window).
- [x] Reveal survives navigation within the session.
- [x] Works identically in the installed PWA.

## REQ-040 — Security hardening: headers, rate limits, dependency alerts

**Status:** 🔲 Not started · **Impact:** both + infra · **Effort:** S
_(from the improvement review, 2026-08-07)_

**Story**
As the owner, I want the site hardened beyond its defaults, so the public
surface resists abuse and the stack tells me when a dependency turns bad.

**Scope (three independent pieces — ship in any order)**
1. **Security headers** on the Static Web App: `globalHeaders` in
   `staticwebapp.config.json` — Content-Security-Policy, X-Frame-Options
   DENY, X-Content-Type-Options nosniff, Referrer-Policy, HSTS. No code
   changes; verify the teacher portal (MSAL popups) still works under the
   CSP before promoting.
2. **Rate limits** on the anonymous POST endpoints (`/api/reviews`,
   `/api/leads`): the honeypot stops dumb bots, nothing stops a patient
   one from flooding moderation. Cheapest: Cloudflare WAF rate rules —
   the domain already fronts through Cloudflare; zero code.
3. **Dependency alerts**: `dependabot.yml` in both repos plus
   `npm audit --audit-level=high` as a CI step.

**How it landed (2026-08-09)** — three of four pieces shipped: security
headers incl. a CSP tuned for MSAL + the photo data-URIs; Dependabot in
both repos; `npm audit --audit-level=high --omit=dev` gating CI in both
repos (shipped deps strictly; dev-tooling advisories are Dependabot's
job — the esbuild dev-server one is the recorded example). Fixing the
audit findings pulled react-router to v7 (v6 advisory) and patched five
transitive vulnerabilities. The func app gained PR checks (ci.yml) in
the process. **Remaining: the Cloudflare rate rules are the owner's
dashboard action** — Security → WAF → rate limiting rules on
`/api/reviews` and `/api/leads` (e.g. 10 requests/min per IP).

**Acceptance criteria**
- [x] Security headers ship (verify sign-in on dev before promoting
      prod, then securityheaders.com).
- [ ] A scripted 100-request burst to /api/reviews is throttled; a normal
      submitter is not (owner: Cloudflare rate rules).
- [x] Dependabot opens PRs in both repos; CI fails on a high-severity
      audit finding in shipped dependencies.
- [ ] Teacher sign-in and publishing verified under the CSP on dev.

## REQ-041 — Student and payment edits persist via the API

**Status:** ✅ Verified already shipped (2026-08-09) · **Impact:** both ·
**Effort:** —

**Verification, not implementation.** The "known wiring gap" this story
was written against no longer exists: add-student, edit-student, the
diary and payment edits all dispatch saga actions that hit the API.
Proven end-to-end against the real compiled handlers (2026-08-09): a
student added through the modal POSTs, is assigned a server id
(STU-A7WB41 in the run), and survives reload; a £42 payment settlement
persisted and survived reload. The verify skill's stale "known gap" note
is corrected in the same change.

**Story**
As the teacher, when I add or edit a student or correct a payment, I want
that saved to the server — today only class scheduling POSTs; student and
payment edits update Redux alone and silently revert on reload (the known
wiring gap, recorded in the verify skill).

**Shape**
- Wire the existing student endpoints (`POST /api/students`,
  `PUT /api/students/:id`) through sagas from the add/edit forms; add the
  missing payment write path end to end (API + storage + saga).
- Optimistic UI with rollback on failure, matching the scheduling flow.
- The verify skill's "known gap" note is deleted the day this ships.

**Acceptance criteria**
- [ ] Add a student, reload: still there (server-side, not Redux).
- [ ] Edit a payment, reload: the correction and month totals hold.
- [ ] A failed save surfaces a toast and rolls the screen back.
- [ ] Coverage holds in both repos.

## REQ-042 — Keyboard-accessible subject cards

**Status:** ✅ Shipped (2026-08-09) · **Impact:** frontend · **Effort:** XS

**Story**
As a keyboard or switch user on Offerings, I want to flip a subject card
without a mouse — the flip is currently a plain `div onClick` with no
role, no tabIndex, no key handler, so the back face is unreachable.

**Acceptance criteria**
- [ ] Cards are focusable in DOM order and flip on Enter/Space.
- [ ] The flip state is announced (aria-pressed or equivalent).
- [ ] Hover behaviour for mouse users is unchanged.

## REQ-043 — LocalBusiness structured data for search

**Status:** 🚧 Built (2026-08-12) · **Impact:** both · **Effort:** S

**Story**
As the owner, I want Google to understand AbhiTutor as a local tutoring
business — name, area served, and the published review rating — so
results can carry stars and rich details. One JSON-LD block, fed from the
same published content the pages render (never-invent applies: emit only
what is actually published — rating markup only from real reviews).

**How it landed (2026-08-12)** — one JSON-LD block, injected into the head
while the public landing is mounted (the `useDocumentMeta` shape, so the
teacher's screens never carry it) and built by a pure function from the
published document: name, description, subjects taught, price range from
the published rates, and the contact channels the owner has published.
The star average moved into a shared `familyReviewSummary()` that Home's
trust chip and the markup both call, so the two cannot drift.

**Area served became content, not an inference.** Google wants an address
on a LocalBusiness, and the owner teaches from home — so a location is
theirs to disclose, never ours to lift out of the About prose. A new
`areaServed` field (site editor → Site name & hero) publishes both
`areaServed` and a locality-only `PostalAddress`; blank omits both.
⚠️ Owner action: fill "Area served" (e.g. "Leeds") and publish — the
markup is otherwise addressless and won't earn a rich result.

⚠️ **Known limit:** Google treats reviews collected on a business's own
site as self-serving and generally will not show stars from them for
LocalBusiness. The markup is correct and honest either way; the star
snippet may simply not appear.

**Acceptance criteria**
- [x] Google's Rich Results test passes for LocalBusiness _(structurally
      verified against the emitted block: required name + address present,
      absolute url/logo, rating in range; run the live tool once the owner
      has published an area served)_.
- [x] Rating markup appears only when approved reviews exist and matches
      the visible average exactly _(one shared computation)_.
- [x] No hardcoded claims — the block derives from the site document.

## REQ-044 — The installed app degrades gracefully offline

**Status:** 🚧 Built (2026-08-14) · **Impact:** frontend · **Effort:** M

**Story**
As a phone user who installed the app, I want opening it offline to show
the shell and an honest "you're offline" line instead of a blank error —
the manifest-only PWA has no service worker today.

**Cautions (why this is M, not S)**
- A service worker caching the shell must never serve a stale deploy:
  version.json is the freshness signal; cache-bust on it.
- The dev/prod identity split (yellow-ringed icons) must survive caching.

**How it landed (2026-08-14)** — `public/sw.js`, registered as
`/sw.js?v=<appVersion>` so every deploy is a new script URL, installs a new
worker, and names its cache after that build; `activate` deletes every cache
that is not this build's. Navigations are network-first, so online the browser
always gets the freshly deployed `index.html` and its new hashed asset names —
the cache only answers when the network does not. `/version.json` is never
cached: the freshness stamp must come from the server.

**Runtime caching alone was not enough.** On a first visit the page loads
before the worker controls it, so its own script and stylesheet requests never
pass through the worker — a visitor who arrived once and then lost signal got a
genuinely blank page (observed in Chrome). A small vite plugin now emits
`precache.json` listing the entry JS/CSS and the worker `addAll`s it on
install, so ONE online visit is enough for every route. Images and fonts stay
on-demand: they degrade to a missing picture, not a blank screen.

**`navigator.onLine` could not carry the offline notice.** After a launch
served entirely from the cache, Chrome reports `onLine === true` — the page
never touched the network, so nothing told it the network was gone, and the
notice stayed hidden in exactly the scenario this story is about. The notice
probes `/version.json` instead: any response proves the origin is reachable,
only a rejected request means offline.

⚠️ **Known limit:** the visitor pages render from the BUNDLED default content
when the API is unreachable (`fetchSiteContentFailed` has always fallen back
that way), so an offline visitor may see older copy than the owner has
published, presented as if current. The notice says "the last version saved to
your device" for that reason. The enquiry form is also fully interactive
offline and only fails on Send — nothing queues it.

**Acceptance criteria**
- [x] Offline launch renders the shell + offline notice, no white screen
      _(verified in Chrome: fresh profile, one page load, then offline —
      `/`, `/about`, `/reviews`, `/pricing` all paint with the notice)_.
- [x] Deploys reach clients within one reload once back online _(a persistent
      profile on 1.0.44 moved to `sw.js?v=1.0.45`, cache
      `abhitutor-shell-1.0.45`, new hashed bundle, old cache purged — in one
      load)_.
- [x] Lighthouse PWA audit passes; dev/prod icons stay distinct _(Lighthouse
      dropped its PWA category in v12, so the criteria were checked directly:
      secure context, an activated worker controlling the page with a fetch
      handler, and a manifest with name/short_name/start_url/standalone and
      192/512/maskable icons. `beforeinstallprompt` does not fire under
      automation, so no install prompt was observed. Applying the deploy's
      dev rewrite to a build gives "AbhiTutor (dev)", `/icons-dev/icon-192.png`
      and `/badge-dev.svg` — the worker caches whatever the origin serves and
      never names an icon, so the yellow ring survives caching)_.

## REQ-045 — Default-content drift check between the repos

**Status:** 🚧 Built (2026-08-12) · **Impact:** both · **Effort:** S

**Story**
As the maintainers, we want the mirrored `defaultSiteContent` in the two
repos to be provably in sync — the emoji copy drifted on 2026-08-06 and
cost a debugging session; today the mirror is discipline, not structure.

**Shape (pick at build time)**
- Either a CI job in each repo that renders both defaults to JSON and
  fails on any difference, or a single checked-in JSON both repos import.

**How it landed (2026-08-12)** — the check found real drift the moment it
ran, which is the argument for it: the backend still said "share the
**hour**" after the 2026-08-09 per-session call, and its services list was
the older nine-line version, missing "GCSE, IGCSE & A-Level Preparation"
and "University Entrance & Scholarship Coaching". The backend defaults
were brought up to the frontend's copy as part of this story.

The gate is two halves, because drift has two shapes:
1. **A unit test in each repo** renders its own `defaultSiteContent` to a
   checked-in `site-content.default.json` (vitest `toMatchFileSnapshot`;
   regenerate with `npx vitest -u`). Keys are sorted so layout can never
   masquerade as drift, while array order — the order families read — is
   preserved. This catches editing the TS without updating the snapshot.
2. **A `content-drift` CI job in each repo** fetches the other repo's
   snapshot and diffs the two files, catching the case where someone
   updates one repo properly and the other never hears about it.

⚠️ Owner action: the repos are private, so the cross-repo read needs a
`CONTENT_DRIFT_TOKEN` secret in both (a fine-grained PAT, read-only
Contents on both repos). Until it is set the job prints a loud warning
and passes rather than blocking every PR — so half the gate is live now
and half is one secret away.

**Acceptance criteria**
- [x] An intentional one-character drift fails CI in whichever repo
      changes second _(verified both ways: an un-regenerated TS edit fails
      the unit test; a regenerated one fails the cross-repo diff)_.
- [x] The check covers every shared field, not a hand-kept list _(the
      whole document is rendered, so a new field is covered the day it is
      added)_.

## REQ-046 — One edited-in-place hook for About, FAQ and Pricing

**Status:** 🚧 Built (2026-08-14) · **Impact:** frontend · **Effort:** M

**Story**
As the next person adding an editable page, I want the edited-in-place
machinery — adopt-until-edited draft, canonicalised dirty check, publish
assembly — in one `useDraftSection` hook. It is currently hand-rolled
three times, and the 2026-08-06 Publish-always-lit bug had to be fixed in
all three places.

**How it landed (2026-08-14)** — `useDraftSection({ source, toDraft,
assemble })` returns `{ draft, edit, assembled, dirty }`, and the three
pages kept their own row shapes: About passes its `AboutDraft`, FAQ its
keyed rows, Pricing a new `{ rates, factors, note }` draft that replaced
three separate `useState` slices. Pricing's form reads as it did — small
per-slice setters wrap `edit`, so the twelve `touch(); setX(...)` pairs
became plain `setX(...)`.

Two details the hand-rolled copies had each solved separately, now solved
once: the published side goes through the SAME `assemble` before the
comparison (the API's key order is not ours), and the adopt effect keys
only off `source`/`edited` — `toDraft`/`assemble` ride in a ref, so a page
passing inline functions cannot spin a re-render loop.

The hook is tested directly as well as through the pages: it is now one
regression away from breaking three of them at once.

**Acceptance criteria**
- [x] About, FAQ and Pricing all consume the shared hook; behaviour is
      pixel-identical (existing suites pass unchanged — no test file was
      touched, 568 green).
- [x] The canonicalised dirty comparison lives in exactly one place.
- [x] A new editable page needs only its assemble/toDraft pair.

## REQ-047 — Split the stylesheet and route monoliths

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** S

**Story**
As the maintainers, we want `_components.scss` (4,800+ lines) split into
per-feature partials and `ROUTE.tsx` (900+ lines) split into per-page
connected components — pure moves, no rule or behaviour changes, so
finding code stops being scroll-archaeology.

**Acceptance criteria**
- [ ] No visual diff (spot screenshots) and no test changes needed.
- [ ] Each partial/page file owns one feature area; imports stay ordered
      so the cascade is unchanged.
- [ ] The build output is byte-comparable ignoring hashes.

## REQ-049 — The visitors' phone tab bar

**Status:** ✅ Built (2026-08-10) · **Impact:** both · **Effort:** M

**Story**
As a phone visitor, I want the site's key pages visible without knowing
the hamburger convention — parents weren't discovering Pricing/Reviews/
FAQ behind the bare icon.

**How it landed** — the owner chose Option C from three mocked design
candidates (labelled hamburger / flat tab bar / raised-spotlight bar):
- A fixed bottom bar on phones, visitors only: three flat slots, one
  **raised spotlight** (brand green→sky, ringed in the page ground),
  then Menu — which opens the existing drawer. The visitor's top
  hamburger retired; the teacher keeps drawer + hamburger (eleven work
  screens don't fit tabs).
- **Owner-configurable** (the ask): `mobileNav { items[≤3], spotlight }`
  on the site document — page keys from home/offerings/pricing/enquire/
  about/reviews/faq/contact, edited in the site editor's "Phone tab
  bar" card. Unknown keys drop on write; contact hides itself while no
  contact details are published. Defaults: home·offerings·pricing,
  spotlight enquire.
- Safe-area padded (`viewport-fit=cover` + `env(safe-area-inset-bottom)`);
  the layout pads under the bar; active tab follows the route.

**Acceptance criteria**
- [x] Visitors on phones see the bar on every public page; teacher never
      does; desktop never does.
- [x] Menu tab opens the drawer; the visitor hamburger is gone.
- [x] Bar contents/order/spotlight follow the published document.
- [x] Verified in a real phone-sized browser: tabs, active state,
      drawer, config, contact gating.

## REQ-050 — Frontend toolchain migration: React 19, Vite 8, TS 6+, hooks lint

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** L

**Story**
The held Dependabot majors have converged into one deliberate migration.
eslint-plugin-react-hooks ≥6 ships the React-Compiler-era rules
(`react-hooks/purity`, `set-state-in-effect`, stricter `use-memo`), and
its Dependabot bump (#91, 2026-08-10) failed lint with ten errors — six
of them the deliberate **adopt-until-edited** draft pattern (a
`useEffect` that `setDraft(toDraft(content))` while unedited) used by
About, FAQ, Pricing and the student details form, plus the per-mount
quote roll (`Math.random` in `useMemo`) and two `useMemo` shape nits.
Then the group bump #97 (2026-08-11) stacked React 18→19, Vite 5→8,
`@vitejs/plugin-react` 4→6 and TypeScript 5.6→6 on top and failed the
build three ways (`JSX` namespace moved to `React.JSX`, argument-less
`useRef()` gone, vite config plugin types). All of it is held in
`dependabot.yml` until this story lands as one verified move.

**Shape**
- React 19 + `@types/react` 19: `React.JSX` namespace, `useRef(initial)`
  call sites, then the full test suite and a real browser pass over the
  teacher flows (publish, editors, tab bars).
- Vite 8 + `@vitejs/plugin-react` 6 together; TypeScript 6 (then 7 when
  typescript-eslint's peer range allows); eslint 10 + `@eslint/js` 10
  ride with the hooks-plugin bump.
- Rework draft adoption to derive-from-props (key the editor subtree on
  the published document, or compare-during-render) instead of
  effect-synced state — pairs naturally with REQ-046's shared hook.
- Move the quote roll out of render (lazy `useState` initialiser or
  effect) keeping per-screen rotation and the fixed three-line slot.
- Then lift every dependabot hold and let the group bump through.

**Acceptance criteria**
- [ ] App builds and all tests pass on React 19, Vite 8, TS ≥6.
- [ ] Lint is clean under eslint-plugin-react-hooks ≥6 with the new
      rules ON (no disables).
- [ ] Draft adoption still works: refreshed content adopts until the
      first edit on every edited-in-place page.
- [ ] The quote still rotates per screen; headers stay fixed-height.
- [ ] Teacher publish + sign-in verified on dev before prod promote.
- [ ] Every dependabot hold is removed in the same PR.

## REQ-051 — Subject chips play on tap

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** S

**Story**
As a visitor (often a child looking over a parent's shoulder), tapping a
subject chip on Home should do something delightful and subject-flavoured
— the chips just became non-navigating badges (2026-08-11), which frees
the tap for play instead of a page change.

**Ideas recorded (owner, 2026-08-11 — pick at build time)**
- Reuse the per-subject emoji sets that already live on the Offerings
  flip cards (`subjectImages`: 📐➗🔢 for Maths, ⚛️🔭🚀 for Physics,
  🧪⚗️💥 for Chemistry, 🔬🧬🌱 for Biology) — a small burst/confetti of
  them from the tapped chip that falls and fades.
- Or the chip itself performs: a wobble + its icon spins/swaps through
  the subject's emoji for a second before settling.
- Keep it cheap: CSS/transform-only particles (the tab-bar lift
  precedent — no layout shift), a handful of nodes created on tap and
  removed on animationend.

**Guard-rails**
- `prefers-reduced-motion`: no burst — at most a gentle highlight.
- No layout shift anywhere (transform/opacity only), and taps must not
  navigate or steal focus.
- Touch and mouse and keyboard (chips become buttons with aria-pressed
  or plain decorative buttons — decide with the a11y hat on).

**Acceptance criteria**
- [ ] Tapping/clicking a chip plays a subject-flavoured animation
      matching that subject's existing emoji set.
- [ ] Zero layout shift; reduced-motion users get a quiet variant.
- [ ] Works with touch, mouse and keyboard; screen readers are not
      spammed (decorative, aria-hidden particles).
- [ ] No regression to the "no navigation from chips" rule.

## REQ-052 — Class notes, read date-wise

**Status:** 🚧 Built (2026-08-13) · **Impact:** frontend · **Effort:** S

**Story**
As the teacher, I write notes on classes while scheduling/editing them
(the session `notes` field), but reading them back means opening each
class one by one. I want to browse those class notes **separately,
date-wise** — a chronological read of what was noted, independent of the
per-student diary (which is its own thing, REQ-0xx dated notes).

**Shape (decide at build)**
- A "Class notes" view — either a tab/section within Class scheduling or
  reachable from it — listing sessions that HAVE notes, grouped by date
  (newest first), each row: date · time · student(s) · subject · the
  note. Empty-noted sessions stay out.
- Filters worth considering: by student (the planner already has one)
  and a month picker matching the calendar.
- Read-first: editing stays where it is (the class dialog); rows link
  back to the class for edits.
- Data is already loaded (sessions carry `notes`) — no API change.

**How it landed (2026-08-13)** — a `/scheduling/notes` page, reached from
a "Class notes" link in the planner's own header: the notes belong to
these classes, so the door is there rather than in the main menu. Newest
day first, classes in the order they ran, and nothing but notes — a class
with an empty (or whitespace) note never appears, and a day with no notes
at all does not either.

Decisions worth recording:
- **A group class reads once**, under everyone in it, because the same
  note usually sits on every linked row. When members genuinely carry
  different notes, each is shown against the student it belongs to rather
  than silently dropping one.
- **A cancelled class keeps its note** and is marked cancelled. The note
  is a record of what happened; hiding it would lose the reason.
- **The planner's own placeholder is not a note** (owner call,
  2026-08-13). Booking a class without writing anything stores
  "Scheduled from the class planner", and hundreds of identical lines
  buried the real notes. It reads as silence — matched exactly, so a note
  that merely mentions the planner is still the teacher's own.
- **Read-only, by design.** Editing stays in the planner dialog so there
  is exactly one place a note can be changed. Every row is a door: it
  deep-links `?day=…&entry=…`, which the planner now honours, so a row
  opens *its own* class rather than the day's first.
- Filters (student, month) are built from classes that actually have
  notes, so a picker can never lead to an empty page.

**Acceptance criteria**
- [x] All session notes readable in one place, grouped by date, newest
      first; sessions without notes don't appear.
- [x] Each row identifies the class (date, time, student, subject) and
      links back to it in the planner _(verified in a browser against a
      day holding two noted classes: clicking the 15:00 note opened the
      15:00 class, not the day's 09:00 one)_.
- [x] Works on phones (filters stack full-width, the action takes its own
      line, no horizontal overflow at 390px).
- [x] No new API surface; coverage holds (565 tests, 94.07%).

## REQ-053 — The phone says when an enquiry or a review lands

**Status:** 🔲 Not started · **Impact:** both + infra · **Effort:** M ·
**Depends on:** ~~REQ-044~~ (shipped 2026-08-14 — the service worker exists;
this story adds a `push` handler to it)
_(owner ask, 2026-08-13; widened to reviews and the dashboard, 2026-08-15)_

**Story**
As the teacher, with the app installed on my Android phone from Chrome, I
want it to tell me when something is waiting for me — a new enquiry, or a
review awaiting moderation — as a notification and a number on the app
icon, so I can act without opening the app to check.

**Two things are waiting-for-me, and they behave the same way**

| what | arrives from | where it is dealt with | counted while unseen |
|---|---|---|---|
| an enquiry | the public enquiry form (`createLead`) | Leads | status `New` |
| a review | a family's submission (`createTestimonial`) | Moderation | status `Pending` |

The icon badge is **one number** — the two added together — because an app
icon has one badge and the teacher's question is "is anything waiting?",
not "which kind?". The counts stay separate everywhere there is room to
show them: the notification, the nav, and the dashboard (REQ-056).

**Shape**
- **Service worker first.** Push is delivered to a service worker, and the
  app is manifest-only today. REQ-044 brings one; this story adds a `push`
  handler to it rather than a second worker.
- **Permission at the right moment**, never on first load: a "Tell me about
  new enquiries" switch in the portal (Leads page or settings). Browsers
  penalise unprompted permission requests, and a refusal is sticky.
- **Subscribe and store.** The client subscribes with the VAPID public key
  and POSTs the subscription to the API; the backend keeps a list (the
  teacher may have a phone *and* a laptop). `DELETE` when the switch is
  turned off.
- **Send on arrival.** `createLead` and `createTestimonial` already run on
  every public submission — after either succeeds, push to every stored
  subscription (`web-push`, VAPID private key in app settings, never the
  repo). Prune on 404/410 so dead endpoints don't accumulate. A review that
  the profanity flagger marks still notifies: flagged is exactly the kind
  that wants looking at.
- **The icon badge** the owner asked for is `navigator.setAppBadge(count)`
  from the `push` handler — new enquiries plus pending reviews — cleared
  with `clearAppBadge()` once nothing is left waiting. `notificationclick`
  opens the page for whichever kind arrived: `/leads` or `/moderation`.
- **Degrade gracefully.** Where push is unsupported (notably iOS unless
  installed, and any browser where permission is refused), the counts still
  show while the app is open — on the nav items and on the dashboard
  (REQ-056), which is the fallback and stands on its own.

**Privacy (REQ-030/031 apply)**
- The notification says "New enquiry — open to read" or "A review is waiting"
  and **nothing about the family**: a name, a message or a review's words on
  a lock screen are personal data shown outside the authenticated app. A
  review is unmoderated by definition — its text must never reach a lock
  screen.
- A push subscription identifies the teacher's device: record it in the ROPA
  and retention schedule, and delete it on unsubscribe and on sign-out.

**Risks worth knowing before starting**
- Android Chrome (installed) is the target and is well supported. iOS only
  delivers web push to home-screen-installed apps (16.4+), and
  `setAppBadge` is not available there at all — so the badge is an Android
  promise, not a universal one.
- The VAPID private key is a real secret: app settings/Key Vault, and
  rotating it invalidates every existing subscription.
- Sending happens inside the public enquiry request: it must not delay or
  fail the family's submission — push failures are logged, never surfaced.

**Acceptance criteria**
- [ ] With the app installed on Android from Chrome and notifications
      allowed, submitting an enquiry on the public site raises a
      notification within seconds and badges the app icon.
- [ ] Submitting a review does the same, and the badge shows enquiries and
      pending reviews added together.
- [ ] Tapping a notification opens the page for that kind — Leads or
      Moderation; the badge clears once nothing is waiting.
- [ ] The notification carries no family personal data, and never a
      review's text.
- [ ] Turning the switch off stops notifications and deletes the
      subscription server-side; expired endpoints are pruned automatically.
- [ ] A push failure never breaks or slows an enquiry submission.
- [ ] Where push is unsupported, the counts still show in-app: the nav
      items and the dashboard (REQ-056), which does not depend on push.
- [ ] No secret in the repo; the ROPA and retention schedule cover the
      subscription.

## REQ-054 — The visitor's phone: give the first screen to the pitch

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** M
_(owner ask, 2026-08-14: "most people will view it in mobile only")_

**Story**
As a parent meeting AbhiTutor for the first time — almost always on a
phone — I want the first screen to tell me what is offered and let me
act on it, instead of spending itself on chrome I did not come for.

**What the phone actually shows today** (measured at 390×844, visitor
mode, 2026-08-14 — page coordinates):

| what | from | height |
|---|---|---|
| brand lockup + masthead | 138px | 228px |
| rotating teacher quote | 154px | 144px |
| theme palette toggle | 310px | 40px |
| notice board | 382px | 286px |
| **hero card (the pitch)** | **684px** | 518px |
| headline | 794px | 58px |
| **"Request a free assessment"** | **974px** | 85px |
| trust chips | 1077px | 104px |

So the promise starts below the fold and the primary action sits ~130px
past it: a visitor scrolls through 668px of brand, a quote and a notice
before learning what is sold. The whole page is 2314px — 2.7 screens —
so this is an ordering problem, not a length one.

**Ideas recorded (pick at build time; the first three are the ones that
move the number above)**

1. **Reorder the phone landing so the pitch leads.** Headline, subhead
   and the assessment CTA first; the notice and the rest follow. The
   notice keeps its pin animation and its scroll-to (2026-08-11) — it
   simply stops standing in front of the pitch.
2. **Portal chrome is not visitor content.** The rotating teacher quote
   and the theme palette toggle are for the person running the business.
   On a visitor's phone that space belongs to the offer. (Both stay on
   the teacher's phone and on desktop — this is a phone-visitor rule.)
3. **One brand lockup above the fold, not two.** The sidebar-header
   lockup and the masthead say the same thing 100px apart; a slim
   sticky bar on scroll would free ~120px.
4. **Proof where the decision is made.** One or two approved parent
   reviews (swipeable) directly under the CTA — today they live a page
   away, and the trust chips are the only proof on Home.
5. **A face earlier.** Parents choose a person: the About portrait,
   small, beside the pitch.
6. **Section rhythm.** Every block is the same card on the same ground;
   alternating surfaces would stop the page reading as one long stack.
7. **Trim the notice board's frame on phones** — the cork surround is
   286px tall for two lines of text.
8. **Skeletons instead of the full-page loader**, so the landing feels
   instant rather than blank-then-whole.

**Guard-rails (owner calls this must not undo)**
- The bottom tab bar and its raised spotlight stay exactly as they are
  (REQ-049, and the teacher's own bar).
- "Why AbhiTutor" stays one claim per line on phones (2026-08-11).
- The notice keeps the pin-on animation, the perpetual sway, and the
  scroll-into-view on load.
- The subject chips stay non-navigating badges (2026-08-11); their tap
  animation is REQ-051's business, not this story's.
- `prefers-reduced-motion` keeps every quiet variant it has.

**Acceptance criteria**
- [ ] On a 390×844 phone in visitor mode, the headline and the primary
      CTA are both above the fold, measured — not judged by eye.
- [ ] No teacher-only chrome (quote, theme picker) on a visitor's phone;
      both remain for the teacher and on desktop.
- [ ] The tab bar, the notice choreography, the one-per-line highlights
      and the chip badges all behave exactly as before.
- [ ] Nothing regresses on desktop or tablet; screenshots at 390, 800
      and 1280 accompany the PR.
- [ ] Coverage holds.

## REQ-055 — A month's statement per student, as a PDF

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** M
_(owner ask, 2026-08-15)_

**Story**
As the teacher, I want to produce a single-student statement for a chosen
month — who they are, the classes they attended, and what is owed or paid
— as a PDF I can send to their parent, so billing is a document a family
can keep rather than a screen I read numbers off.

**The data is already there.** `PaymentRecord` (per student, per month)
carries every figure this needs, so no model change and no API change is
expected:

| the statement wants | comes from |
|---|---|
| who it is for | `Student` — name, `studentId` code, year, school, parent name, contact |
| the month | `PaymentRecord.month` |
| classes attended | `PaymentRecord.sessions` — a `SessionLine` per held class (date, subject, duration, fee) |
| how many, how long | `sessionsHeld`, `totalDurationMinutes` |
| what it costs | `feePerSession` + `feeType` (per-session or a monthly retainer) |
| where it stands | `amountDue`, `amountPaid`, `outstanding`, `status` (Paid / Partial / Pending) |

Two rules the numbers already follow, which the PDF must not restate in
its own words: a cancelled class is never billed (REQ-010), and a month
bills for classes actually taught (REQ-001). A monthly-retainer student's
lines carry fee 0 — their flat fee covers the classes — so a per-line fee
column must not be summed into a total for them.

**Shape (pick at build time)**
1. **Print stylesheet + `window.print()`.** No dependency, no bundle
   cost, and the browser's own "Save as PDF". The teacher picks the
   destination, and page breaks are CSS's job. Weakest on exact layout
   control and on filename (the browser decides).
2. **Client-side generator (jsPDF/pdf-lib).** Exact layout and a proper
   `Ashan-Perera-2026-08.pdf` filename, at the cost of a dependency and
   ~100–300 kB in a bundle that already warns at 500 kB. Fonts for the
   brand lockup would need embedding.
3. **Server-side render.** Best fidelity and a mailable artefact, but it
   is a new endpoint, a new dependency in the Function App, and a
   personal-data document generated outside the browser — the heaviest
   privacy footprint of the three.

Recommendation to weigh at build time: **(1)**, unless the owner needs a
fixed filename or wants to attach the file without a save dialog.

**Cautions**
- **This is a disclosure of personal data**, not a screen. A statement
  names a child, their school and a parent's contact details, and then
  leaves the app as a file. It should carry only what a bill needs — the
  student's name, code, year and the classes; the address and notes have
  no business on it (REQ-031 data minimisation).
- **Diary notes and progress must never appear.** They are the teacher's
  working record, not a billing document.
- The CSP allows no external anything (`default-src 'self'`), so any
  font, logo or library must be self-hosted or inlined — a PDF library
  loaded from a CDN will simply not run.
- A statement for a month with no held classes should say so plainly
  rather than render an empty table that reads as a broken export.
- The generated file is out of the app's control once saved: worth a line
  in [PRIVACY-RETENTION.md](./PRIVACY-RETENTION.md) noting that exported
  statements live wherever the teacher puts them.

**Acceptance criteria**
- [ ] From the payment tracker, a teacher can produce a PDF for **one**
      student and **one** month in a single action.
- [ ] The PDF names the student (name, code, year), the month, and the
      teacher's own business identity as published in the site document —
      never a hardcoded name or address.
- [ ] Every held class of that month appears as a line — date, subject,
      duration — and cancelled classes appear nowhere.
- [ ] The totals on the PDF equal the totals the payment tracker shows
      for that student and month, including the monthly-retainer case
      where the per-class lines carry no fee.
- [ ] A month with no held classes produces a statement that says so.
- [ ] No diary note, progress figure, address or safeguarding detail
      appears anywhere in the output.
- [ ] The PDF renders with no network access (offline, and under the
      site's CSP).

**Notes**
- Worth deciding early whether this is "a statement" (what is owed) or "a
  receipt" (what was paid) — the acceptance above covers both by showing
  due, paid and outstanding, but the title and tone differ, and the owner
  may want the word "Invoice" avoided for tax reasons.
- A whole-month, all-students export is a different story: this one is
  deliberately per-student, because that is what gets sent to a parent.

## REQ-056 — The dashboard counts what is waiting

**Status:** 🔲 Not started · **Impact:** frontend · **Effort:** S
_(owner ask, 2026-08-15: a number for a new review or a new enquiry, on the
phone AND on the dashboard)_

**Story**
As the teacher opening my dashboard, I want to see at a glance how much is
waiting for me — enquiries I have not answered and reviews I have not
moderated — so the first screen tells me what needs doing rather than
making me visit two pages to find out.

**Half of this already ships.** The dashboard's hero carries a "N new
enquiries" pill today (REQ-019), fed by `fetchLeadsRequested` on mount and
counting leads with status `New`. What is missing is the same treatment
for reviews: `fetchPendingTestimonials` exists and the moderation screen
uses it, but nothing surfaces the count anywhere else. So this story is
"do for reviews what REQ-019 did for enquiries, and make the pair read as
one thing".

**Deliberately not dependent on push.** REQ-053 puts these numbers on the
Android app icon, which needs a subscription, a VAPID key and a permission
prompt. This story needs none of that and can ship on its own — and it is
the graceful-degradation path REQ-053 promises for every device where push
is unsupported or refused.

**Shape**
- The dashboard loads the pending-review count the way it already loads
  leads: dispatch on mount, count in a memo, no new endpoint.
- Two pills side by side, each its own door — enquiries to Leads, reviews
  to Moderation. Zero is not a pill: an empty inbox should be quiet, not a
  "0" the teacher has to read and dismiss.
- The teacher's nav carries the same counts, so the number is visible from
  any screen and not only from the dashboard.
- One shared "what is waiting" selector, so the dashboard, the nav and
  (later) REQ-053's badge can never disagree about the number.

**Cautions**
- A pending review is unmoderated text from the public. The count is a
  number — no names, no quotes, nowhere outside the authenticated screens.
- The dashboard is already the busiest screen in the app; this must be two
  quiet pills in the existing hero strip, not a new card competing with
  "Today at a glance".
- Flagged reviews (REQ-028) count as pending: they are the ones most
  wanting attention, so they must not be filtered out of the number.

**Acceptance criteria**
- [ ] The dashboard shows the number of enquiries awaiting a reply and the
      number of reviews awaiting moderation, each opening its own page.
- [ ] A count of zero shows nothing at all — no empty pill.
- [ ] Flagged reviews are included in the pending count.
- [ ] The same numbers appear on the teacher's nav, from every screen.
- [ ] The dashboard, the nav and REQ-053's badge read from one shared
      count, so they cannot disagree.
- [ ] No review text, family name or enquiry detail appears in any count
      surface.
- [ ] Nothing about it requires notification permission or a service
      worker.

**Notes**
- REQ-053 adds the same two numbers to the installed app's icon; the badge
  is their sum, because an icon has one badge. Keeping them separate here
  is what makes the badge's total explainable when the teacher taps in.

## REQ-057 — The teacher's own reminders

**Status:** 🔲 Not started · **Impact:** both · **Effort:** M
_(owner ask, 2026-08-15)_

**Story**
As the teacher, I want to write myself a reminder — a date, a time and
whatever I need to remember — and see it on the dashboard among the
upcoming classes, so the one screen I open in the morning holds everything
that is coming, not only the teaching.

**What it is not.** Not a class: it books nothing, bills nothing, belongs
to no student and never touches the planner. "Order more graph paper" and
"Ring the Chapmans back" are the shape of it. That separation is the whole
design — the moment a reminder can carry a student, it becomes a second
way to schedule teaching and the two will disagree.

**Shape**
- **A reminder is `{ id, date, time?, text }`** and nothing else. The time
  is optional: "Thursday" is a legitimate reminder, and forcing 00:00 on it
  would sort it to dawn.
- **Its own store, its own endpoints.** `GET/POST/PUT/DELETE /reminders`,
  a `reminders` table alongside the others, teacher-only on every verb —
  this is the teacher's private note-to-self, never public and never
  reachable signed out.
- **On the dashboard, in the same list as the classes**, ordered by date
  and time together so the morning reads in order. A reminder must be
  visually distinct at a glance — a class is an obligation to a family, a
  reminder is one to yourself — and must never be counted in "upcoming
  sessions" totals or the week-load bars.
- **Editing where it is read.** Add from the dashboard, edit and delete in
  place. There is no second screen for four fields.
- **Past reminders fade rather than vanish**, so yesterday's forgotten note
  is still visible today; a delete is the teacher's own call.

**Cautions**
- The dashboard's upcoming list is capped per student (REQ-019 era logic)
  and folds group classes into one entry. Reminders join the same list, so
  the cap and the folding must not silently swallow them.
- Free text written by the teacher is still stored data: HTML-stripped on
  write like every other free field, and length-capped.
- A reminder may name a family ("ring the Chapmans"), so it is personal
  data in the ROPA sense — it needs a line in the retention schedule and it
  must be deleted with the teacher's data, not left behind.
- Times are local. The app has a `toDateKey` convention precisely because
  `toISOString` shifts the day near midnight — reminders must use it too.

**Acceptance criteria**
- [ ] The teacher can add a reminder with a date, an optional time and free
      text, from the dashboard.
- [ ] It appears among the upcoming items in date/time order, plainly
      distinguishable from a class.
- [ ] The teacher can edit and delete their reminders.
- [ ] Reminders never appear in session counts, week-load bars, payments,
      a student's page, or anywhere public.
- [ ] A reminder with no time still sorts sensibly within its day.
- [ ] Reminders survive a reload — they are stored via the API, not in the
      browser.
- [ ] Signed out, no reminder is reachable; the endpoints are teacher-only.
- [ ] The retention schedule and ROPA cover them.

**Notes**
- Worth deciding at build time whether a reminder can repeat ("every
  Monday"). The story deliberately specifies single-date reminders: repeats
  are a scheduler, and a scheduler is a different story.
- Once REQ-053 exists, a reminder due today is the obvious second thing the
  phone could announce — but that is REQ-053's business, not this one's.

## REQ-058 — Which pages visitors actually reach

**Status:** 🔲 Not started · **Impact:** both · **Effort:** M
_(owner ask, 2026-08-15: "how many people are viewing the website and their
actions" — narrowed the same day to **visits, not people**, and to which
pages they reach, date by date)_

**Story**
As the owner, I want to see how many visits the public site got and which
pages those visits reached, day by day, so I can tell whether anyone is
getting as far as Pricing or the enquiry form — without installing anything
that watches families.

**The constraint that shapes the design.** The app's CSP is `script-src
'self'` with `connect-src` limited to its own two Function Apps, and
[PRIVACY-ROPA.md §3](./PRIVACY-ROPA.md) carries a standing rule: *"no new
processor without paperwork first… the policy currently tells families
there are no such providers; that statement must stay true."* Google
Analytics, Plausible, Fathom and anything else hosted would each mean
widening the CSP, adding a processor to the ROPA and rewriting what the
privacy policy promises.

So this is first-party by design: the site posts to the API it already
talks to. No CSP change, no new processor, and the promise to families
stays as written.

**Built so it holds no personal data at all**
- **A visit is a tab, not a person.** A random id is generated in memory
  when the page loads and lives in a JS variable — **nothing is written to
  the device**, no cookie and no storage. That keeps it outside PECR's
  consent rule for storing information on terminal equipment, which is what
  forces a banner. The honest cost: a full reload counts as a new visit, so
  the number is "visits", never "people", and must be labelled that way.
- **No IP, no user agent, no referrer stored.** An IP is personal data; the
  moment it is kept, this becomes a processing activity with a lawful basis
  to argue. The API records only what the page tells it.
- **Public pages only.** The teacher's own screens are private and their own
  usage would drown the numbers — a signed-in session records nothing.
- **Never the content.** What someone typed into the enquiry form is never
  an event; only that they reached the page.

**Shape**
- **Event:** `{ visitId, page, at }` where `page` is the route key the menu
  already uses (`home`, `offerings`, `pricing`, `enquire`, `about`,
  `reviews`, `faq`, `contact`). An unknown key is dropped, so the table can
  never fill with arbitrary strings.
- **`POST /events`** — public, unauthenticated (visitors are not signed in),
  rate-limited, and written to a `pageviews` table. It must never fail a
  page: fire-and-forget, errors swallowed.
- **`GET /events/daily`** — teacher-only, returning per-date totals: visits
  (distinct `visitId`) and a count per page.
- **The snapshot screen** — a date-wise table, newest first: one row per
  day, the visit count, and the per-page numbers beside it. The app already
  has a table idiom (Study Snapshot, Payment Tracker) to follow.
- **Aggregate on read, purge the raw.** Daily totals are what the teacher
  reads; raw event rows are purged on the retention schedule, and the
  schedule gains a line for them.

**Cautions**
- **Bots inflate everything.** Crawlers hit the public pages constantly.
  Without at least a crude filter the numbers are fiction — worth deciding
  the rule (no events from requests without a real navigation, or a
  known-bot user-agent check done server-side and then discarded).
- Every visitor now makes an extra request per page. It must be small,
  fire-and-forget, and never on the critical path of a render.
- An open public POST endpoint is an invitation: rate-limit it, cap the
  body, and validate the page key against the known list.
- **The ROPA and privacy policy still need a line**, even holding no
  personal data — saying plainly that the site counts visits to its own
  pages, stores no cookies and identifies nobody. Silence would be worse
  than the sentence.

**Acceptance criteria**
- [ ] A teacher-only screen shows, per date, how many visits the public site
      had and how many reached each page.
- [ ] The number is labelled visits, never users or people.
- [ ] Nothing is written to a visitor's device — no cookie, no storage —
      and no consent banner is required.
- [ ] No IP, user agent, referrer or form content is stored.
- [ ] A signed-in teacher's own browsing records nothing.
- [ ] An unknown page key is rejected rather than stored.
- [ ] Event posting can fail, be blocked or be slow without affecting what
      the visitor sees.
- [ ] The CSP is unchanged and no third-party processor is added.
- [ ] The privacy policy and ROPA describe the counting before it ships.

**Notes**
- Deliberately not included: sessions of *people* across visits, referrers,
  time-on-page, scroll depth, or anything approaching a funnel by
  individual. Each of those needs an identifier that survives the tab, and
  that is the line where a banner and a ROPA entry become unavoidable.
- If richer data is ever wanted, Azure Application Insights is the natural
  next step — its JS SDK installs from npm, so it satisfies `script-src
  'self'`, and the data would stay in the same Azure subscription under the
  DPA the ROPA already cites. It sets a session identifier, so it is a
  paperwork decision, not a drop-in.

