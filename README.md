# 🔭 AgentLens

**AI 에이전트·하네스·MCP 기술 소식 자동 수집, 요약 및 질의응답 플랫폼**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

---

## 주요 기능

- **기술 소식 자동 수집 및 노이즈 필터링**: RSS, GeekNews, HackerNews, Reddit, arXiv, GitHub 등에서 AI·에이전트·MCP 관련 소식을 정기 수집하고 비관련 글을 필터링합니다.
- **AI 3줄 요약 및 시사점 정리**: 기사별 핵심 3줄 요약(TL;DR), 기술 태그, 개발자 관점의 시사점(Why It Matters)을 생성합니다.
- **AI 챗 워크스페이스 (`/chat`)**: 수집된 기술 소식 전체 또는 선택한 특정 기사를 바탕으로 질의응답 및 대화 내역 관리를 지원합니다.
- **일일 브리핑 및 외부 채널 공유**: 주요 소식 일일 브리핑 생성, 마크다운 내보내기, Notion·이메일·Slack/Discord 웹훅 발송을 지원합니다.
- **MCP 서버 내장**: Claude Desktop 등 외부 MCP 클라이언트에서 수집된 소식을 검색·조회할 수 있습니다.

---

## 기술 스택

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy (SQLite), FastMCP
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Infra**: Docker, Docker Compose

---

## 실행 및 배포 방법

### 1. Docker Compose 배포

```bash
# 컨테이너 빌드 및 백그라운드 실행
docker compose up -d --build
# 또는
make docker-up

# 실시간 로그 확인
make docker-logs

# 서비스 종료
docker compose down
# 또는
make docker-down
```

- **웹 애플리케이션**: [http://localhost:3001](http://localhost:3001)
- **API 문서 (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. 로컬 개발 환경 실행

#### 요구사항
- Python 3.11+
- Node.js 20+ 및 `pnpm`

```bash
# 의존성 설치 (백엔드 가상환경 및 프론트엔드 패키지)
make setup

# 개발 서버 실행 (백엔드 :8000, 프론트엔드 :3001)
make dev

# 전체 테스트 실행
make test
```

---

## 환경 설정 안내

### 1. 환경변수 (`.env`)

`backend/.env.example`을 참고하여 `backend/.env` 파일을 생성하고 주요 환경변수를 설정합니다.

```bash
# LLM API 키 설정 (사용할 프로바이더 선택 입력)
ANTHROPIC_API_KEY=""
GEMINI_API_KEY=""
OPENAI_API_KEY=""
OLLAMA_BASE_URL="http://localhost:11434"

# 외부 알림 및 브리핑 연동 (선택 사항)
SLACK_WEBHOOK_URL=""
DISCORD_WEBHOOK_URL=""
NOTION_API_KEY=""
NOTION_PAGE_ID=""
```

### 2. 설정 파일 (`config.json` & `sources.json`)

- **`config.json`**: 서버 포트, 수집 스케줄, 기본 LLM 모델 등 애플리케이션 동작 설정을 관리합니다.
- **`sources.json`**: 정기 수집할 RSS 피드 및 외부 사이트 목록을 관리합니다.

### 3. MCP 연동 (`claude_desktop_config.json`)

Claude Desktop 등 MCP 클라이언트에 아래 설정을 추가하여 연동할 수 있습니다.

```json
{
  "mcpServers": {
    "agentlens": {
      "command": "python",
      "args": ["-m", "app.mcp.server"],
      "cwd": "/절대경로/agentlens/backend"
    }
  }
}
```

---

## 프로젝트 구조

```
agentlens/
├── docker-compose.yml          # Docker Compose 설정
├── Makefile                    # 빌드, 실행, 테스트 단축 명령어
├── config.json                 # 애플리케이션 설정
├── sources.json                # 수집 대상 소스 목록
├── backend/                    # FastAPI 백엔드 및 FastMCP 서버
│   ├── app/
│   │   ├── api/                # REST API 라우터
│   │   ├── collectors/         # 소식 수집기 및 필터
│   │   ├── models/             # 데이터베이스 ORM 모델
│   │   ├── schemas/            # Pydantic 스키마
│   │   ├── services/           # 비즈니스 로직 및 LLM 연동
│   │   └── mcp/                # MCP 서버
│   ├── tests/                  # 백엔드 테스트
│   └── Dockerfile
├── frontend/                   # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                # App Router 페이지 (/, /chat)
│   │   ├── components/         # UI 컴포넌트
│   │   ├── hooks/              # 커스텀 훅
│   │   ├── types/              # TypeScript 타입 및 스키마
│   │   └── tests/              # 프론트엔드 테스트
│   └── Dockerfile
└── docs/                       # 프로젝트 설계 및 검증 문서
```

---

## 라이선스

이 프로젝트는 [Apache License 2.0](LICENSE) 라이선스를 따릅니다.
