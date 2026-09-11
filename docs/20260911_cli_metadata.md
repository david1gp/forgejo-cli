# Goal
Extend `fj version --verbose` to display CLI/package and environment metadata while keeping `fj version` unchanged.

# Decisions
- Reuse the existing verbose version command and existing dependencies.
- Show executable path and resolved target, version, description, author, license, project URL, installation type, runtime and declared requirements, platform and OS release, and available build metadata.
- Derive values from package metadata and the current environment; do not invent unavailable installation or build details.
- Omit build details when metadata is unavailable.

# Approach
Inspect the version flow, implement metadata reporting using existing conventions and built-ins, then verify with focused tests and real CLI invocations.

# Tasks
1. Implement metadata reporting and focused tests. Status: complete.
2. Independently verify output and regression coverage. Status: complete.
