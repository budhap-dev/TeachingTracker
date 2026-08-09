# Teaching Tracker — Interface & Functional Design Document (IFDD)

> The contract + behaviour spec: **API reference**, **data dictionary**, **per-screen functional specs**, and **user journeys**.
> Grounded in source (`file:line`). Companion: [TDD.md](./TDD.md) (architecture & technical design).

---

## 1. Actors & access model

| Actor | Access |
|---|---|
| **Teacher** (email in the Key Vault allow-list) | Full app: all screens, all API endpoints. |
| **Visitor** (signed-out) | The public site: `/` (Home landing), `/about`, `/offerings`, `/enquire`, `/contact`*, `/reviews`, `/faq`, `/pricing`, `/privacy`. Teacher routes redirect to sign-in; the sign-in line itself hides behind five taps on the hero badge (REQ-039). *Contact (menu + page CTAs) only shows once contact details are published. |

**Gating.** Client: `RequireTeacher` wraps teacher routes; signed-out visitors are redirected to `/` and shown `SignInView`; the sidebar hides `teacherOnly` items (`RequireTeacher.tsx:16-42`, `Sidebar.tsx:101-103`). Server: every data endpoint calls `requireTeacher` (JWT + `access_as_teacher` scope + email allow-list). When `AUTH_ENFORCED=false` the verdict is logged but not enforced (`auth.ts:155-164`).

**Transport.** JSON over HTTPS. Base URL = `VITE_API_BASE_URL` (must include `/api`). Requests carry `Authorization: Bearer <JWT>` when a token is available, else go bare. Errors are `{ "error": string }` with a 4xx/5xx status (`http.ts:16-46`).

---

## 2. API reference

Base path `/api`. Auth = teacher (JWT) unless noted. All 4xx bodies `{ error }`.

### 2.1 Students

#### `GET /students`
List **all** students (no archived filtering — the client filters). → `200 Student[]`. (`getStudents.ts`)

#### `GET /students/{id}`
One student. `id` integer. → `200 Student` · `400` non-integer id · `404` not found. (`getStudent.ts`)

#### `POST /students` · `PUT /students/{id}`
Upsert (create when no id, update when id matches). Body `StudentInput`. A route `{id}` overrides the body id.
→ `201 Student` (created) · `200 Student` (updated) · `400` validation/non-integer id.
Validation (`validateStudentInput`): `firstName`/`lastName` required; `mode` ∈ enum; `progress` 0–100; `progressBySubject` numeric 0–100; `fees` ≥ 0. (`upsertStudent.ts`)

#### `DELETE /students/{id}`
GDPR cascade erase (student + their sessions + settlements). → `204 No Content` · `400` · `404`. (`deleteStudent.ts`)

#### `POST /students/{id}/archive`
Move to Alumni. Body `{ notes: string }` — **non-empty closing note required**. Cancels (never deletes) future non-cancelled classes. → `200 Student` · `400` (bad id / missing note) · `404`. (`archiveStudent.ts`)

#### `POST /students/{id}/restore`
Return an alumnus to the active roster (does not un-cancel classes). No body. → `200 Student` · `400` · `404`. (`restoreStudent.ts`)

### 2.2 Sessions

#### `GET /sessions?studentId={id}`
List classes (optional `studentId` filter), date+time ordered. → `200 ScheduledSession[]` · `400` non-integer `studentId`. (`getSessions.ts`)

#### `POST /sessions`
Book a class. Body `SessionInput` — solo (`studentId`) or group (`studentIds[]`). A group creates one row per student sharing `groupId`. → `201` single `ScheduledSession` (solo) or `ScheduledSession[]` (group) · `400`. (`createSession.ts`)

#### `PUT /sessions/{id}`
Edit or cancel a class. Body `SessionUpdate` (any non-empty subset; `status` to cancel/restore; `applyToGroup` to fan out). → `200` single or `ScheduledSession[]` · `400` · `404`. (`updateSession.ts`)

#### `DELETE /sessions/{id}`
Permanently delete the class (all rows if a group). → `200 { ids: number[] }` (note: 200, not 204) · `400` · `404`. (`deleteSession.ts`)

#### `POST /sessions/{id}/members`
Add a student to a class (promotes solo → group; restores a cancelled member instead of duplicating). Body `{ studentId: number }`. → `201 ScheduledSession[]` (group rows) · `400` · `409` already a member · `404` session/student not found. (`addSessionMember.ts`)

### 2.3 Payments

> Bills are **derived**; only settlements are stored. `amountDue = sessionsHeld × fees` where *held* = non-cancelled & date ≤ today.

#### `GET /payments?studentId=&month=&status=`
Flat records. Optional filters (`month` = `YYYY-MM`, `status` ∈ Paid/Partial/Pending). → `200 PaymentRecord[]` · `400`. (`getPayments.ts`)

