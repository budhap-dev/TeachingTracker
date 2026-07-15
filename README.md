# Teaching Tracker

Teaching Tracker is a responsive React + TypeScript application for managing
student records, progress, class scheduling, fees, and payments.

All data is served by the [`func-teaching-tracker`](https://github.com/budhap-dev/func-teaching-tracker)
API and loaded through **redux-saga** — the frontend ships no data of its own.

## Hosted environments

| Env      | Frontend                                                 | API base URL                                                | Data          |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------- | ------------- |
| **dev**  | https://delightful-water-09b7c480f.7.azurestaticapps.net  | https://func-teachtracker-dev-pjlmrq.azurewebsites.net/api   | 5 students    |
| **test** | https://delightful-sea-0e15b030f.7.azurestaticapps.net    | https://func-teachtracker-test-mtbace.azurewebsites.net/api  | 10 students   |
| **prod** | https://nice-sea-095463c0f.7.azurestaticapps.net          | https://func-teachtracker-prod-gjvecw.azurewebsites.net/api  | 15 students   |

Each environment has its own Static Web App wired to its own Function App, and
serves a distinct dataset. Full details, CORS, and the deploy runbook:
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Features

- Dashboard overview
- Student management, with per-student monthly **fees**
- Student detail pages
- Class scheduling (persisted to the API)
- Monthly payment tracking, grouped by month with server-computed totals
- Responsive layout for desktop and mobile
- Redux Toolkit + redux-saga state management
- Sass styling

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Redux Toolkit + **redux-saga**
- MUI
- Sass
- Vitest + Testing Library (100% coverage enforced)

## Project structure

```
src/
├── api/          # API client + typed endpoint modules (students, payments, sessions)
├── components/   # presentational UI components
├── store/        # Redux slice, sagas, store wiring
├── hooks/        # form + theme hooks
├── test/         # fixtures + test setup
└── ROUTE.tsx     # container: selects state, dispatches, renders views
```

## Getting Started

### Prerequisites

- Node.js **24+** (`.nvmrc` pins 24 — run `nvm use`)
- npm
- A running backend (see below)

### Install

```bash
npm install
```

### Run locally

The app needs the API. With `func-teaching-tracker` running on `:7071`:

```bash
VITE_API_BASE_URL=http://localhost:7071/api npm start
```

Then open http://localhost:3000.

> Without `VITE_API_BASE_URL` the app still renders, but every screen shows zeros
> and empty lists — there is no bundled seed data. You cannot point a local
> frontend at a deployed API (CORS allows only the paired Static Web App origin).

### Other scripts

```bash
npm run build      # tsc -b && vite build
npm test           # vitest (coverage enforced at 100%)
npm run lint       # eslint
```

## Deployment

Push to `main` auto-deploys **dev → test**. Production is a separate manual
workflow (**Actions → "Deploy frontend to Production (manual)"**), and the API
must be deployed **before** the frontend. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Known gap

Only class scheduling writes back to the API. Adding/editing a student and
editing a payment update Redux only — they revert on reload.

## Roadmap

- Persist student and payment edits via the API (`POST /students`, `POST /payments`)
- Replace the API's in-memory store with Cosmos DB
- Add authentication for teachers
- Add analytics charts
- Support multiple teachers
