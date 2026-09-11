# Goal
Add verbose CLI metadata to sibling projects offering executable CLIs, and make project-creator set it up automatically through a recipe step.

# Decisions
- Preserve existing plain version output and backend version semantics.
- Prefer `version --verbose`, adapting existing command conventions where necessary.
- Include executable/target, package version/description/author/license/project, installation type, runtime/requirements, and platform/OS release when available. Omit unavailable build metadata.
- Use existing dependencies and built-ins; derive metadata rather than hard-code it.
- Cover operational CLIs as well as product CLIs; exclude ordinary package build/test scripts and dependency directories.
- Respect each repository's instructions and existing changes; do not commit or publish packages.

# Approach
Inventory direct sibling repositories, implement independent repository-scoped changes, add an automatic CLI metadata recipe step, and verify each affected CLI and generated output.

# Tasks
1. Complete sibling executable inventory and confirm scope. Status: complete; 15 sibling repositories.
2. Add metadata to confirmed sibling CLIs in repository-scoped increments. Status: complete. Scope: assets-optimizer, assets-service, authworks, caddy-projects, codex-imagen, google-search-console-client, lexware-client, minimax, outscraper-client, project-creator, project-registry, ralph, telegram-send, waha-client, zitadel-cli.
3. Add project-creator recipe step and generation tests. Status: complete.
4. Independently verify affected repositories and summarize supported commands. Status: complete. MiniMax and project-registry use `--version --verbose`; other main CLIs support `version --verbose`.
5. Run commits skill separately in every changed repository, including forgejo-cli, preserving unrelated work. Status: sibling repositories complete; forgejo-cli finalization in progress.
