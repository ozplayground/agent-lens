# AgentLens 배포 명세 및 환경 검증서 (Deployment Spec)

- **작성일자**: 2026-09-15
- **담당자**: 데브옵스 엔지니어 (`devops-engineer`)
- **문서 버전**: v2.0
- **상태**: Approved

---

## 1. 컨테이너 아키텍처 및 Docker Compose 토폴로지

AgentLens는 단일 호스트 또는 클라우드 서버에서 `docker-compose.yml`을 통해 백엔드(FastAPI)와 프론트엔드(Next.js)를 독립적인 멀티스테이지 컨테이너로 패키징하여 운영합니다.

```
                    [Host Port: 3001]
                           │
                           ▼
               ┌───────────────────────┐
               │ frontend-container    │ (Next.js 16 Standalone / Node 20)
               └───────────┬───────────┘
                           │ (Internal Network: http://backend:8000)
                           ▼
                    [Host Port: 8000]
                           │
                           ▼
               ┌───────────────────────┐
               │ backend-container     │ (FastAPI / Python 3.11 Slim)
               └───────────┬───────────┘
                           │
                   ┌───────┴───────┐
                   ▼               ▼
            [agentlens.db]   [config.json] (Host Volume Mount)
```

---

## 2. Dockerfile 멀티스테이지 최적화 명세

### 2.1 Backend Dockerfile (`backend/Dockerfile`)
- **베이스 이미지**: `python:3.11-slim`
- **보안 설정**: non-root 계정 권장, 불필요한 빌드 도구 제거
- **포트**: `8000` 노출
- **헬스체크**: `curl -f http://localhost:8000/health || exit 1`

### 2.2 Frontend Dockerfile (`frontend/Dockerfile`)
- **빌드 스테이지**: `node:20-alpine`, `pnpm install` 후 `pnpm build`
- **러너 스테이지**: `node:20-alpine`, Standalone 출력물만 복사하여 최종 이미지 용량 < 150MB 유지
- **포트**: `3001` 노출

---

## 3. 환경변수 및 볼륨 마운트 정책 (Environment & Volumes)

### 3.1 호스트 볼륨 마운트
- `./agentlens.db:/app/agentlens.db`: SQLite 데이터 영구 보존
- `./config.json:/app/config.json`: LLM 키, 노션/이메일 설정 영구 보존
- `./sources.json:/app/sources.json`: 수집 대상 피드 목록 영구 보존

### 3.2 필수 및 선택 환경변수
| 변수명 | 필수 여부 | 기본값 | 설명 |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | 선택 | `sqlite+aiosqlite:///./agentlens.db` | DB 연결 문자열 |
| `GEMINI_API_KEY` | 선택 | `""` | Google Gemini LLM API 키 (미설정 시 로컬 NLP 폴백) |
| `OPENAI_API_KEY` | 선택 | `""` | OpenAI GPT-4o-mini API 키 |
| `NOTION_API_KEY` | 선택 | `""` | 브리핑 Notion 연동 키 |
| `SMTP_HOST` | 선택 | `""` | 이메일 발송 SMTP 서버 호스트 |

---

## 4. 원클릭 실행 및 롤백 가이드 (Runbook)

```bash
# 1. 전체 컨테이너 빌드 및 백그라운드 구동
docker compose up -d --build

# 2. 컨테이너 상태 및 헬스체크 확인
docker compose ps
curl http://localhost:8000/health

# 3. 로그 실시간 모니터링
docker compose logs -f backend
docker compose logs -f frontend

# 4. 서비스 중지 및 롤백
docker compose down
```
