locals {
  base = "${var.project}-${var.env}"
}

resource "azurerm_resource_group" "this" {
  name     = "rg-${local.base}-web"
  location = var.location
  tags     = var.tags
}

# Free-tier Static Web App. Content is served from a global CDN; `location` only
# selects where the app's metadata is hosted (must be a SWA-supported region).
resource "azurerm_static_web_app" "this" {
  name                = "swa-${local.base}"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_size
  tags                = var.tags
}

# The production custom domain (REQ-035): apex + www, both on the free tier's
# two custom-domain slots, TLS managed and renewed by Azure at no cost.
#
# Ordering matters on first apply:
#   - www validates by CNAME delegation, so the CNAME (www -> the SWA's
#     default hostname, DNS-only/grey-cloud on Cloudflare) must exist BEFORE
#     the apply, or creation times out.
#   - the apex validates by TXT token: the token appears once the apply is
#     in flight (terraform output custom_domain_validation_tokens) — add the
#     TXT at the apex while it waits, then the apex traffic record (CNAME
#     flattening on Cloudflare) makes the site answer.
resource "azurerm_static_web_app_custom_domain" "apex" {
  count = var.custom_domain == null ? 0 : 1

  static_web_app_id = azurerm_static_web_app.this.id
  domain_name       = var.custom_domain
  validation_type   = "dns-txt-token"
}

resource "azurerm_static_web_app_custom_domain" "www" {
  count = var.custom_domain == null ? 0 : 1

  static_web_app_id = azurerm_static_web_app.this.id
  domain_name       = "www.${var.custom_domain}"
  validation_type   = "cname-delegation"
}
