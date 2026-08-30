# @adaptive-ds/forgejo-cli

Result-based TypeScript tooling for Forgejo: an importable client library and the `fj` command-line interface.

[![npm](https://img.shields.io/npm/v/%40adaptive-ds%2Fforgejo-cli)](https://www.npmjs.com/package/@adaptive-ds/forgejo-cli)
[![license](https://img.shields.io/npm/l/%40adaptive-ds%2Fforgejo-cli)](./LICENSE)

> **Status:** early development. The CLI includes repository, issue, pull-request, user, organization, release, release-asset, tag, wiki, and Actions workflows;
> additional Forgejo resource command groups will be added in subsequent releases.

## Install

The package targets Node.js 22+ and Bun 1.3+.

```sh
bun add @adaptive-ds/forgejo-cli @adaptive-ds/result valibot
# or
npm install @adaptive-ds/forgejo-cli @adaptive-ds/result valibot
```

The `fj` executable is included:

```sh
bunx --package @adaptive-ds/forgejo-cli fj --help
# or, after installing it in a project:
npx --package @adaptive-ds/forgejo-cli fj --help
```

`@adaptive-ds/result` and `valibot` are peer dependencies for library consumers. They will back the fallible,
validated APIs as the Forgejo contexts are implemented.

## CLI foundation

```sh
fj --help
fj version
fj --host https://forgejo.example.test whoami
fj --host https://forgejo.example.test auth add-token TOKEN
fj auth login --token TOKEN
fj --host https://forgejo.example.test auth login
fj --host https://forgejo.example.test auth login --client-id YOUR_OAUTH_CLIENT_ID
fj auth logout https://forgejo.example.test
fj auth use-ssh false
fj auth list
fj issue view owner/repo#1
fj issue comment --repo owner/repo 1 --body "A comment"
fj pr search --repo owner/repo --state open
fj pr create --repo owner/repo --head feature --base main --title "A change" --body-file description.md
fj pr view owner/repo#1
fj pr view owner/repo#1 diff
fj pr view owner/repo#1 diff --patch --editor
fj pr view owner/repo#1 files --json
fj pr view owner/repo#1 commits --oneline
fj pr checkout owner/repo#1 --branch review-1
fj pr merge owner/repo#1 --method squash --yes
fj release create v1.0.0 --tag v1.0.0 --body-file notes.md
fj release asset download v1.0.0 app.zip --output app.zip
fj tag list --repo owner/repo
fj wiki contents --repo owner/repo
fj wiki view Home --repo owner/repo
fj wiki clone --repo owner/repo --ssh
fj actions tasks --repo owner/repo
fj actions variables list --repo owner/repo
fj actions dispatch build.yml main --repo owner/repo --inputs ENV=staging
fj repo edit --repo owner/repo --avatar ./avatar.png
fj repo edit --repo owner/repo --unset-avatar
fj user search alice
fj user view alice --json
fj org list --only-member-of
fj org team list acme
fj completion bash
```

`-H`/`--host` and `-C`/`--cwd` are global options. Output automatically uses minimal text when stdout is not a TTY;
use `--style fancy` or `--style minimal` to select the preferred interactive style.

`fj auth login` opens the host's OAuth authorization page and receives the callback on a temporary loopback URL using
PKCE. The OAuth client ID is resolved in this order: `--client-id`, `FORGEJO_OAUTH_CLIENT_ID` (also
`FJ_OAUTH_CLIENT_ID`, `FORGEJO_CLIENT_ID`, or `FJ_CLIENT_ID`), `oauth_client_ids` in the Forgejo config file, and
the built-in public IDs for supported hosts. Use `fj auth login --token TOKEN` for non-interactive automation;
tokens are never printed.

## Persistent defaults

Configure a self-hosted Forgejo instance once; `fj config set` stores these values in the owner-only
`~/.config/forgejo-cli/config.json` file:

```sh
fj config set default-host "git.contentoren.de"
fj config set ssh-base "ssh://git@ssh.git.contentoren.de:2222"
fj config set default-org "contentoren"
fj config set default-remote "origin"
```

Use `fj config unset KEY` to remove any of `default-host`, `ssh-base`, `default-org`, or `default-remote`; for example,
`fj config unset default-org`. Persisted defaults do not require an `/etc/profile.d` entry. SSH keys for Git transport and
`fj auth login` (or token authentication) remain separate setup; authenticated identity comes from the Forgejo API
credentials, not from an SSH key or `FJ_USER`.

## Directory organization assignments

Add the optional `directory_assignments` property to the JSON configuration file for organization defaults that follow
the working directory:

```json
{
  "directory_assignments": {
    "/home/david/personal": null,
    "/home/david/leo": "contentoren"
  }
}
```

Assignment keys must be absolute paths; `~` is not expanded. A non-empty string selects that Forgejo organization, while
`null` selects the authenticated user's personal namespace. The nearest matching ancestor wins, so more-specific
directory assignments take precedence over broader ones. Add this property alongside existing configuration values;
the `config set` command does not replace it.

## Environment defaults

The CLI also accepts shell-configurable overrides for common repository and identity inputs:

- `FJ_HOST` is the primary API host; `FJ_FALLBACK_HOST` is used after Git-remote discovery fails.
- `FJ_SSH_BASE` is an SSH URL prefix, such as `ssh://git@ssh.git.contentoren.de:2222`, used only when constructing
  SSH repository URLs.
- `FJ_USER` is an explicit user target override for commands that address a user; it is not a persisted authenticated
  identity. `FJ_ORG` is the default repository owner. They are separate defaults and are not interchangeable.
- `FJ_REMOTE` is the preferred named Git remote when `--remote` is absent.

The nearest `.env` is discovered by walking upward from the effective working directory; only the following Forgejo
variables are read from it, and unrelated values are ignored:

Set only the values needed; the four host names are compatible alternatives, not a required set.

```dotenv
FJ_HOST=https://forgejo.example.test
FORGEJO_BASE_URL=https://forgejo.example.test
FORGEJO_URL=https://forgejo.example.test
FORGEJO_HOST=forgejo.example.test
FJ_FALLBACK_HOST=https://forgejo.example.test
FJ_SSH_BASE=ssh://git@ssh.git.contentoren.de:2222
FJ_USER=david
FJ_ORG=contentoren
FJ_REMOTE=origin
FJ_NO_ORG=true
```

`FJ_NO_ORG` accepts case-insensitive `true` or `false`; `true` selects the personal namespace. Process environment
values override values for the same variable in the nearest `.env`. In general, precedence is explicit CLI options,
Forgejo environment values (process environment, then `.env`), the nearest directory assignment, and persisted global
defaults. For organization destinations, explicit owner/organization or `--no-org` wins, then `FJ_NO_ORG`/`FJ_ORG`,
the directory assignment, and persisted `default-org`. `FJ_NO_ORG=false` allows a `null` directory assignment to fall
through to the persisted organization. Blank environment values and invalid `FJ_NO_ORG` values are ignored.

Command-specific Git behavior remains authoritative: a usable Git remote continues to identify the repository in a
checked-out repository. Host resolution uses explicit host, `FJ_HOST` (or the compatible `FORGEJO_BASE_URL`,
`FORGEJO_URL`, or `FORGEJO_HOST` aliases), the selected Git remote's host, `FJ_FALLBACK_HOST`, and persisted
`default-host`; remote resolution uses explicit remote, `FJ_REMOTE`, persisted `default-remote`, and automatic remote
selection. SSH URL construction uses an explicit URL, `FJ_SSH_BASE`, persisted `ssh-base`, then the server-provided
URL. If no explicit repository or usable Git remote identifies a repository, the CLI falls back to `basename(cwd)`.

Inspect the effective values, selected paths, and provenance with:

```sh
fj config show --resolved
fj config show --resolved --json
```

The output identifies `cli`, `environment`, `.env`, `directory`, `persisted`, or `none` as sources. Credentials and
unrelated `.env` values are never shown.

`--no-org` bypasses organization defaults for personal repository operations:

```sh
fj repo create --no-org my-repo
fj repo fork --no-org owner/repo
fj repo migrate --no-org https://github.com/owner/repo.git migrated-repo
```

If no explicit repository or usable Git remote identifies a repository, the CLI falls back to `basename(cwd)` as the
repository name.

For per-shell environment overrides, a shell profile can use:

```sh
export FJ_HOST="git.contentoren.de"
export FJ_FALLBACK_HOST="https://git.contentoren.de/"
export FJ_SSH_BASE="ssh://git@ssh.git.contentoren.de:2222"
export FJ_USER="david"
export FJ_ORG="contentoren"
export FJ_REMOTE="origin"
```

## Planned Forgejo workflows

`fj` and the library are being designed for automation against self-hosted Forgejo instances, including:

- repository, issue, pull request, release, tag, and wiki workflows;
- actions, users, organizations, and authentication workflows;
- explicit host and repository resolution for scripts and interactive use; and
- machine-readable output suitable for shell pipelines and automation.

Credentials stay outside the repository. Environment-based credentials will be supported for non-interactive
automation, and the client will return structured `Result` values instead of throwing domain or transport errors.

## Library

The package exposes an ESM library from its root entry point:

```ts
import { forgejoCliVersion } from "@adaptive-ds/forgejo-cli"

console.log(forgejoCliVersion)
```

The client and resource contexts expose validated, Result-based APIs. CLI execution accepts injected `fetch`, browser,
editor, stdin, filesystem, Git/process, confirmation, and output functions where automation or tests need them.

## Development

```sh
bun install
bun run dev             # run the fj scaffold from source
bun run format          # format source, tests, and configuration
bun run format:check
bun run type-check
bun run test
bun run build           # emit dist/ with JavaScript and declarations
bun run deploy          # run formatting, types, tests, and build
```

The design and implementation plan is documented in [`docs/20260823_forgejo-cli.md`](./docs/20260823_forgejo-cli.md).

## Release

```sh
bun run release [version]
```

The release script creates a changelog, updates the package version, builds the package, commits and tags on `main`,
pushes the branch and tag, and creates the GitHub release. It requires authenticated `gh` and `git cliff`. Package
publishing is handled separately by the trusted-publishing workflow.

## License

MIT © David Siewert. See [`LICENSE`](./LICENSE).
