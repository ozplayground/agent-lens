.PHONY: setup dev test build clean

setup:
	@echo "==> Setting up environment..."
	uv venv .venv || python3 -m venv .venv
	uv pip install --python .venv -r backend/requirements.txt || .venv/bin/pip install -r backend/requirements.txt
	cd frontend && pnpm install

dev:
	@./scripts/dev.sh

test:
	@./scripts/test.sh

build:
	cd frontend && pnpm build

clean:
	rm -rf .venv backend/__pycache__ frontend/.next frontend/node_modules

collect:
	@echo "==> Running immediate collection..."
	cd backend && ../.venv/bin/python -c "import asyncio; from app.collectors.manager import collector_manager; asyncio.run(collector_manager.collect_all())"

reset:
	@echo "==> Resetting all collected data and triggering clean re-crawl..."
	@curl -s -X POST http://localhost:8000/api/schedule/reset-and-collect | python3 -m json.tool || true

docker-build:
	@echo "==> Building Docker images for Backend and Frontend..."
	docker compose build

docker-up:
	@echo "==> Launching AgentLens services via Docker Compose..."
	docker compose up -d

docker-down:
	@echo "==> Stopping Docker Compose services..."
	docker compose down

docker-logs:
	docker compose logs -f

