#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🚀 Starting AgentLens Dev Services..."

cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Backend on 8000
echo "📡 [Backend] Launching FastAPI on http://localhost:8000..."
cd "$DIR/backend"
"$DIR/.venv/bin/uvicorn" app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Start Frontend (auto-select port 3000 or 3001)
FRONTEND_PORT=3000
if lsof -i :3000 >/dev/null 2>&1; then
    FRONTEND_PORT=3001
fi

echo "💻 [Frontend] Launching Next.js on http://localhost:${FRONTEND_PORT}..."
cd "$DIR/frontend"
pnpm dev --port ${FRONTEND_PORT} &
FRONTEND_PID=$!

echo ""
echo "✨ AgentLens is running!"
echo "   - Frontend: http://localhost:${FRONTEND_PORT}"
echo "   - Backend:  http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Briefing: http://localhost:8000/api/briefing/today"
echo ""

wait
