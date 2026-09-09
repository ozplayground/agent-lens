#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🧪 Running AgentLens Verification & Test Harness..."

# 1. Backend tests
echo "==> [Backend Test Harness] Pytest..."
cd "$DIR/backend"
"$DIR/.venv/bin/pytest" -v tests/

# 2. Frontend typecheck
echo "==> [Frontend Test Harness] TypeScript check..."
cd "$DIR/frontend"
pnpm tsc --noEmit

echo "🎉 All Test Harness checks passed successfully!"
