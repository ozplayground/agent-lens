# AgentLens 백엔드 시스템 및 데이터베이스 설계서 (System Design & ERD)

- **작성일자**: 2026-10-20
- **작성자**: 백엔드 시스템 디자이너 (`system-designer`)
- **문서 버전**: v1.1
- **상태**: Approved

---

## 1. 백엔드 모듈 아키텍처 및 계층도 (Layered Architecture)

AgentLens 백엔드는 관심사 분리(Separation of Concerns)와 단방향 의존성 원칙을 엄격히 준수하는 **계층형 아키텍처 (Router $\rightarrow$ Service $\rightarrow$ Provider / Repository $\rightarrow$ Model)**로 설계 및 구현되어 있습니다.

핵심 LLM 처리 계층(`LLMProcessor`)은 **4대 멀티 프로바이더 — Anthropic Claude, Google Gemini, OpenAI, OpenAI-Compatible (Ollama / vLLM)**를 직접 지원하며, 가용한 엔진이 부재하거나 업스트림 장애 발생 시 정직한 표준 에러 코드(503, 502, 429)를 클라이언트로 투명하게 전파합니다.

```
backend/
├── app/
│   ├── api/             # 1. Router Layer (FastAPI Routers & SSE Streaming Endpoints)
│   │   ├── chat.py      # /api/chat/stream, /api/chat/query, /api/chat/sessions, /api/chat/search, /api/chat/sources/{id}
│   │   ├── news.py      # /api/news, /api/news/{id}, /api/news/{id}/ask, /api/news/{id}/ask/stream, /api/news/all, /api/news/feed/rss.xml
│   │   ├── briefing.py  # /api/briefing/today, /generate, /export/notion, /send/email, /test/*, /settings
│   │   ├── sources.py   # /api/sources, /rss, /github, /{type}/{id}/toggle, /{type}/{id}
│   │   ├── research.py  # /api/research/inspect-url, /discover, /register-candidate, /status, /audit-logs, /run-deep
│   │   ├── schedule.py  # /api/schedule/status, /progress, /trigger, /reset-and-collect
│   │   ├── trends.py    # /api/trends/radar
│   │   ├── webhook.py   # /api/webhook/test, /send-briefing
│   │   ├── stats.py     # /api/stats
│   │   ├── mcp.py       # /api/mcp/info (FastMCP Server Integration)
│   │   └── router.py    # 중앙 APIRouter 통합 등록
│   ├── core/            # 전역 설정(pydantic-settings), 보안 유틸리티
│   ├── config.py        # Settings (BaseSettings), JSON + .env 동적 병합 및 reload
│   ├── database.py      # aiosqlite 비동기 엔진, WAL 모드, PRAGMA foreign_keys=ON, ensure_db_schema
│   ├── scheduler.py     # APScheduler 기반 정기 크론 수집 엔진
│   ├── services/        # 2. Service Layer (Pure Business Logic & Multi-LLM Orchestration)
│   │   ├── chat_service.py         # 에이전틱 리서치 워크플로우(ReAct), Scoped/Global RAG 및 4단 리포트 오케스트레이터
│   │   ├── chat_session_service.py # 세션 수명주기, FIFO 30개 자동 축출, 10턴 슬라이딩 윈도우, 대화 턴 자동 영속화
│   │   ├── llm_processor.py        # 4대 멀티 프로바이더(Claude, Gemini, OpenAI, Ollama/vLLM) 라우팅, 품질/신호 평가 엔진
│   │   ├── llm_providers/          # 플러그형 LLM 프로바이더 어댑터 계층
│   │   │   ├── base.py             # BaseLLMProvider 추상 인터페이스
│   │   │   └── anthropic_provider.py # Anthropic Claude (Haiku/Sonnet/Opus 3-Tier, Prompt Caching, 토큰 추적)
│   │   ├── scraper.py              # ArticleScraperService (httpx, BeautifulSoup, Scrape L1 메모리/L2 DB 캐시)
│   │   ├── agentic_search.py       # AgenticSearchService (원문 충실도 평가 및 DuckDuckGo 맥락 앵커링 보충 검색)
│   │   ├── retriever.py            # SQLite FTS5 (BM25) + Quality + Recency 3축 하이브리드 리트리버
│   │   ├── source_researcher.py    # URL 피드 자동 감지(RSS/Atom/GitHub) 및 신규 소스 추천
│   │   ├── deep_researcher.py      # 자율 딥 리서치 엔진 (인용 도메인 마이닝 및 4축 자율 검증)
│   │   ├── briefing_service.py     # 일일 인텔리전스 종합 브리핑 자동 합성
│   │   ├── sources_service.py      # sources.json 수집원 CRUD 관리
│   │   ├── trend_service.py        # Tech Radar 기술 스택 빈도 및 급상승(Velocity) 산출
│   │   ├── notion_service.py       # Notion 공식 API 기반 브리핑 페이지 발행
│   │   ├── email_service.py        # SMTP HTML 뉴스레터 이메일 발송
│   │   └── webhook_service.py      # Slack Block Kit / Discord Rich Embeds 웹훅 발송
│   ├── collectors/      # RSS, GitHub, arXiv, Reddit, HackerNews, HuggingFace 비동기 수집 파이프라인
│   │   ├── manager.py   # CollectorManager (점진적 수집, 실시간 진행률 추적)
│   │   ├── categorizer.py # 4대 도메인 자동 분류 및 AI 연관성 게이트
│   │   └── base.py      # BaseCollector 수집 규약
│   ├── models/          # 3. Domain Entity Layer (SQLAlchemy 2.0 Async ORM)
│   │   ├── news.py      # NewsItem, CrawlLog, SourceResearchLog
│   │   └── chat_session.py # ChatSessionModel, ChatMessageModel
│   └── schemas/         # 4. Data Transfer Layer (Pydantic v2 Schemas)
│       ├── chat.py      # ChatStreamRequest, ChatQueryRequest, ChatSourceItem, StatusPayload 등
│       └── news.py      # NewsListResponse, DailyBriefingResponse, ScheduleStatusResponse 등
└── tests/               # pytest 비동기 단위 및 통합 테스트 스위트
```

