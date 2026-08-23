# Reorganize source feature folders

## Goal

Reduce crowded feature directories by moving coherent capability families into noun-based subfolders without changing the package's public API.

## Decisions

- Keep core feature CRUD, schemas, references, and shared helpers at each feature root.
- Add subfolders only for clear capability families with multiple related files.
- Preserve exported symbol names and root package exports.
- Do not reorganize small or already cohesive source folders.

## Approach

- Reorganize each feature independently, updating internal imports, root exports, and tests as needed.
- Run focused checks after each feature, followed by the full project checks.

## Tasks

- [x] 1. Reorganize `organizations` into `teams`, `members`, `labels`, and `repositories`.
- [x] 2. Reorganize `pullRequests` into `comments`, `reviews`, `commits`, `files`, and `dependencies`.
- [x] 3. Reorganize `issues` into `comments`, `assignees`, `dependencies`, `labels`, and `templates`.
- [x] 4. Reorganize `users` into `emails`, `gpgKeys`, `sshKeys`, `activity`, `social`, `organizations`, and `repositories`.
- [x] 5. Reorganize `repositories` into `labels`, `avatars`, `watching`, and `stars`.
- [x] 6. Reorganize `actions` into `secrets`, `variables`, `runs`, `tasks`, and `workflows`.
- [x] 7. Reorganize release asset files into `releases/assets`.
- [x] 8. Run full verification and review all path changes for accidental API changes.

## Current context

- All source reorganization tasks are complete.
- Root exports and public symbols are preserved.
- Full type checking, tests, formatting, build, and import audits pass.

## Paths

- `src/index.ts`
- `src/organizations/`
- `src/pullRequests/`
- `src/issues/`
- `src/users/`
- `src/repositories/`
- `src/actions/`
- `src/releases/`
- Related tests and internal importers
