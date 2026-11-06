# API 명세: AgentLens

Updated: 2026-11-06

이 문서는 backend 코드(`backend/app/`)에서 역으로 정리한 HTTP API 명세다. 정적 OpenAPI 파일은 없고, 런타임 `/docs`·`/openapi.json` 은 FastAPI 가 만든다. 아래 내용은 코드에서 확인한 사실만 적는다. 서버와 테스트는 실행하지 않았다.

## 공통

### 베이스 URL과 경로
- backend 는 `uvicorn app.main:app` 으로 :8000 에서 뜬다 (`docker-compose.yml` 의 `BACKEND_PORT` 기본 8000).
- 업무 API 는 모두 `/api` 접두사 아래에 있다. `api_router = APIRouter(prefix="/api")` 가 라우터 10개(news, schedule, stats, mcp, briefing, trends, webhook, sources, research, chat)를 묶는다 (`backend/app/api/router.py:13`).
- 접두사 밖의 엔드포인트는 `GET /`, `GET /health` 둘이다 (`backend/app/main.py:50`, `:54`). FastAPI 기본값이 그대로라 `/docs`, `/redoc`, `/openapi.json` 도 열린다 (`backend/app/main.py:28`, `docs_url` 등을 끄지 않는다).

### 프록시와 직접 연결
- 프론트는 브라우저에서 상대 경로 `/api/...` 를 부른다. Next rewrite 가 `/api/:path*` 를 `${INTERNAL_API_URL}/api/:path*`(기본 `http://127.0.0.1:8000`)로 넘긴다 (`frontend/next.config.ts`). 서버 측 렌더링에서는 `INTERNAL_API_URL` → `NEXT_PUBLIC_API_URL` → `http://127.0.0.1:8000` 순으로 베이스를 정한다 (`frontend/src/lib/api.ts:3`).
- 직접 연결: `POST /api/news/{id}/ask/stream` 만 `getDirectApiBase()` 로 backend 에 직접 붙는다. `NEXT_PUBLIC_API_URL` 이 있으면 그것을, 없으면 브라우저 호스트의 `:8000` 을 쓴다. 직접 연결이 실패하면(AbortError 제외) 상대 경로로 한 번 더 시도한다 (`frontend/src/lib/api.ts:12`, `:97`).
- `POST /api/chat/stream` 은 직접 연결을 쓰지 않는다. `ChatWorkspace.tsx` 가 상대 경로 `/api/chat/stream` 으로 부르므로 Next rewrite 를 거친다 (`frontend/src/components/chat/ChatWorkspace.tsx:300`).

### 인증
- 없다. 어떤 엔드포인트에도 의존성(Depends) 기반 인증, API 키 검사, 세션 검사가 없다. 쓰기·삭제·외부 발송 엔드포인트도 마찬가지다.

### CORS
- `CORSMiddleware(allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])` (`backend/app/main.py:29`).
- `settings.CORS_ORIGINS` (`backend/app/config.py:45`) 는 정의만 있고 `main.py` 는 이를 읽지 않고 `["*"]` 를 직접 넣는다.

### Content-Type
- 요청: JSON 본문을 받는 엔드포인트는 `application/json` 을 기대한다. chat 의 `/query`, `/stream`, `POST /sessions` 는 FastAPI 본문 바인딩 대신 `await request.json()` 으로 직접 읽는다. 그래서 자동 생성 OpenAPI 에 이 세 엔드포인트의 요청 본문 스키마가 나타나지 않는다 (`backend/app/api/chat.py:125`, `:277`, `:444`).
- 응답: 대부분 `application/json`. 예외는 `GET /api/news/feed/rss.xml`(`application/xml`), `POST /api/news/{id}/ask/stream`(`text/event-stream`), `POST /api/chat/stream`(`text/event-stream; charset=utf-8`)이다.

### 오류 응답 형식
라우터마다 형식이 다르다. 네 가지가 섞여 있다.

| 형식 | 모양 | 쓰는 곳 |
|---|---|---|
| HTTPException | `{"detail": "<메시지 문자열>"}` | news, briefing, webhook, sources, research |
| 요청 검증 실패 (FastAPI 기본) | 422, `{"detail": [{"type", "loc", "msg", "input", ...}]}` | 쿼리·경로·본문 모델 바인딩을 쓰는 모든 엔드포인트. 기본 핸들러를 덮어쓰지 않는다 |
| chat ErrorResponse | `{"error_code": "ERR_...", "message": "...", "details": null 또는 {"error": "..."}}` | chat 라우터 전부 (`JSONResponse` 로 직접 만든다) |
| 전역 예외 처리 | 500, `{"detail": "Internal server error occurred. Please check server logs.", "error": "<str(exc)>"}` | 처리하지 않은 모든 예외 (`backend/app/main.py:37`). 예외 문자열을 그대로 응답에 싣는다 |

- 실패를 200 으로 돌려주는 엔드포인트도 있다. `POST /api/research/inspect-url` 은 접속 실패도 200 과 `"status": "error"` 로 응답하고, `POST /api/schedule/trigger`, `POST /api/schedule/reset-and-collect`, `POST /api/research/run-deep` 은 이미 실행 중이면 200 과 `"status": "already_running"` 을 준다.

### 페이지네이션
엔드포인트마다 방식이 다르다.

| 엔드포인트 | 파라미터 | 규칙 |
|---|---|---|
| `GET /api/news` | `page`(≥1, 기본 1), `size`(1~100, 기본 20) | offset = `(page-1)*size`. 응답에 `total`, `page`, `size`, `total_pages`(`ceil(total/size)`, total 이 0 이면 1) |
| `GET /api/chat/sessions` | `limit`(1~50, 기본 30), `offset`(≥0, 기본 0) | `updated_at` 내림차순. 응답은 배열만 주고 전체 개수는 주지 않는다 |
| `GET /api/research/audit-logs` | `limit`(기본 30, 제약 없음) | `created_at` 내림차순. 응답 `total` 은 이번에 돌려준 개수다 |
| `GET /api/chat/search` | `top_k`(1~20, 기본 5) | 상위 k 개만 |
| `GET /api/news/feed/rss.xml` | 없음 | `published_at` 내림차순 최대 50개 고정 |

### 날짜 형식
- DB 의 `DateTime` 컬럼(`published_at`, `created_at`, `started_at` 등)은 SQLite 에 시간대 없이 저장되어 오프셋 없는 ISO 8601 문자열(예: `2026-11-06T01:02:03.123456`)로 나간다. 코드는 이 값을 UTC 로 기록하고 UTC 로 해석한다 (`backend/app/services/trend_service.py:73` 의 `tzinfo is None` 보정 참고).
- 서버가 그 자리에서 만드는 시각(`datetime.now(timezone.utc).isoformat()`)은 `+00:00` 오프셋이 붙는다 (예: `stats.last_updated`, `schedule.current_time`, `briefing.generated_at`, SSE `status.timestamp`).
- 일일 브리핑의 `date` 는 `"%Y년 %m월 %d일"` 형식의 한국어 문자열이다 (`backend/app/services/briefing_service.py:114`).
- RSS `pubDate` 는 `"%a, %d %b %Y %H:%M:%S GMT"` 다 (`backend/app/api/news.py:184`).

## 엔드포인트 요약

총 44개 (News 6, Chat 8, Briefing 8, Schedule 4, Sources 5, Research 6, Trends 1, Webhook 2, Stats 1, MCP 1, 기타 2).

| 메서드 | 경로 | 설명 | 라우터 파일 | 프론트 사용처 (api.ts 함수 / 없음) |
|---|---|---|---|---|
| GET | `/` | 서비스 이름·버전 | `backend/app/main.py` | 없음 |
| GET | `/health` | 헬스체크 | `backend/app/main.py` | 없음 (docker-compose healthcheck 가 부른다) |
| GET | `/api/news` | 뉴스 목록 (필터·정렬·페이지) | `backend/app/api/news.py` | `fetchNewsFeed` |
| DELETE | `/api/news/all` | 뉴스 전체 삭제 | `backend/app/api/news.py` | `deleteAllNews` (정의만 있고 호출처 없음) |
| GET | `/api/news/{news_id}` | 뉴스 단건 | `backend/app/api/news.py` | 없음 |
| POST | `/api/news/{news_id}/ask` | 기사 Ask AI (동기) | `backend/app/api/news.py` | `askQuestionAboutNews` (정의만 있고 호출처 없음) |
| POST | `/api/news/{news_id}/ask/stream` | 기사 Ask AI (SSE) | `backend/app/api/news.py` | `askQuestionAboutNewsStream` |
| GET | `/api/news/feed/rss.xml` | RSS 2.0 피드 | `backend/app/api/news.py` | 없음 (`Header.tsx` 의 링크 href) |
| GET | `/api/chat/sources/{source_id}` | 챗 핸드오버용 기사 상세 | `backend/app/api/chat.py` | 없음 (`ChatWorkspace.tsx` 가 직접 fetch) |
| GET | `/api/chat/search` | 코퍼스 검색 미리보기 | `backend/app/api/chat.py` | 없음 |
| POST | `/api/chat/query` | 챗 단발 질의 (동기) | `backend/app/api/chat.py` | 없음 |
| POST | `/api/chat/stream` | 챗 질의 (SSE) | `backend/app/api/chat.py` | 없음 (`ChatWorkspace.tsx` 가 직접 fetch) |
| GET | `/api/chat/sessions` | 대화 세션 목록 | `backend/app/api/chat.py` | 없음 (`useChatSessions.ts` 가 직접 fetch) |
| POST | `/api/chat/sessions` | 대화 세션 생성/업서트 | `backend/app/api/chat.py` | 없음 (`useChatSessions.ts` 가 직접 fetch) |
| GET | `/api/chat/sessions/{session_id}` | 대화 세션 상세 | `backend/app/api/chat.py` | 없음 (`useChatSessions.ts` 가 직접 fetch) |
| DELETE | `/api/chat/sessions/{session_id}` | 대화 세션 삭제 | `backend/app/api/chat.py` | 없음 (`useChatSessions.ts` 가 직접 fetch) |
| GET | `/api/briefing/today` | 오늘의 브리핑 | `backend/app/api/briefing.py` | `fetchDailyBriefing` |
| POST | `/api/briefing/generate` | 브리핑 재생성 | `backend/app/api/briefing.py` | 없음 |
| POST | `/api/briefing/export/notion` | 브리핑을 Notion 페이지로 | `backend/app/api/briefing.py` | `exportBriefingToNotion` |
| POST | `/api/briefing/send/email` | 브리핑 이메일 발송 | `backend/app/api/briefing.py` | `sendBriefingByEmail` |
| POST | `/api/briefing/test/notion` | Notion 연결 테스트 | `backend/app/api/briefing.py` | `testNotionConnection` |
| POST | `/api/briefing/test/email` | SMTP 연결 테스트 (테스트 메일 발송) | `backend/app/api/briefing.py` | `testEmailConnection` |
| GET | `/api/briefing/settings` | 브리핑·발송 설정 조회 | `backend/app/api/briefing.py` | `fetchBriefingSettings` |
| POST | `/api/briefing/settings` | 브리핑·발송 설정 저장 (config.json) | `backend/app/api/briefing.py` | `updateBriefingSettings` |
| GET | `/api/schedule/status` | 수집 스케줄·최근 로그 | `backend/app/api/schedule.py` | `fetchScheduleStatus` |
| GET | `/api/schedule/progress` | 수집 진행 상황 | `backend/app/api/schedule.py` | `fetchCrawlProgress` |
| POST | `/api/schedule/trigger` | 수동 수집 시작 | `backend/app/api/schedule.py` | `triggerManualCollect` |
| POST | `/api/schedule/reset-and-collect` | 뉴스·로그 전체 삭제 후 재수집 | `backend/app/api/schedule.py` | `resetAndRecollect` |
| GET | `/api/sources` | 수집 소스 목록·통계 | `backend/app/api/sources.py` | `fetchSources` |
| POST | `/api/sources/rss` | RSS 소스 추가 | `backend/app/api/sources.py` | `addRssSource` |
| POST | `/api/sources/github` | GitHub 저장소 추가 | `backend/app/api/sources.py` | 없음 |
| PATCH | `/api/sources/{source_type}/{item_id}/toggle` | 소스 활성 토글 | `backend/app/api/sources.py` | `toggleSource` |
| DELETE | `/api/sources/{source_type}/{item_id}` | 소스 삭제 | `backend/app/api/sources.py` | `deleteSource` |
| POST | `/api/research/inspect-url` | URL 의 피드 탐지·평가 | `backend/app/api/research.py` | `inspectUrl` |
| POST | `/api/research/discover` | 큐레이션 카탈로그에서 후보 추천 | `backend/app/api/research.py` | `discoverSources` (정의만 있고 호출처 없음) |
| POST | `/api/research/register-candidate` | 후보를 RSS 소스로 등록 | `backend/app/api/research.py` | `registerCandidate` (정의만 있고 호출처 없음) |
| GET | `/api/research/status` | 딥 리서치 상태 | `backend/app/api/research.py` | `fetchDeepResearchStatus` |
| GET | `/api/research/audit-logs` | 딥 리서치 판정 기록 | `backend/app/api/research.py` | `fetchResearchAuditLogs` |
| POST | `/api/research/run-deep` | 딥 리서치 즉시 실행 | `backend/app/api/research.py` | `triggerDeepResearch` |
| GET | `/api/trends/radar` | 기술 레이더 집계 | `backend/app/api/trends.py` | `fetchTechRadar` |
| POST | `/api/webhook/test` | 웹훅 테스트 메시지 발송 | `backend/app/api/webhook.py` | `testWebhook` |
| POST | `/api/webhook/send-briefing` | 브리핑을 웹훅으로 발송 | `backend/app/api/webhook.py` | `sendBriefingToWebhook` |
| GET | `/api/stats` | 뉴스 개수 통계 | `backend/app/api/stats.py` | `fetchStats` |
| GET | `/api/mcp/info` | MCP 서버 정보·Claude Desktop 설정 | `backend/app/api/mcp.py` | 없음 |