### 1.1 멀티 LLM 프로바이더 추상화 및 에러 전파

AgentLens는 특정 벤더에 종속되지 않는 유연하고 신뢰할 수 있는 LLM 파이프라인을 운영합니다. 프로바이더별 구체적인 모델명과 API 키는 환경변수 및 설정 파일(`config.json`)을 통해 런타임에 동적으로 주입됩니다.

1. **Anthropic Claude 프로바이더 (`AnthropicLLMProvider`)**:
   - `BaseLLMProvider` 인터페이스 구현, 멀티 티어 라우팅 및 시스템 프롬프트 캐싱(`cache_control: {"type": "ephemeral"}`) 지원.
   - 예외 처리: 키 누락 시 `AnthropicKeyMissingException` (HTTP 401), 한도 초과 시 `AnthropicQuotaExceededException` (HTTP 429), 서버 과부하 시 `AnthropicOverloadedException` (HTTP 529).
2. **Google Gemini 프로바이더 (`_call_gemini`)**:
   - `generativelanguage.googleapis.com` 비동기 REST 직접 호출 (`generateContent`).
3. **OpenAI 프로바이더 (`_call_openai`, `stream_tokens`)**:
   - 비동기 OpenAI SDK (`openai.AsyncOpenAI`) 스트리밍 토큰 연동.
4. **OpenAI-Compatible 로컬 LLM 프로바이더 (`_call_ollama`)**:
   - 사내 자체 호스팅(Ollama, vLLM) 및 온프레미스 표준 엔드포인트 연동.

#### LLM 에러 전파 원칙
- **가용 프로바이더 부재 (HTTP 503)**:
  `check_provider_available()` 검증 시 활성화된 프로바이더 API 키나 가용한 로컬 런타임이 존재하지 않는 경우, `ERR_LLM_PROVIDER_UNAVAILABLE` (HTTP 503)을 반환하고 키 설정 안내를 제공합니다.
- **업스트림 통신 장애 (HTTP 502)**:
  외부 LLM API 호출 실패, 네트워크 타임아웃, 5xx 서버 에러 발생 시 `ERR_LLM_UPSTREAM_FAILED` (HTTP 502)를 명시적으로 반환합니다.
- **호출 한도 초과 (HTTP 429)**:
  외부 LLM API의 Rate Limit 또는 Quota 초과(HTTP 429) 감지 시 `ERR_LLM_QUOTA_EXCEEDED` (HTTP 429)를 클라이언트로 전파하여 재시도 안내를 제공합니다.
