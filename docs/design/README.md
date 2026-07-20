# Teaching Tracker — Design Documentation

Whole-system design docs spanning both repositories — the **`TeachingTracker`** React SPA and the **`func-teaching-tracker`** Azure Functions API + Terraform infrastructure.

| Document | What it covers |
|---|---|
| **[TDD.md](./TDD.md)** — Technical Design Document | System context, container architecture, frontend & backend design, data model (ER), key flows (sequence), security, infrastructure (Terraform), CI/CD, non-functionals, and known gaps/risks. |
| **[IFDD.md](./IFDD.md)** — Interface & Functional Design Document | Access model, full **API reference** (every endpoint contract), **data dictionary**, per-screen **functional specs**, and **user journeys**. |

## Rendered hub

An interactive, diagram-rich rendering of both documents:
**[claude.ai/code/artifact/d5897b6f-9012-4eca-8399-93959a9c4c89](https://claude.ai/code/artifact/d5897b6f-9012-4eca-8399-93959a9c4c89)** — private until shared. Source: [`design-hub.html`](./design-hub.html).

## How these were built
Reverse-engineered from source via parallel extraction across three domains (frontend, backend/API, infra/delivery), then synthesised — so every claim is grounded in code and cited `file:line`. They are meant to be **re-verified against the code** rather than trusted as a snapshot; when the code moves, re-run the extraction.

## Diagrams
Both docs use [Mermaid](https://mermaid.js.org/) fenced blocks, which render natively on GitHub and in the companion Artifact.

## Known drift flagged (fix candidates)
- OpenAPI spec is missing `DELETE /sessions/{id}`, `POST /sessions/{id}/members`, and the `datedNotes` field; `by-month` doc says `totalExpected` vs code `totalDue`.
- `DATA_STORE` is read once at process start — a config flip needs a restart/redeploy.
- Prod `auth_enforced = false` (API logs but does not reject unauthenticated calls) — fix queued in func-teaching-tracker PR #26, apply pending. (Residency **resolved**: prod moved to UK South.)
- Terraform state is local and holds secrets.
