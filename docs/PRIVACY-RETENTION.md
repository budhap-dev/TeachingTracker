# Retention schedule and purge routine

**REQ-033.** Written 2026-07-31. Owner: the tutor (data controller).

Data leaves this system when its purpose ends — not whenever someone
remembers. This document is the schedule, the routine that honours it, and
the log of runs. Every claim the public
[privacy policy](../src/components/PrivacyView.tsx) makes about "how long we
keep it" traces to the table below; if one changes, both change.

Companion document: [PRIVACY-ROPA.md](./PRIVACY-ROPA.md) (processing records,
breach plan, ICO registration).

---

## 1. The schedule

⚠️ **Values marked _(default)_ were chosen as sensible starting points and
need the owner's confirmation.** They are written as decisions, not
suggestions, so the routine is runnable today; change them here first, then in
the policy page.

| Category | Kept for | Anchor date | Erased by |
| --- | --- | --- | --- |
| **Payment / settlement records** | 6 years after the end of the tax year they fall in | `PaymentRecord.month` | Manual — see §3.4 and the ⚠️ conflict in §4 |
| **Active student records** | While tutoring continues | — | `DELETE /api/students/{id}` on request |
| **Alumni (archived) student records** | **24 months** after archiving _(default)_ | `Student.archivedOn` | `DELETE /api/students/{id}` |
| **Enquiries — not converted** | **12 months** after they arrive _(default)_ | `Lead.submittedOn` | `DELETE /api/leads/{id}` |
| **Enquiries — converted to a student** | **6 months** after conversion _(default)_ | `Lead.submittedOn` (see §4) | `DELETE /api/leads/{id}` |
| **Reviews — published** | Until removed, or immediately on request | — | `DELETE /api/testimonials/{id}` |
| **Page-visit rows** (REQ-058 — not personal data) | **90 days** _(default)_ | The row's own date partition | Purge the `pageviews` partitions older than the window; the per-day totals the teacher reads identify nobody and may be kept |
| **Reviews — rejected / not published** | Until the next quarterly run (≤ 3 months) | `Testimonial.moderatedOn` | `DELETE /api/testimonials/{id}` |
| **Monthly JSON dumps** | **12 months**, rolling _(default)_ | Filename date stamp | Delete the file from owner storage |
| **Dev seed data** | Indefinite — invented people, no real personal data | — | n/a |

**Why 24 months for alumni.** A student who stops after GCSEs may come back
for A-levels roughly two years later, and their history is what makes that
restart useful. Beyond that the record is no longer doing work for anyone.

**Why 6 months for converted enquiries.** Conversion copies what matters into
the student record; the enquiry itself is then a duplicate of data held under
a stronger basis. It is kept briefly so the teacher can see where a family
came from.

**Reviews are consent-based**, so they are kept while that consent stands and
removed on request at any time — no fixed clock. Rejected ones never earned
publication, so they go at the next run.

---

## 2. What the routine covers

- **Live tables** (prod and dev): `students`, `sessions`, `settlements`,
  `testimonials`, `leads`. The `sitecontent`, `contact` and `counters` tables
  hold no personal data and are out of scope.
- **Monthly JSON dumps** produced by `npm run dump`
  (`func-teaching-tracker/src/tools/dump.ts`) and held in the owner's own
  storage. ⚠️ These are the easiest thing to forget: erasing someone from the
  live tables does **not** remove them from a dump taken last month.
- **Dev seed data** is invented people — recorded here and in the ROPA, then
  ignored.

---

## 3. The purge routine

A manual checklist, run **quarterly** on **1 February, 1 May, 1 August and
1 November** _(default cadence — owner to put a recurring calendar reminder in
place)_. Automation is deliberately out of scope until the routine has run at
least once and the values above have settled; Azure Table Storage has no TTL,
so automating means a timer-triggered function with date filters — a follow-up
story, not a requirement of REQ-033.

Sign in to the teacher portal, then work the list top to bottom. Record counts
as you go; §5 wants them.

### 3.1 Enquiries

1. Open the **Leads inbox**.
2. Delete every enquiry whose `submittedOn` is more than **12 months** ago and
   whose status is **New** or **Contacted**.
3. Delete every **Converted** enquiry whose `submittedOn` is more than
   **6 months** ago.
4. Use the card's Delete action (a real erasure), **not** a status change — a
   status keeps the record.

### 3.2 Reviews

1. Open **Review moderation**.
2. Delete every review that was rejected / left unpublished at a previous run.
3. Leave published reviews alone — they stay until the author asks otherwise.

### 3.3 Alumni students

1. Open the **Alumni** view.
2. For each student archived more than **24 months** ago, confirm with the
   owner that no return is expected, then delete the student.
3. Deleting cascades: the student's classes and settlement rows go with them
   (verified by the service test covering `deleteStudentCascade`).
4. ⚠️ Read §4 first — this step currently destroys payment history that the
   6-year rule says to keep.

### 3.4 Payment records

No routine deletion yet: nothing in the system is old enough for the 6-year
clock to have expired (the app's records start in 2026). At the first run
after **April 2032**, purge settlement rows for tax years ending more than six
years earlier. Until then, this step is a no-op — tick it and move on.

### 3.5 Dumps

1. In the owner's dump storage, delete every file whose date stamp is more
   than **12 months** old.
2. If a specific erasure request was honoured this quarter, note in §5 that
   dumps still containing that person expire by the date shown — that is the
   honest bound on "it's all gone".

### 3.6 Close out

Add a row to §5 with the date, what was purged, and the counts. That log is
the evidence a challenge asks for; an unlogged purge may as well not have
happened.

---

## 4. Known gaps — owner decisions needed

These are real inconsistencies between what the build does and what the policy
says. They are written down rather than quietly worked around.

1. ⚠️ **Student erasure destroys payment history.**
   `DELETE /api/students/{id}` cascades into `settlements`, so an erasure
   takes the payment rows with it — while the six-year line in the table
   above says those records should survive. The policy page used to claim
   both at once ("deleting removes payment history" *and* "tax-law records
   stay for that legal period"), which could not be true together.

   **Interim action taken (2026-07-31):** the policy sentence was corrected to
   describe what the code actually does, because a public page must not claim
   something untrue. The tax-law carve-out is gone from the page for now.

   The owner still needs to choose the end state:
   - **(a) Recommended** — keep a minimal financial record on erasure (month,
     amount, and an opaque reference in place of the name), so HMRC is
     satisfied without holding an identifiable person. Needs a small backend
     change, and the carve-out sentence then returns to the policy.
   - **(b)** Accept today's behaviour as the final answer — an erasure request
     takes the payment rows with it, and the page stays as it now reads.

   Until this is settled, §3.3 should be run with the owner's explicit
   agreement, case by case.

2. ⚠️ **Enquiries have no "last touched" date.** `Lead` records only
   `submittedOn`; a status change to Contacted or Converted is not dated. The
   schedule therefore anchors on `submittedOn`, which is slightly more
   aggressive than "N months after last touch". If that proves wrong in
   practice, adding a `lastUpdatedOn` field is a small backend change.

3. ⚠️ **Dumps outlive erasure.** A deletion honoured today can persist in
   dumps for up to 12 months. The rolling window bounds it; the policy should
   not promise faster than that. Shortening the dump window is the lever if a
   stronger promise is wanted.

---

## 5. Purge log

One row per run. Counts, not names — this log must not itself become a record
of the people it erased.

| Date | Enquiries | Reviews | Alumni students | Payments | Dumps deleted | Run by | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _(no runs yet — the first is due 1 August 2026)_ | | | | | | | |
