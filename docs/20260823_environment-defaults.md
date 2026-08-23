# Environment defaults

## Goal

Allow `fj` commands to use shell-configurable defaults for Forgejo host, SSH base, expected user, organization, Git remote, and the current directory's repository name without repeating CLI options.

## Decisions

- Use `FJ_HOST`, `FJ_FALLBACK_HOST`, `FJ_SSH_BASE`, `FJ_USER`, `FJ_ORG`, and `FJ_REMOTE`; keep existing `FORGEJO_*` host aliases compatible.
- Resolve values in this order: explicit CLI input, environment default, existing Git/config discovery, built-in fallback.
- Resolve the API host as `FJ_HOST`, then `FJ_FALLBACK_HOST`; preserve the current explicit `--host` precedence.
- Treat `FJ_SSH_BASE` as an SSH URL prefix such as `ssh://git@ssh.git.contentoren.de:2222`, used only when constructing SSH repository URLs.
- Use `FJ_ORG` as the default repository owner and `FJ_USER` as the default user/expected authenticated identity; do not silently interchange them.
- Use `basename(cwd)` only when neither an explicit repository nor usable Git remote identifies a repository.
- Use `FJ_REMOTE` as the preferred named remote when `--remote` is absent.
- Ignore blank environment values and make environment/cwd inputs injectable for deterministic tests.

## Approach

- Centralize environment parsing in one configuration resolver.
- Feed resolved defaults into repository context and command target resolution rather than reading `process.env` throughout command runners.
- Preserve all current explicit arguments, remote discovery, and compatibility aliases.
- Document each variable with precedence and shell examples.

## Tasks

- [x] Add and export a typed environment-default resolver with blank-value handling and focused unit tests.
- [x] Integrate host and preferred-remote defaults into repository context resolution while preserving explicit input and Git discovery precedence.
- [x] Add organization, user, and current-directory repository fallbacks only to commands whose targets may currently be omitted.
- [x] Apply the SSH-base prefix where SSH clone/remote URLs are constructed, preserving explicit URLs and SSH-selection flags.
- [x] Add CLI and repository-context coverage for precedence, fallback, and non-regression cases.
- [x] Document supported variables, semantics, precedence, and examples in the README.
- [x] Run formatting, type checking, tests, and build verification.

## Paths

- `src/configuration/forgejoEnvironmentDefaults.ts`
- `src/index.ts`
- `src/cli/forgejoCliHostResolve.ts`
- `src/cli/forgejoCliParse.ts`
- `src/cli/forgejoCliRun.ts`
- `src/cli/forgejoCliUserRun.ts`
- `src/cli/forgejoCliOrganizationRun.ts`
- `src/repositories/forgejoRepositoryContextResolve.ts`
- `src/repositories/forgejoRepositoryCloneMetadataGet.ts`
- `src/remotes/forgejoRemoteParse.ts`
- `tests/forgejoEnvironmentDefaults.test.ts`
- `tests/forgejoRepositoryContextResolve.test.ts`
- `tests/forgejoCli.test.ts`
- `tests/forgejoCliRepo.test.ts`
- `tests/forgejoCliUserResource.test.ts`
- `tests/forgejoCliOrganizationResource.test.ts`
- `README.md`
