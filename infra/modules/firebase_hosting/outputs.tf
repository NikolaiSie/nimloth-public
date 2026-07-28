output "domain_status" {
  description = "Firebase ownership and hosting status for each custom domain."
  value = merge(
    {
      (google_firebase_hosting_custom_domain.primary.custom_domain) = {
        host_state      = google_firebase_hosting_custom_domain.primary.host_state
        ownership_state = google_firebase_hosting_custom_domain.primary.ownership_state
      }
    },
    {
      for domain, mapping in google_firebase_hosting_custom_domain.redirect : domain => {
        host_state      = mapping.host_state
        ownership_state = mapping.ownership_state
      }
    }
  )
}

output "hosting_url" {
  description = "Default Firebase Hosting URL."
  value       = "https://${google_firebase_hosting_site.this.site_id}.web.app"
}

output "required_dns_updates" {
  description = "DNS records reported by Firebase for ownership verification and traffic routing."
  value = merge(
    {
      (google_firebase_hosting_custom_domain.primary.custom_domain) = google_firebase_hosting_custom_domain.primary.required_dns_updates
    },
    {
      for domain, mapping in google_firebase_hosting_custom_domain.redirect : domain => mapping.required_dns_updates
    }
  )
}
