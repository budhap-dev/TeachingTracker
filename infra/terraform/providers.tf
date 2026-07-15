terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  # Authenticates via `az login` (Azure CLI) during local bootstrap.
  # Optionally pin the subscription: `export ARM_SUBSCRIPTION_ID=<sub-id>`.
}
