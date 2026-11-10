SHELL := /bin/bash

.PHONY: setup dev test build clean collect reset docker-build docker-up docker-down docker-logs check

# 명령 줄(make collect COLLECT_MODE=api)이나 환경 변수로 바꿀 수 있다.
AGENTLENS_API_URL ?= http://localhost:8000
COLLECT_MODE ?= auto
COLLECT_TIMEOUT ?= 1800
DOCKER_WAIT_TIMEOUT ?= 180
DOCKER_LOGS_ARGS ?= -f --tail=200

# scripts/collect.py 와 scripts/dev.sh 가 환경에서 읽는다. DEV_* 의 기본값은 scripts/dev.sh 에 있다.
export AGENTLENS_API_URL COLLECT_MODE COLLECT_TIMEOUT DEV_BACKEND_PORT DEV_FRONTEND_PORT DEV_HOST DEV_READY_TIMEOUT

setup:
	@if [ -x .venv/bin/python ] && .venv/bin/python -c 'import sys; sys.exit(0 if sys.version_info[:2] == (3, 11) else 1)' 2>/dev/null; then \
		echo "==> .venv 이미 있음 (Python $$(.venv/bin/python -c 'import platform; print(platform.python_version())'))"; \
	elif command -v uv >/dev/null 2>&1; then \
		echo "==> uv 로 .venv 를 Python 3.11 로 만든다"; \
		uv venv --clear --python 3.11 .venv; \
	elif command -v python3.11 >/dev/null 2>&1; then \
		echo "==> python3.11 로 .venv 를 만든다"; \
		python3.11 -m venv --clear .venv; \
	else \
		echo "make setup: uv 나 python3.11 이 필요하다" >&2; \
		exit 1; \
	fi
	@if command -v uv >/dev/null 2>&1; then \
		echo "==> backend 의존성 설치 (uv, requirements-dev.txt = 운영 requirements.txt + 테스트 도구)"; \
		uv pip install --python .venv/bin/python -r backend/requirements-dev.txt; \
	else \
		echo "==> backend 의존성 설치 (pip, requirements-dev.txt = 운영 requirements.txt + 테스트 도구)"; \
		.venv/bin/python -m ensurepip --upgrade && .venv/bin/python -m pip install -r backend/requirements-dev.txt; \
	fi
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "make setup: pnpm 이 필요하다 (corepack enable 로 켠다)" >&2; \
		exit 1; \
	fi
	cd frontend && pnpm install --frozen-lockfile

dev:
	@./scripts/dev.sh

test: check

build:
	cd frontend && pnpm build

# 설치물·빌드 산출물·캐시만 지운다. 데이터(agentlens.db*), 설정 파일, frontend/next-env.d.ts, Docker 는 남긴다.
clean:
	rm -rf .venv frontend/node_modules frontend/.next frontend/tsconfig.tsbuildinfo .pytest_cache backend/.pytest_cache backend/tests/test_agentlens.db backend/tests/test_agentlens.db-wal backend/tests/test_agentlens.db-shm
	find . -name __pycache__ -type d -prune -not -path './.git/*' -exec rm -rf {} +

collect:
	cd backend && PYTHONPATH=. ../.venv/bin/python ../scripts/collect.py

# curl 과 reset-and-collect 를 레시피에 그대로 둔다 (파괴적 명령 게이트가 이 대상을 진입점으로 잡는다).
reset:
	@echo "==> make 의 reset 대상: $(AGENTLENS_API_URL) 의 수집 데이터 전체 삭제 후 재수집"
	@if ! curl -fsS --max-time 5 -o /dev/null "$(AGENTLENS_API_URL)/health"; then \
		echo "make reset: $(AGENTLENS_API_URL) 에 backend 가 없다. make dev 또는 make docker-up 으로 먼저 띄운다" >&2; \
		exit 1; \
	fi; \
	resp="$$(curl -fsS --max-time 30 -X POST "$(AGENTLENS_API_URL)/api/schedule/reset-and-collect")" || exit 1; \
	if ! printf '%s\n' "$$resp" | python3 -m json.tool --no-ensure-ascii 2>/dev/null; then \
		echo "make reset: 응답이 JSON 이 아니다: $$resp" >&2; \
		exit 1; \
	fi; \
	st="$$(printf '%s' "$$resp" | python3 -c 'import json, sys; d = json.load(sys.stdin); print(d.get("status", "") if isinstance(d, dict) else "")')"; \
	if [ "$$st" != "started" ]; then \
		printf '%s' "$$resp" | python3 -c 'import json, sys; d = json.load(sys.stdin); m = (d.get("message") or d.get("status")) if isinstance(d, dict) else d; print("make reset: " + str(m), file=sys.stderr)'; \
		exit 1; \
	fi

docker-build:
	@echo "==> Building Docker images for Backend and Frontend..."
	docker compose build

docker-up:
	@echo "==> Docker Compose 로 서비스를 띄우고 healthy 가 될 때까지 기다린다 (최대 $(DOCKER_WAIT_TIMEOUT)초)"
	docker compose up -d --wait --wait-timeout $(DOCKER_WAIT_TIMEOUT)
	@echo "==> backend:  http://localhost:$$(docker compose port backend 8000 | sed 's/.*://')"
	@echo "==> frontend: http://localhost:$$(docker compose port frontend 3001 | sed 's/.*://')"

docker-down:
	@echo "==> Stopping Docker Compose services..."
	docker compose down

# Ctrl-C(종료 130)는 사용자가 멈춘 것이라 정상 종료로 본다. 그 밖의 실패 코드는 그대로 전달한다.
# trap 을 걸어 두어야 셸이 SIGINT 로 함께 죽지 않고 docker 의 종료 코드를 볼 수 있다.
docker-logs:
	@trap ':' INT; \
	docker compose logs $(DOCKER_LOGS_ARGS); rc=$$?; \
	if [ "$$rc" -eq 130 ]; then echo "==> 로그 보기를 멈췄다"; exit 0; fi; \
	exit $$rc

# 검사: backend pytest + frontend vitest, eslint, tsc --noEmit. 하나라도 실패하면 0 이 아닌 값으로 끝난다
check:
	cd backend && ../.venv/bin/pytest -v tests/
	cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit
