# Runbook — abhitutor.co.uk cutover (REQ-035 part 2)

> **✅ EXECUTED 2026-08-04** — registered in the morning, live by evening.
> Steps 1–4 ran as written (apex TXT validated in ~18 minutes; www's
> certificate landed first, apex minutes later). Both hostnames answer
> with valid certificates; API preflight verified for the new origin.
> Kept for reference, re-runs on a future domain, and the rollback.
> Outstanding aftercare at execution time: prod promotion + prod
> site-editor republish, PWA re-add, Search Console.

The domain was registered 2026-08-04 (Cloudflare, `.co.uk` only — owner
call). This runbook takes it from registered to live. Each step says who
runs it. Total elapsed time is an afternoon, most of it DNS/certificate
waiting.

## 1. DNS, first record — owner, Cloudflare dashboard

Add a **CNAME** for `www` *before* any Terraform apply (the www binding
validates by delegation, and creation times out without it):

| Type  | Name  | Target                                   | Proxy status |
|-------|-------|------------------------------------------|--------------|
| CNAME | `www` | `nice-sea-095463c0f.7.azurestaticapps.net` | **DNS only (grey cloud)** |

⚠️ **Grey cloud, not orange.** Proxied records break Azure's validation
and certificate issuance. This is the classic Cloudflare + SWA tripwire.

## 2. Backend apply — owner (or paired), func-teaching-tracker

```sh
cd func-teaching-tracker/infra/terraform
terraform plan   # expect: prod Function App CORS + Entra SPA redirect URIs
terraform apply
```

One list drives both: `cors_allowed_origins` also feeds the SPA redirect
URIs, so this single apply lets the API accept the new origin *and* lets
Microsoft sign-in return to it. No portal clicks.

## 3. Frontend apply — owner (or paired), TeachingTracker

```sh
cd TeachingTracker/infra/terraform
terraform plan   # expect: two azurerm_static_web_app_custom_domain resources
terraform apply
```

- The **www** binding validates against the CNAME from step 1.
- The **apex** binding issues a TXT validation token. While the apply is
  in flight (or right after), read it and add the record:

```sh
terraform output custom_domain_validation_tokens
```

| Type | Name | Content            | Proxy status |
|------|------|--------------------|--------------|
| TXT  | `@`  | *(the prod token)* | n/a          |

## 4. DNS, traffic record for the apex — owner, Cloudflare

Once the apex validates (Azure portal shows the domain "Ready", usually
minutes):

| Type  | Name | Target                                   | Proxy status |
|-------|------|------------------------------------------|--------------|
| CNAME | `@`  | `nice-sea-095463c0f.7.azurestaticapps.net` | **DNS only (grey cloud)** |

Cloudflare flattens the apex CNAME automatically. Azure then issues the
managed TLS certificate itself — free, auto-renewing; allow up to a few
hours the first time.

## 5. Verify — either of us

- `https://abhitutor.co.uk` and `https://www.abhitutor.co.uk` load with a
  valid padlock; the old `*.azurestaticapps.net` URL still works.
- Teacher sign-in round-trips on the new domain (step 2's redirect URIs).
- The app talks to the API (no CORS errors in the console).
- `https://abhitutor.co.uk/version.json` reports the prod build.

## 6. Aftercare — owner

- Re-add the PWA to phone home screens under the new domain.
- If using Google Search Console: add the new domain property.
- Optional, later: if `abhitutor.com` still matters, check it's free and
  buy it then (deliberately skipped at registration).

## Rollback

Delete the two DNS records; the site continues on the
`*.azurestaticapps.net` hostname untouched. The Terraform resources can
stay (an unresolvable custom domain serves nothing) or be removed with a
targeted destroy.
