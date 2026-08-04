output "static_web_app_names" {
  description = "Map of environment -> Static Web App resource name."
  value       = { for k, m in module.web : k => m.name }
}

output "static_web_app_hostnames" {
  description = "Map of environment -> public Static Web App hostname (the frontend URL)."
  value       = { for k, m in module.web : k => m.default_host_name }
}

output "static_web_app_urls" {
  description = "Map of environment -> full https URL. Use these as the Function App CORS allowed origins."
  value       = { for k, m in module.web : k => "https://${m.default_host_name}" }
}

output "static_web_app_api_tokens" {
  description = "Map of environment -> SWA deployment token. Store each as the GitHub secret AZURE_STATIC_WEB_APPS_API_TOKEN in the matching environment."
  value       = { for k, m in module.web : k => m.api_key }
  sensitive   = true
}

output "custom_domain_validation_tokens" {
  description = "Environment -> apex TXT validation token (REQ-035). Read with: terraform output custom_domain_validation_tokens"
  value       = { for k, m in module.web : k => m.custom_domain_validation_token }
  sensitive   = true
}
