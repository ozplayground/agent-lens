# ==========================================
# AgentLens Backend Dockerfile
# Python 3.11 FastAPI Async Engine
# ==========================================

FROM python:3.11-slim AS runner

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system dependencies (curl for container healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Unprivileged runtime user (기본 uid·gid 1000). 진입점이 bind mount 된 config.json 소유자가 root 가 아니면 그 uid 로 실행한다
RUN groupadd --system --gid 1000 app && \
    useradd --system --uid 1000 --gid app --no-create-home --shell /usr/sbin/nologin app

# Copy application source code
COPY --chown=app:app app/ ./app/
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Data directory for the SQLite DB and crawl lock (named volume). /app 도 app 소유라 설정 저장의 임시 파일(*.tmp)을 쓸 수 있다
RUN mkdir -p /app/data && chown app:app /app /app/data

EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/health || exit 1

# root 로 시작해 config.json 소유자(root 면 1000) uid 로 /app/data 를 맞춘 뒤 그 uid 로 실행한다 (docker-entrypoint.sh)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
