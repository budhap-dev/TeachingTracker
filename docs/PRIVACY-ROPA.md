# Privacy operations record — ROPA, breach plan, DPIA screening, ICO

**REQ-034.** Written 2026-07-31. Owner: the tutor (data controller).

The operational paperwork behind the public
[privacy policy](../src/components/PrivacyView.tsx). Its purpose is that a
GDPR challenge is answered by opening this file, not by reconstruction — and
that every claim the public page makes traces to a line here.

Companion document: [PRIVACY-RETENTION.md](./PRIVACY-RETENTION.md) (schedule,
purge routine, purge log).

---

## 1. Controller

| | |
| --- | --- |
| **Controller** | Springboard Tutoring — a single-tutor teaching practice |
| **Named decision-maker** | The tutor (owner). There is no DPO; none is required (see §5) |
| **Contact route for data subjects** | The public Contact page (email / phone / WhatsApp) |
| **Jurisdiction** | UK GDPR + Data Protection Act 2018; supervisory authority is the ICO |

⚠️ **Owner to fill in:** the trading address and the contact email that
requests should formally go to, if different from the Contact page.

---

## 2. Records of processing (UK GDPR Article 30)

Categories of personal data, why they are held, and on what basis. This table
is the source of truth; the public policy is its plain-English rendering.

| # | Purpose | Data subjects | Categories of data | Lawful basis | Where it enters | Retention |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Deliver and record tutoring | **Children** (pupils) and their parents/guardians | Name, date of birth, school, year, subjects, progress scores, dated lesson notes, home address; parent's name and phone | Contract (Art. 6(1)(b)) — delivering the tutoring arranged | Typed in by the teacher, from details a parent gives offline | While tutoring continues; 24 months after archiving |
| 2 | Respond to enquiries | Parents/guardians (prospects) | Name, email and/or phone, child's school year, subjects, free-text goal | Legitimate interest (Art. 6(1)(f)) — replying to someone who asked | Public `/enquire` form | 12 months; 6 months once converted |
| 3 | Publish genuine feedback | Parents and students who submit | Display name, role, subject, year, rating, quote | Consent (Art. 6(1)(a)) — submitted for publication | Public `/reviews` form | While published; removed on request |
| 4 | Bill for lessons and keep business records | Students / paying parents | Student name and id, month, fee, sessions held, amounts due/paid, status, notes | Contract, and legal obligation (Art. 6(1)(c)) — HMRC record-keeping | Recorded by the teacher | 6 years after the tax year — ⚠️ see §6 gap 1 |
| 5 | Secure the teacher's portal | The teacher only | Microsoft Entra ID sign-in identity and tokens | Legitimate interest (Art. 6(1)(f)) — protecting family data | Microsoft Entra ID | Managed by Microsoft Entra |

### 2.1 Children's data — flagged

⚠️ **Record 1 is predominantly children's data.** Three facts govern how it is
handled, and all three are stated in the public policy:

- It is supplied **by a parent or guardian**, never collected from a child
  directly. There are no child accounts, no forms addressed to children, and
  no messaging.
- The tone bar for the notice is higher, so the policy is written in plain
  English aimed at the parents it covers.
- The free-text fields (lesson notes, enquiry goal) could attract health or
  SEN details, which would be **special-category** data. The enquiry form
  carries helper text steering families away from it, and the policy asks for
  sensitive matters to be discussed directly instead. **No special-category
  data is knowingly processed**; if that ever changes, this record and the
  lawful-basis analysis must be revisited first (Art. 9 needs its own basis).

### 2.2 Data minimisation review

Every stored field, justified or challenged. Reviewed 2026-07-31; redo it
whenever a field is added.

| Field | Verdict |
| --- | --- |
| Child's name, school, year, subjects | **Keep** — the minimum needed to teach and identify a pupil |
| Date of birth | ⚠️ **Challenge.** Used for age-appropriate material, but school year already conveys that within a year. A birth *year*, or nothing, would likely do. Owner decision; recorded rather than assumed necessary |
| Home address | ⚠️ **Challenge.** Genuinely needed for face-to-face students (the tutor travels), unnecessary for online-only ones. The `mode` field already distinguishes them — the form could require it only for face-to-face. Owner decision |
| Progress scores, lesson notes | **Keep** — the substance of tutoring records. Free text, so §2.1's sensitive-data caution applies |
| Parent name and phone | **Keep** — the contact route for a child's tutoring |
| Enquiry: name, email/phone, year, subjects, goal | **Keep** — each is used to reply. Only one of email/phone is required, which is already minimal |
| Review: display name, role, subject, year, rating, quote | **Keep** — a first name or initials is explicitly enough; nothing identifying is required |
| Payment: student name alongside the id | ⚠️ **Challenge.** The name is denormalised onto every payment row for display convenience; the id alone would suffice and would make de-identified retention (§6 gap 1) straightforward |

