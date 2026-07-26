# Bootstrap

The environment roots are written to support remote state, but this repository does not hard-code a backend because the storage buckets must exist first.

Use this directory if you want Terraform to create state buckets with local state as the bootstrap step, then configure the environment roots to use those buckets as remote backends.