## News

### GET /api/news
- 뉴스 목록을 필터·검색·정렬해 페이지 단위로 돌려준다.
- 쿼리 파라미터

| 이름 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `category` | string | 아니오 | 없음 | 소문자로 바꿔 `news_items.category` 와 일치 비교. `all` 이면 필터 없음 |
| `source` | string | 아니오 | 없음 | 소문자로 바꿔 `news_items.source` 와 일치 비교. `all` 이면 필터 없음 |
| `search` | string | 아니오 | 없음 | 앞뒤 공백 제거 후 `title`, `summary`, `tags`, `tech_stack`, `why_it_matters` 에 `ILIKE %search%` (OR) |
| `high_signal_only` | bool | 아니오 | `false` | `true` 면 `is_high_signal = true` 만 |
| `sort` | string | 아니오 | `hot` | `latest`(published_at desc), `top`(raw_score desc), `quality`(quality_score desc, hotness_score desc). 그 밖의 값은 모두 `hot`(hotness_score desc, published_at desc) |
| `page` | int | 아니오 | 1 | ≥ 1 |
| `size` | int | 아니오 | 20 | 1 ~ 100 |

- 응답 200: `NewsListResponse`

```json
{
  "items": [ { "id": 1, "title": "...", "url": "https://...", "source": "hackernews", "category": "agent_tech",
    "summary": "", "author": null, "tags": ["agent"], "tldr_bullets": ["..."], "why_it_matters": "",
    "tech_stack": ["MCP"], "quality_score": 6.0, "is_high_signal": false, "raw_score": 0,
    "comments_count": 0, "hotness_score": 0.0, "published_at": "2026-11-06T01:02:03",
    "created_at": "2026-11-06T01:02:03", "dedup_hash": "..." } ],
  "total": 120, "page": 1, "size": 20, "total_pages": 6
}
```

- 변환 규칙: DB 의 `tags`, `tech_stack` 은 쉼표 구분 문자열을 배열로 쪼갠다. `tldr_bullets` 는 JSON 문자열을 파싱하고 실패하면 `[]`. `quality_score` 가 0 이나 NULL 이면 6.0 으로 바꾼다 (`backend/app/api/news.py:17`).
- 오류: 422 (`page` < 1, `size` 범위 밖 등 쿼리 검증 실패).
- 부수 효과: 없음 (읽기).
- 관련 코드: `backend/app/api/news.py:47`

### DELETE /api/news/all
- `news_items` 테이블의 모든 행을 지운다.
- 파라미터·본문: 없음.
- 응답 200: `{"status": "success", "deleted_count": <int>}` (response_model 없음).
- 오류: 명시 분기 없음. DB 예외는 전역 500.
- 부수 효과: `DELETE FROM news_items` 후 커밋. FTS5 트리거(`news_items_ad`)가 있으면 색인에서도 지운다. `crawl_logs` 는 지우지 않는다. 확인 절차나 인증이 없다.
- 관련 코드: `backend/app/api/news.py:96`

### GET /api/news/{news_id}
- 뉴스 한 건을 돌려준다.
- 경로 파라미터: `news_id` (int, 필수).
- 응답 200: `NewsItemResponse` (위 목록의 항목과 같은 모양).
- 오류: 404 `{"detail": "News item not found"}`, 422 (`news_id` 가 정수가 아님. `GET /api/news/all` 도 여기에 걸려 422 가 난다).
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/news.py:104`

### POST /api/news/{news_id}/ask
- 기사 제목·요약·카테고리·기술 스택을 넣은 프롬프트로 질문에 답한다.
- 경로 파라미터: `news_id` (int, 필수).
- 요청 본문: `AskQuestionRequest`

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `question` | string | 예 | — | 길이 제약 없음. 빈 문자열도 통과한다 |

- 응답 200: `AskQuestionResponse` `{"news_id": int, "question": str, "answer": str, "model_used": str | null}`
- 동작: `llm_processor.answer_question_with_meta` 가 메모리 캐시(`제목:질문 소문자` 키)를 먼저 보고, 없으면 `generate_live_answer`(Anthropic → OpenAI → Ollama)를 부른다. LLM 이 모두 실패하면 예외를 삼키고 휴리스틱 답변을 만들며 `model_used` 는 `"AgentLens Heuristic Engine"` 이다. 그래서 LLM 실패가 HTTP 오류로 드러나지 않는다 (`backend/app/services/llm_processor.py:717`, `:463`).
- 오류: 404 `{"detail": "News item not found"}`, 422 (본문 검증 실패).
- 부수 효과: 외부 LLM 호출. 프로세스 메모리 캐시 `_qa_cache` 에 저장 (크기 제한 코드는 확인하지 못했다).
- 관련 코드: `backend/app/api/news.py:111`

### POST /api/news/{news_id}/ask/stream
- 위와 같은 질문을 SSE 로 스트리밍한다. 이벤트 형식은 [SSE 스트림](#sse-스트림) 절에 있다.
- 경로 파라미터·요청 본문: `POST /api/news/{news_id}/ask` 와 같다.
- 응답 200: `text/event-stream`, 헤더 `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
- 오류: 404 `{"detail": "News item not found"}` (스트림을 열기 전에 확인), 422.
- 부수 효과: 외부 LLM 스트리밍 호출(Anthropic → OpenAI SDK, 둘 다 실패하면 휴리스틱). 성공한 답은 `_qa_cache` 에 저장.
- 관련 코드: `backend/app/api/news.py:137`, `backend/app/services/llm_processor.py:816`

### GET /api/news/feed/rss.xml
- 최신 뉴스 50건을 RSS 2.0 XML 로 돌려준다.
- 쿼리 파라미터

| 이름 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `category` | string | 아니오 | 없음 | `all` 이 아니면 `category` 일치 비교. `GET /api/news` 와 달리 소문자로 바꾸지 않는다 |