The three ⚠️ rows are minimisation debt, not blockers. They are written down
because "we reviewed and justified each field" is only a defensible claim if
the uncomfortable answers are recorded too.

### 2.3 Categories not held

Stated because their absence is part of the position: no marketing profiles,
no analytics identifiers, no advertising cookies, no third-party data
purchases, no automated decision-making or profiling, and **no international
transfers** beyond Microsoft's own support arrangements under its DPA — data
is stored in **UK South**.

**Page-visit counts (not personal data).** The public site records, for each
visit to a public page, a random per-tab id held only in the browser's memory,
the page name and the time. No IP address, user agent, referrer or form
content is stored, and the id is never written to the visitor's device, so no
visitor can be identified from these rows and no processor is involved. Counts
are the owner's own, in the owner's own Azure storage. Raw rows are purged on
the retention schedule. The absence of an analytics *identifier* above still
holds: nothing here survives a closed tab (REQ-058).

---

## 3. Recipients and processors

| Processor | What it does | Personal data involved | Safeguard |
| --- | --- | --- | --- |
| **Microsoft Azure** (Table Storage, Functions, Static Web Apps) | Hosts the app; stores all records | All of §2 records 1–4 | [Microsoft Products and Services DPA](https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA); UK South region |
| **Microsoft Entra ID** | Teacher sign-in | §2 record 5 only | Same Microsoft DPA |
| **GitHub** | Source code and CI | **None** — no personal data in the repository (dev seed data is invented people) | n/a |
| **The owner's own storage** | Holds the monthly JSON dumps | All of §2 records 1–4 | Not a third party; owner custody, private storage, no sharing |

**Rule — no new processor without paperwork first.** Adding analytics, an
email/newsletter provider, a backup service, an SMS gateway or any AI service
means updating **this table and the public policy before** it ships, not
after. The policy currently tells families there are no such providers; that
statement must stay true.

### 3.1 Security measures

Every item below is true of the build today — nothing aspirational is listed,
because the policy is only as honest as this list.

- **HTTPS** on every endpoint, public and teacher.
- **Microsoft Entra sign-in enforced on every teacher endpoint** in prod
  (REQ-003/004) — the API returns 401 to unauthenticated requests rather than
  relying on the UI to hide data.
- **Encryption at rest** — Azure Storage service encryption on the tables.
- **UK South** region for both the app and the data (prod, since REQ-009).
- **Single-person access**: the tutor is the only account with access to the
  portal or the storage account.
- **Managed identity / Key Vault** for the storage connection — no secrets in
  source (REQ-004/009).
- **Erasure implemented, not promised**: `DELETE /api/students/{id}` (cascades
  to classes and settlements), `DELETE /api/leads/{id}`,
  `DELETE /api/testimonials/{id}`.
- ❌ **No independent backups** beyond the monthly dumps, and no encrypted
  off-site backup service. Stated plainly so no one claims otherwise.

---

## 4. Breach plan

A personal-data breach is any loss, theft, unauthorised access, accidental
disclosure or destruction — a leaked dump file and a mistakenly public storage
container both count.

**Who decides:** the owner, personally. There is no committee and no
delegation; if the owner is unreachable, the assessment waits and the 72-hour
clock keeps running, so contain first.

### Step 1 — Contain (immediately)

Revoke the exposed credential or access, take the affected surface offline if
that is what it takes, and stop the leak spreading. Do not delete evidence of
what happened.

### Step 2 — Assess (same day)

Write down: what data, whose, how many people, when it started, whether it is
recoverable, and whether the data was encrypted or readable. Children's data
raises the risk rating — say so explicitly in the assessment.

### Step 3 — Notify the ICO (within 72 hours of becoming aware)

Required unless the breach is **unlikely to result in a risk** to people's
rights and freedoms. If it is a genuinely close call, **report it** — the
threshold is not "certain harm".

