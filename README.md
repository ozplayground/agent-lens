<div align="center">

# 🔭 AgentLens

**AI Agent · Harness · MCP 기술 소식 수집 및 요약 도구**

[![Version](https://img.shields.io/badge/Version-v0.1.0-blue?style=flat-square)](https://github.com/ozplayground/agent-lens/releases)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 소개

**AgentLens**는 AI 에이전트(Autonomous Agents), 하네스(Harness) 및 벤치마크, MCP(Model Context Protocol) 관련 기술 소식을 주기적으로 수집하고, LLM을 통해 노이즈를 걸러내어 3줄 요약과 실무 시사점을 제공하는 웹 애플리케이션입니다.

- **백엔드**: Python FastAPI + SQLite (비동기 크롤러, LLM 프로세서, FastMCP 서버)
- **프론트엔드**: Next.js 16 (App Router) + Tailwind CSS (라이트 모드 대시보드)

---

## 🛠️ 주요 기능

- **자동 소식 수집 및 노이즈 필터링**: RSS 피드, 커뮤니티(GeekNews, HackerNews, Reddit), 논문(arXiv), GitHub 릴리즈 소식을 정기 수집합니다. 긱뉴스나 일반 피드의 비(非) AI 글은 사전 키워드 필터와 LLM 평가를 통해 자동으로 걸러냅니다.
- **AI 3줄 요약 및 개발자 시사점(Why It Matters)**: 기사 핵심 3줄 요약과 엔지니어링 관점에서의 실무 시사점을 자동 생성합니다.
- **기사 질의응답 (Ask AI)**: 기사 상세 모달에서 질문을 입력하거나 추천 칩을 클릭하여 실시간 스트리밍으로 기술적인 답변을 확인합니다.
- **일일 브리핑**: 분야별 소식을 종합 요약하여 제공하며, 마크다운 복사/다운로드, Notion 연동 및 이메일 발송을 지원합니다.
- **로컬 FastMCP 서버 내장**: Claude Desktop 등 로컬 AI 도구에서 소식을 검색할 수 있도록 Model Context Protocol 규격을 지원합니다.

---

## 🚀 빠른 시작

### 1. Docker Compose로 실행

```bash
# 실행
docker compose up -d --build

# 종료
docker compose down
```

접속 주소:
- **웹 대시보드**: [http://localhost:3001](http://localhost:3001)
- **API 문서 (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. 로컬 환경에서 직접 실행

#### 요구사항
- Python 3.11+
- Node.js 20+ 및 `pnpm`

#### 설치 및 실행

```bash
# 의존성 설치
make setup

# 개발 서버 실행 (백엔드 :8000, 프론트엔드 :3001)
make dev
```

#### 테스트 실행

```bash
# 백엔드 및 프론트엔드 테스트
make test
```

---

## ⚙️ 설정 안내

- **`config.json`**: 포트 설정, 수집 스케줄, 사용할 LLM 모델 및 API 키, Notion/이메일 설정 등을 관리합니다. 웹 UI의 설정 모달에서도 수정할 수 있습니다.
- **`sources.json`**: 수집 대상 RSS 피드 및 사이트 목록입니다.
- **`.env`**: 민감한 API 키(`GEMINI_API_KEY`, `OPENAI_API_KEY`)는 `backend/.env` 파일에 작성하여 안전하게 관리할 수 있습니다.

---

## 🔌 MCP 연동 (Claude Desktop)

Claude Desktop 설정 파일(`claude_desktop_config.json`)에 아래 설정을 추가하여 로컬 도구로 연동할 수 있습니다:

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

## 📂 프로젝트 구조

```
agentlens/
├── docker-compose.yml   # Docker Compose 설정
├── Makefile             # 실행/테스트 단축 명령어
├── README.md            # 프로젝트 문서
├── config.json          # 애플리케이션 설정
├── sources.json         # 수집 피드 목록
├── backend/             # FastAPI 백엔드 (수집기, API, LLM 프로세서, FastMCP)
├── frontend/            # Next.js 프론트엔드 (대시보드 UI)
└── docs/                # 기능 명세서 및 아키텍처 문서
```

---

## 📄 라이선스

이 프로젝트는 [Apache License 2.0](LICENSE) 라이선스를 따릅니다.

