#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$ROOT_DIR/packages/mobx-requestor"

if [ $# -eq 0 ]; then
  echo "❌ Error: Please provide a version bump type (major, minor, patch)"
  echo "Usage: ./publish.sh <major|minor|patch>"
  exit 1
fi

BUMP_TYPE=$1

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "❌ Error: Invalid bump type '$BUMP_TYPE'. Must be major, minor, or patch."
  exit 1
fi

echo "🚀 Starting publish process for 'mobx-requestor'..."
echo "📍 Package directory: $PACKAGE_DIR"

cd "$PACKAGE_DIR"

if ! grep -q "bump-$BUMP_TYPE" package.json; then
  echo "❌ Error: Script 'bump-$BUMP_TYPE' not found in $PACKAGE_DIR/package.json"
  exit 1
fi

echo "📦 Running 'bun run bump-$BUMP_TYPE'..."
bun run "bump-$BUMP_TYPE"

echo "✅ Publish process completed successfully!"

npm publish