- **스트리밍 중단 (SSE event: error)**:
  토큰 전송 도중 네트워크가 단절되거나 외부 예외가 발생하면 `StreamErrorPayload` (`error_code: ERR_LLM_STREAM_FAILED`, `status_code: 502`, `retryable: true`) 이벤트를 방출하고 정상 종료합니다.
- **모델 식별자 무결성 보존**:
  `sanitize_model_identifier()`를 적용하여 요청 페이로드의 모델 지정값 및 과거 DB 메시지 레코드에 기록된 실제 모델 식별자(`model`, `model_tier`)를 왜곡 없이 그대로 보존합니다.

---

## 2. 데이터베이스 엔티티 관계도 (Mermaid ERD)

```mermaid
erDiagram
    NEWS_ITEMS ||--|| NEWS_FTS : content_sync_triggers
    NEWS_ITEMS |o--o{ CHAT_SESSIONS : active_source_id_fkey
    CHAT_SESSIONS ||--o{ CHAT_MESSAGES : cascade_delete_messages
    NEWS_ITEMS ||..o{ CRAWL_LOGS : logged_per_collector_run
    NEWS_ITEMS ||..o{ SOURCE_RESEARCH_LOGS : citation_domain_mined

    NEWS_ITEMS {
        int id PK "고유 아티클 ID (Auto Increment)"
        string title "기사/논문 제목 (VARCHAR 500)"
        string url "원문 링크 URL (VARCHAR 1000)"
        string source "수집 출처 코드 (VARCHAR 50, indexed)"
        string category "카테고리 코드 (VARCHAR 50, indexed)"
        text summary "본문 발췌 요약문 (TEXT)"
        string author "작성자/연구기관 (VARCHAR 200, nullable)"
        string tags "태그 키워드 목록 (VARCHAR 500)"
        text tldr_bullets "JSON 직렬화된 3줄 핵심 요약 불릿 (TEXT)"
        text why_it_matters "엔지니어링 시사점 및 아키텍처 인사이트 (TEXT)"
        string tech_stack "추출된 기술/모델 엔티티 (VARCHAR 500)"
        float quality_score "품질 점수 1.0~10.0 (FLOAT, indexed)"
        boolean is_high_signal "고신호 Must-Read 여부 (BOOLEAN, indexed)"
        int raw_score "외부 추천/스타수 (INTEGER)"
        int comments_count "외부 댓글 수 (INTEGER)"
        float hotness_score "시간 감쇠 화제성 점수 (FLOAT, indexed)"
        text full_content "실시간 추출된 원문 아티클 전문 (TEXT, nullable)"
        datetime scraped_at "전문 스크래핑 완료 일시 (DATETIME UTC, indexed, nullable)"
        datetime published_at "원문 발행 일시 (DATETIME UTC, indexed)"
        datetime created_at "DB 최초 수집 일시 (DATETIME UTC)"
        string dedup_hash UK "정규화 URL+제목 SHA-256 해시 (VARCHAR 64, unique)"
    }

    NEWS_FTS {
        int rowid UNINDEXED "news_items.id 참조 (content_rowid)"
        text title "제목 전문 색인 (FTS5)"
        text summary "요약 전문 색인 (FTS5)"
        text why_it_matters "개발자 시사점 전문 색인 (FTS5)"
        text tech_stack "추출 기술 스택 전문 색인 (FTS5)"
        text tags "태그 키워드 전문 색인 (FTS5)"
    }

    CHAT_SESSIONS {
        string id PK "세션 고유 ID (VARCHAR 36 UUID v4)"
        string title "세션 제목 (VARCHAR 100, 기본값 '새 대화')"
        string scope_mode "검색 스코프 모드 ('scoped', 'global', VARCHAR 20)"
        int active_source_id FK "선택 기사 ID (INTEGER, nullable, ON DELETE SET NULL)"
        text active_filters_json "타깃 포커스 필터 직렬화 JSON (TEXT, nullable)"
        datetime created_at "세션 생성 일시 (DATETIME UTC)"
        datetime updated_at "마지막 질의/수정 일시 (DATETIME UTC, indexed)"
    }

    CHAT_MESSAGES {
        string id PK "메시지 고유 ID (VARCHAR 36 UUID v4)"
        string session_id FK "소속 세션 UUID (VARCHAR 36, indexed, ON DELETE CASCADE)"
        string role "화자 역할 ('user', 'assistant', 'system', VARCHAR 20)"
        text content "메시지 본문 내용 (TEXT)"
        text sources_json "인용된 원본/보충 출처 목록 JSON (TEXT, nullable)"
        string status "메시지 상태 ('pending', 'streaming', 'completed', 'error', 'aborted', VARCHAR 20)"
        int latency_ms "응답 생성 소요 시간 밀리초 (INTEGER, nullable)"
        string model "답변 생성에 사용된 LLM 모델 식별자 (VARCHAR 50, nullable)"
        string model_tier "적용된 모델 티어 ('haiku', 'sonnet', 'opus', VARCHAR 20, nullable)"
        text usage_json "토큰 소비 및 프롬프트 캐시 통계 JSON (TEXT, nullable)"
        datetime created_at "메시지 발송/생성 일시 (DATETIME UTC, indexed)"
    }

    CRAWL_LOGS {
        int id PK "로그 ID (Auto Increment)"
        string source "수집 출처 식별자 (VARCHAR 50)"
        int items_crawled "탐색된 총 아이템 수 (INTEGER)"
        int items_saved "신규 저장된 아이템 수 (INTEGER)"
        string status "수집 상태 ('success', 'error', 'partial', VARCHAR 20)"
        text error_message "수집 실패 시 에러 메시지 (TEXT, nullable)"
        datetime started_at "수집 시작 일시 (DATETIME UTC)"
        datetime completed_at "수집 완료 일시 (DATETIME UTC)"
    }

    SOURCE_RESEARCH_LOGS {
        int id PK "연구 감사 일지 ID (Auto Increment)"
        string source_name "발굴된 소스 표시명 (VARCHAR 200)"
        string site_url "웹사이트 홈 URL (VARCHAR 500)"
        string feed_url "RSS/Atom 피드 URL (VARCHAR 500)"
        string category "분류된 카테고리 (VARCHAR 50)"
        float relevance_score "도메인 적합도 점수 0.0~10.0 (FLOAT)"
        string verdict "판정 결과 ('AUTO_ADOPTED', 'WATCHLIST', 'REJECTED', VARCHAR 30)"
        text verdict_reason "AI 판정 근거 상세 의견서 (TEXT)"
        int analyzed_articles_count "샘플링 분석 기사 수 (INTEGER)"
        datetime created_at "연구 일시 (DATETIME UTC, indexed)"
    }
```

