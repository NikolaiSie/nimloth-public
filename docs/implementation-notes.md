# Implementation Notes

## Small decisions already made

- Markdown rather than MDX for published content to reduce complexity in a public teaching repository
- A client-side market panel that calls an internal route so the homepage can remain locally runnable without build-time access to private services
- No CSS framework in the first iteration; styles are plain CSS to keep the visual system obvious and editable
- Terraform environment roots are separate rather than using workspaces so production and non-production remain explicit
- `dev` is intended to auto-deploy to non-production on every push
- Non-production is allowed to consume production data only through a narrow read-only API surface, not through broad shared credentials

## Pending refinements

- Add a production custom domain front end once the DNS and certificate path is finalized
- Decide whether preview environments are worth the added complexity
- Add observability resources such as uptime checks and alerting policies
