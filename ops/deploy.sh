#!/usr/bin/env bash
set -euo pipefail

echo "Running the local @adaptive-ds/forgejo-cli deployment preflight."
bun run format:check
bun run type-check
bun run test
bun run build