| ICO reporting | |
| --- | --- |
| Online | <https://ico.org.uk/for-organisations/report-a-breach/> |
| Phone | **0303 123 1113** |
| Deadline | 72 hours from awareness; a late report must explain the delay |

Record the decision **either way**, with the reasoning and the date. A
documented "assessed, not reportable" is a defence; silence is not.

### Step 4 — Inform the families (without undue delay)

Required where the risk to individuals is **high**. Tell them in plain
English: what happened, what data, what it means for them, what has been done,
and how to reach the owner. Given this is children's data, lean towards
telling parents.

### Step 5 — Record and learn

Log every breach — reportable or not — in §7 below. UK GDPR requires the
record regardless of whether the ICO was told.

---

## 5. DPIA screening note

**Dated 2026-07-31. Conclusion: a full DPIA is not required. Recorded here
because the screening itself is the evidence.**

A DPIA is required for processing likely to result in a high risk, and the
ICO's list includes processing children's data. This app does process
children's data, so the question is taken seriously rather than waved away.

The reasoning against:

- **Not "large scale"** — a single tutor's roster, tens of students, not
  thousands. Scale is central to the ICO's high-risk criteria.
- **No profiling, no automated decisions, no tracking** — progress scores are
  the teacher's own assessment, recorded and read by that same teacher.
- **No special-category data** knowingly held (§2.1), and the forms actively
  steer away from it.
- **No data matching, combining or sharing** with any other source or party.
- **No innovative technology** applied to the data, and no systematic
  monitoring of a publicly accessible area.
- **Expected by the parents** — the data is exactly what arranging tutoring
  requires, given by them for that purpose.

Against that: the data is about children, includes home addresses and dates of
birth, and one person holds all of it. The mitigations are the §3.1 controls,
the minimisation review in REQ-030/031, and the retention schedule.

**Review triggers** — redo this screening if any of these happen: student
numbers grow past roughly 100; a second person gains access to the data; any
special-category data starts being recorded deliberately; profiling,
automated assessment or an AI service touches student records; or the data
starts being shared with another organisation.

---

## 6. Known gaps

Carried from [PRIVACY-RETENTION.md §4](./PRIVACY-RETENTION.md#4-known-gaps--owner-decisions-needed)
so this document stands alone:

1. ⚠️ **Erasing a student destroys payment history** that §2 record 4 says is
   kept for six years. The policy page was corrected on 2026-07-31 to match
   the code rather than the intent. Recommended fix: retain a de-identified
   financial record on erasure, then restore the tax-law wording. Owner
   decision outstanding.
2. ⚠️ **Enquiries have no "last touched" date**, so retention anchors on the
   submission date instead.
3. ⚠️ **Monthly dumps outlive live erasure** by up to 12 months. The rolling
   window is the bound; the policy must not promise faster.
4. ⚠️ **ICO registration is unconfirmed** — see §8.

---

## 7. Breach log

Every breach, reportable or not. No breaches to date.

| Date discovered | What happened | Data and people affected | Risk assessment | ICO notified? | Families told? | Actions taken |
| --- | --- | --- | --- | --- | --- | --- |
| _(none)_ | | | | | | |

---

## 8. ICO registration — owner action outstanding

⚠️ **Not yet confirmed. This is an owner action, not a code change.**

Most UK organisations processing personal data must pay the ICO's annual
**data protection fee** (tier 1, small organisations: **£52/year**, or £40 by
direct debit). Exemptions exist but are narrow, and a business holding
children's records on a live web app is unlikely to fall inside one.

**Do this:** run the ICO's self-assessment at
<https://ico.org.uk/for-organisations/data-protection-fee/self-assessment/>
and record the outcome below.

| | |
| --- | --- |
| Self-assessment completed on | ⚠️ _pending_ |
| Outcome | ⚠️ _pending_ — registration number, or the exemption relied on and why |
| Fee tier and renewal date | ⚠️ _pending_ |

---

## 9. Keeping this current

This document is only useful if it stays true. Update it **in the same pull
request** as any change that adds, removes or repurposes personal data — a new
field on a form, a new stored entity, a new processor, a change to retention
or access. [CONTRIBUTING.md](../CONTRIBUTING.md) carries this as a review step.

| Date | Change |
| --- | --- |
| 2026-07-31 | Created (REQ-034), alongside the retention schedule (REQ-033) |
