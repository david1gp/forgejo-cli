# Directory organization assignments

## Goal

Resolve Forgejo organization defaults from the working directory, allow a nearest local `.env` to override them, and expose the effective configuration and its sources through the CLI.

## Decisions

- Add absolute-path directory assignments to `~/.config/forgejo-cli/config.json`; do not expand `~` in assignment keys.
- Configure `/home/david/personal` as the personal namespace and `/home/david/leo` as the `contentoren` organization. Do not add or provision an `adaptive` organization.
- Match the longest ancestor assignment for the effective working directory.
- Discover the nearest `.env` while walking from the working directory upward and read only Forgejo variables. Support existing variables and add `FJ_NO_ORG=true` for the personal namespace.
- Precedence is explicit CLI options, Forgejo environment values including the discovered `.env`, nearest directory assignment, then global persisted defaults. Existing Git remote repository resolution remains authoritative for checked-out repositories.
- Add `fj config show --resolved` and `--json`; report selected paths and per-value provenance while redacting credentials and unrelated `.env` values.

## Approach

- Extend configuration validation and default resolution without changing existing config compatibility.
- Keep directory matching, `.env` discovery, and resolved-config rendering in focused modules with tests.
- Reuse dependencies already present in `package.json` before adding any package.

## User-facing configuration

Add `directory_assignments` to the JSON configuration file. Assignment keys must already be absolute paths; `~` is not
expanded:

```json
{
  "directory_assignments": {
    "/home/david/personal": null,
    "/home/david/leo": "contentoren"
  }
}
```

A non-empty string selects an organization and `null` selects the personal namespace. The longest matching ancestor of
the effective working directory is selected. The nearest `.env` is discovered by walking upward from that directory;
only these variables are read from it:

```text
FJ_HOST, FORGEJO_BASE_URL, FORGEJO_URL, FORGEJO_HOST,
FJ_FALLBACK_HOST, FJ_SSH_BASE, FJ_USER, FJ_ORG, FJ_REMOTE, FJ_NO_ORG
```

`FJ_NO_ORG=true` selects the personal namespace; `FJ_NO_ORG` accepts case-insensitive `true` or `false`. Process environment values
override the same variables from `.env`; unrelated `.env` values are ignored. Precedence is explicit CLI options,
Forgejo environment values, the nearest directory assignment, then persisted global defaults. Existing usable Git
remote repository resolution remains authoritative for checked-out repositories.

Use `fj config show --resolved` for human-readable effective values and provenance, or
`fj config show --resolved --json` for machine-readable output. Credentials and unrelated `.env` values are redacted.

## Tasks

- [x] 1. Add directory-assignment schema, longest-ancestor resolution, personal-namespace representation, and focused tests.
- [x] 2. Add nearest `.env` discovery and Forgejo-only override parsing, including `FJ_NO_ORG`, precedence, and focused tests.
- [x] 3. Add `fj config show --resolved [--json]` with source provenance and secret redaction, plus CLI tests.
- [x] 4. Update user-facing documentation and run the complete verification suite.
- [x] 5. Harden resolved-output redaction and `.env` parsing.
- [x] 6. Include authoritative Git-selected values and provenance in resolved output.
- [x] 7. Make tests independent of ambient user config and rerun complete verification.
- [x] 8. Apply the requested personal and leo assignments to the existing user config and verify resolved output.
- [x] 9. Complete host redaction, Git provenance, and valid quoted `.env` whitespace handling; rerun verification.
