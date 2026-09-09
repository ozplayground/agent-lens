# [기획서] 03. JSON 기반 어플리케이션 통합 설정 & 4번 항목(브리핑 & Ask AI) 런타임 명세

## 1. 기획 배경 및 목적
- **현상 및 사용자 요구사항**:
  1. "4번 항목(오늘의 AI 브리핑 & 대화형 Ask AI)은 정확하게 어떤 게 필요한지 구체적으로 명시할 것."
  2. "어플리케이션 구동에 필요한 모든 옵션과 설정을 `config.json` 파일로 손쉽게 추가/관리할 수 있게 할 것."
  3. "기본 구동 환경변수(`.env`)는 에이전트가 알아서 프로비저닝하여 별도 세팅 없이 즉시 실행 가능하도록 할 것."
- **목적**:
  - 누구나 JSON 파일 하나로 LLM 프로바이더, 수집 스케줄, 웹훅, 크롤러 옵션을 커스터마이징할 수 있는 **Unified JSON Config System** 구축.
  - 기본 `.env`와 `config.json` 간의 조화로운 계층형 설정 로더(Settings Loader) 구현.
  - 4번 항목의 작동 원리와 구동에 필요한 리소스(상용 API 키, 로컬 LLM 하드웨어 스펙, DB 전제 조건)의 완벽한 가이드화.

---

## 2. 4번 항목 (오늘의 AI 브리핑 & 대화형 Ask AI) 필요 요소 상세 명세

4번 항목은 지난 24시간 동안 수집된 기술 소식을 바탕으로 **일일 종합 인텔리전스 리포트**를 생성하고, 개별 기사에 대해 사용자가 심층 질문을 던졌을 때 **실시간으로 답변하는 기능**입니다.

### 2.1 동작 모드별 필요 리소스 비교

| 구분 | 모드 A: 완전 무료 내장 모드 (기본) | 모드 B: 상용 클라우드 LLM 모드 | 모드 C: 로컬 오픈소스 LLM 모드 |
|---|---|---|---|
| **필요 API 키** | **없음 (Zero-Config)** | `GEMINI_API_KEY` 또는 `OPENAI_API_KEY` | 없음 |
| **권장 모델** | 내장 Heuristic NLP Engine | `gemini-2.0-flash` 또는 `gpt-4o-mini` | `llama3.2:3b`, `qwen2.5:7b`, `deepseek-r1:7b` |
| **비용** | 100% 무료 | 무료 티어(Gemini 분당 15회) / 유료 토큰 종량제 | 100% 무료 |
| **하드웨어 요구량** | 기본 사양 (RAM 4GB 이상) | 기본 사양 (네트워크 연결 필수) | Apple Silicon M시리즈 또는 NVIDIA GPU (VRAM 8GB+) |
| **네트워크 요구사항** | 오프라인 가능 | 외부 API 서버 (HTTPS 443) 아웃바운드 허용 | 로컬 호스트 통신 (`localhost:11434`) |
| **사전 데이터 조건** | DB에 최소 3~5건 이상의 수집 아티클 누적 | DB에 최소 3~5건 이상의 수집 아티클 누적 | DB에 최소 3~5건 이상의 수집 아티클 누적 |

---

## 3. JSON 설정 파일 구조 설계 (`config.json`)

어플리케이션 루트에 위치하며, 사용자가 원하는 필드를 자유롭게 추가하고 변경할 수 있습니다.

```json
{
  "app": {
    "project_name": "AgentLens",
    "version": "1.0.0",
    "host": "0.0.0.0",
    "port": 8000,
    "frontend_port": 3001,
    "database_url": "sqlite+aiosqlite:///./agentlens.db"
  },
  "llm": {
    "provider": "auto",
    "gemini_api_key": "",
    "gemini_model": "gemini-2.0-flash",
    "openai_api_key": "",
    "openai_model": "gpt-4o-mini",
    "ollama_base_url": "http://localhost:11434",
    "ollama_model": "llama3.2:latest",
    "quality_cutoff_score": 5.0,
    "high_signal_threshold": 7.8
  },
  "scheduler": {
    "enabled": true,
    "crawl_hours": [0, 6, 12, 18],
    "timezone": "UTC"
  },
  "webhooks": {
    "slack_webhook_url": "",
    "discord_webhook_url": "",
    "auto_dispatch_daily_briefing": true
  },
  "crawler": {
    "user_agent": "AgentLens-Collector/1.0",
    "request_timeout_seconds": 12,
    "max_concurrent_requests": 5,
    "items_per_source_limit": 20
  }
}
```

---

## 4. 환경변수 우선순위 및 병합 정책

1. **최우선순위**: 시스템 OS 환경변수 또는 `.env` 파일의 변수
2. **차순위**: `config.json`에 정의된 JSON 값
3. **기본값**: Pydantic / 코드 내 기본값

---

## 5. 단계별 개발 및 검증 체크리스트
- [x] 1단계: 루트 및 백엔드용 `config.json` 파일 생성
- [x] 2단계: `backend/.env`, `frontend/.env.local`, 루트 `.env` 기본 환경변수 파일 자동 생성
- [x] 3단계: `backend/app/config.py`에 `config.json` 자동 로더 및 병합 로직 구현
- [x] 4단계: `backend/app/services/llm_processor.py`에 라이브 LLM (Gemini / OpenAI / Ollama) 호출 및 자동 Fallback 추가
- [x] 5단계: 백엔드 단위 테스트 작성 (`backend/tests/test_config_and_live_llm.py`, 27개 테스트 전 항목 패스)
- [x] 6단계: 전체 빌드 및 검증 (`./scripts/test.sh`, `make test`, Next.js build 100% 성공)

---

## 6. 사람(사용자) 액션 아이템
1. **JSON 기반 설정 변경**:
   - `config.json`을 열어 원하는 값(API 키, 모델명, 수집 주기, 웹훅 URL 등)을 JSON 포맷으로 바로 수정/추가하실 수 있습니다.
2. **기본 환경변수 파일 확인**:
   - 자동으로 생성된 `backend/.env` 파일에서 비밀 키나 포트 설정을 즉시 확인하실 수 있습니다.