- 응답 200: `application/xml`. `<channel>` 의 `<link>` 는 `http://localhost:3000` 으로 고정이다. 항목마다 `title`, `link`, `description`(summary), `category`, `pubDate`, `guid`(url).
- 오류: 명시 분기 없음. `summary` 가 NULL 이거나 `published_at` 이 NULL 인 행이 있으면 `saxutils.escape(None)` / `None.strftime` 에서 예외가 나 전역 500 이 된다 (`backend/app/api/news.py:182`, `:184`). `category` 는 XML 이스케이프하지 않는다.
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/news.py:169`

## Chat

chat 라우터의 오류는 모두 `ErrorResponse` 형식(`{"error_code", "message", "details"}`)이다. 단, `POST /api/chat/stream` 의 요청 모델 변환 실패는 전역 500 형식으로 나간다(아래 참고).

### GET /api/chat/sources/{source_id}
- 챗 컨텍스트 칩·인용 팝오버에 쓰는 기사 상세를 돌려준다.
- 경로 파라미터: `source_id` (int, 필수).
- 응답 200: `ChatSourceDetailResponse`. `full_content`, `scraped_at` 을 포함한다. 날짜는 문자열(`isoformat()`).
- 오류

| 상태 | error_code | 조건 |
|---|---|---|
| 404 | `ERR_HANDOVER_SOURCE_NOT_FOUND` | 해당 id 의 뉴스가 없음 |
| 422 | (FastAPI 기본 형식) | `source_id` 가 정수가 아님 |

- 부수 효과: 없음.
- 관련 코드: `backend/app/api/chat.py:48`, `backend/app/services/chat_service.py:86`

### GET /api/chat/search
- SQLite FTS5(BM25)·품질·최신성 점수로 코퍼스를 검색해 청크를 미리 보여준다.
- 쿼리 파라미터

| 이름 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `q` | string | 사실상 예 | 없음 | 공백 제거 후 2자 이상. 아니면 400 |
| `top_k` | int | 아니오 | 5 | 1 ~ 20 |
| `min_quality` | float | 아니오 | 5.0 | 1.0 ~ 10.0 |
| `category` | string | 아니오 | `all` | `ChatFocusFilter.category` 리터럴(`all`, `harness`, `mcp_plugins_skills`, `agent_tech`, `ai_news`) |
| `time_range` | string | 아니오 | `all` | `all`, `24h`, `7d`, `30d` |
| `sort` | string | 아니오 | `hot` | `hot`, `latest`, `quality` |
| `high_signal_only` | bool | 아니오 | `false` | — |
| `source` | string | 아니오 | 없음 | — |

- 응답 200: `ChatSearchResponse` `{"query", "total_matches", "chunks": [ChatSearchChunk], "latency_ms"}`
- 오류

| 상태 | error_code | 조건 |
|---|---|---|
| 400 | `ERR_SEARCH_QUERY_TOO_SHORT` | `q` 가 없거나 2자 미만 |
| 500 | `ERR_RETRIEVER_INDEX_ERROR` | 그 밖의 모든 예외. `category`·`time_range`·`sort` 에 리터럴 밖의 값을 넣으면 `ChatFocusFilter` 생성이 실패해 이 500 이 난다 (검증 오류가 400 이 아니라 500 으로 나간다). `details.error` 에 예외 문자열 |
| 422 | (FastAPI 기본 형식) | `top_k`, `min_quality` 범위 밖 |

- 부수 효과: FTS5 가상 테이블 `news_fts` 와 동기화 트리거가 없으면 만들고 `rebuild` 한다. 색인 행 수가 `news_items` 보다 적어도 `rebuild` 하고 커밋한다 (`backend/app/services/retriever.py:60`). 즉 GET 이 스키마를 바꿀 수 있다.
- 관련 코드: `backend/app/api/chat.py:65`, `backend/app/services/chat_service.py:127`

### POST /api/chat/query
- 챗 질문에 동기로 한 번 답한다.
- 요청 본문: `ChatQueryRequest` (`request.json()` 으로 직접 읽은 뒤 `ChatQueryRequest(**body)` 로 만든다)

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `question` | string | 예 | — | 1 ~ 2000자, 공백만이면 안 됨 |
| `model` | string | 아니오 | `settings.ANTHROPIC_DEFAULT_CHAT_MODEL` | 값 검증 없음. `gemini` 가 들어가면 Gemini, `gpt`/`openai` 가 들어가면 OpenAI 로 보낸다 |
| `model_tier` | `haiku` \| `sonnet` \| `opus` | 아니오 | null | — |
| `scope` | `scoped` \| `global` | 아니오 | `global` | — |
| `source_id` | int | scoped 일 때 예 | null | — |
| `session_id` | string | 아니오 | null | 형식 검증 없음. 없으면 새 UUID 를 만들어 응답에 넣는다 |
| `history` | `ChatMessageHistory[]` | 아니오 | null | — |
| `top_k` | int | 아니오 | 5 | 1 ~ 10 |
| `filters` | `ChatFocusFilter` | 아니오 | null | — |

- 응답 200: `ChatQueryResponse`.
- 동작: scoped 면 기사 본문(`full_content`, 없으면 스크래핑)을 단일 출처로 쓴다. global 이면 먼저 ReAct 계획(`_plan_react_action`, 도메인 신호가 있으면 haiku 모델 LLM 호출)으로 검색 여부를 정하고, 검색하면 FTS5 결과를 출처 후보로 쓴다. 답변 생성 후 global 모드는 답변에 인용된 `[N]` 이나 제목 토큰이 등장한 출처만 남긴다 (`backend/app/services/chat_service.py:447`, `:478`).
- 오류

| 상태 | error_code | 조건 |
|---|---|---|
| 400 | `ERR_INVALID_PAYLOAD` | 본문이 JSON 이 아님 |
| 400 | `ERR_CHAT_PAYLOAD_EMPTY` | `question` 이 문자열이 아니거나 비어 있음 |
| 400 | `ERR_CHAT_PAYLOAD_TOO_LARGE` | `question` 2000자 초과 |
| 400 | `ERR_INVALID_SCOPE_PARAM` | `scope` 가 `scoped`/`global` 이 아님 |
| 404 | `ERR_HANDOVER_SOURCE_NOT_FOUND` | scoped 인데 `source_id` 가 없거나 해당 기사가 없음 |
| 401 | `ERR_CLAUDE_API_KEY_MISSING` | Anthropic 키 없음 또는 인증 실패 |
| 429 | `ERR_CLAUDE_QUOTA_EXCEEDED` | 코드상 분기는 있다. 다만 `generate_live_answer` 가 Anthropic 429 를 `LLMQuotaExceededException` 으로 바꿔 던지므로 실제로는 아래 `ERR_LLM_QUOTA_EXCEEDED` 가 나갈 것으로 보인다 |
| 529 | `ERR_CLAUDE_OVERLOADED` | Anthropic 503/529 |
| 503 | `ERR_LLM_PROVIDER_UNAVAILABLE` | 쓸 수 있는 LLM 키·Ollama 가 없음 |
| 502 | `ERR_LLM_UPSTREAM_FAILED` | 모든 프로바이더 호출 실패 |
| 429 | `ERR_LLM_QUOTA_EXCEEDED` | Anthropic/OpenAI 429 |
| 500 | `ERR_SERVER_INTERNAL` | 그 밖의 예외. `model_tier`·`filters`·`top_k`·`history` 의 Pydantic 검증 실패도 여기로 떨어진다 (400 이 아님). `details.error` 에 예외 문자열 |

- 부수 효과: 외부 LLM 호출(계획 1회 + 답변 1회까지). scoped 에서 본문이 없으면 기사 URL 을 스크래핑하고 `news_items.full_content`, `scraped_at` 을 갱신한다 (`backend/app/services/scraper.py:126`). 대화 세션에는 저장하지 않는다 (`/stream` 과 다르다).
- 관련 코드: `backend/app/api/chat.py:124`, `backend/app/services/chat_service.py:478`

### POST /api/chat/stream
- 챗 질문을 SSE 로 스트리밍한다. 이벤트 형식은 [SSE 스트림](#sse-스트림) 절에 있다.
- 요청 본문: `ChatStreamRequest` (필드는 `ChatQueryRequest` 와 같다).
- 응답 200: `text/event-stream; charset=utf-8`, 헤더 `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
- 스트림을 열기 전 검사 (모두 JSON 응답)

| 상태 | error_code | 조건 |
|---|---|---|
| 400 | `ERR_INVALID_PAYLOAD` | 본문이 JSON 이 아님 |
| 400 | `ERR_CHAT_PAYLOAD_EMPTY` | `question` 이 비어 있음 |
| 400 | `ERR_CHAT_PAYLOAD_TOO_LARGE` | 2000자 초과 |
| 400 | `ERR_INVALID_SCOPE_PARAM` | `scope` 값 오류 |
| 404 | `ERR_HANDOVER_SOURCE_NOT_FOUND` | scoped 인데 `source_id` 가 없거나 기사가 없음 |
| 503 | `ERR_LLM_PROVIDER_UNAVAILABLE` | `check_provider_available()` 실패 (키·Ollama 없음) |
| 401/429/529/502 | `ERR_CLAUDE_API_KEY_MISSING` 등 | 핸들러에 분기는 있으나 `check_provider_available()` 은 `LLMProviderUnavailableException` 만 던진다. 나머지 분기가 실행되는 경로는 확인하지 못했다 |
| 500 | (전역 형식 `{"detail", "error"}`) | `ChatStreamRequest(**body)` 가 try 밖에 있어 `model_tier`·`filters`·`top_k` 등 검증 실패가 전역 예외 처리로 간다 (`backend/app/api/chat.py:406`) |

- 스트림 도중 오류: LLM 토큰 생성 중 예외가 나면 `event: error` 를 보내고 끝낸다. 그 전 단계(계획, 검색, 스크래핑)에서 예외가 나면 오류 이벤트 없이 스트림이 끊긴다 (try 범위 밖, `backend/app/services/chat_service.py:576`).
- 부수 효과: 외부 LLM 호출, scoped 에서 스크래핑과 `news_items` 갱신. `done` 이벤트를 보낸 뒤 `persist_turn` 으로 사용자 질문과 답변 두 메시지를 `chat_messages` 에 넣는다. 세션이 없으면 만들고, 제목이 `새 대화` 면 질문 앞 30자로 자동 제목을 붙이며, 세션을 30개로 자르는 FIFO 정리를 한다. 저장 실패는 로그만 남긴다 (`backend/app/services/chat_service.py:808`, `backend/app/services/chat_session_service.py:371`, `:437`).
- 관련 코드: `backend/app/api/chat.py:276`

### GET /api/chat/sessions
- 대화 세션 목록을 `updated_at` 내림차순으로 돌려준다.
- 쿼리 파라미터

| 이름 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `limit` | int | 아니오 | 30 | 1 ~ 50 |
| `offset` | int | 아니오 | 0 | ≥ 0 |

- 응답 200: `ChatSessionSummary[]` (배열). `last_message_preview` 는 마지막 메시지 앞 100자.
- 오류: 500 `ERR_SERVER_INTERNAL` (예외 메시지를 `message` 에 붙인다), 422 (범위 밖).
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/chat.py:422`, `backend/app/services/chat_session_service.py:58`

### POST /api/chat/sessions
- 세션을 만들거나, `id` 가 이미 있으면 갱신(업서트)한다. `messages` 가 오면 이어 붙인다.
- 요청 본문: `ChatSessionCreateRequest`

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `id` | string | 아니오 | null (새 UUID 생성) | 주어지면 `uuid.UUID()` 로 파싱 가능해야 함 |
| `title` | string | 아니오 | `새 대화` | 길이 검증 없음 (DB 컬럼은 `String(100)`) |
| `scope_mode` | `scoped` \| `global` | 아니오 | `global` | — |
| `active_source_id` | int | 아니오 | null | 존재 여부 검사 없음 |
| `active_filters` | `ChatFocusFilter` | 아니오 | null | — |
| `messages` | `ChatMessageItem[]` | 아니오 | null | 항목마다 `id`, `session_id`, `role`, `content`, `created_at` 필수 |

- 응답 201: `ChatSessionDetail` (갱신이어도 201).
- 오류

| 상태 | error_code | 조건 |
|---|---|---|
| 400 | `ERR_SESSION_INVALID_UUID` | 본문이 JSON 이 아님, 모델 검증 실패(어떤 필드든), `id` 가 UUID 형식이 아님. 세 경우 모두 같은 코드를 쓴다 |
| 500 | `ERR_SESSION_CREATE_FAILED` | 그 밖의 예외 (예외 메시지를 `message` 에 붙인다) |

- 부수 효과: `chat_sessions` INSERT 또는 UPDATE, `messages` 를 `chat_messages` 에 INSERT. 기존 메시지와 id 중복 검사를 하지 않는다. 세션 수가 30개를 넘으면 `updated_at` 이 가장 오래된 세션부터 삭제한다 (`backend/app/services/chat_session_service.py:211`, `:299`, `:437`).
- 관련 코드: `backend/app/api/chat.py:443`

### GET /api/chat/sessions/{session_id}
- 세션과 메시지 전체, `active_source` 상세를 돌려준다.
- 경로 파라미터: `session_id` (string, 필수, 형식 검증 없음).
- 응답 200: `ChatSessionDetail`. 메시지는 `created_at` 오름차순. 저장된 `sources_json`, `usage_json`, `active_filters_json` 은 파싱하고 실패하면 null.
- 오류: 404 `ERR_SESSION_NOT_FOUND`, 500 `ERR_SERVER_INTERNAL`.
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/chat.py:496`, `backend/app/services/chat_session_service.py:100`

### DELETE /api/chat/sessions/{session_id}
- 세션과 하위 메시지를 지운다 (ORM `cascade="all, delete-orphan"`).
- 경로 파라미터: `session_id` (string, 필수).
- 응답 200: `GenericSuccessResponse` `{"status": "success", "message": "대화 세션 및 하위 메시지가 원자적으로 영구 삭제되었습니다.", "deleted_count": 1}`
- 오류: 404 `ERR_SESSION_NOT_FOUND`, 500 `ERR_SESSION_DELETE_FAILED`.
- 부수 효과: `chat_sessions`, `chat_messages` DELETE.
- 관련 코드: `backend/app/api/chat.py:525`, `backend/app/services/chat_session_service.py:280`

## Briefing

### GET /api/briefing/today
- 카테고리 4개(harness, mcp_plugins_skills, agent_tech, ai_news)별 상위 기사 최대 3건으로 브리핑을 만든다. 저장·캐시 없이 부를 때마다 새로 만든다. LLM 은 부르지 않는다 (요약·헤드라인·액션 아이템은 코드 내 규칙과 고정 문구).
- 파라미터·본문: 없음.
- 응답 200: `DailyBriefingResponse`

```json
{
  "title": "오늘의 AI 브리핑",
  "date": "2026년 11월 06일",
  "headline": "...",
  "overview": "• **하네스 & 벤치마크**: ...",
  "categories": [ { "id": "harness", "name": "하네스 & 벤치마크", "icon": "🎯", "summary": "...",
    "items": [ { "id": 1, "title": "...", "url": "...", "source": "...", "why_it_matters": "", "summary": "",
      "tags": [], "category": "harness", "category_name": "하네스 & 벤치마크", "hotness_score": 0.0 } ] } ],
  "action_items": ["...", "...", "..."],
  "markdown_report": "# 🌅 오늘의 AI 브리핑\n...",
  "featured_items_count": 12,
  "generated_at": "2026-11-06T00:00:00+00:00"
}
```