---

## 3. 인덱싱 및 쿼리 최적화 전략 (Indexing Strategy)

| 테이블명 | 인덱스 식별자 | 인덱스 컬럼 | 인덱스 유형 | 생성 목적 및 대상 쿼리 |
| :--- | :--- | :--- | :--- | :--- |
| `news_items` | `ix_news_items_dedup_hash` | `dedup_hash` | UNIQUE B-Tree | 수집 파이프라인에서 신규 아티클의 $O(1)$ 중복 감지 및 INSERT 충돌 방지 |
| `news_items` | `idx_category_published` | `(category, published_at DESC)` | Composite B-Tree | 카테고리별 최신순 뉴스 피드 정렬 및 오프셋 페이징 조회 가속화 |
| `news_items` | `idx_category_hotness` | `(category, hotness_score DESC)` | Composite B-Tree | 카테고리별 트렌딩(Hot) 랭킹 정렬 및 탭 전환 응답 최적화 |
| `news_items` | `idx_high_signal` | `(is_high_signal, hotness_score DESC)` | Composite B-Tree | ⭐️ `Must Read` 고신호 전용 피드 필터링 및 랭킹 정렬 가속화 |
| `news_items` | `ix_news_items_quality_score` | `quality_score` | B-Tree | 품질 점수 정렬 및 RAG 검색 기본 품질 컷오프(5.0) 조건절 필터링 |
| `news_items` | `ix_news_items_scraped_at` | `scraped_at DESC` | B-Tree | 원문 전문(`full_content`) 스크래핑 캐시 상태 확인 및 최근 캐시 우선 조회 |
| `news_items` | `ix_news_items_source` | `source` | B-Tree | 특정 소스 코드(GitHub, arXiv, HackerNews 등) 단독 필터링 |
| `news_items` | `ix_news_items_published_at`| `published_at DESC` | B-Tree | 전체 카테고리 통합 최신순 피드 정렬 |
| `news_fts` | `news_fts` (FTS5) | `title, summary, why_it_matters, tech_stack, tags` | FTS5 Inverted Index | 지식 코퍼스 BM25 전문 검색 ($0.5 \cdot \text{BM25} + 0.3 \cdot \text{Quality} + 0.2 \cdot \text{Recency}$) |
| `chat_sessions` | `idx_chat_sessions_updated_at`| `updated_at DESC` | B-Tree | 최근 대화 세션 목록 최신 활동순 정렬 조회 (`limit=30`) |
| `chat_messages` | `idx_chat_messages_session_created` | `(session_id, created_at ASC)` | Composite B-Tree | 세션 내 전체 대화 이력 시간순 복원 및 최근 10턴 슬라이딩 윈도우 인출 |
| `chat_messages` | `ix_chat_messages_session_id` | `session_id` | B-Tree | 세션 삭제 시 외래키 참조 레코드 CASCADE 삭제 가속화 |
| `source_research_logs` | `ix_source_research_logs_created_at` | `created_at DESC` | B-Tree | 자율 딥 리서치 감사 일지 최신순 페이징 조회 (`limit=30`) |

