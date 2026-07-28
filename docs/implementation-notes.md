# Implementation Notes

## Small decisions already made

- Markdown rather than MDX for published content to reduce complexity in a public teaching repository
- A client-side market panel that calls an internal route so the homepage can remain locally runnable without build-time access to private services
- No CSS framework in the first iteration; styles are plain CSS to keep the visual system obvious and editable
- Terraform environment roots are separate rather than using workspaces so production and non-production remain explicit
- `dev` is intended to auto-deploy to non-production on every push
- Non-production is allowed to consume production data only through a narrow read-only API surface, not through broad shared credentials
- The current data API contract is server-side `X-API-Key` authentication rather than browser access or workload identity
- Cloud Run IAP is managed in Terraform so deploys do not silently remove authenticated browser access after manual console changes; the module uses the Google beta provider because direct Cloud Run IAP is currently a beta Terraform field
- Terraform provider lock files are committed per environment root so local validation and CI use the same provider versions
- Each environment root declares a GCS backend; CI supplies only the environment-specific bucket and prefix so state persists between ephemeral runners
- Firebase Hosting is the production custom-domain edge because it avoids the fixed cost of a global load balancer and the production limitations of direct Cloud Run domain mapping
- Existing authoritative DNS is not migrated automatically because the domain carries Google Workspace mail; Firebase-required records are exposed as Terraform outputs instead

## Pending refinements

- Inventory the existing domain records before considering a future Cloud DNS migration
- Decide whether preview environments are worth the added complexity
- Add observability resources such as uptime checks and alerting policies