- 오류: 명시 분기 없음 (전역 500).
- 부수 효과: 없음 (DB 읽기).
- 관련 코드: `backend/app/api/briefing.py:25`, `backend/app/services/briefing_service.py:106`

### POST /api/briefing/generate
- `GET /api/briefing/today` 와 같은 함수를 같은 방식으로 부른다. 응답도 같다. "재생성" 이지만 저장된 브리핑이 없으므로 차이가 없다.
- 관련 코드: `backend/app/api/briefing.py:40`

### POST /api/briefing/export/notion
- 브리핑을 만들어 Notion 부모 페이지 아래에 새 페이지로 만든다.
- 요청 본문: `NotionExportRequest` (본문 생략 가능)

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `api_key` | string | 아니오 | null → `settings.NOTION_API_KEY` | — |
| `page_id` | string | 아니오 | null → `settings.NOTION_PAGE_ID` | URL 이나 하이픈 섞인 ID 를 `clean_id` 로 정리 |

- 응답 200: `NotionExportResponse` `{"success": true, "message": "Notion 페이지가 성공적으로 생성되었습니다!", "url": "<page url>"}`
- 오류: 400 `{"detail": "<서비스 메시지>"}` — 키 없음, 부모 페이지 없음, Notion API 오류, 네트워크 오류 모두.
- 부수 효과: 외부 Notion API 호출(`https://api.notion.com/v1`, 페이지 생성 `POST /pages`), Notion 워크스페이스에 페이지 생성.
- 관련 코드: `backend/app/api/briefing.py:55`, `backend/app/services/notion_service.py:208`

### POST /api/briefing/send/email
- 브리핑을 HTML 메일로 보낸다. SMTP 설정은 항상 `settings`(config.json) 값을 쓴다.
- 요청 본문: `EmailSendRequest` (본문 생략 가능)

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `to_email` | string | 아니오 | null → `settings.SMTP_TO` | 쉼표 등으로 여러 명 (`_parse_recipients`) |
| `subject` | string | 아니오 | null → `[AgentLens] 오늘의 AI 브리핑 - <date>` | — |

- 응답 200: `EmailSendResponse` `{"success": true, "message": "성공적으로 N명의 수신자에게 이메일을 발송했습니다."}`
- 오류: 400 `{"detail": ...}` — SMTP 호스트 미설정, 수신자 없음, 인증 실패, 연결 실패, 기타 발송 오류.
- 부수 효과: 외부 SMTP 접속과 메일 발송 (스레드에서 `smtplib`).
- 관련 코드: `backend/app/api/briefing.py:75`, `backend/app/services/email_service.py:226`

### POST /api/briefing/test/notion
- Notion 토큰 인증과 (주어지면) 페이지 접근 권한을 확인한다.
- 요청 본문: `TestNotionRequest` `{"api_key"?: str, "page_id"?: str}` — 비면 `settings` 값.
- 응답 200: `{"success": true, "message": "Notion 연동 성공! (연결된 통합: <bot>)"}`
- 오류: 400 `{"detail": ...}` (토큰 없음, 인증 실패, 페이지 권한 오류, 네트워크 오류).
- 부수 효과: 외부 Notion API 호출 (읽기).
- 관련 코드: `backend/app/api/briefing.py:95`, `backend/app/services/notion_service.py:33`

### POST /api/briefing/test/email
- 주어진 SMTP 설정으로 접속·인증하고 테스트 메일을 보낸다.
- 요청 본문: `TestEmailRequest`

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `smtp_host` | string | 아니오 | null → `settings.SMTP_HOST` |
| `smtp_port` | int | 아니오 | 587 |
| `smtp_user` | string | 아니오 | null → `settings.SMTP_USER` |
| `smtp_password` | string | 아니오 | null → `settings.SMTP_PASSWORD` |
| `use_tls` | bool | 아니오 | true |
| `to_email` | string | 아니오 | null → `settings.SMTP_TO`, 그것도 없으면 `smtp_user` 가 이메일 형식일 때 그 주소 |

- 응답 200: `{"success": true, "message": "성공적으로 N명의 수신자에게 이메일을 발송했습니다."}`
- 오류: 400 `{"detail": ...}` (호스트 없음, 수신자 없음, 인증·연결 실패 등).
- 부수 효과: 요청자가 지정한 임의 호스트·포트로 SMTP 접속, 실제 메일 발송.
- 관련 코드: `backend/app/api/briefing.py:102`, `backend/app/services/email_service.py:180`

### GET /api/briefing/settings
- config.json 의 `briefing`, `webhooks` 섹션을 UI 용으로 돌려준다.
- 응답 200 (response_model 없음)

```json
{
  "title": "오늘의 AI 브리핑",
  "auto_dispatch_hour": 0,
  "notion": { "enabled": false, "has_api_key": true, "masked_api_key": "secr...abcd", "page_id": "", "auto_export": false },
  "email": { "enabled": false, "smtp_host": "", "smtp_port": 587, "smtp_user": "", "has_password": false,
             "smtp_from": "", "smtp_to": "", "use_tls": true, "auto_send": false },
  "webhooks": { "slack_webhook_url": "", "discord_webhook_url": "",
                "auto_dispatch_daily_briefing": true, "auto_alert_high_signal": true }
}
```

- 마스킹: Notion 키는 9자 이상이면 앞 4자 + `...` + 뒤 4자, 아니면 `***`. SMTP 비밀번호는 내보내지 않고 `has_password` 만 준다. Slack/Discord 웹훅 URL 은 마스킹 없이 그대로 준다.
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/briefing.py:116`

### POST /api/briefing/settings
- 브리핑·SMTP·웹훅 설정을 config.json 에 쓴다.
- 요청 본문: `BriefingSettingsUpdate` (모든 필드 선택, null 이면 건드리지 않음)

| 필드 | 타입 | 저장 위치 | 비고 |
|---|---|---|---|
| `notion_api_key` | string | `briefing.notion.api_key` | 값이 `***` 이면 무시 |
| `notion_page_id` | string | `briefing.notion.page_id` | — |
| `notion_auto_export` | bool | `briefing.notion.auto_export` | `enabled` 를 `auto_export or api_key 있음` 으로 함께 바꾼다 |
| `smtp_host` | string | `briefing.email.smtp_host` | — |
| `smtp_port` | int | `briefing.email.smtp_port` | — |
| `smtp_user` | string | `briefing.email.smtp_user` | — |
| `smtp_password` | string | `briefing.email.smtp_password` | 값이 `***` 이면 무시 |
| `smtp_from` | string | `briefing.email.smtp_from` | — |
| `smtp_to` | string | `briefing.email.smtp_to` | — |
| `smtp_use_tls` | bool | `briefing.email.use_tls` | — |
| `email_auto_send` | bool | `briefing.email.auto_send` | `enabled` 를 `auto_send or smtp_host 있음` 으로 함께 바꾼다 |
| `slack_webhook_url` | string | `webhooks.slack_webhook_url` | URL 검증 없음 |
| `discord_webhook_url` | string | `webhooks.discord_webhook_url` | URL 검증 없음 |

- 응답 200: `{"success": true, "message": "설정이 성공적으로 저장되었습니다."}`
- 오류: 500 `{"detail": "설정 파일(config.json) 저장에 실패했습니다."}` — 파일 쓰기 실패. `docker-compose.yml` 은 `./config.json:/app/config.json:ro` 로 읽기 전용 마운트하므로 컨테이너에서는 이 경로가 실패할 것으로 보인다 (실행해 확인하지 않았다).
- 부수 효과: config.json 파일 전체를 다시 쓰고 `settings.reload()` 로 프로세스 설정을 다시 읽는다. `dict(settings.raw_json_config)` 는 얕은 복사라 저장 전에 메모리의 설정 딕셔너리 중첩 값이 먼저 바뀐다 (`backend/app/api/briefing.py:163`, `backend/app/config.py:161`).
- 관련 코드: `backend/app/api/briefing.py:161`

## Schedule

### GET /api/schedule/status
- 다음 수집 시각, 실행 여부, 최근 수집 로그 5건을 돌려준다.
- 응답 200: `ScheduleStatusResponse`

```json
{
  "current_time": "2026-11-06T03:00:00+00:00",
  "schedule_hours": [0, 6, 12, 18],
  "timezone": "UTC",
  "next_run": "2026-11-06T06:00:00+00:00",
  "minutes_until_next_run": 180.0,
  "is_running": false,
  "last_crawl_time": "2026-11-06T00:05:00",
  "last_crawl_status": "idle",
  "recent_logs": [ { "id": 10, "source": "...", "items_crawled": 30, "items_saved": 5, "status": "success",
                     "started_at": "...", "completed_at": "..." } ]
}
```

- `last_crawl_status` 는 로그의 상태가 아니라 메모리 플래그 `collector_manager.is_running` 으로 `running`/`idle` 을 정한다.
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/schedule.py:14`

