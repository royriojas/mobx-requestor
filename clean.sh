#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧹 Cleaning generated files..."

echo "  Removing .turbo caches..."
find "$ROOT_DIR" -name ".turbo" -type d -prune -exec rm -rf {} +

echo "  Removing node_modules..."
find "$ROOT_DIR" -name "node_modules" -type d -prune -exec rm -rf {} +

echo "  Removing dist/ and build/ folders..."
find "$ROOT_DIR" -name "dist" -type d -prune -not -path "*/.git/*" -exec rm -rf {} +
find "$ROOT_DIR" -name "build" -type d -prune -not -path "*/.git/*" -exec rm -rf {} +

echo "  Removing ESLint caches..."
find "$ROOT_DIR" -name ".eslintcache" -type f -delete

echo "✅ Clean complete. Run 'bun install' to restore dependencies."
