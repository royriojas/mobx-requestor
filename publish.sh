#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Determine package name and bump type
# Usage:
#   ./publish.sh <bump-type>                  # publishes mobx-requestor (default)
#   ./publish.sh <package-name> <bump-type>   # publishes the specified package
if [ $# -eq 0 ]; then
  echo "❌ Error: Please provide a version bump type (major, minor, patch)"
  echo "Usage: ./publish.sh [package-name] <major|minor|patch>"
  echo "  package-name defaults to 'mobx-requestor' if omitted"
  exit 1
fi

if [ $# -eq 1 ]; then
  PACKAGE_NAME="mobx-requestor"
  BUMP_TYPE=$1
else
  PACKAGE_NAME=$1
  BUMP_TYPE=$2
fi

PACKAGE_DIR="$ROOT_DIR/packages/$PACKAGE_NAME"

if [ ! -d "$PACKAGE_DIR" ]; then
  echo "❌ Error: Package directory '$PACKAGE_DIR' does not exist."
  exit 1
fi

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "❌ Error: Invalid bump type '$BUMP_TYPE'. Must be major, minor, or patch."
  exit 1
fi

echo "🚀 Starting publish process for '$PACKAGE_NAME'..."
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
