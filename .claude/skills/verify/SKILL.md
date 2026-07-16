---
name: verify
description: Drive the TeachingTracker frontend in a real browser against real func-teaching-tracker API data, and screenshot every screen.
---

# Verifying TeachingTracker

The frontend ships **no static data** — every screen (Dashboard, Students,
Student Detail, Study Snapshot, Payment Tracker, Class Scheduling) is driven by
the `func-teaching-tracker` API via redux-saga. So you cannot verify anything
without a backend running. The surface is **pixels**: drive Chrome, screenshot.

## Handle: API + dev server

Azure Functions Core Tools is **not installed**, so don't try `func start`.
Instead serve the *real compiled handlers* over plain HTTP. Recipe that works:

1. Build the func app: `cd ../func-teaching-tracker && npm run build`
2. Run an HTTP shim that `require()`s `dist/functions/*.js` and calls each
   handler with a mock request (`{ params, query: URLSearchParams, text() }`)
   and context (`{ log }`). Handlers return `{ status, jsonBody }`.
   Set `Access-Control-Allow-Origin: *` and answer `OPTIONS` (POSTs preflight).
   Listen on `:7071`. Set `ENVIRONMENT=dev|prod` to pick the dataset.
   A working copy lives in the scratchpad as `api-shim.mjs` — rewrite it if gone.
3. Start the frontend against it:
   `VITE_API_BASE_URL=http://localhost:7071/api npm start`  (vite on :3000)

Routes the shim must cover: `GET/POST /api/students`, `GET/PUT /api/students/:id`,
`GET /api/payments`, `GET /api/payments/by-month`, `POST /api/payments`,
`GET/POST /api/sessions`.

## Handle: browser

No Playwright browsers are cached and `playwright` isn't a dependency. Use:

```bash
npm i playwright-core            # in a scratch dir
```
```js
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ channel: 'chrome' })  // uses installed Chrome
```

`channel: 'chrome'` avoids the ~400MB browser download.

## Gotchas

- **Wait properly.** `waitUntil: 'domcontentloaded'` + 1.5s is NOT enough — React
  hasn't mounted and you'll wrongly conclude the app renders nothing. Use
  `networkidle` + ~1s, or `findBy`-style polling.
- **`.content-stack` is not a reliable root selector.** Use `page.locator('main')`.
- Nav buttons: `page.getByRole('navigation').getByRole('button', { name: /^students$/i })`.
  Anchor `^...$` or "Students" also matches "Study Snapshot".
- Students list renders as **cards, not a `<table>`** — counting `table tbody tr`
  gives 0. Study Snapshot and Payment Tracker *do* use tables.
- Dev mode double-fires every fetch (React StrictMode). Expected; not a bug.

## Flows worth driving

- All six screens via the sidebar; assert env-appropriate counts
  (dev = 5 students / 4 sessions; prod = 15/8).
- Deep link `/students/3` cold → must show the student, not bounce to the list
  (there's a loading guard). `/students/9999` → redirects to the list.
- Schedule a class → POSTs to `/api/sessions` and persists server-side.
- Payment edit → month totals recompute in the summary cards.
- API down (`page.route('http://localhost:7071/**', r => r.abort())`) → app must
  still render the shell with zeroed stats, no uncaught errors.

## Known gap (not a regression)

Only **session creation** writes to the API. Student add/edit and payment edits
update Redux only — no `POST /students` / `POST /payments` is ever sent, so they
silently revert on reload. Don't report this as new breakage; it's a wiring gap.