#### `GET /payments/by-month?studentId=&status=`
Records grouped by month with totals. → `200 MonthlyPaymentGroup[]` (ascending) · `400`. (`getPaymentsByMonth.ts`)

#### `POST /payments`
Record settlement(s). Body single or array `PaymentInput`. Omit `amountPaid` to **settle in full**; omitted `notes` preserves the existing note. → `200 PaymentRecord[]` · `400` empty/validation. (`savePayments.ts`)

### 2.4 Public + content endpoints (added with the public-site epic)

> Full request/response shapes live in the OpenAPI spec (`GET /api/docs`) — kept in step with the services; summaries only here.

- **Reviews** — `GET /testimonials` (public: Approved only; teacher: all + Pending), `POST /testimonials` (public, honeypot + profanity flag → Pending; rating required for Parent/Student, rejected for Professional/Personal recommendations), `PUT /testimonials/{id}` (moderation), `DELETE /testimonials/{id}`.
- **Site content** — `GET /site-content` (public), `PUT /site-content` (teacher): the whole public site as one validated JSON document — hero, subjects, journey, approach, bio/CV + photo, pricing, highlights, services, FAQ, freeform, sectionOrder.
- **Leads** — `POST /leads` (public enquiry, honeypot), `GET /leads`, `PUT /leads/{id}` (teacher works New → Contacted → Converted), `DELETE /leads/{id}` (GDPR).
- **Contact** — `GET /contact` (public), `PUT /contact` (teacher): the published email/phone/availability/preferred channel.

### 2.5 Docs (public, ungated)
- `GET /api/docs` → Scalar UI (HTML). `GET /api/openapi.json` → OpenAPI 3.0.3 document.
- Spec drift closed 2026-08-09 (session delete/members, datedNotes, content-era schemas). REQ-045 proposes a CI check so drift fails builds instead of lingering.

---

## 3. Data dictionary

### Student (`models/student.ts`, `data/students.ts`)
| Field | Type | Notes |
|---|---|---|
| `id` | number | DB key (server-assigned) |
| `studentId` | string | Human code `STU-######` / `DEV-####` (server-generated) |
| `firstName`, `lastName` | string | Required on input |
| `dob` | string | `YYYY-MM-DD` |
| `subjects` | string[] | Studied subjects |
| `school`, `year` | string | |
| `progress` | number | 0–100, blended; kept = rounded mean of `progressBySubject` (REQ-014) |
| `progressBySubject?` | Record<string,number> | Per-subject 0–100 |
| `mode` | `Online` \| `Face to Face` \| `Both` | |
| `fees` | number | GBP per session |
| `notes` | string | **Legacy** single note (no longer surfaced) |
| `datedNotes?` | `DatedNote[]` | Diary log |
| `parentName`, `contactNumber`, `address` | string | |
| `isArchived?` | boolean | Absent/false = active (REQ-013) |
| `archivedOn?`, `archiveNotes?` | string | Set on archive, kept through restore |

**DatedNote:** `{ id: number, date: string (YYYY-MM-DD), text: string }`.

### ScheduledSession (`models/session.ts`)
`id`, `studentId`, `studentName` (denormalised), `year`, `subject`, `date` (`YYYY-MM-DD`), `time` (`HH:MM`), `durationMinutes` ∈ {30,60,90,120}, `groupId?` (links group rows), `notes`, `status` ∈ {Scheduled, Cancelled}.

### Payments (`models/payment.ts`)
- **PaymentSettlement** (*stored*): `studentId`, `month`, `amountPaid`, `notes`.
- **PaymentRecord** (*derived*): `id` (= `studentId*100+monthIndex`), `studentId`, `studentName`, `month`, `feePerSession`, `sessionsHeld`, `amountDue`, `amountPaid`, `outstanding` (= max(due−paid,0)), `status`, `notes`.
- **MonthlyPaymentGroup**: `month`, `totalDue`, `totalReceived`, `totalOutstanding`, `sessionsHeld`, `records[]`.
- **PaymentInput**: `{ studentId, month, amountPaid?, notes? }`.

### Input types
- **StudentInput** = `Partial<Omit<Student,'id'>> & { id?, firstName, lastName }`.
- **SessionInput** = solo `studentId` or group `studentIds[]`, + `subject`, `date`, `time`, `durationMinutes?`, `notes?`.
- **SessionUpdate** = any non-empty subset of session fields + `status?`, `applyToGroup?`.

---

## 4. Functional / UI spec (per screen)

Common states: a **BusyBar** shows while any load/save flag is set; a **NoticeToast** shows success (auto-hide 3.5 s) or error (persists); data screens render `PageLoading` skeletons until loaded.

