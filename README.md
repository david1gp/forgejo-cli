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
