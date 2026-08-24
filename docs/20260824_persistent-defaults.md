# Persistent Forgejo defaults

## Goal

Persist host, SSH base, default organization, and preferred remote in `~/.config/forgejo-cli/config.json` so each user configures the self-hosted Forgejo instance once, while retaining environment overrides, Git-remote discovery, personal repositories, and authenticated user detection.

## Decisions

- Store optional `default_host`, `ssh_base`, `default_org`, and `default_remote` values in the existing owner-only configuration file.
- Do not persist a default user; resolve the current account through authenticated Forgejo API behavior and retain `FJ_USER` only as an explicit environment target override.
- Add `fj config set KEY VALUE` and `fj config unset KEY` for `default-host`, `ssh-base`, `default-org`, and `default-remote`.
- Use host precedence: explicit host, `FJ_HOST` and compatible force-host aliases, selected Git remote host, `FJ_FALLBACK_HOST`, persisted default host.
- Use remote precedence: explicit remote, `FJ_REMOTE`, persisted default remote, existing automatic selection.
- Use repository precedence: explicit repository, usable Git remote, then owner default plus current-directory basename.
- Use organization precedence: explicit owner/organization, `--no-org` personal namespace, `FJ_ORG`, persisted default organization.
- Use SSH-base precedence: explicit URL, `FJ_SSH_BASE`, persisted SSH base, server-provided URL.
- `--no-org` bypasses environment and persisted organization defaults for repository create, fork, and one-part migrate destinations; it conflicts with an explicit organization or destination owner.
- Preserve unknown behavior and existing configuration credentials, aliases, OAuth client IDs, and SSH preferences during updates.

## Approach

- Extend configuration validation with optional defaults and add focused load/update helpers.
- Resolve environment overrides and persisted defaults once at CLI boundaries with injectable configuration for tests.
- Correct fallback-host ordering so Git remotes remain authoritative unless a force-host input is supplied.
- Keep personal repository creation on Forgejo's authenticated user endpoint; resolve authenticated identity only where an explicit personal owner is required.
- Document one-time configuration and per-command overrides.

## Tasks

- [x] Extend the configuration schema and persistence helpers for typed defaults, preserving existing files and permissions.
- [x] Add and test `config set` and `config unset` commands for the four supported keys.
- [x] Integrate persisted host, SSH-base, organization, and remote defaults with environment overrides and Git-context precedence.
- [x] Add and test `--no-org` conflict handling and personal-namespace behavior for repository create, fork, and migrate.
- [x] Add cross-boundary precedence and non-regression tests for configuration, environment, remotes, authentication identity, and SSH URLs.
- [x] Update README documentation with one-time setup, override, unset, and personal-repository examples.
- [x] Run formatting, type checking, tests, build, and diff verification.

## Paths

- `src/configuration/forgejoConfigurationSchema.ts`
- `src/configuration/forgejoConfigurationLoad.ts`
- `src/configuration/forgejoConfigurationSave.ts`
- `src/configuration/forgejoConfigurationDefaults.ts`
- `src/configuration/forgejoEnvironmentDefaults.ts`
- `src/repositories/forgejoRepositoryContextResolve.ts`
- `src/cli/forgejoCliCommandHierarchy.ts`
- `src/cli/forgejoCliParse.ts`
- `src/cli/forgejoCliHostResolve.ts`
- `src/cli/forgejoCliRun.ts`
- `src/index.ts`
- `tests/forgejoConfiguration.test.ts`
- `tests/forgejoCli.test.ts`
- `tests/forgejoCliRepo.test.ts`
- `tests/forgejoRepositoryContextResolve.test.ts`
- `tests/forgejoEnvironmentDefaults.test.ts`
- `README.md`