---

## 4. 트랜잭션 및 동시성 제어 정책 (Concurrency & Transactions)

1. **SQLite WAL 모드 및 고성능 동시성 제어**:
   - 커넥션 풀 생성(`database.py`) 시 이벤트 리스너를 통해 아래 PRAGMA 지시어를 즉시 주입합니다:
     - `PRAGMA journal_mode = WAL;` (Write-Ahead Logging: 독자-기록자 간 비차단 동시 접근 보장)
     - `PRAGMA synchronous = NORMAL;` (WAL 모드 환경에서 안정성과 디스크 I/O 처리량 극대화)
     - `PRAGMA busy_timeout = 30000;` (최대 30초 락 대기로 일시적 트랜잭션 경합 시 `database locked` 에러 방지)
     - `PRAGMA foreign_keys = ON;` (외래키 무결성 및 CASCADE 삭제 강제 활성화)
     - `PRAGMA cache_size = -64000;` (64MB 공유 메모리 캐시 할당으로 FTS5 및 대용량 인덱스 조회 가속화)
2. **대화 턴 영속화 원자성 및 CASCADE 무결성**:
   - `POST /api/chat/stream` 스트리밍 완료(`event: done`) 시 `ChatSessionService.persist_turn()`을 통해 단일 데이터베이스 트랜잭션 내에서:
     - 사용자 질문 메시지 INSERT
     - 어시스턴트 완료 답변 메시지 INSERT (인용 출처 JSON, 실제 모델 식별자, 레이턴시, 토큰 통계 포함)
     - 세션 제목 자동 생성(최초 질의 30자) 및 `updated_at` 타임스탬프 갱신을 원자적으로 COMMIT합니다.
   - 전체 활성 세션 수가 30개(`CHAT_SESSION_MAX_LIMIT`)를 초과하는 경우 `updated_at ASC` 기준 가장 오래된 세션을 자동 축출(FIFO Eviction)하며, `ON DELETE CASCADE` 제약조건에 의해 연관된 하위 `chat_messages`가 일괄 삭제됩니다.
3. **기사 스크래핑 Single-Flight 동시성 제어**:
   - 동일 기사 URL에 대해 동시 스크래핑 요청이 유입될 경우, `ArticleScraperService`의 URL별 `asyncio.Lock`을 통해 외부 네트워크 요청(타임아웃 5.0초)을 단 1회만 실행하고, 후속 요청은 메모리(L1) 및 DB `full_content`(L2) 캐시를 즉시 공유합니다.
4. **백그라운드 수집 및 딥 리서치 작업 격리**:
   - 크롤러 주기 실행 및 수동 수집 트리거(`/api/schedule/trigger`, `/api/research/run-deep`)는 FastAPI `BackgroundTasks` 및 독립 `asyncio.create_task`로 기동되어 REST API 응답 블로킹을 방지합니다.

---

## 5. RESTful API 엔드포인트 명세 목록 (Endpoint Catalog)

상세 OpenAPI 3.1 YAML 스펙은 [`02_OPENAPI_SPEC.yaml`](./02_OPENAPI_SPEC.yaml)을 참조합니다.

