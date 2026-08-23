# Forgejo CLI

## Goal

Create `@adaptive-ds/forgejo-cli` as a public MIT-licensed TypeScript package that provides both the `fj` command and an importable Forgejo client, reimplementing the existing Rust CLI with Bun, Valibot, and Result-based fallible APIs.

## Decisions

- Work in `/home/david/adaptive/forgejo-cli` because it is the current requested directory.
- Use `/home/david/adaptive/zitadel-cli`, `/home/david/adaptive/ralph`, and `/home/david/adaptive/result` as project convention references.
- Follow the code-style skill: one export per file, subject-first names, bounded contexts, Valibot validation, and `Result` instead of thrown domain errors.
- Publish an ESM package with `fj` as its executable and explicit library exports from built `dist` files.
- Store host credentials outside the repository and permit environment-based credentials for automation.
- Validate against `https://git.contentoren.de` without exposing credentials.

## Approach

- Establish repository, package, build, formatting, release, and documentation infrastructure first.
- Build small reusable core modules for validation, errors, configuration, authentication, HTTP, repository resolution, and output.
- Add bounded Forgejo resource APIs and compose them into an importable client.
- Recreate the CLI hierarchy over the library, prioritizing behavioral compatibility for identifiers, host/repository resolution, stdin/editor input, and non-interactive output.
- Verify with unit tests, package/build checks, CLI smoke tests, and safe live calls to the self-hosted Forgejo instance.

## Tasks

- [x] 1. Scaffold project infrastructure, package metadata, scripts, license, release automation, workspace settings, and README.
- [x] 2. Implement and test core Result-based schemas, configuration, credentials, HTTP transport, identifiers, repository resolution, and public client construction.
- [x] 3. Implement and test repository, issue, pull request, release, tag, wiki, actions, user, organization, and authentication library contexts.
- [x] 4. Implement the `fj` CLI command tree and output/input behavior over the library.
- [x] 5. Verify formatting, types, unit tests, build/package contents, CLI smoke behavior, and safe live Forgejo API calls; correct defects.
- [x] 6. Publish the completed project as a public GitHub repository.

## Paths

- `package.json`
- `README.md`
- `LICENSE`
- `.github/`
- `.gitattributes`
- `.gitignore`
- `biome.json`
- `cliff.toml`
- `forgejo-cli.code-workspace`
- `tsconfig.json`
- `tsconfig.lib.json`
- `bunfig.toml`
- `ops/deploy.sh`
- `ops/release.sh`
- `src/`
- `tests/`