### GET /api/schedule/progress
- 수집기의 메모리 상태를 그대로 돌려준다.
- 응답 200: `{"is_running": bool, "current_source": str, "step_message": str, "items_collected": int, "items_saved": int, "items_filtered": int, "total_sources": int, "completed_sources": int, "last_crawl_time": str | null}`
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/schedule.py:43`, `backend/app/collectors/manager.py:59`

### POST /api/schedule/trigger
- 전체 수집을 백그라운드 작업으로 시작하고 바로 응답한다.
- 응답 200 (두 경우 모두 200)
  - 시작: `{"status": "started", "message": "...", "total_collected": 0, "total_saved": 0, "source_results": {}}`
  - 이미 실행 중: `{"status": "already_running", "message": "이미 수집이 진행 중입니다.", "total_collected": <int>, "total_saved": <int>, "source_results": {}}`
- 부수 효과: `BackgroundTasks` 로 `collector_manager.collect_all()` 실행. 외부 소스(RSS, GitHub, Reddit, Hacker News, arXiv, Hugging Face) 호출, 항목별 LLM 평가(`evaluate_content_with_llm`), `news_items` INSERT, 소스별 `crawl_logs` INSERT (`backend/app/collectors/manager.py:176`).
- 관련 코드: `backend/app/api/schedule.py:48`

### POST /api/schedule/reset-and-collect
- 뉴스와 수집 로그를 모두 지우고 재수집을 시작한다.
- 응답 200
  - 시작: `{"status": "started", "message": "기존 데이터 N건이 삭제되었으며, ...", "deleted_count": N}`
  - 이미 실행 중: `{"status": "already_running", "message": "...", "deleted_count": 0}` (삭제하지 않는다)
- 부수 효과: `DELETE FROM news_items`, `DELETE FROM crawl_logs` 후 커밋, 수집기 메모리 카운터 초기화, 백그라운드 `collect_all()` (위와 같은 외부 호출·DB 쓰기). 확인 절차나 인증이 없다.
- 관련 코드: `backend/app/api/schedule.py:69`

## Sources

소스 목록은 DB 가 아니라 `sources.json` 파일에 있다. 파일은 cwd → 부모 → 저장소 루트 → `backend/app/config/sources.json` 순으로 찾는다. 저장할 때는 찾은 파일을 임시 파일 교체로 쓰고, `backend/app/config/sources.json` 과 다르면 그곳에도 같은 내용을 쓴다 (`backend/app/services/sources_service.py:11`, `:101`). 저장 실패(`save_sources` 가 False)는 엔드포인트가 확인하지 않아 성공으로 응답한다.

### GET /api/sources
- 등록된 수집 소스 전체와 요약 통계를 돌려준다.
- 응답 200 (response_model 없음)

```json
{
  "status": "success",
  "sources_file": "/abs/path/to/sources.json",
  "updated_at": "2026-11-06T00:00:00+00:00",
  "stats": { "total_rss": 20, "active_rss": 18, "total_github_repos": 3, "active_github_repos": 3,
             "github_search_enabled": true, "reddit_enabled": true, "hackernews_enabled": true,
             "arxiv_enabled": true, "huggingface_enabled": true },
  "data": { "version": "...", "updated_at": "...", "rss_feeds": [ ... ],
            "github_sources": { "enabled": true, "search_queries": [], "monitored_repos": [] },
            "reddit_sources": { ... }, "hackernews_sources": { ... }, "arxiv_sources": { ... },
            "huggingface_sources": { "enabled": true } }
}
```

- `sources_file` 로 서버의 절대 경로를 노출한다. 파일을 못 읽으면 코드 내 기본 소스(`_default_sources`)를 돌려준다.
- 부수 효과: 없음 (파일 읽기). 파일이 없으면 기본 경로의 상위 디렉터리를 만든다 (`mkdir`).
- 관련 코드: `backend/app/api/sources.py:22`

### POST /api/sources/rss
- RSS/Atom 피드를 등록한다. 같은 URL(끝 `/` 무시)이 있으면 새로 만들지 않고 그 항목을 `enabled=true` 로 바꾸고 이름·카테고리를 덮어쓴다.
- 요청 본문: `AddRssRequest`

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `name` | string | 예 | — | 빈 문자열이면 400 |
| `url` | string | 예 | — | 빈 문자열이면 400. URL 형식 검증 없음 |
| `site_url` | string | 아니오 | `""` → `url` | — |
| `category_hint` | string | 아니오 | `ai_news` | 값 검증 없음 |
| `country` | string | 아니오 | `GLOBAL` | 값 검증 없음 |
| `description` | string | 아니오 | `""` | — |

- 응답 200: `{"status": "success", "message": "'<name>' 등록 완료", "source": {id, name, url, site_url, category_hint, country, enabled, description, added_at}}`. 새 항목의 `id` 는 이름을 소문자로 바꾸고 영숫자·`_` 밖의 문자를 `_` 로 바꾼 값이다. 같은 `id` 중복을 막지 않는다.
- 오류: 400 `{"detail": "Name and URL are required"}`, 422.
- 부수 효과: `sources.json` 쓰기.
- 관련 코드: `backend/app/api/sources.py:49`, `backend/app/services/sources_service.py:185`

### POST /api/sources/github
- 모니터링할 GitHub 저장소를 등록한다. 같은 이름(대소문자 무시)이 있으면 `enabled=true`, `category` 를 덮어쓴다.
- 요청 본문: `AddGitHubRepoRequest`

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `repo` | string | 예 | — | 빈 문자열이면 400. `owner/repo` 형식 검증 없음 |
| `category` | string | 아니오 | `agent_tech` | — |
| `description` | string | 아니오 | `""` | — |
| `stars_hint` | int | 아니오 | 0 | — |

- 응답 200: `{"status": "success", "message": "'<repo>' 등록 완료", "repo": {repo, category, enabled, description, stars_hint, added_at}}`
- 오류: 400 `{"detail": "Repository is required"}`, 422.
- 부수 효과: `sources.json` 쓰기.
- 관련 코드: `backend/app/api/sources.py:64`, `backend/app/services/sources_service.py:212`

### PATCH /api/sources/{source_type}/{item_id}/toggle
- 소스 하나 또는 소스 유형 전체의 `enabled` 를 뒤집는다.
- 경로 파라미터

| 이름 | 타입 | 값 |
|---|---|---|
| `source_type` | string | `rss`(item_id 는 피드 `id` 또는 `url`), `github_repo`(item_id 는 `repo`), `github`·`reddit`·`hackernews`·`arxiv`·`huggingface`(유형 전체 토글, item_id 는 무시) |
| `item_id` | string | 경로 한 마디. `/` 를 담을 수 없다 |

- 응답 200: `{"status": "success", "message": "소스 상태가 변경되었습니다 (<type> / <id>)"}`
- 오류: 404 `{"detail": "Source not found or invalid type"}`.
- 부수 효과: `sources.json` 쓰기.
- 관련 코드: `backend/app/api/sources.py:77`, `backend/app/services/sources_service.py:159`

### DELETE /api/sources/{source_type}/{item_id}
- 소스를 지운다. `rss`(id 또는 url 일치하는 항목 모두), `github_repo`(repo 일치)만 지원한다.
- 응답 200: `{"status": "success", "message": "소스가 삭제되었습니다 (<type> / <id>)"}`
- 오류: 404 `{"detail": "Source not found or failed to delete"}` (그 밖의 유형 포함).
- 부수 효과: `sources.json` 쓰기.
- 관련 코드: `backend/app/api/sources.py:85`, `backend/app/services/sources_service.py:235`

## Research

### POST /api/research/inspect-url
- 임의 URL(블로그, 웹사이트, GitHub 저장소)에서 RSS/Atom 피드를 찾아 최근 글 4건과 신호 점수를 돌려준다.
- 요청 본문: `InspectUrlRequest` `{"url": str}` (필수). `http(s)://` 가 없으면 `https://` 를 붙인다.
- 동작: GitHub 저장소 URL 이면 `releases.atom` 을 먼저 시도한다. 아니면 URL 을 받아 XML 이면 그대로 피드로, HTML 이면 `<link rel="alternate">` 를 찾는다. 점수는 동기 휴리스틱 `evaluate_quality_and_signal` 로 매긴다 (LLM 호출 없음).
- 응답 200 — 결과와 상관없이 200

| `status` | 필드 |
|---|---|
| `found` | `name`, `feed_url`, `site_url`, `description`, `category_hint`, `relevance_score`, `is_high_signal`, `recent_posts[{title, link, published, snippet}]`, `already_registered`, `why_recommended`. GitHub 이면 `type: "atom"`, `source_kind: "github_releases"` 추가 |
| `error` | `message`, `input_url` 또는 `feed_url` |
| `not_found` | `message`, `input_url` |
| `empty` | `message`, `feed_url` |

- 오류: 400 `{"detail": "URL is required"}` (빈 문자열), 422.
- 부수 효과: 서버가 요청자가 준 URL 로 외부 HTTP GET 을 보낸다 (리다이렉트 따라감, 타임아웃 10초/8초).
- 관련 코드: `backend/app/api/research.py:24`, `backend/app/services/source_researcher.py:179`

### POST /api/research/discover
- 코드 안의 큐레이션 카탈로그(`CURATED_ECOSYSTEM_CATALOG`)에서 키워드·카테고리로 후보를 고른다. 이름과 달리 외부 탐색은 하지 않는다.
- 요청 본문: `DiscoverRequest`

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `query` | string | 아니오 | `""` | 이름·설명·카테고리·태그에 부분 일치 (소문자) |
| `category` | string | 아니오 | `""` | `category_hint` 일치 |
| `limit` | int | 아니오 | 8 | 상한 없음. 0 이면 8 로 바뀐다 (`req.limit or 8`) |

- 응답 200: `{"query", "category", "total_found", "candidates": [{id, name, site_url, feed_url, category_hint, country, description, relevance_score, tags, already_registered, why_recommended}]}`. 미등록 후보 먼저, 그다음 점수 내림차순.
- 부수 효과: 없음 (`sources.json` 읽기).
- 관련 코드: `backend/app/api/research.py:35`, `backend/app/services/source_researcher.py:331`

### POST /api/research/register-candidate
- 후보를 RSS 소스로 등록한다 (`sources_service.add_rss_source` 재사용).
- 요청 본문: `RegisterCandidateRequest`

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `name` | string | 예 | — |
| `feed_url` | string | 예 | — |
| `site_url` | string | 아니오 | `""` |
| `category_hint` | string | 아니오 | `ai_news` |
| `country` | string | 아니오 | `GLOBAL` |
| `description` | string | 아니오 | `""` |

- 응답 200: `{"status": "success", "message": "'<name>' 소스가 성공적으로 스크래핑 대상에 등록되었습니다.", "source": {...}}`
- 오류: 400 `{"detail": "name과 feed_url은 필수입니다."}` (빈 문자열), 422.
- 부수 효과: `sources.json` 쓰기.
- 관련 코드: `backend/app/api/research.py:48`, `backend/app/services/source_researcher.py:385`

### GET /api/research/status
- 딥 리서치 엔진의 메모리 상태.
- 응답 200: `{"is_running": bool, "last_run_time": str | null, "auto_adopted_count": int, "last_run_summary": {evaluated_total, auto_adopted, completed_at, results[]} 또는 {}, "cadence": "Every 12 hours (03:00, 15:00 UTC) + On-demand"}`
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/research.py:62`, `backend/app/services/deep_researcher.py:147`

### GET /api/research/audit-logs
- `source_research_logs` 를 최신순으로 돌려준다.
- 쿼리 파라미터: `limit` (int, 선택, 기본 30, 범위 제약 없음).
- 응답 200: `{"status": "success", "total": <돌려준 개수>, "logs": [{id, source_name, site_url, feed_url, category, relevance_score, verdict, verdict_reason, analyzed_articles_count, created_at}]}`. `verdict` 는 `AUTO_ADOPTED`, `WATCHLIST`, `REJECTED`, `ALREADY_MONITORED` 중 하나다. DB 오류는 로그만 남기고 빈 배열을 돌려준다.
- 오류: 422 (`limit` 이 정수가 아님).
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/research.py:67`, `backend/app/services/deep_researcher.py:156`

### POST /api/research/run-deep
- 딥 리서치 한 사이클을 `asyncio.create_task` 로 백그라운드에서 시작한다.
- 쿼리 파라미터: `max_candidates` (int, 선택, 기본 6, 범위 제약 없음). 본문이 아니라 쿼리다.
- 응답 200
  - 시작: `{"status": "started", "message": "자율 딥 리서치 사이클이 백그라운드에서 기동되었습니다.", "max_candidates": N}`
  - 이미 실행 중: `{"status": "already_running", "message": "Deep Research is already executing"}`
- 부수 효과: 시드 사이트와 최근 기사에서 뽑은 외부 도메인으로 HTTP 요청(피드 탐지), 휴리스틱 평가, `AUTO_ADOPTED` 판정이면 `sources.json` 에 RSS 소스 자동 추가, `source_research_logs` INSERT (`backend/app/services/deep_researcher.py:376`).
- 관련 코드: `backend/app/api/research.py:77`

## Trends

### GET /api/trends/radar
- 최근 500건의 `tech_stack` 을 세어 기술 레이더를 만든다.
- 응답 200 (response_model 없음)

```json
{
  "updated_at": "2026-11-06T00:00:00+00:00",
  "total_analyzed": 500,
  "surging_tags": [ { "name": "MCP", "count": 40, "category": "Protocols & Tooling", "recent_count": 5,
                      "velocity": "+100%", "sample_news_id": 12 } ],
  "categories": [ { "name": "Harness & Benchmark", "count": 30, "percentage": 25.0 } ],
  "tags": [ ... 최대 25개, surging_tags 와 같은 모양 ... ]
}
```