| 도메인 | Method | Endpoint Path | Summary | Auth | Request Body / Query Params | Response Body / Status |
| :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| **Chat** | `POST` | `/api/chat/stream` | 전용 AI 챗 4대 멀티 LLM SSE 실시간 스트리밍 질의응답 | Public | `ChatStreamRequest` | `text/event-stream` (`status`, `sources`, `token`, `done`, `error`) |
| **Chat** | `POST` | `/api/chat/query` | 전용 AI 챗 4대 멀티 LLM 동기식 단건 질의응답 | Public | `ChatQueryRequest` | `ChatQueryResponse` (200) |
| **Chat** | `GET` | `/api/chat/sources/{source_id}` | Scoped 핸드오버 및 인용 팝오버용 기사 상세 메타데이터 조회 | Public | Path: `source_id: int` | `ChatSourceDetailResponse` (200, 404) |
| **Chat** | `GET` | `/api/chat/search` | 코퍼스 지식 하이브리드 RAG 검색 프리뷰 (FTS5 + Quality + Recency) | Public | `q`, `top_k`, `min_quality`, `category`, `time_range`, `sort`, `high_signal_only`, `source` | `ChatSearchResponse` (200, 400, 500) |
| **Chat** | `GET` | `/api/chat/sessions` | 최근 대화 세션 목록 조회 (`updated_at DESC`, 최대 30개) | Public | `limit: int = 30`, `offset: int = 0` | `List[ChatSessionSummary]` (200) |
| **Chat** | `POST` | `/api/chat/sessions` | 신규 대화 세션 생성 또는 오프라인 배치 업서트 | Public | `ChatSessionCreateRequest` | `ChatSessionDetail` (201, 400, 500) |
| **Chat** | `GET` | `/api/chat/sessions/{session_id}` | 특정 세션 상세 메타데이터 및 전체 메시지 이력 조회 | Public | Path: `session_id: str` | `ChatSessionDetail` (200, 404, 500) |
| **Chat** | `DELETE` | `/api/chat/sessions/{session_id}` | 대화 세션 및 하위 메시지 CASCADE 영구 삭제 | Public | Path: `session_id: str` | `GenericSuccessResponse` (200, 404, 500) |
| **News** | `GET` | `/api/news` | 뉴스 피드 목록 다차원 필터링, 검색, 정렬 및 페이징 조회 | Public | `category`, `source`, `search`, `high_signal_only`, `sort`, `page`, `size` | `NewsListResponse` (200) |
| **News** | `DELETE` | `/api/news/all` | 데이터베이스 내 모든 뉴스 아이템 영구 삭제 | Public | - | `GenericSuccessResponse` (200) |
| **News** | `GET` | `/api/news/{news_id}` | 특정 뉴스 아이템 단건 상세 조회 | Public | Path: `news_id: int` | `NewsItemResponse` (200, 404) |
| **News** | `POST` | `/api/news/{news_id}/ask` | 특정 뉴스 아이템 대상 인라인 Ask AI 동기식 질의응답 | Public | Path: `news_id: int`, Body: `AskQuestionRequest` | `AskQuestionResponse` (200, 404) |
| **News** | `POST` | `/api/news/{news_id}/ask/stream` | 특정 뉴스 아이템 대상 인라인 Ask AI 실시간 SSE 스트리밍 | Public | Path: `news_id: int`, Body: `AskQuestionRequest` | `text/event-stream` (200, 404) |
| **News** | `GET` | `/api/news/feed/rss.xml` | RSS 2.0 XML 피드 발행 | Public | `category: Optional[str]` | `application/xml` (200) |
| **Briefing** | `GET` | `/api/briefing/today` | 오늘의 AI 종합 인텔리전스 브리핑 조회 (미존재 시 자동 생성) | Public | - | `DailyBriefingResponse` (200) |
| **Briefing** | `POST` | `/api/briefing/generate` | 오늘의 AI 종합 브리핑 강제 재생성 | Public | - | `DailyBriefingResponse` (200) |
| **Briefing** | `POST` | `/api/briefing/export/notion` | 일일 브리핑을 Notion 페이지로 발행 | Public | `NotionExportRequest` | `NotionExportResponse` (200, 400) |
| **Briefing** | `POST` | `/api/briefing/send/email` | 일일 브리핑 HTML 뉴스레터 이메일 발송 | Public | `EmailSendRequest` | `EmailSendResponse` (200, 400) |
| **Briefing** | `POST` | `/api/briefing/test/notion` | Notion API 키 및 페이지 연결 테스트 | Public | `TestNotionRequest` | `{"success": bool, "message": str}` (200, 400) |
| **Briefing** | `POST` | `/api/briefing/test/email` | SMTP 이메일 발송 연결 테스트 | Public | `TestEmailRequest` | `{"success": bool, "message": str}` (200, 400) |
| **Briefing** | `GET` | `/api/briefing/settings` | 브리핑 연동 설정(Notion, SMTP, Webhook) 조회 (마스킹 적용) | Public | - | `BriefingSettingsResponse` (200) |
| **Briefing** | `POST` | `/api/briefing/settings` | 브리핑 연동 설정 저장 (config.json 영속화) | Public | `BriefingSettingsUpdate` | `{"success": bool, "message": str}` (200, 500) |
| **Sources** | `GET` | `/api/sources` | 수집 대상 소스 목록 및 활성 상태 통계 조회 | Public | - | `SourcesResponse` (200) |
| **Sources** | `POST` | `/api/sources/rss` | 신규 RSS/Atom 피드 등록 | Public | `AddRssRequest` | `{"status": str, "message": str, "source": dict}` (200, 400) |
| **Sources** | `POST` | `/api/sources/github` | 신규 GitHub 모니터링 저장소 등록 | Public | `AddGitHubRepoRequest` | `{"status": str, "message": str, "repo": dict}` (200, 400) |
| **Sources** | `PATCH` | `/api/sources/{source_type}/{item_id}/toggle` | 특정 소스 활성화/비활성화 상태 토글 | Public | Path: `source_type: str`, `item_id: str` | `{"status": str, "message": str}` (200, 404) |
| **Sources** | `DELETE` | `/api/sources/{source_type}/{item_id}` | 등록된 소스 영구 삭제 | Public | Path: `source_type: str`, `item_id: str` | `{"status": str, "message": str}` (200, 404) |
| **Research** | `POST` | `/api/research/inspect-url` | 임의 URL 피드 자동 감지 및 신호 적합도 분석 | Public | `InspectUrlRequest` | `InspectUrlResponse` (200, 400) |
| **Research** | `POST` | `/api/research/discover` | 키워드/카테고리 기반 신규 고품질 소스 후보 자율 발굴 | Public | `DiscoverRequest` | `DiscoverResponse` (200) |
| **Research** | `POST` | `/api/research/register-candidate` | 발굴된 추천 소스 후보 원클릭 수집 등록 | Public | `RegisterCandidateRequest` | `{"status": str, "message": str}` (200, 400) |
| **Research** | `GET` | `/api/research/status` | 자율 딥 리서치 엔진 현재 실행 상태 조회 | Public | - | `DeepResearchStatusResponse` (200) |
| **Research** | `GET` | `/api/research/audit-logs` | 자율 딥 리서치 소스 평가 감사 로그 조회 | Public | `limit: int = 30` | `ResearchAuditLogsResponse` (200) |
| **Research** | `POST` | `/api/research/run-deep` | 자율 딥 리서치 사이클 백그라운드 즉시 기동 | Public | `max_candidates: int = 6` | `{"status": str, "message": str, "max_candidates": int}` (200) |
| **Schedule** | `GET` | `/api/schedule/status` | 크론 스케줄러 상태 및 최근 크롤링 로그 조회 | Public | - | `ScheduleStatusResponse` (200) |
| **Schedule** | `GET` | `/api/schedule/progress` | 실시간 점진적 수집 진행률 및 현재 소스 조회 | Public | - | `CrawlProgressResponse` (200) |
| **Schedule** | `POST` | `/api/schedule/trigger` | 실시간 점진적 크롤링 백그라운드 즉시 시작 | Public | - | `{"status": str, "message": str, ...}` (200) |
| **Schedule** | `POST` | `/api/schedule/reset-and-collect` | 기존 데이터 전체 초기화 후 클린 재수집 시작 | Public | - | `{"status": str, "message": str, "deleted_count": int}` (200) |
| **Trends** | `GET` | `/api/trends/radar` | Tech Radar 기술 스택 빈도 및 급상승(Surging) 지표 조회 | Public | - | `TechRadarResponse` (200) |
| **Webhook** | `POST` | `/api/webhook/test` | Slack / Discord 웹훅 전송 테스트 | Public | `WebhookTestRequest` | `{"success": bool, "message": str}` (200, 400) |
| **Webhook** | `POST` | `/api/webhook/send-briefing` | 오늘의 일일 브리핑을 지정된 웹훅으로 즉시 발송 | Public | `WebhookBriefingRequest` | `{"success": bool, "message": str}` (200, 400) |
| **Stats** | `GET` | `/api/stats` | 데이터베이스 전체 기사수, 카테고리별/출처별 통계 조회 | Public | - | `StatsResponse` (200) |
| **MCP** | `GET` | `/api/mcp/info` | FastMCP 도구 메타데이터 및 Claude Desktop 연동 가이드 | Public | - | `McpInfoResponse` (200) |
| **System** | `GET` | `/` | API 루트 서비스 메타데이터 및 문서 링크 | Public | - | `RootResponse` (200) |
| **System** | `GET` | `/health` | 서버 헬스체크 및 크롤러 동작 상태 조회 | Public | - | `HealthResponse` (200) |

