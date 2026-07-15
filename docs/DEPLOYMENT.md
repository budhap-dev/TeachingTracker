# Frontend deployment — dev / test / prod

The Teaching Tracker frontend is hosted on **Azure Static Web Apps** (Free tier),
one resource per environment, each talking only to its matching Function App from
the [`func-teaching-tracker`](https://github.com/budhap-dev/func-teaching-tracker)
repo.

```
Frontend (Static Web App)                API (Function App)
  swa-teachtracker-dev    ─── /api ──▶   func-teachtracker-dev-pjlmrq
  swa-teachtracker-test   ─── /api ──▶   func-teachtracker-test-mtbace
  swa-teachtracker-prod   ─── /api ──▶   func-teachtracker-prod-gjvecw
```

## Hosted URLs

| Env      | Frontend (open this)                                            | API base URL                                                    |
| -------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| **dev**  | https://delightful-water-09b7c480f.7.azurestaticapps.net         | https://func-teachtracker-dev-pjlmrq.azurewebsites.net/api       |
| **test** | https://delightful-sea-0e15b030f.7.azurestaticapps.net           | https://func-teachtracker-test-mtbace.azurewebsites.net/api      |
| **prod** | https://nice-sea-095463c0f.7.azurestaticapps.net                 | https://func-teachtracker-prod-gjvecw.azurewebsites.net/api      |

Each environment serves a **different dataset**, so you can tell them apart at a
glance (counts are owned by the API repo's `src/data/seed.ts`):

| Env  | Students | Booked classes | Total expected / month |
| ---- | -------- | -------------- | ---------------------- |
| dev  | 5        | 4              | £590                   |
| test | 10       | 6              | £1,295                 |
| prod | 15       | 8              | £2,115                 |

### Azure resources

| Env  | Static Web App          | Resource group             |
| ---- | ----------------------- | -------------------------- |
| dev  | `swa-teachtracker-dev`  | `rg-teachtracker-dev-web`  |
| test | `swa-teachtracker-test` | `rg-teachtracker-test-web` |
| prod | `swa-teachtracker-prod` | `rg-teachtracker-prod-web` |

Subscription `e16bea76-64f0-45a5-ae4a-53701ff61801` · Tenant `d2fa8fd6-d1f2-4ac4-bcf5-e8dd34885bb3`

## How an environment connects to its API

The only per-environment knob is **`VITE_API_BASE_URL`**, baked into the bundle at
build time. All API access goes through [`src/api/client.ts`](../src/api/client.ts);
components never reference a hostname.

**The frontend ships no data of its own.** Every screen is populated from the API
via redux-saga. If `VITE_API_BASE_URL` is unset, the app still renders but shows
zeros and empty lists — there is no seed-data fallback. To run locally you need a
backend (see [Local development](#local-development)).

Because the URL is compiled in, **each environment is built separately** with its
own value — the pipeline does not promote a single artifact across envs.

> Migration note: to move to a Static Web Apps **Standard** linked backend later
> (same-origin `/api/*` proxy, no CORS), set `VITE_API_BASE_URL=""` so requests
> become relative, link each SWA to its Function App, and drop the CORS config in
> the API repo. No component code changes.

## CORS — configured in the API repo

The browser calls the Function App cross-origin, so each Function App allows
**only** its paired SWA origin. This is already applied, via `cors_allowed_origins`
in the API repo's `infra/terraform/variables.tf`:

| Env  | Function App allows |
| ---- | ------------------- |
| dev  | `https://delightful-water-09b7c480f.7.azurestaticapps.net` |
| test | `https://delightful-sea-0e15b030f.7.azurestaticapps.net`   |
| prod | `https://nice-sea-095463c0f.7.azurestaticapps.net`         |

Cross-env calls are refused (dev's origin cannot call the prod API). To verify:

```bash
az functionapp cors show -n func-teachtracker-dev-pjlmrq -g rg-teachtracker-dev
```

> ⚠️ `az functionapp show --query siteConfig.cors` reports **empty** on Flex
> Consumption even when CORS is correctly set. That's a reporting quirk, not a
> misconfiguration — use `az functionapp cors show` (above) or check the
> `Access-Control-Allow-Origin` response header on a preflight.

## Deploy pipeline

Push to `main` auto-promotes **dev → test**. Production is deliberately separate.

```
push to main ──▶ dev (auto) ──▶ test (auto, after dev)

prod ──▶ manual only: "Deploy frontend to Production (manual)"
```

- [`deploy.yml`](../.github/workflows/deploy.yml) — dev → test on push
- [`deploy-prod.yml`](../.github/workflows/deploy-prod.yml) — prod, `workflow_dispatch` only
- [`deploy-env.yml`](../.github/workflows/deploy-env.yml) — reusable per-env build + deploy

Each job checks out, runs `npm ci`, builds with that environment's
`VITE_API_BASE_URL`, and deploys `dist/` to that env's Static Web App using its
deploy token.

### Deploying to production

There is **no approval button**. GitHub Environment *required reviewers* need a
public repo or a paid plan (setting one returns `HTTP 422` here), so prod is gated
by being a separate manually-triggered workflow instead.

```bash
# 1. API FIRST (other repo)
gh workflow run deploy-prod.yml --repo budhap-dev/func-teaching-tracker --ref main

# 2. THEN the frontend
gh workflow run deploy-prod.yml --repo budhap-dev/TeachingTracker --ref main
```

Or in the GitHub UI: **Actions → "Deploy … to Production (manual)" → Run workflow → `main`**.

> ⚠️ **Order matters — deploy the API before the frontend.** The frontend calls
> `/sessions` and `/payments/by-month`; if the frontend ships first, those return
> **404** on an older API and Class Scheduling + Payment Tracker render empty. The
> reverse is safe: the API keeps serving the flat `/payments` an older bundle uses.

## GitHub configuration

Three GitHub Environments (`dev`, `test`, `prod`), each with:

| Kind     | Name                              | Value                                                       |
| -------- | --------------------------------- | ----------------------------------------------------------- |
| Variable | `VITE_API_BASE_URL`               | That env's API base URL (see [Hosted URLs](#hosted-urls))   |
| Secret   | `AZURE_STATIC_WEB_APPS_API_TOKEN` | That env's SWA deploy token                                 |

Re-read the deploy tokens any time with:

```bash
cd infra/terraform && terraform output -json static_web_app_api_tokens
```

## Infrastructure

Terraform in [`infra/terraform`](../infra/terraform) creates one resource group +
one Free-tier Static Web App per environment. State is **local** — run these from
the machine holding `terraform.tfstate`.

```bash
cd infra/terraform
az login
terraform init
terraform apply

terraform output static_web_app_urls                # public URLs
terraform output -json static_web_app_api_tokens    # deploy tokens (sensitive)
```

> Static Web Apps only exist in a few regions (`eastus2`, `westus2`, `centralus`,
> `westeurope`, `eastasia`) — **not** `eastus`. Default here is `eastus2`.

## Local development

The app needs a backend — **run the API locally**:

```bash
VITE_API_BASE_URL=http://localhost:7071/api npm start   # vite on :3000
```

> You can't point a local frontend at a **deployed** API: each Function App allows
> only its paired `*.azurestaticapps.net` origin, so the browser blocks
> `http://localhost:3000` with a CORS error. (Adding a localhost origin to
> `cors_allowed_origins` for `dev` would work, but weakens the isolation.)

See the API repo's README for running it. Note Azure Functions Core Tools is
**not** currently installed on this machine — `.claude/skills/verify/SKILL.md`
documents a working alternative that serves the compiled handlers over HTTP.

To verify every screen against real API data in a browser, see
[`.claude/skills/verify/SKILL.md`](../.claude/skills/verify/SKILL.md).

## Known gap

Only **class scheduling** writes back to the API (`POST /sessions`). Adding or
editing a student, and editing a payment, update Redux only — no request is sent,
so those edits **revert on reload**. The endpoints (`POST /students`,
`POST /payments`) and API clients exist; no saga wires them yet.