- `velocity` 는 24시간 내 등장 수 `recent_count` 가 3 이상이면 `+{recent_count*20}%`, 1~2 면 `+25%`, 0 이고 전체 8 이상이면 `HOT`, 아니면 `STEADY`. `surging_tags` 는 `recent_count > 0` 또는 `count >= 5` 인 태그 중 상위 6개. 뉴스가 없으면 숫자 0 과 빈 배열.
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/trends.py:6`, `backend/app/services/trend_service.py:40`

## Webhook

### POST /api/webhook/test
- 지정 URL 로 테스트 메시지를 POST 한다.
- 요청 본문: `WebhookTestRequest`

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `webhook_url` | string | 예 | — | `http` 로 시작해야 함 (그 밖의 검증 없음) |
| `provider` | string | 아니오 | `auto` | `auto` 면 URL 로 판별(`slack.com` → slack, `discord.com`/`discordapp.com` → discord, 그 밖 generic). 그 밖의 값은 그대로 쓰고 `slack`/`discord` 가 아니면 generic 페이로드 |

- 응답 200: `{"success": true, "message": "테스트 웹훅 메시지가 성공적으로 전송되었습니다."}`
- 오류: 400 `{"detail": "유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요."}`, 400 `{"detail": "<전송 실패 메시지>"}` (대상이 200/204 가 아니거나 요청 실패).
- 부수 효과: 서버가 요청자가 준 임의 URL 로 외부 HTTP POST (타임아웃 8초). 실패 메시지에 대상 응답 본문 앞 100자를 담는다.
- 관련 코드: `backend/app/api/webhook.py:19`, `backend/app/services/webhook_service.py:17`

### POST /api/webhook/send-briefing
- 브리핑을 만들어 지정 URL 로 보낸다.
- 요청 본문: `WebhookBriefingRequest` (`webhook_url` 필수, `provider` 기본 `auto`). `provider` 는 받기만 하고 쓰지 않는다. 항상 URL 로 판별한다.
- 응답 200: `{"success": true, "message": "오늘의 일일 브리핑이 웹훅으로 성공적으로 발송되었습니다."}`
- 오류: 400 (URL 형식, 전송 실패).
- 부수 효과: 브리핑 생성(DB 읽기), 외부 HTTP POST. 페이로드의 `executive_summary` 는 헤드라인 + 마크다운 리포트 앞 600자 + `...`, `top_highlights` 는 빈 배열이다.
- 관련 코드: `backend/app/api/webhook.py:28`

## Stats

### GET /api/stats
- 뉴스 전체 개수와 카테고리별·소스별 개수.
- 응답 200: `StatsResponse` `{"total_news": int, "category_counts": {str: int}, "source_counts": {str: int}, "last_updated": "<지금 시각 ISO>"}`. `last_updated` 는 데이터 갱신 시각이 아니라 응답 시각이다.
- 부수 효과: 없음.
- 관련 코드: `backend/app/api/stats.py:11`

## MCP

### GET /api/mcp/info
- MCP 서버(stdio, `python -m app.mcp.server`) 소개와 Claude Desktop 설정 예시를 돌려준다. MCP 프로토콜 자체는 HTTP 로 열지 않는다.
- 응답 200

```json
{
  "name": "AgentLens MCP Server",
  "description": "...",
  "tools": [ { "name": "get_latest_harness_methods", "description": "..." },
             { "name": "get_mcp_and_skills_ecosystem", "description": "..." },
             { "name": "search_agent_news", "description": "..." },
             { "name": "trigger_agentlens_crawl", "description": "..." } ],
  "claude_desktop_config": { "mcpServers": { "agentlens": {
      "command": "<sys.executable 절대 경로>", "args": ["-m", "app.mcp.server"], "cwd": "<backend 절대 경로>" } } }
}
```

- 도구 목록은 하드코딩이다. `backend/app/mcp/server.py` 의 `@mcp.tool()` 네 개와 이름이 같다.
- 부수 효과: 없음. 서버의 Python 실행 파일 경로와 backend 디렉터리 절대 경로를 노출한다.
- 관련 코드: `backend/app/api/mcp.py:6`

## 기타

### GET /
- 응답 200: `{"service": "AgentLens API", "version": "<settings.VERSION>", "docs": "/docs"}`
- 관련 코드: `backend/app/main.py:50`

### GET /health
- 응답 200: `{"status": "healthy", "version": "<settings.VERSION>", "running": <collector_manager.is_running>}`. DB 연결은 확인하지 않는다.
- docker-compose 의 backend healthcheck 가 `curl -f http://127.0.0.1:8000/health` 로 부른다.
- 관련 코드: `backend/app/main.py:54`

### 시작 시 동작 (엔드포인트 아님)
- `lifespan` 이 `ensure_db_schema()`, 스케줄러 시작을 하고, `news_items` 가 비어 있으면 요청을 받기 전에 `collect_all()` 을 동기로 한 번 돈다 (`backend/app/main.py:13`). 이 동안 서버는 요청을 받지 않는다.

## SSE 스트림

### POST /api/news/{news_id}/ask/stream
- 프레임: `event:` 줄 없이 `data: <JSON>\n\n` 만 보낸다. 이벤트 종류는 JSON 의 `event` 필드로 구분한다 (`backend/app/api/news.py:157`).

| `event` | 필드 | 설명 |
|---|---|---|
| `meta` | `model: str` | 쓰는 모델 이름. 캐시 적중이면 `"<model> (캐시됨)"`. 프로바이더를 바꿔 다시 시도하면 두 번 이상 올 수 있다 |
| `token` | `text: str` | 답변 조각 |
| `done` | `total_text: str` | 전체 답변. 종료 신호 |

- 순서: `meta` → `token`* → `done`. Anthropic 스트림이 중간에 실패하면 이미 보낸 토큰 뒤에 OpenAI 나 휴리스틱의 `meta`·`token` 이 이어 붙는다 (`full_text` 를 이어 쓴다, `backend/app/services/llm_processor.py:860`~`:937`).
- 오류 이벤트: 없다. 모든 프로바이더 실패는 휴리스틱 답변으로 대체한다. 휴리스틱 단계에서 예외가 나면 오류 이벤트 없이 스트림이 끊긴다.
- 종료: `done` 은 `full_text` 가 비어 있지 않을 때만 보낸다.

### POST /api/chat/stream
- 프레임: `event: <종류>\ndata: <JSON>\n\n` (`backend/app/services/chat_service.py:576`).

| 이벤트 | data 필드 | 설명 |
|---|---|---|
| `status` | `step`, `label`, `progress`, `timestamp`, (`query`) | 진행 단계. backend 가 보내는 `step` 은 `extracting_source`(30), `synthesizing`(85/80/75), `thinking`(25), `tool_calling`(50, `query` 포함) 넷뿐이다 |
| `sources` | `sources: ChatSourceItem[]`, `applied_filters`, `is_relaxed`, `primary_count`, `supplementary_count` | 출처. `supplementary_count` 는 항상 0, 모든 출처의 `type` 은 `primary` |
| `token` | `token: str` | 답변 조각 |
| `done` | `done: true`, `session_id`, `model`, `model_tier`, `sources_count`, `primary_count`, `supplementary_count`, `latency_ms`, `usage` | 종료 신호. `usage` 는 `llm_processor.last_usage` 딕셔너리 그대로 |
| `error` | `error_code: "ERR_LLM_STREAM_FAILED"`, `message`, `status_code: 502`, `step: "synthesizing"`, `retryable: true` | 토큰 생성 중 예외. 이 이벤트 뒤 스트림을 끝내고 `done` 은 보내지 않는다 |

- scoped 순서: `status(extracting_source, 30)` → `status(synthesizing, 85)` → `sources`(단일 출처, `full_content` 포함, `applied_filters: null`) → `token`* → `done`.
- global 순서
  - 검색함: `status(thinking, 25)` → `status(tool_calling, 50)` → `status(synthesizing, 80)` → `token`* → `sources`(답변에 인용된 출처만, 토큰 뒤에 온다) → `done`.
  - 검색 안 함: `status(thinking, 25)` → `status(synthesizing, 75)` → `token`* → `done` (`sources` 없음).
- `done` 이후 서버는 대화 턴을 DB 에 저장한다 (클라이언트에 이벤트를 더 보내지 않는다).

## 스키마 사전

### backend/app/schemas/news.py

**NewsItemBase / NewsItemResponse** (`NewsItemResponse` 는 `NewsItemBase` + 아래 3필드)

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `title` | str | 예 | — |
| `url` | str | 예 | — |
| `source` | str | 예 | — |
| `category` | str | 예 | — |
| `summary` | str \| null | 아니오 | `""` |
| `author` | str \| null | 아니오 | null |
| `tags` | str[] | 아니오 | `[]` |
| `tldr_bullets` | str[] | 아니오 | `[]` |
| `why_it_matters` | str \| null | 아니오 | `""` |
| `tech_stack` | str[] | 아니오 | `[]` |
| `quality_score` | float | 아니오 | 6.0 |
| `is_high_signal` | bool | 아니오 | false |
| `raw_score` | int | 아니오 | 0 |
| `comments_count` | int | 아니오 | 0 |
| `hotness_score` | float | 아니오 | 0.0 |
| `published_at` | datetime | 예 | — |
| `id` | int | 예 | — |
| `created_at` | datetime | 예 | — |
| `dedup_hash` | str | 예 | — |

**NewsListResponse**: `items: NewsItemResponse[]`, `total: int`, `page: int`, `size: int`, `total_pages: int` (모두 필수).

**AskQuestionRequest**: `question: str` (필수).

**AskQuestionResponse**: `news_id: int`, `question: str`, `answer: str` (필수), `model_used: str | null` (기본 null).

**BriefingCategoryItem**

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `id` | int \| null | 아니오 | null |
| `title` | str | 예 | — |
| `url` | str | 예 | — |
| `source` | str \| null | 아니오 | `""` |
| `why_it_matters` | str \| null | 아니오 | `""` |
| `summary` | str \| null | 아니오 | `""` |
| `tags` | str[] \| null | 아니오 | `[]` (문자열이면 쉼표로 쪼갠다) |
| `category` | str \| null | 아니오 | `""` |
| `category_name` | str \| null | 아니오 | `""` |
| `hotness_score` | float \| null | 아니오 | 0.0 |

**BriefingCategorySection**: `id: str`, `name: str`, `icon: str`, `summary: str` (필수), `items: BriefingCategoryItem[]` (기본 `[]`).

**DailyBriefingResponse**

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `title` | str \| null | 아니오 | `오늘의 AI 브리핑` |
| `date` | str | 예 | — |
| `headline` | str | 예 | — |
| `overview` | str \| null | 아니오 | `""` |
| `categories` | BriefingCategorySection[] \| null | 아니오 | `[]` |
| `action_items` | str[] \| null | 아니오 | `[]` |
| `markdown_report` | str | 예 | — |
| `featured_items_count` | int | 예 | — |
| `generated_at` | str | 예 | — |

**NotionExportRequest**: `api_key: str | null`, `page_id: str | null` (모두 기본 null).

**NotionExportResponse**: `success: bool`, `message: str` (필수), `url: str | null` (기본 null).

**EmailSendRequest**: `to_email: str | null`, `subject: str | null` (기본 null).

**EmailSendResponse**: `success: bool`, `message: str` (필수).

**TestNotionRequest**: `api_key: str | null`, `page_id: str | null` (기본 null).

**TestEmailRequest**: `smtp_host: str | null`(null), `smtp_port: int | null`(587), `smtp_user: str | null`(null), `smtp_password: str | null`(null), `use_tls: bool | null`(true), `to_email: str | null`(null).

**BriefingSettingsUpdate**: `notion_api_key`, `notion_page_id`, `smtp_host`, `smtp_user`, `smtp_password`, `smtp_from`, `smtp_to`, `slack_webhook_url`, `discord_webhook_url` (str | null), `notion_auto_export`, `smtp_use_tls`, `email_auto_send` (bool | null), `smtp_port` (int | null). 모두 기본 null.

**ScheduleStatusResponse**

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `current_time` | str | 예 | — |
| `schedule_hours` | int[] | 예 | — |
| `timezone` | str | 예 | — |
| `next_run` | str | 예 | — |
| `minutes_until_next_run` | float | 예 | — |
| `is_running` | bool | 예 | — |
| `last_crawl_time` | str \| null | 아니오 | null |
| `last_crawl_status` | str \| null | 아니오 | `idle` |
| `recent_logs` | dict[] | 아니오 | `[]` |

