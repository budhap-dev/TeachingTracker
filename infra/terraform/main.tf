# One isolated Static Web App (with its own resource group) per environment.
module "web" {
  source   = "./modules/static_web_app"
  for_each = var.environments

  project  = var.project
  env      = each.key
  location = each.value.location
  sku_tier = each.value.sku_tier
  sku_size = each.value.sku_size

  custom_domain = each.value.custom_domain
  tags          = merge(var.tags, { environment = each.key })
}
