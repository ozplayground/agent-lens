#!/usr/bin/env bash
# 로컬 개발 서버: backend(uvicorn --reload)와 frontend(next dev)를 함께 띄운다.
# 두 서버는 각자 프로세스 그룹으로 띄우고, 끝날 때 그룹째 내린다.
# macOS /bin/bash 3.2 에서 돌아야 한다 (wait -n, 연관 배열, ${var,,} 를 쓰지 않는다).
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

DEV_BACKEND_PORT="${DEV_BACKEND_PORT:-8000}"
DEV_FRONTEND_PORT="${DEV_FRONTEND_PORT:-3000}"
DEV_HOST="${DEV_HOST:-0.0.0.0}"
DEV_READY_TIMEOUT="${DEV_READY_TIMEOUT:-120}"

BACKEND_PID=""
FRONTEND_PID=""
CLEANED=0

say() { printf '[dev] %s\n' "$*"; }
warn() { printf '[dev] %s\n' "$*" >&2; }

# 프로세스 그룹에 남은 프로세스가 있는지 본다.
group_alive() {
  [ -n "$1" ] && kill -0 -- "-$1" 2>/dev/null
}

# 두 프로세스 그룹을 TERM 으로 내리고, 10초 안에 안 내려가면 KILL 한다. 한 번만 돈다.
cleanup() {
  if [ "$CLEANED" -eq 1 ]; then
    return 0
  fi
  CLEANED=1
  local pg left tries
  for pg in $BACKEND_PID $FRONTEND_PID; do
    if kill -TERM -- "-$pg" 2>/dev/null; then
      :
    fi
  done
  tries=0
  while [ "$tries" -lt 50 ]; do
    left=0
    for pg in $BACKEND_PID $FRONTEND_PID; do
      if group_alive "$pg"; then
        left=1
      fi
    done
    if [ "$left" -eq 0 ]; then
      break
    fi
    sleep 0.2
    tries=$((tries + 1))
  done
  for pg in $BACKEND_PID $FRONTEND_PID; do
    if group_alive "$pg"; then
      warn "프로세스 그룹 $pg 이 10초 안에 내려가지 않아 KILL 한다"
      if kill -KILL -- "-$pg" 2>/dev/null; then
        :
      fi
    fi
  done
  return 0
}

on_signal() {
  trap '' INT TERM
  say "정리하는 중..."
  cleanup
  say "중지했다"
  exit 0
}

# 죽은 자식의 종료 코드를 알리고 정리한 뒤 종료 1.
report_exit() {
  local name="$1" pid="$2" code
  if wait "$pid" 2>/dev/null; then
    code=0
  else
    code=$?
  fi
  warn "$name 가 종료 코드 $code 으로 끝났다"
  cleanup
  exit 1
}

# 1. 사전 확인
if [ ! -x .venv/bin/uvicorn ] || [ ! -d frontend/node_modules ]; then
  warn "개발 의존성이 없다 (.venv/bin/uvicorn 또는 frontend/node_modules). make setup 을 먼저 실행한다."
  exit 1
fi

# 2. 포트 확인 (연결이 되면 이미 누가 쓰고 있다)
for port in "$DEV_BACKEND_PORT" "$DEV_FRONTEND_PORT"; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; then
    warn "포트 $port 사용 중 (Docker 가 떠 있으면 make docker-down)"
    exit 1
  fi
done

trap cleanup EXIT
trap on_signal INT TERM

# frontend 가 브라우저에서 backend 에 직접 붙는 주소. 8000 이 아닐 때만 넘긴다.
next_api_url="${NEXT_PUBLIC_API_URL:-}"
if [ "$DEV_BACKEND_PORT" != "8000" ] && [ -z "$next_api_url" ]; then
  next_api_url="http://localhost:$DEV_BACKEND_PORT"
fi

# 3. 각자 프로세스 그룹으로 띄운다 ($! 가 곧 그룹 id)
set -m
(
  cd backend
  exec ../.venv/bin/uvicorn app.main:app --reload --reload-dir app \
    --host "$DEV_HOST" --port "$DEV_BACKEND_PORT"
) </dev/null &
BACKEND_PID=$!
(
  cd frontend
  export INTERNAL_API_URL="http://127.0.0.1:$DEV_BACKEND_PORT"
  if [ -n "$next_api_url" ]; then
    export NEXT_PUBLIC_API_URL="$next_api_url"
  fi
  exec pnpm dev --port "$DEV_FRONTEND_PORT"
) </dev/null &
FRONTEND_PID=$!
# 자식만 따로 그룹에 두고, 아래 sleep 등은 이 셸의 그룹에서 돌게 한다 (Ctrl-C 가 이 셸에 온다).
set +m

say "backend (pid $BACKEND_PID, 포트 $DEV_BACKEND_PORT), frontend (pid $FRONTEND_PID, 포트 $DEV_FRONTEND_PORT) 를 띄웠다. 준비를 기다린다..."

# 4. 준비 대기
start=$SECONDS
while :; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    report_exit backend "$BACKEND_PID"
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    report_exit frontend "$FRONTEND_PID"
  fi
  if curl -fsS -o /dev/null "http://127.0.0.1:$DEV_BACKEND_PORT/health" 2>/dev/null \
    && curl -fsS -o /dev/null "http://127.0.0.1:$DEV_FRONTEND_PORT/api/health" 2>/dev/null; then
    break
  fi
  if [ $((SECONDS - start)) -ge "$DEV_READY_TIMEOUT" ]; then
    warn "${DEV_READY_TIMEOUT}초 안에 준비되지 않았다"
    cleanup
    exit 1
  fi
  sleep 1
done

say "준비됐다"
say "  frontend: http://localhost:$DEV_FRONTEND_PORT"
say "  backend:  http://localhost:$DEV_BACKEND_PORT"
say "  API 문서: http://localhost:$DEV_BACKEND_PORT/docs"
say "Ctrl-C 로 둘 다 내린다"

# 5. 감시
while :; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    report_exit backend "$BACKEND_PID"
  fi
  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    report_exit frontend "$FRONTEND_PID"
  fi
  sleep 1
done