**StatsResponse**: `total_news: int`, `category_counts: dict[str, int]`, `source_counts: dict[str, int]` (필수), `last_updated: str | null` (기본 null).

**ManualCollectResponse**: `message: str`, `total_collected: int`, `total_saved: int`, `source_results: dict` (모두 필수). 정의만 있고 어느 엔드포인트도 response_model 로 쓰지 않는다 (`POST /api/schedule/trigger` 는 `status` 필드를 더한 dict 를 직접 돌려준다).

### backend/app/schemas/chat.py

**TokenUsageMeta**: `input_tokens: int`(0), `output_tokens: int`(0), `cache_read_input_tokens: int | null`(null), `cache_creation_input_tokens: int | null`(null).

**ChatMessageHistory**: `role: "user" | "assistant" | "system"`, `content: str` (모두 필수, 길이 제약 없음).

**ChatFocusFilter**

| 필드 | 타입 | 기본값 |
|---|---|---|
| `category` | `all` \| `harness` \| `mcp_plugins_skills` \| `agent_tech` \| `ai_news` | `all` |
| `time_range` | `all` \| `24h` \| `7d` \| `30d` | `all` |
| `sort` | `hot` \| `latest` \| `quality` | `hot` |
| `high_signal_only` | bool | false |

**ChatStreamRequest / ChatQueryRequest** (두 모델의 필드가 같다)

| 필드 | 타입 | 필수 | 기본값 | 제약 |
|---|---|---|---|---|
| `question` | str | 예 | — | 1 ~ 2000자 |
| `model` | str \| null | 아니오 | `settings.ANTHROPIC_DEFAULT_CHAT_MODEL` (없으면 `claude-sonnet-5-5`) | — |
| `model_tier` | `haiku` \| `sonnet` \| `opus` \| null | 아니오 | null | — |
| `scope` | `scoped` \| `global` | 아니오 | `global` | — |
| `source_id` | int \| null | 아니오 | null | — |
| `session_id` | str \| null | 아니오 | null | — |
| `history` | ChatMessageHistory[] \| null | 아니오 | null | — |
| `top_k` | int | 아니오 | 5 | 1 ~ 10 |
| `filters` | ChatFocusFilter \| null | 아니오 | null | — |

**ChatStatusPayload**: `step: ChatStatusStep`(필수, `thinking`·`tool_calling`·`observing`·`extracting_source`·`evaluating_sufficiency`·`agentic_searching`·`synthesizing`), `label: str`, `timestamp: str` (필수), `progress: int | null`, `query: str | null`, `queries: str[] | null`, `sources_found: int | null`. 정의만 있고 `stream_chat` 은 dict 를 직접 `json.dumps` 한다.

**ChatSourceItem** (별칭 `ChatSourceMeta`)

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `index` | int \| str | 예 | — |
| `type` | `primary` \| `supplementary` | 아니오 | `primary` |
| `id` | int \| null | 아니오 | null |
| `title` | str | 예 | — |
| `url` | str | 예 | — |
| `source` | str | 예 | — |
| `category` | str \| null | 아니오 | null |
| `quality_score` | float \| null | 아니오 | null |
| `score` | float \| null | 아니오 | null |
| `snippet` | str \| null | 아니오 | null |
| `full_content` | str \| null | 아니오 | null |
| `domain` | str \| null | 아니오 | null |
| `relevance_score` | float \| null | 아니오 | null |
| `published_at` | str \| null | 아니오 | null |
| `publisher` | str \| null | 아니오 | null |

**ChatSourcesPayload**: `sources: ChatSourceItem[]`(필수), `applied_filters: any`(null), `is_relaxed: bool`(false), `primary_count: int | null`, `supplementary_count: int | null`. 정의만 있고 스트림에서는 dict 로 만든다.

**StreamErrorPayload**: `error_code: str`, `message: str` (필수), `status_code: int`(502), `step: str | null`(null), `retryable: bool`(true). 정의만 있고 스트림에서는 dict 로 만든다.

**DonePayload**: `done: bool`(true), `session_id: str`(필수), `model: str | null`(기본 모델), `model_tier`(`sonnet`), `sources_count: int`(필수), `primary_count`, `supplementary_count` (int | null), `latency_ms: int`(필수), `usage: TokenUsageMeta | null`. 정의만 있고 스트림에서는 dict 로 만든다.

**ChatQueryResponse**

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `answer` | str | 예 | — |
| `sources` | ChatSourceItem[] | 예 | — |
| `session_id` | str | 예 | — |
| `model` | str \| null | 아니오 | 기본 모델 |
| `model_tier` | ModelTier \| null | 아니오 | `sonnet` |
| `scope` | `scoped` \| `global` | 예 | — |
| `applied_filters` | ChatFocusFilter \| null | 아니오 | null |
| `is_relaxed` | bool | 아니오 | false |
| `primary_count` | int \| null | 아니오 | null |
| `supplementary_count` | int \| null | 아니오 | null |
| `latency_ms` | int | 예 | — |
| `usage` | TokenUsageMeta \| null | 아니오 | null |

**ChatSourceDetailResponse**

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `id` | int | 예 | — |
| `title` | str | 예 | — |
| `url` | str | 예 | — |
| `source` | str | 예 | — |
| `category` | str | 예 | — |
| `author` | str \| null | 아니오 | null |
| `summary` | str | 아니오 | `""` |
| `tldr_bullets` | str[] | 아니오 | `[]` |
| `why_it_matters` | str | 아니오 | `""` |
| `tech_stack` | str[] | 아니오 | `[]` |
| `tags` | str[] | 아니오 | `[]` |
| `quality_score` | float | 예 | — |
| `is_high_signal` | bool | 아니오 | false |
| `hotness_score` | float | 아니오 | 0.0 |
| `published_at` | str | 예 | — |
| `created_at` | str \| null | 아니오 | null |
| `full_content` | str \| null | 아니오 | null |
| `scraped_at` | str \| null | 아니오 | null |

**ChatSearchChunk**: `index: int`, `id: int`, `title: str`, `url: str`, `source: str`, `category: str`, `snippet: str`, `quality_score: float`, `published_at: str`, `bm25_score: float`, `rag_score: float` (모두 필수).

**ChatSearchResponse**: `query: str`, `total_matches: int`, `chunks: ChatSearchChunk[]`, `latency_ms: int` (모두 필수).

**ErrorResponse**: `error_code: str`, `message: str` (필수), `details: dict | null` (null). chat 라우터가 import 하지만 실제 응답은 같은 모양의 dict 를 `JSONResponse` 로 직접 만든다.

**GenericSuccessResponse**: `status: str`(`success`), `message: str | null`, `deleted_count: int | null`.

**ChatMessageItem**

| 필드 | 타입 | 필수 | 기본값 |
|---|---|---|---|
| `id` | str | 예 | — |
| `session_id` | str | 예 | — |
| `role` | `user` \| `assistant` \| `system` | 예 | — |
| `content` | str | 예 | — |
| `created_at` | str | 예 | — |
| `sources` | ChatSourceItem[] \| null | 아니오 | null |
| `status` | `pending` \| `streaming` \| `completed` \| `error` \| `aborted` | 아니오 | `completed` |
| `model` | str \| null | 아니오 | null |
| `model_tier` | ModelTier \| null | 아니오 | null |
| `latency_ms` | int \| null | 아니오 | null |
| `usage` | TokenUsageMeta \| null | 아니오 | null |

**ChatSessionSummary**: `id: str`, `title: str`, `created_at: str`, `updated_at: str`, `scope_mode: "scoped" | "global"` (필수), `active_source_id: int | null`, `message_count: int`(0), `last_message_preview: str | null`, `active_filters: ChatFocusFilter | null`.

**ChatSessionDetail**: `id`, `title`, `created_at`, `updated_at`, `scope_mode` (필수), `active_source_id: int | null`, `active_source: ChatSourceDetailResponse | null`, `active_filters: ChatFocusFilter | null`, `messages: ChatMessageItem[]`(`[]`).

**ChatSessionCreateRequest**: `id: str | null`(null), `title: str | null`(`새 대화`), `scope_mode: "scoped" | "global" | null`(`global`), `active_source_id: int | null`, `active_filters: ChatFocusFilter | null`, `messages: ChatMessageItem[] | null`.

### 라우터 파일 안의 요청 모델

**WebhookTestRequest / WebhookBriefingRequest** (`backend/app/api/webhook.py:11`): `webhook_url: str`(필수), `provider: str | null`(`auto`).

**AddRssRequest** (`backend/app/api/sources.py:8`): `name: str`, `url: str` (필수), `site_url`(`""`), `category_hint`(`ai_news`), `country`(`GLOBAL`), `description`(`""`) — 모두 `str | null`.

**AddGitHubRepoRequest** (`backend/app/api/sources.py:16`): `repo: str`(필수), `category`(`agent_tech`), `description`(`""`), `stars_hint: int | null`(0).

**InspectUrlRequest** (`backend/app/api/research.py:8`): `url: str`(필수).

**DiscoverRequest** (`backend/app/api/research.py:11`): `query: str | null`(`""`), `category: str | null`(`""`), `limit: int | null`(8).

**RegisterCandidateRequest** (`backend/app/api/research.py:16`): `name: str`, `feed_url: str` (필수), `site_url`(`""`), `category_hint`(`ai_news`), `country`(`GLOBAL`), `description`(`""`).

## 계약 대조

backend Pydantic ↔ frontend `src/types` ↔ MSW(`src/mocks/handlers.ts`, `src/mocks/handlers/chat.ts`) 사이에서 찾은 불일치다. 프론트 런타임 코드는 zod 스키마로 응답을 `parse` 하지 않는다 (`.parse` 호출은 `src/tests/` 에만 있다). 그래서 zod 와 backend 의 차이는 런타임 오류가 아니라 타입·계약 테스트의 어긋남으로 나타난다.

### 경로

| 경로 | backend | frontend / MSW |
|---|---|---|
| `GET /api/chat/stream` | 없음 (POST 만 있다. GET 은 405) | MSW `sseGetChatStreamHandler` 가 GET 을 목으로 제공한다 (`src/mocks/handlers.ts:480`) |
| `PATCH`/`DELETE /api/sources/github_repo/{owner/repo}` | `item_id` 는 경로 한 마디(`{item_id}`)라 `/` 를 담을 수 없다 | `toggleSource('github_repo', r.repo)` 가 `encodeURIComponent` 로 `%2F` 를 보낸다 (`SourcesListTab.tsx:261`). ASGI 는 디코딩된 경로로 라우팅하므로 매칭되지 않고 404 `{"detail":"Not Found"}` 가 날 것으로 보인다 (실행해 확인하지 않았다). RSS 피드에 `id` 가 없어 `url` 로 대체할 때도 같다 |
| MSW 가 없는 경로 | — | schedule 4개, trends, webhook 2개, research 6개, sources 쓰기 4개, briefing 의 export·send·test·settings 6개, mcp, `/news/feed/rss.xml`, `/`, `/health` |
| 프론트가 쓰지 않는 경로 | `POST /api/sources/github`, `POST /api/briefing/generate`, `GET /api/news/{id}`, `GET /api/chat/search`, `POST /api/chat/query`, `GET /api/mcp/info` | `askQuestionAboutNews`, `deleteAllNews`, `discoverSources`, `registerCandidate` 는 `api.ts` 에 정의만 있고 호출처가 없다 |

### News·Briefing·Sources (`src/types/news.ts`, `src/lib/api.ts`)

