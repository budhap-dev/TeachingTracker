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
