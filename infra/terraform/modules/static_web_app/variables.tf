variable "project" {
  description = "Short project name prefix (lowercase alphanumeric)."
  type        = string
}

variable "env" {
  description = "Environment name (e.g. dev, prod). Must match the GitHub Environment name."
  type        = string
}

variable "location" {
  description = "Azure region. Must be a Static Web Apps-supported region (eastus2, westus2, centralus, westeurope, eastasia)."
  type        = string
}

variable "sku_tier" {
  description = "Static Web App SKU tier (Free or Standard)."
  type        = string
  default     = "Free"
}

variable "sku_size" {
  description = "Static Web App SKU size (Free or Standard)."
  type        = string
  default     = "Free"
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}

variable "custom_domain" {
  description = "Apex custom domain to bind (e.g. abhitutor.co.uk); www is bound alongside it. null = no custom domain (dev stays on the generated hostname deliberately)."
  type        = string
  default     = null
}