| 대상 | 필드 | 불일치 |
|---|---|---|
| `NewsItemSchema` | `full_content`, `scraped_at` | zod 에만 있다 (optional). backend `NewsItemResponse` 는 이 두 필드를 내보내지 않는다 |
| `NewsItemSchema` | `url` | zod `z.string().url()`, backend `str` (형식 보장 없음) |
| `NewsItemSchema` | `quality_score` | zod `0~10`, backend 범위 제약 없음 |
| `NewsItemSchema` | `published_at`, `created_at` | zod `string`, backend `datetime` (오프셋 없는 ISO 로 직렬화) |
| `MonitoredRepoSchema` | `category` 기본값 | zod `mcp_plugins_skills`, backend `agent_tech` |
| `CrawlProgress` (api.ts) | `last_crawl_time` | TS `string` optional, backend 는 `null` 을 보낸다 |
| `InspectUrlResponse` (api.ts) | `type`, `source_kind`, `input_url` | backend 는 보내지만 TS 타입에 없다 |
| `triggerDeepResearch` 반환 | `max_candidates` | backend 는 보내지만 TS 타입에 없다 |
| `BriefingSettings`, `ScheduleStatus`, `TechRadarData`, 브리핑 export·email 응답 | — | zod 없이 TS interface 만 있다. 필드 이름은 backend 와 일치한다 |

### Chat (`src/types/chat.ts`)

| 대상 | 필드 | 불일치 |
|---|---|---|
| `ChatSourceDetailResponseSchema` | `full_content`, `scraped_at` | backend 에만 있다 (zod 에 없음) |
| `ChatSourceDetailResponseSchema`, `ChatSourceItemSchema`, `ChatSearchChunkSchema` | `url`, `quality_score`, `title` | zod 는 URL 형식, `1.0~10.0`, 최대 500자를 요구한다. backend 는 제약 없음 |
| `ChatSearchChunkSchema` | `rag_score` | zod `0~1`, backend 제약 없음 |
| `ChatStreamRequestSchema`, `ChatQueryRequestSchema` | `model` 기본값 | zod `claude-sonnet-5-5` 고정, backend 는 설정값 |
| 같은 두 스키마 | `source_id`, `session_id` | zod 는 양의 정수, UUID 를 요구한다. backend 는 `int`, 아무 문자열 |
| `ChatMessageHistorySchema` | `content` | zod 최소 1자, backend 제약 없음 |
| `ChatSessionSummarySchema`, `ChatSessionDetailSchema` | `title` | zod 1~100자, backend 는 POST 로 받은 길이 그대로 저장·반환 |
| `ChatQueryResponseSchema` | `answer`, `model` | zod 최소 1자 필수, backend `model` 은 nullable |
| `LlmErrorCodeSchema` | 코드 목록 | backend 가 실제로 내는 `ERR_INVALID_PAYLOAD`, `ERR_RETRIEVER_INDEX_ERROR` 가 enum 에 없다. 반대로 enum 의 `ERR_INVALID_MODEL_TIER`, `ERR_CHAT_STREAM_TIMEOUT`, `ERR_SESSION_LIMIT_EXCEEDED`, `ERR_INVALID_FILTER_PARAM`, `ERR_ARTICLE_EXTRACTION_FAIL`, `ERR_STREAM_ABORTED_BY_USER`, `ERR_SONNET_SCHEMA_VALIDATION`, `ERR_ANTHROPIC_*` 별칭은 backend 코드에서 내는 곳을 찾지 못했다 |
| `LlmErrorCodeSchema` 주석 | `ERR_CLAUDE_API_KEY_MISSING` | 주석은 HTTP 503, backend 는 401 |
| `ChatStreamErrorPayloadSchema`, `LlmErrorResponseSchema` | `provider` | zod·MSW 에는 있다. backend 는 보내지 않는다 |
| `ChatStatusStepSchema` | `evaluating_sufficiency`, `agentic_searching`, `observing` | zod·MSW 에는 있다. backend 스트림은 보내지 않는다 |

### MSW 동작 vs backend

| 경로 | MSW | backend |
|---|---|---|
| `GET /api/news` 잘못된 page/size | 400 `{"error_code": "ERR_INVALID_PAGE_PARAM", ...}` | 422 FastAPI 검증 형식 |
| `GET /api/news/{id}` 없음 | 404 `{"error_code": "ERR_FEED_CARD_NOT_FOUND", ...}` | 404 `{"detail": "News item not found"}` |
| `POST /api/news/{id}/ask` 빈 질문 | 400 `ERR_CHAT_PAYLOAD_EMPTY` | 200 (빈 질문도 처리) |
| `POST /api/news/{id}/ask` LLM 없음 | 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | 200 휴리스틱 답변 (`model_used: "AgentLens Heuristic Engine"`) |
| `POST /api/news/{id}/ask/stream` 없음 | 404 `{"error_code": ...}` | 404 `{"detail": ...}` |
| `DELETE /api/news/all` | `{status, message, deleted_count}` | `{status, deleted_count}` (`message` 없음) |
| `POST /api/chat/stream`, `/query` 잘못된 `model`·`model_tier` | 400 `ERR_INVALID_MODEL_TIER` (`model` 은 세 Claude 모델만 허용) | `model` 은 검증하지 않는다. `model_tier` 오류는 `/stream` 에서 전역 500 `{"detail","error"}`, `/query` 에서 500 `ERR_SERVER_INTERNAL` |
| `POST /api/chat/stream` 이벤트 순서 | 항상 `status`×4(`extracting_source`→`evaluating_sufficiency`→`agentic_searching`→`synthesizing`) → `sources` → `token` → `done`, 보충 출처(`supplementary`) 포함 | 위 [SSE 스트림](#sse-스트림) 순서. global 모드는 `sources` 가 토큰 뒤에 오고, 보충 출처는 없다 |
| `POST /api/chat/stream` 오류 이벤트 | `provider: "anthropic"` 포함 | `provider` 없음 |

## 알려진 불일치·위험

### 파괴적 엔드포인트 (인증·확인 없음)
- `DELETE /api/news/all`: 뉴스 전부 삭제.
- `POST /api/schedule/reset-and-collect`: 뉴스와 수집 로그 전부 삭제 후 외부 수집·LLM 평가를 시작한다.
- `DELETE /api/sources/{type}/{id}`, `PATCH .../toggle`: `sources.json` 수정.
- `DELETE /api/chat/sessions/{id}`: 세션 삭제. 또 `POST /api/chat/sessions` 와 스트림 저장은 세션이 30개를 넘으면 가장 오래된 세션을 자동으로 지운다.
- `POST /api/briefing/settings`: config.json 전체를 다시 쓴다.

### 인증 없는 쓰기·외부 호출
- 인증이 전혀 없고 CORS 가 모든 출처를 허용한다(`allow_credentials=True`). backend 포트(:8000)에 닿는 누구나 위 파괴적 엔드포인트와 아래 외부 호출을 부를 수 있다.
- 서버가 요청자가 지정한 주소로 나가는 요청을 보낸다 (SSRF 성격): `POST /api/webhook/test`·`/send-briefing`(임의 http URL 로 POST, 응답 본문 일부를 되돌려준다), `POST /api/research/inspect-url`(임의 URL GET, 리다이렉트 따라감), `POST /api/briefing/test/email`(임의 SMTP 호스트·포트 접속 후 메일 발송), `POST /api/briefing/test/notion`, `/export/notion`(요청자가 준 토큰으로 Notion 호출).
- 비용이 드는 호출: `/api/chat/query`, `/api/chat/stream`, `/api/news/{id}/ask(*)`, `/api/schedule/trigger`(항목별 LLM 평가)에 속도 제한이 없다.

### 정보 노출
- 전역 예외 처리가 `str(exc)` 를 `error` 필드로 돌려준다. chat 라우터도 `details.error` 나 `message` 에 예외 문자열을 싣는다.
- `GET /api/briefing/settings` 가 Slack/Discord 웹훅 URL 을 마스킹 없이 돌려준다 (웹훅 URL 자체가 비밀이다).
- `GET /api/sources` 의 `sources_file`, `GET /api/mcp/info` 의 `command`·`cwd` 가 서버 절대 경로를 노출한다.

### 입력 검증 누락
- `POST /api/news/{id}/ask(*)` 의 `question` 에 길이 제한이 없다 (chat 은 2000자).
- `GET /api/research/audit-logs?limit`, `POST /api/research/run-deep?max_candidates`, `POST /api/research/discover` 의 `limit` 에 범위 제약이 없다.
- `POST /api/sources/rss`·`/github`, `register-candidate`: URL·저장소 형식, `category_hint`·`country` 값 검증이 없다. RSS `id` 가 이름에서 만들어져 중복될 수 있고, `DELETE` 는 같은 `id` 를 가진 항목을 모두 지운다.
- `POST /api/briefing/settings`: 웹훅 URL·SMTP 값 검증이 없다.
- 검증 실패가 400 이 아닌 500 으로 나가는 곳: `/api/chat/stream`(요청 모델 변환이 try 밖), `/api/chat/query`(`ERR_SERVER_INTERNAL`), `/api/chat/search`(필터 리터럴 오류가 `ERR_RETRIEVER_INDEX_ERROR`).
- `POST /api/chat/sessions` 는 JSON 오류·필드 오류·UUID 오류를 모두 `ERR_SESSION_INVALID_UUID` 로 돌려준다.

### 동작상 위험
- 대화 메시지 중복·충돌: 스트림이 끝나면 backend 가 `persist_turn` 으로 질문·답변을 새 UUID 로 저장하고, 프론트(`useChatSessions.ts:225`)도 같은 턴을 포함한 전체 메시지를 클라이언트 id 로 `POST /api/chat/sessions` 에 보낸다. `append_messages_batch` 는 id 중복 검사 없이 INSERT 하므로 첫 턴은 메시지가 중복 저장되고, 다음 턴부터는 이미 저장된 클라이언트 id 를 다시 보내 기본 키 충돌로 500 `ERR_SESSION_CREATE_FAILED` 가 날 것으로 보인다. 프론트는 이 응답의 상태를 확인하지 않는다. 실행해 확인하지는 않았다 (`backend/app/services/chat_session_service.py:299`, `frontend/src/components/chat/useChatSessions.ts:225`).
- `usage` 공유 상태: `done` 이벤트와 `/query` 응답의 `usage` 는 싱글턴 `llm_processor.last_usage` 를 읽는다. 동시 요청이 있으면 다른 요청의 사용량이 섞일 수 있고, OpenAI·Ollama 경로는 이 값을 갱신하지 않아 이전 요청 값이 남는다 (`backend/app/services/llm_processor.py:320`, `:388`).
- `GET /api/chat/search` 가 FTS 테이블 생성·`rebuild`·커밋을 할 수 있다 (GET 의 쓰기).
- `GET /api/briefing/today` 와 `POST /api/briefing/generate` 는 같은 함수다. "재생성" 의미가 없다.
- `POST /api/briefing/settings` 는 Docker 에서 config.json 이 읽기 전용 마운트라 실패할 것으로 보인다.
- `sources.json` 저장 실패를 sources·research 엔드포인트가 확인하지 않아 성공으로 응답한다.
- `GET /api/news/feed/rss.xml` 은 `summary`·`published_at` 이 NULL 인 행이 있으면 500 이 나고, `<link>` 가 `http://localhost:3000` 으로 고정이다.
- `POST /api/chat/stream` 에서 계획·검색·스크래핑 단계 예외는 `error` 이벤트 없이 스트림을 끊는다.
- 서버 시작 시 DB 가 비어 있으면 첫 수집이 끝날 때까지 요청을 받지 않는다.

### 문서와 코드의 차이
- `docs/tech-spec.md` 는 SSE 2개를 모두 rewrite 를 거치지 않고 직접 붙인다고 적었지만, 코드에서 직접 연결은 `POST /api/news/{id}/ask/stream` 뿐이다. `POST /api/chat/stream` 은 상대 경로로 rewrite 를 거친다 (`frontend/src/components/chat/ChatWorkspace.tsx:300`).