| Screen | Route | Purpose | Key states & interactions |
|---|---|---|---|
| **Dashboard** | `/` | Teacher home | Stat tiles, upcoming sessions (archived excluded), progress "attention" bands, week-load bars; a week bar deep-links to the planner (`?day=`). |
| **Students** | `/students` | Active roster | `StudentList` grouped by year; "Add new student" → `StudentFormModal` (no Notes field — diary lives on the student page). |
| **Student · Details** | `/students/:id` | Profile | Read grid + edit form (locked until **Edit**); upcoming-sessions mini-table with edit/cancel and classmate links; **Archive** (requires edit mode + closing note); **Details \| Diary** tabs. |
| **Student · Diary** | `/students/:id/diary` | Dated notes | Ruled-notebook log; inline add (date defaults today) that **saves immediately**; per-entry edit/delete; empty state "No entries yet". Emptying an edit deletes the entry. |
| **Study Snapshot** | `/study-snapshot` | Study formats | Sortable/paginated table; per-student Group/Solo/Both from non-cancelled sessions. |
| **Alumni** | `/alumni` | Archived students | Teacher-only table of `isArchived` students; open → restore. |
| **Payment Tracker** | `/payments` | Monthly billing | Month selector; per-row **amount box + Save** (commits only on Save/Enter, never on keystroke/blur; Save disabled until dirty); notes; summary cards `Received / Yet to be paid / Due / status tally`, all **summed from the visible (active) rows**. |
| **Class Scheduling** | `/scheduling` | Planner | Month calendar; day modal to book (multi-select ⇒ group), edit, add member, cancel, or delete a class; duration 30/60/90/120. |
| **Leads** | `/leads` | Enquiry pipeline | Teacher-only; New → Contacted → Converted; GDPR delete. |
| **Review moderation** | `/reviews/moderation` | Approve/reject | Teacher-only; Pending queue with profanity flags; approve/reject/delete. |
| **Site editor** | `/site-editor` | Publish the public site | Edit/Preview tabs over the whole document; sortable sections; publishes atomically. About/FAQ/Pricing are edited on their own pages instead. |
| **Public site** | `/`, `/about`, `/offerings`, `/enquire`, `/contact`, `/reviews`, `/faq`, `/pricing`, `/privacy` | Marketing + enquiries | All render the published `siteContent` document (never bundled defaults once published); About/FAQ/Pricing become their own editors for the signed-in teacher; Enquire/Reviews accept public submissions (honeypot-guarded); Contact hides everywhere until details are published. |
| **Sign in** | (hidden) | Teacher door | Home's "Sign in with Microsoft" line appears after five quick taps on the hero badge (REQ-039), then `loginRedirect`. |

---

## 5. User journeys

**Add a diary note.** Diary tab → type entry (date defaults today) → **Add entry** → `StudentNotesSection.onChange([...notes, {id,date,text}])` → route dispatches `saveStudentRequested({...student, datedNotes})` → `POST /students` → `saveStudentSucceeded` stores the server copy + "Student saved." Edit/delete use the same onChange→save path. (`StudentNotesSection.tsx:75-110`, `ROUTE.tsx:418-420`)

**Record a payment.** Payment Tracker → pick month → type into a row's amount box (`amountDrafts`, no API call) → **Save/Enter** → `commitAmount` → `savePaymentRequested` → `POST /payments` → `savePaymentSucceeded` replaces the record and `recalculateTotals` the month → totals update + "Payment saved." (`PaymentTrackerView.tsx:135-172`)

**Schedule / edit a class.** Planner day modal (or dashboard `?day=`) → pick student(s), subject, time, duration → `createSessionRequested` → `POST /sessions` (group ⇒ N rows). Edit → `PUT /sessions/{id}`; add member → `POST /sessions/{id}/members`; cancel → `PUT` with `status=Cancelled` (row stays visible); delete → `DELETE /sessions/{id}` (row removed). Same handlers exist on the student page. (`ROUTE.tsx:493-563`)

**Archive / restore.** Student page → **Edit** → **Archive** → dialog warns how many upcoming classes will be cancelled and **requires a closing note** → `archiveStudentRequested` → `POST /students/{id}/archive` → student leaves every active surface, appears in Alumni; a follow-up `fetchSessionsRequested` reflects the server-cancelled classes. Restore from the banner or Alumni → `POST /students/{id}/restore`. (`StudentDetailsView.tsx:285-327`, `ROUTE.tsx:381-389`)

---

## 6. Cross-cutting behaviours
- **Optimistic-safe refetch:** a background student refetch won't clobber unsaved local edits (`hasLocalStudentChanges`, `store.ts:137-155`).
- **Cancelled ≠ deleted:** cancelling a class keeps the row (greyed, excluded from counts); only `DELETE` removes it.
- **Group semantics:** one class = N rows sharing `groupId`; edits/cancels can target one row or the whole group via `applyToGroup`.
- **Denormalised names self-heal:** `refreshSessionNames` rewrites drifted session name/year on any student save.
- **Auth-less mode:** with no `VITE_ENTRA_*` vars, the SPA runs without MSAL and sends tokenless requests — used by tests, local dev, and the browser-verification harness.
