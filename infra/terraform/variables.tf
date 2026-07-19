variable "project" {
  description = "Short project name used as a prefix for Azure resources (lowercase alphanumeric)."
  type        = string
  default     = "teachtracker"

  validation {
    condition     = can(regex("^[a-z0-9]{1,20}$", var.project))
    error_message = "project must be 1-20 lowercase alphanumeric characters."
  }
}

# One Static Web App is provisioned per entry in this map. The keys must match
# the GitHub Environment names used in the deploy workflow (dev/prod).
#
# NOTE: Azure Static Web Apps are only available in a subset of regions —
# eastus2, westus2, centralus, westeurope, eastasia. Do not use "eastus".
variable "environments" {
  description = "Per-environment configuration (keyed by environment name: dev/prod)."
  type = map(object({
    location = string
    sku_tier = optional(string, "Free")
    sku_size = optional(string, "Free")
  }))
  default = {
    # REQ-009 phase 0 note: the SWA stays here deliberately. It serves only
    # the static bundle — no personal data is processed or stored on it (the
    # browser talks to the Function App directly), westeurope rejected new
    # customers at move time, and SWA offers no UK region. The data stack
    # (Functions, Key Vault, storage) is what moved to UK South.
    dev = {
      location = "eastus2"
    }
    prod = {
      location = "eastus2"
    }
  }
}

variable "tags" {
  description = "Base tags applied to all resources (environment tag is added per env)."
  type        = map(string)
  default = {
    project   = "teaching-tracker-web"
    managedBy = "terraform"
  }
}