---

## 6. 에러 코드 및 예외 처리 아키텍처 (Error Architecture)

AgentLens 백엔드는 모든 예외 상황에 대해 일관된 Pydantic JSON 에러 스키마(`ErrorResponse: { error_code, message, details }`)를 반환합니다.

| HTTP Status | 비즈니스 에러 코드 (`error_code`) | 발생 원인 및 비즈니스 정책 |
| :---: | :--- | :--- |
| **400** | `ERR_INVALID_PAYLOAD` | 요청 본문(JSON) 형식이 올바르지 않거나 파싱 불가 |
| **400** | `ERR_CHAT_PAYLOAD_EMPTY` | 질문 프롬프트(`question`)가 비어있거나 공백 문자열임 |
| **400** | `ERR_CHAT_PAYLOAD_TOO_LARGE` | 질문 본문 길이가 2,000자를 초과함 |
| **400** | `ERR_INVALID_SCOPE_PARAM` | 유효하지 않은 검색 스코프 모드 지정 (`scoped`, `global` 외의 값) |
| **400** | `ERR_SEARCH_QUERY_TOO_SHORT` | 코퍼스 지식 검색어(`q`)가 2글자 미만임 |
| **400** | `ERR_SESSION_INVALID_UUID` | 세션 ID가 유효한 UUID v4 형식이 아니거나 요청 유효성 검증 실패 |
| **401** | `ERR_CLAUDE_API_KEY_MISSING` | Anthropic Claude 호출 시 `ANTHROPIC_API_KEY`가 설정되지 않음 |
| **404** | `ERR_HANDOVER_SOURCE_NOT_FOUND` | Scoped 모드에서 지정된 `source_id` 기사가 DB에 존재하지 않음 |
| **404** | `ERR_SESSION_NOT_FOUND` | 요청된 `session_id`의 대화 세션이 DB에 존재하지 않음 |
| **429** | `ERR_LLM_QUOTA_EXCEEDED` | 외부 LLM API(Gemini, OpenAI, Anthropic)의 호출 한도(Rate Limit / Quota) 초과 |
| **429** | `ERR_CLAUDE_QUOTA_EXCEEDED` | Anthropic Claude API의 TPM/RPM 호출 한도 초과 |
| **502** | `ERR_LLM_UPSTREAM_FAILED` | 외부 LLM API 통신 장애, 5xx 에러 또는 응답 불가 |
| **502** | `ERR_LLM_STREAM_FAILED` | SSE 스트리밍 토큰 전송 도중 네트워크 단절 또는 업스트림 예외 발생 (`event: error`) |
| **503** | `ERR_LLM_PROVIDER_UNAVAILABLE` | 가용한 LLM 프로바이더 엔진 미설정 (API 키 미등록, 로컬 Ollama 미기동) |
| **529** | `ERR_CLAUDE_OVERLOADED` | Anthropic Claude 업스트림 서버 일시적 과부하 (HTTP 529) |
| **500** | `ERR_SERVER_INTERNAL` | 서버 내부 예상치 못한 미처리 예외 발생 |
| **500** | `ERR_SESSION_CREATE_FAILED` | 신규 세션 생성 트랜잭션 커밋 실패 |
| **500** | `ERR_SESSION_DELETE_FAILED` | 세션 삭제 트랜잭션 커밋 실패 |
| **500** | `ERR_RETRIEVER_INDEX_ERROR` | SQLite FTS5 검색 인덱스 쿼리 실행 실패 |
