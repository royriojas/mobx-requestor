#!/bin/bash

set -euo pipefail

bun run build
bun changeset version

git add .
git commit -m "chore: release"

bun ./replace-workspace-star-deps.ts

bun changeset publish

git checkout -- "**/package.json"