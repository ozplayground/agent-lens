# 테스트 명세: AgentLens
Updated: 2026-11-06

이 문서는 저장소의 테스트 코드를 읽어 정리한 명세다. 테스트는 실행하지 않았다. backend 개수는 `cd backend && ../.venv/bin/pytest --collect-only -q tests/` (수집만 함)로, frontend 개수는 파일의 `it(` 호출을 세어 확인했다. 통과 여부는 확인하지 못했다.

| 구분 | 파일 수 | 테스트 수 |
|---|---|---|
| backend (`backend/tests/test_*.py`) | 16 (+ `conftest.py`) | 160 |
| frontend (`frontend/src/tests/**/*.test.ts(x)`) | 24 (+ `setup.ts`) | 241 |

표기:
- **ASGI**: `httpx.AsyncClient(transport=ASGITransport(app=app))` 로 FastAPI 앱을 같은 프로세스 안에서 부른다. 이 호출 자체는 네트워크를 쓰지 않는다. `ASGITransport` 는 lifespan 이벤트를 보내지 않으므로 `backend/app/main.py:13-26` 의 lifespan(초기 수집, 스케줄러 시작)은 테스트에서 돌지 않는다.
- **실호출**: mock 없이 외부(또는 로컬) 네트워크로 나가는 경로가 있다. 자세한 근거는 `## 외부 호출 판정` 에 둔다.
- **키 있으면**: `ANTHROPIC_API_KEY` 가 설정돼 있으면 Anthropic API 를 실제로 부른다. 현재 작업 트리의 `.env`, `backend/.env` 에는 이 값이 들어 있다.

## 테스트 목록

### backend

#### backend/tests/conftest.py (fixture)
| 이름 | 종류 | 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|---|
| (모듈 수준 코드) | import 시점 | `os.environ["DATABASE_URL"]` 을 `sqlite+aiosqlite:///backend/tests/test_agentlens.db` 로 바꾼 뒤 `app.database` 를 import 한다 (`conftest.py:6-9`). `TESTING`, `CI` 는 설정하지 않고 LLM 키도 지우지 않는다 | `app/config.py`, `app/database.py` | 없음 |
| `init_db` | autouse async fixture, 함수 범위 | 테스트마다 `ensure_db_schema()` 를 부르고(`create_all` 이라 없는 테이블만 만든다), id=1 `NewsItem`(LangGraph Harness, quality 8.5) 이 없으면 넣는다. teardown 이 없어 데이터는 테스트·실행 사이에 남는다 | `app/database.py:45` `ensure_db_schema`, `app/models` | 없음 |

#### backend/tests/test_agentic_workflow.py (16)
fixture: `db_session`(AsyncSessionLocal 세션), `sample_article_scoped`(고유 URL `https://example.com/langgraph-v03-guide-<uid>`, `full_content=None` 인 NewsItem 을 만들고 teardown 에서 지운다).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_article_scraper_l1_l2_cache_and_db_persistence | 첫 호출은 HTTP 로 500자 이상 본문을 추출해 DB(`full_content`, `scraped_at`)에 저장하고, 같은 인스턴스·새 인스턴스의 재호출은 추가 HTTP 없이 같은 본문을 돌려준다 | `services/scraper.py` `get_article_content` | `httpx.AsyncClient.get` patch |
| test_article_scraper_graceful_fallback_on_403_and_timeout | 403 은 `ScrapeBlockedException`, 타임아웃은 `ScrapeTimeoutException` 을 던진다 | `scraper.fetch_and_parse` | `httpx.AsyncClient.get` patch |
| test_article_scraper_single_flight_lock | 같은 URL 동시 5회 요청이 HTTP 1회로 합쳐진다 | `get_article_content` (URL 락) | `httpx.AsyncClient.get` patch (지연 응답) |
| test_agentic_search_sufficiency_and_anchoring | 설치 명령이 없는 본문이면 `is_sufficient=False`, 하위 질의 1~2개, 첫 질의에 "LangGraph" 가 들어간다 | `services/agentic_search.py` `evaluate_sufficiency` | 없음 |
| test_agentic_search_relevance_filtering | 관련도 0.60 미만 후보를 버리고 나머지를 S1, S2 보조 출처로 만든다 | `search_supplementary` | `_search_web_candidates` patch |
| test_chat_scoped_sse_agentic_lifecycle | scoped 스트림이 status(extracting_source, synthesizing) → sources(primary 1개) → token → done 을 내고, 보조 검색 단계와 S1 이 없다 | `services/chat_service.py` `stream_chat` | `get_article_content`, `evaluate_and_search`, `check_provider_available`, `stream_tokens` patch |
| test_chat_scoped_graceful_degradation_when_scrape_fails | 스크랩이 `ScrapeBlockedException` 이어도 error 없이 status·sources·done 을 낸다 | `stream_chat` | 위와 같은 patch (스크랩은 예외) |
| test_article_scraper_readability_fallback_when_trafilatura_fails | trafilatura 가 None 이면 readability+BeautifulSoup 으로 500자 이상을 추출한다 | `fetch_and_parse` | `httpx.AsyncClient.get`, `trafilatura.extract` patch |
| test_article_scraper_empty_content_exception | 두 추출기 모두 500자 미만이면 `ScrapeEmptyContentException` 을 던진다 | `fetch_and_parse` | `httpx.AsyncClient.get` patch |
| test_agentic_search_sufficiency_true_when_content_already_answers | 본문에 설치 명령이 있으면 `is_sufficient=True`, 질의 0개 | `evaluate_sufficiency` | 없음 |
| test_chat_query_scoped_with_agentic_workflow_success | scoped `query_chat` 이 primary 1개, supplementary 0, 보조 검색 미호출, LLM 답을 그대로 돌려준다 | `ChatService.query_chat` | `get_article_content`, `evaluate_and_search`, `generate_live_answer` patch |
| test_agentic_search_comparison_and_patch_triggers | "vs" 질문은 `comparison_benchmarks`, 릴리즈·패치 질문은 `patch_changelog` 누락으로 판정한다 | `evaluate_sufficiency` | 없음 |
| test_agentic_search_web_candidates_and_relevance | `_calculate_relevance` 가 0.60 기준으로 관련/무관을 가르고, DuckDuckGo 응답을 후보로 파싱한다 | `_calculate_relevance`, `_search_web_candidates` | `httpx.AsyncClient.get` patch |
| test_chat_global_react_search_tool_lifecycle | 기술 질문은 thinking → tool_calling(search_news_corpus) → synthesizing → token → sources → done 순서이고 observing 이 없으며 sources 가 token 뒤에 온다 | `stream_chat` (global), `_plan_react_action` | `stream_tokens` patch |
| test_chat_global_react_casual_greeting_skips_search_tool | 인사·잡담 4개는 tool_calling·sources 없이 "직접 답변 생성" 으로 가고 sources_count 0 | `stream_chat` | `stream_tokens` patch |
| test_chat_global_react_llm_planner_and_citation_filtering | scoped 는 바로 none, 라이브 planner 의 JSON 응답으로 none/search 를 정하고, 인용된 [2] 만 남기는 출처 필터 | `_plan_react_action`, `_filter_cited_sources` | `is_test_environment`(False), `has_live_provider`, `generate_live_answer` patch |

#### backend/tests/test_anthropic_provider.py (16)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_anthropic_provider_interface_and_model_resolution | 키 유무로 `is_available`, haiku/sonnet/opus 별칭·ID·None 의 모델 해석 | `llm_providers/anthropic_provider.py` `AnthropicLLMProvider`, `resolve_model_and_tier` | 없음 |
| test_anthropic_generate_text_mocked_http | 응답 텍스트와 usage(캐시 토큰 포함)를 추출하고 `x-api-key`, `anthropic-version`, `anthropic-beta` 헤더를 보낸다 | `generate_text_with_usage` | `httpx.AsyncClient.post` patch |
| test_anthropic_stream_chat_mocked_sse | SSE `content_block_delta` 를 토큰으로 내고 모델명에 haiku 가 들어간다 | `stream_chat` | `httpx.AsyncClient.stream` patch |
| test_anthropic_prompt_caching_ephemeral_structure | system 블록에 `cache_control: ephemeral` 이 붙는다 | `build_cached_system_block` | 없음 |
| test_anthropic_generate_structured_summary_with_caching | JSON 응답을 파싱해 category·점수·usage 를 돌려준다 | `generate_structured_summary` | `httpx.AsyncClient.post` patch |
| test_anthropic_error_mapping | HTTP 401/429/529 를 각각 KeyMissing/QuotaExceeded/Overloaded 예외로 바꾼다 | `_check_error_status` (`generate_text` 경유) | `httpx.AsyncClient.post` patch |
| test_llm_processor_anthropic_priority_and_routing | Anthropic 이 가용하면 `generate_live_answer` 가 먼저 쓴다 | `services/llm_processor.py` `generate_live_answer` | `anthropic_provider` 를 MagicMock 으로 교체 |
| test_chat_stream_3tier_model_routing | `POST /api/chat/stream` 의 done 이벤트에 `model_tier: haiku` 와 usage 가 있다 | `api/chat.py` `chat_stream`, `ChatService.stream_chat` | ASGI, **실호출** (LLM mock 없음, 키 있으면) |
| test_chat_query_3tier_model_routing | `POST /api/chat/query` 가 `model_tier: opus`, model 에 opus, usage 를 돌려준다 | `chat_query`, `query_chat` | ASGI, **실호출** (LLM mock 없음, 키 있으면) |
| test_chat_session_persistence_with_model_tier_and_usage | `persist_turn` 이 model_tier·usage 를 저장하고 상세 조회로 복원한다 | `services/chat_session_service.py` | 없음 (테스트 DB) |
| test_anti_gemini_has_live_provider_ignores_gemini_key | Gemini 키만 있으면 `has_live_provider()` 가 False | `has_live_provider` | settings·environ·`load_json_config`·`is_available` patch |
| test_anti_gemini_model_sanitization | 과거 모델명(Gemini 등)을 그대로 두고 빈 값은 `claude-sonnet-5-5` | `sanitize_model_identifier` | 없음 |
| test_anthropic_config_and_schema_defaults | `DEFAULT_MODEL`, 설정, 채팅 스키마 기본 모델이 `claude-sonnet-5-5` | `anthropic_provider.DEFAULT_MODEL`, `config.py`, `schemas/chat.py` | 없음 (`.env` 의 모델 값에 영향받는다) |
| test_anti_gemini_isolation_in_generate_live_answer | 가용 프로바이더가 없으면 `LLMProviderUnavailableException`, `_call_gemini` 미호출 | `generate_live_answer` | settings·`is_available`·`_call_gemini` patch, 로컬 Ollama 탐침 가능 |
| test_anti_gemini_isolation_in_stream_tokens | 같은 조건에서 `stream_tokens` 가 예외를 던진다 | `stream_tokens` | settings·`is_available` patch, 로컬 Ollama 탐침 가능 |
| test_anti_gemini_stream_question_answer_never_yields_gemini | meta 이벤트 모델명에 "Google"/"gemini" 가 없다 | `stream_question_answer` | settings·environ·`is_available` patch, 휴리스틱 답이 `_qa_cache` 에 남는다 |

#### backend/tests/test_api.py (9)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_health | `GET /health` 200, `status: healthy` | `main.py` `health` | ASGI |
| test_schedule | `GET /api/schedule/status` 의 `schedule_hours` 가 [0,6,12,18] | `api/schedule.py` | ASGI |
| test_news | `GET /api/news` 200, `items` 키 | `api/news.py` `get_news_feed` | ASGI |
| test_stats | `GET /api/stats` 200 | `api/stats.py` | ASGI |
| test_mcp_info | `GET /api/mcp/info` 의 tools 가 4개 이상 | `api/mcp.py` | ASGI |
| test_rss | `GET /api/news/feed/rss.xml` content-type 에 xml | `news.py` `get_rss_feed` | ASGI |
| test_daily_briefing_endpoint | `GET /api/briefing/today` 에 headline, markdown_report | `api/briefing.py`, `services/briefing_service.py` | ASGI |
| test_ask_ai_endpoint | `POST /api/news/{id}/ask` 200, answer 키 (뉴스 항목이 있을 때만 단언) | `news.py:111-135`, `llm_processor.answer_question_with_meta` | ASGI, **실호출** (키 있으면), 없으면 휴리스틱 |
| test_ask_ai_stream_endpoint | `POST /api/news/{id}/ask/stream` 이 text/event-stream, `data: ` 포함 | `news.py:137-167`, `stream_question_answer` | ASGI, **실호출** (키 있으면), 실패 시 휴리스틱 |

#### backend/tests/test_briefing_notion_email.py (9)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_today_briefing_structure | title "오늘의 AI 브리핑", 카테고리 4개(harness, mcp_plugins_skills, agent_tech, ai_news), action_items 1개 이상 | `api/briefing.py`, `briefing_service.generate_daily_briefing` | ASGI |
| test_notion_clean_id | Notion URL 의 32자 ID 를 UUID 형식으로 바꾸고, UUID 는 그대로 둔다 | `services/notion_service.py` `clean_id` | 없음 |
| test_notion_test_connection_mock | `/users/me` 200 이면 성공과 봇 이름을 돌려준다 | `notion_service.test_connection` | `httpx.AsyncClient.get` patch |
| test_notion_export_page_mock | 브리핑 페이지 생성 성공과 notion.so URL | `notion_service.create_briefing_page`, `briefing_service` | `httpx.AsyncClient.post` patch, **실호출** (`GET /v1/databases/{id}` 는 patch 안 됨) |
| test_notion_api_endpoints | `POST /api/briefing/test/notion` 빈 키 400, `POST /api/briefing/export/notion` 이 url 을 돌려준다 | `api/briefing.py` | `create_briefing_page` patch (export 만), test/notion 은 조건부 실호출 |
| test_email_service_html_generation | HTML 에 DOCTYPE, 제목, AgentLens 가 들어간다 | `services/email_service.py` `_build_html` | 없음 |
| test_email_test_connection_mock | SMTP 테스트 성공 메시지 | `email_service.test_connection` | `smtplib.SMTP` patch |
| test_email_api_endpoints | `POST /api/briefing/test/email` 빈 호스트 400, `POST /api/briefing/send/email` success | `api/briefing.py` | `send_briefing_email` patch (send 만), test/email 은 **실호출 가능** (config.json 의 SMTP 값 사용) |
| test_briefing_settings_get_and_post | 설정 조회에 title/notion/email/webhooks, 갱신 응답 success | `briefing.py` `get/update_briefing_settings`, `config.save_json_config` | 없음, 루트 `config.json` 을 실제로 쓴다 |

#### backend/tests/test_chat.py (34)
fixture `seed_chat_test_data`(autouse): id 101(FastMCP, 9.3), 102(LangGraph, 9.1), 103(스팸, 2.1)을 넣거나 덮어쓴다. teardown 없음.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_sqlite_fts_retriever_search_and_ranking | "FastMCP Python" 상위 결과가 101, index 1, rag_score 0~1, bm25 존재 | `services/retriever.py` `SqliteFtsRetriever.retrieve` | 없음 |
| test_sqlite_fts_retriever_quality_pruning | min_quality 5.0 이면 103 이 빠진다 | `retrieve` | 없음 |
| test_sqlite_fts_retriever_query_sanitization | 특수문자 질의가 SQL 오류 없이 리스트를 돌려준다 | `retrieve` | 없음 |
| test_knowledge_retriever_facade | facade 가 "LangGraph" 로 102 를 돌려준다 | `KnowledgeRetrieverFacade.search_knowledge` | 없음 |
| test_get_chat_source_success | `GET /api/chat/sources/101` 이 메타데이터(리스트형 tldr/tech_stack/tags)를 돌려준다 | `api/chat.py` `get_chat_source`, `ChatService.get_source_detail` | ASGI |
| test_get_chat_source_not_found | 없는 id 는 404 `ERR_HANDOVER_SOURCE_NOT_FOUND` | 같음 | ASGI |
| test_chat_search_success | `GET /api/chat/search` 가 chunks, bm25/rag 점수, latency_ms 를 돌려준다 | `search_chat_corpus` | ASGI |
| test_chat_search_query_too_short | q 1자면 400 `ERR_SEARCH_QUERY_TOO_SHORT` | 같음 | ASGI |
| test_chat_search_filters | category·min_quality 필터를 지킨다 | 같음 | ASGI |
| test_chat_query_global_mode_success | global query 가 답, 출처 1개 이상, session_id, model 을 돌려준다 | `chat_query`, `query_chat` | ASGI, `generate_live_answer` patch |
| test_chat_query_scoped_mode_success | scoped query 출처가 101 하나다 | `query_chat` (scoped) | ASGI, `generate_live_answer`·`evaluate_and_search` patch, **실호출** (스크래퍼가 `https://github.com/jlowin/fastmcp` GET) |
| test_chat_query_empty_question_validation | 빈/공백 질문 400 `ERR_CHAT_PAYLOAD_EMPTY` | `chat_query` | ASGI |
| test_chat_query_too_large_question_validation | 2001자 질문 400 `ERR_CHAT_PAYLOAD_TOO_LARGE` | `chat_query` | ASGI |
| test_chat_query_scoped_source_not_found | 없는 source_id 404 | `query_chat` | ASGI |
| test_chat_query_invalid_scope | 잘못된 scope 400 `ERR_INVALID_SCOPE_PARAM` | `chat_query` | ASGI |
| test_chat_stream_global_sse_success | sources/token/done 이벤트가 있고 done.session_id 가 요청과 같다 | `chat_stream`, `stream_chat` | ASGI, `check_provider_available`·`stream_tokens` patch |
| test_chat_stream_scoped_sse_success | scoped 스트림에 sources, "FastMCP", done | 같음 | ASGI, 같은 patch, **실호출** (101 URL 스크랩, 프로세스 첫 회) |
| test_chat_stream_empty_question_validation | 공백 질문 400 | `chat_stream` | ASGI |
| test_chat_stream_scoped_source_not_found | 없는 source_id 404 | `chat_stream` | ASGI |
| test_sqlite_fts_retriever_focus_filter_category | category 필터 결과만 나오고 is_relaxed False | `retrieve_with_meta` | 없음 |
| test_sqlite_fts_retriever_focus_filter_high_signal | high_signal_only 결과에 103 이 없다 | `retrieve_with_meta` | 없음 |
| test_sqlite_fts_retriever_adaptive_tau_and_time_range | `get_tau_seconds` 의 24h/7d/30d/all 값 | `get_tau_seconds` | 없음 |
| test_sqlite_fts_retriever_focus_filter_sort_modes | latest/quality 정렬 순서 (결과 2개 이상일 때만 단언) | `retrieve_with_meta` | 없음 |
| test_sqlite_fts_retriever_auto_relaxation_on_zero_matches | 24h 에 0건이면 all 로 완화하고 is_relaxed True | `retrieve_with_meta` | 없음 (item 201 을 넣고 지우지 않는다) |
| test_chat_search_with_focus_filters | `/api/chat/search` 가 category·time_range·sort·high_signal_only 를 바인딩한다 | `search_chat_corpus` | ASGI |
| test_chat_query_with_focus_filters_and_relaxation | query 응답의 applied_filters.time_range 가 all, is_relaxed True | `query_chat` | ASGI, `generate_live_answer` patch (item 201 필요) |
| test_chat_stream_sources_event_includes_focus_filter_metadata | sources 이벤트에 applied_filters·is_relaxed | `stream_chat` | ASGI, `check_provider_available`·`stream_tokens` patch |
| test_chat_service_fallback_function_completely_removed | `ChatService` 에 `_generate_fallback_answer` 가 없다 | `ChatService` | 없음 |
| test_chat_stream_llm_provider_unavailable_returns_503 | 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | `api/chat.py:349,377` | ASGI, `check_provider_available` patch (예외) |
| test_chat_stream_llm_upstream_failed_returns_502 | 502 `ERR_LLM_UPSTREAM_FAILED` | `api/chat.py:386` | 같음 |
| test_chat_stream_llm_quota_exceeded_returns_429 | 429 `ERR_LLM_QUOTA_EXCEEDED` | `api/chat.py:395` | 같음 |
| test_chat_stream_midstream_failure_yields_sse_error_event | 토큰 뒤 예외면 `event: error` `ERR_LLM_STREAM_FAILED`, sources·done 없음 | `chat_service.py:759-769` | ASGI, `check_provider_available`·`stream_tokens` patch |
| test_chat_query_llm_provider_unavailable_returns_503 | query 에서 503 | `api/chat.py:239` | ASGI, `generate_live_answer` patch (예외) |
| test_chat_query_llm_upstream_failed_returns_502 | query 에서 502 | `api/chat.py:248` | 같음 |

#### backend/tests/test_chat_sessions.py (18)
fixture `cleanup_chat_sessions`(autouse): 테스트 전 `chat_messages`, `chat_sessions` 를 모두 지운다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_get_sessions_empty | 세션이 없으면 빈 리스트 200 | `api/chat.py` `list_chat_sessions` | ASGI |
| test_get_sessions_list_and_ordering | updated_at 내림차순 정렬과 limit/offset | 같음 | ASGI |
| test_create_session_defaults | 기본 제목 "새 대화", global, UUID, 빈 messages, 201 | `create_or_upsert_chat_session` | ASGI |
| test_create_session_explicit_uuid_and_fields | 지정한 UUID·제목·scope·source 로 만든다 | 같음 | ASGI |
| test_create_session_invalid_uuid | 잘못된 UUID 400 | 같음 | ASGI |
| test_upsert_existing_session | 같은 ID 면 메타데이터를 갱신한다 | 같음 | ASGI |
| test_get_session_detail_success | 상세에 active_source 가 채워지고 messages 리스트가 있다 | `get_chat_session_detail` | ASGI |
| test_get_session_detail_not_found | 404 `ERR_SESSION_NOT_FOUND` | 같음 | ASGI |
| test_delete_session_and_cascade_messages | 세션 삭제 시 메시지도 지운다 | `delete_chat_session` | ASGI |
| test_delete_session_not_found | 404 `ERR_SESSION_NOT_FOUND` | 같음 | ASGI |
| test_fifo_30_retention_eviction | 31번째 생성 시 가장 오래된 세션을 지우고 30개를 유지한다 | `ChatSessionService` FIFO | ASGI |
| test_chat_stream_auto_persists_turn_and_auto_titles | 스트림 완료 후 user/assistant 메시지를 저장하고 질문 앞 30자로 자동 제목을 붙인다 | `chat_stream`, `persist_turn` | ASGI, `check_provider_available`·`stream_tokens` patch, **실호출** (item 1 URL 스크랩) |
| test_generate_auto_title_rules | 마크다운·HTML 제거, 공백은 "새 대화", 30자 초과는 "..." | `chat_session_service.generate_auto_title` | 없음 |
| test_create_session_with_initial_messages | 요청 본문의 초기 메시지를 저장한다 | `create_or_upsert_chat_session` | ASGI |
| test_chat_session_service_append_single_message | `append_message_and_update_session` 단위 동작 | `ChatSessionService` | 없음 |
| test_api_session_error_handling_branches | 서비스 예외 시 500 응답 | `api/chat.py` 세션 엔드포인트 | ASGI, `ChatSessionService` 메서드 patch (예외) |
| test_chat_session_service_direct_unit | create/list/detail/delete/fifo 직접 호출 | `ChatSessionService` | 없음 |
| test_chat_session_service_json_fallbacks_and_upsert_branches | 깨진 JSON 은 None 으로 대체, 전체 필드 upsert, `enforce_fifo_retention(max_limit=0)` | `ChatSessionService` | 없음 |

#### backend/tests/test_collectors.py (8)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_harness_classification | SWE-bench 제목을 harness 로 분류하고 점수 > 0 | `collectors/categorizer.py` `classify_and_tag` | 없음 |
| test_mcp_classification | MCP 제목을 mcp_plugins_skills 로 분류 | `classify_and_tag` | 없음 |
| test_agent_tech_classification | LangGraph 제목을 agent_tech 로 분류 | `classify_and_tag` | 없음 |
| test_ai_news_classification | DeepSeek-R1 제목을 ai_news 로 분류 | `classify_and_tag` | 없음 |
| test_dedup_hash_stability | utm 파라미터가 달라도 같은 dedup 해시 | `compute_dedup_hash` | 없음 |
| test_hotness_decay | 1시간 전 글이 48시간 전 글보다 hotness 가 높다 | `calculate_hotness` | 없음 |
| test_unrelated_noise_rejection | GeekNews 비 AI 제목 5개가 unrelated, 점수 0 | `is_strictly_ai_related`, `classify_and_tag` | 없음 |
| test_evaluate_content_with_llm_strict_gate | 비 AI 글은 pre-filter 로 거절, AI 글은 통과(quality ≥ 7.0) | `llm_processor.evaluate_content_with_llm` | **실호출** (두 번째 호출, 키 있으면) |

#### backend/tests/test_config_and_live_llm.py (3)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_config_json_found_and_loaded | config.json 을 찾고 PROJECT_NAME, VERSION(허용 목록), 스케줄, 품질 임계값(5.0, 7.0)을 읽는다 | `config.py` `find_config_json`, `Settings` | 없음 |
| test_get_custom_json_value | 임의 섹션 값 조회와 기본값 | `Settings.get_custom_json_value` | 없음 |
| test_llm_processor_fallback_and_answer | `answer_question` 이 20자 넘는 문자열을 돌려준다 | `llm_processor.answer_question` | **실호출** (키 있으면, 캐시 상태에 따라 다름) |

#### backend/tests/test_deep_researcher.py (4)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_probe_and_discover_feed_github | GitHub 저장소 URL 에서 releases.atom 피드를 찾아 항목을 읽는다 | `services/deep_researcher.py` `probe_and_discover_feed` | **실호출** (github.com) |
| test_evaluate_and_decide_scoring | 하네스 관련 피드를 AUTO_ADOPTED 또는 WATCHLIST, 점수 ≥ 7.5 로 판정한다 | `evaluate_and_decide` | 없음 (sources.json 읽기, 휴리스틱) |
| test_deep_research_run_and_audit | 후보 2개를 평가하고 `SourceResearchLog` 감사 로그를 남긴다 | `run_deep_research` | **실호출** (시드 사이트 2곳), sources.json 쓰기 가능 |
| test_deep_research_api_endpoints | `/api/research/status`, `/audit-logs`, `POST /run-deep` 응답 형식 | `api/research.py` | ASGI, run-deep 는 백그라운드 태스크로 실호출 시작 |

#### backend/tests/test_dynamic_rag_retrieval.py (10)
fixture `seed_distinct_rag_articles`(autouse): id 9001~9005(Claude, MCP 스펙, SWE-bench, WinDbg MCP, 일반 아키텍처)를 넣거나 덮어쓴다. teardown 없음.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_dynamic_rag_retrieval_returns_distinct_articles_by_query | Claude/MCP/Benchmark 질의의 상위 결과가 서로 다르고 주제어를 포함한다 | `SqliteFtsRetriever.retrieve`, `_ensure_fts_table` | 없음 |
| test_conversational_queries_extract_keywords_and_return_distinct_articles | 한국어 불용어가 섞인 질의도 주제별로 다른 결과를 준다 | `retrieve` | 없음 |
| test_ensure_fts_table_creates_table_and_indexes_items | `news_fts` 가상 테이블이 있고 건수가 news_items 이상이다 | `_ensure_fts_table` | 없음 |
| test_sql_like_fallback_ranks_by_relevance_when_fts_fails | FTS 질의가 실패하면 LIKE 대체 검색이 주제별 결과를 준다 | `retrieve` | `_sanitize_fts_query` patch |
| test_gemini_call_restored_and_invokes_specified_model | `_call_gemini` 가 지정 모델 URL·키로 POST 하고 응답을 파싱한다 | `llm_processor._call_gemini` | `httpx.AsyncClient` 클래스 patch |
| test_generate_live_answer_honestly_routes_to_gemini_when_requested | gemini 모델 요청이면 `_call_gemini` 를 1회 부른다 | `generate_live_answer` | `settings.GEMINI_API_KEY`, `_call_gemini` patch |
| test_version_0_2_2_consistency | `settings.VERSION` 과 config.json `app.version` 이 0.3.1 | `config.py` | 없음 |
| test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k | "WinDbg MCP 서버" 는 9004 한 건만 돌려준다 | `retrieve` | 없음 |
| test_dynamic_retrieval_returns_empty_when_no_relevant_articles_exist | 무관한 질의는 0건 | `retrieve` | 없음 |
| test_chat_service_global_rag_returns_dynamic_source_count | `_resolve_sources` 가 1건/0건을 그대로 돌려준다 | `ChatService._resolve_sources` | 없음 |

#### backend/tests/test_llm_processor.py (13)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_extract_tech_stack | 텍스트에서 Claude 3.7, DeepSeek-R1, SWE-bench, LangGraph, FastMCP 를 뽑는다 | `extract_tech_stack` | 없음 |
| test_evaluate_quality_and_signal | 하네스 글은 quality ≥ 7.0 통과, 스팸은 5.0 미만 거절 | `evaluate_quality_and_signal` | 없음 |
| test_generate_synthesis | TL;DR 2개 이상, why_it_matters, tech_stack 에 MCP | `generate_synthesis` | 없음 |
| test_answer_question | `answer_question` 이 20자 넘는 문자열 | `answer_question` | **실호출** (키 있으면), 없으면 휴리스틱 |
| test_base_llm_provider_interface | `BaseLLMProvider` 가 추상이고 4개 추상 메서드를 가진다 | `llm_providers/base.py` | 없음 |
| test_unit_test_mock_provider | 테스트 안에 정의한 mock 프로바이더가 동작한다 (제품 코드 검증 아님) | 테스트 파일 내부 클래스 | 없음 |
| test_check_provider_available_production_gate | 프로바이더가 없으면 `LLMProviderUnavailableException` | `check_provider_available` | `has_live_provider` patch |
| test_generate_live_answer_fails_fast_without_mock_fallback | 모든 프로바이더 실패 시 `LLMUpstreamException` | `generate_live_answer` | `has_live_provider`·`is_available`·`_call_openai`·`_call_ollama` patch |
| test_stream_tokens_fails_fast_without_mock_fallback | 모든 프로바이더 실패 시 `stream_tokens` 가 `LLMUpstreamException` | `stream_tokens` | `has_live_provider`·`is_available`·`openai_key`·`ollama_url` patch, 로컬 Ollama 스트림 시도 가능 |
| test_chat_stream_end_to_end_with_mocked_llm | `/api/chat/stream` 이 sources·token·done 과 모델명을 낸다 | `chat_stream` | ASGI, `stream_tokens` patch, `check_provider_available` 은 실제 (키 없으면 로컬 Ollama 탐침) |
| test_chat_query_end_to_end_with_mocked_llm | `/api/chat/query` 가 mock 답과 모델명을 돌려준다 | `chat_query` | ASGI, `generate_live_answer` patch |
| test_scoped_chat_stream_end_to_end_with_mocked_llm | scoped 스트림이 status·sources·token·done 을 내고 mock fallback 문구가 없다 (item 999 를 만들고 finally 에서 지운다) | `chat_stream` (scoped) | ASGI, `stream_tokens` patch, **실호출** (`https://example.com/isolated-scoped-benchmark` 스크랩) |
| test_mock_llm_provider_removed_from_app_services | `llm_providers.mock_provider` import 가 실패한다 | 모듈 존재 여부 | 없음 |

#### backend/tests/test_reset_and_delete.py (2)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_reset_and_collect_endpoint | `POST /api/schedule/reset-and-collect` 가 started/already_running 과 deleted_count 를 돌려준다 (테스트 DB 의 뉴스·크롤 로그를 모두 지운다) | `api/schedule.py:69-99` | ASGI, `collector_manager.collect_all` monkeypatch |
| test_delete_all_news_endpoint | `DELETE /api/news/all` 이 success 와 deleted_count | `api/news.py:96` | ASGI |

#### backend/tests/test_scheduler.py (1)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_scheduled_hours | `SCHEDULED_HOURS == [0, 6, 12, 18]` | `app/scheduler.py` 상수 | 없음 |

#### backend/tests/test_scoped_chat_grounding.py (6)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_version_is_0_2_2 | `settings.VERSION == "0.3.1"` | `config.py` | 없음 |
| test_mock_llm_provider_removed_from_production | `mock_provider` import 실패 | 모듈 존재 여부 | 없음 |
| test_anthropic_payload_omits_temperature | Anthropic 요청 payload 에 temperature 가 없다 (동기 테스트 안에서 `asyncio.run`) | `generate_text_with_usage` | `httpx.AsyncClient.post` patch |
| test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback | scoped 프롬프트에 기사 제목·요약·본문·질문이 들어가고 응답에 mock 문구가 없다 | `ChatService.stream_chat`, `_build_grounding_prompt` | DB 세션 AsyncMock, `get_article_content`·`persist_turn`·`stream_tokens` mock |
| test_sanitize_model_identifier_preserves_historical_models | Gemini/OpenAI/Claude 모델명 보존, 빈 값은 기본 모델 | `sanitize_model_identifier` | 없음 |
| test_no_mock_fallback_on_provider_absence | 프로바이더가 없으면 check/generate/stream 모두 `LLMProviderUnavailableException` | `check_provider_available`, `generate_live_answer`, `stream_tokens` | `has_live_provider` patch |

#### backend/tests/test_sources_and_research.py (6)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_sources_service_load | sources 에 rss_feeds, github_sources, reddit_sources 가 있고 RSS 가 10개 이상 | `services/sources_service.py` `get_all_sources` | 없음 (파일 읽기) |
| test_sources_service_active_feeds | 활성 피드는 모두 enabled | `get_active_rss_feeds` | 없음 |
| test_sources_toggle_and_crud | RSS 추가 → 토글(비활성) → 삭제 | `add_rss_source`, `toggle_source`, `delete_source` | 없음, sources.json 을 실제로 쓴다 |
| test_source_researcher_discover | "harness" 질의로 후보를 찾고 첫 후보 점수 ≥ 7.0 | `services/source_researcher.py` `discover_sources` | 없음 (메모리 카탈로그) |
| test_source_researcher_inspect_url | GitHub 저장소 URL 에서 releases.atom 피드를 찾는다 | `inspect_url` | **실호출** (github.com) |
| test_sources_and_research_api_endpoints | `GET /api/sources` 통계, `POST /api/research/discover`, `POST /api/research/register-candidate` 성공 후 정리 | `api/sources.py`, `api/research.py` | ASGI, sources.json 을 실제로 쓰고 지운다 |

#### backend/tests/test_trends_and_webhook.py (5)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_classify_tag_category | 태그 4개를 레이더 카테고리로 분류 | `services/trend_service.py` `classify_tag_category` | 없음 |
| test_webhook_provider_detection | URL 로 slack/discord/generic 판별 | `services/webhook_service.py` `detect_provider` | 없음 |
| test_webhook_payload_generation | slack 은 blocks, discord 는 embeds, 브리핑 slack payload 에 blocks | `build_test_payload`, `build_briefing_payload` | 없음 |
| test_trends_radar_endpoint | `GET /api/trends/radar` 에 total_analyzed, surging_tags, categories, tags | `api/trends.py`, `trend_service.get_tech_radar` | ASGI |
| test_webhook_invalid_url | http 로 시작하지 않는 URL 은 400 | `api/webhook.py:20-22` | ASGI |

### frontend

#### frontend/src/tests/setup.ts
vitest 설정(`frontend/vitest.config.ts`: jsdom, globals, `setupFiles: ['./src/tests/setup.ts']`)이 모든 테스트 파일 앞에 읽는다.

| 항목 | 동작 |
|---|---|
| `@testing-library/jest-dom/vitest` | DOM 매처를 등록한다 |
| `HTMLElement.prototype.scrollIntoView` | jsdom 에 없는 메서드를 빈 함수로 채운다 |
| `vi.mock('next/navigation')` | `useRouter`(push/replace/prefetch/back), `useSearchParams().get → null`, `usePathname → ''` 를 기본 mock 으로 둔다. 여러 테스트 파일이 자체 mock 으로 덮어쓴다 |
| `vi.mock('next/font/google')` | Geist, Geist_Mono 를 CSS 변수 객체로 바꾼다 |
| MSW `server` | `beforeAll` 에서 `server.listen({ onUnhandledRequest: 'bypass' })`, `afterEach` 에서 `resetHandlers`, `afterAll` 에서 `close`. 핸들러는 `frontend/src/mocks/handlers.ts` (+ `mocks/handlers/chat.ts`)의 `*/api/...` 경로다. 핸들러가 없는 요청은 실제 네트워크로 그대로 나간다 (`setup.ts:27`) |

frontend 공통: 아래 표에서 "없음" 은 콜백을 `vi.fn()` 으로 넘기는 것 말고는 mock 이 없다는 뜻이다. setup.ts 의 전역 mock 은 항상 켜져 있다.

#### frontend/src/tests/AskAiPanel.test.tsx (3) — 대상 `components/news-detail/AskAiPanel.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders quick prompts and placeholder when chat history is empty | 대화 기록이 없으면 빠른 질문 프롬프트와 placeholder 를 보여준다 | AskAiPanel | 없음 |
| triggers onAsk with prompt text when quick prompt pill is clicked | 빠른 질문 pill 클릭 시 그 문구로 onAsk 를 부른다 | AskAiPanel | 없음 |
| renders chat messages correctly when chat history exists | 대화 기록이 있으면 메시지를 보여준다 | AskAiPanel | 없음 |

#### frontend/src/tests/chat/ActiveSourceChip.test.tsx (4) — 대상 `components/chat/ActiveSourceChip.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders category and title accurately | 카테고리와 제목을 보여준다 | ActiveSourceChip | fixture `mocks/fixtures/chat.ts` |
| calls onRemove when the remove button is clicked | 제거 버튼 클릭 시 onRemove | ActiveSourceChip | 없음 |
| does not trigger onRemove when disabled | disabled 면 onRemove 를 부르지 않는다 | ActiveSourceChip | 없음 |
| calls onPreviewClick when title or preview button is clicked | 제목·미리보기 클릭 시 onPreviewClick | ActiveSourceChip | 없음 |

#### frontend/src/tests/chat/ChatHeader.test.tsx (7) — 대상 `components/chat/ChatHeader.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders navigation back link to feed and brand title | 피드로 돌아가는 링크와 브랜드 제목 | ChatHeader | 없음 |
| renders scope segmented controls and calls onScopeChange | scope 세그먼트 컨트롤과 onScopeChange 호출 | ChatHeader | 없음 |
| renders ActiveSourceChip when activeSource is provided | activeSource 가 있으면 칩을 보여준다 | ChatHeader, ActiveSourceChip | fixture |
| calls onNewChat when 새 대화 button is clicked | "새 대화" 클릭 시 onNewChat | ChatHeader | 없음 |
| disables new chat button when streaming | 스트리밍 중 새 대화 버튼 비활성 | ChatHeader | 없음 |
| renders ChatModelSelector in header when selectedTier and onSelectTier are provided | 티어 props 가 있으면 모델 선택기를 보여준다 | ChatHeader, ChatModelSelector | 없음 |
| disables ChatModelSelector in header when isStreaming is true | 스트리밍 중 모델 선택기 비활성 | ChatHeader, ChatModelSelector | 없음 |

#### frontend/src/tests/chat/ChatHistoryDrawer.test.tsx (10) — 대상 `components/chat/ChatHistoryDrawer.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| does not render when isOpen is false | 닫힘 상태면 렌더링하지 않는다 | ChatHistoryDrawer | 없음 |
| renders drawer with navigation role and title when isOpen is true | 열림 상태에서 navigation role 과 제목 | ChatHistoryDrawer | 없음 |
| calls onClose when backdrop or close button is clicked | 배경·닫기 버튼 클릭 시 onClose | ChatHistoryDrawer | 없음 |
| calls onClose when Escape key is pressed | Escape 키로 onClose | ChatHistoryDrawer | 없음 |
| calls onNewChat and onClose when + 새 대화 button is clicked | "+ 새 대화" 클릭 시 onNewChat, onClose | ChatHistoryDrawer | 없음 |
| calls onSelectSession and onClose when a session card is clicked | 세션 카드 클릭 시 onSelectSession, onClose | ChatHistoryDrawer | 없음 |
| renders Loading State with skeletons when isLoading is true | 로딩 스켈레톤 | ChatHistoryDrawer | 없음 |
| renders Error State with retry button when error is present | 오류 상태와 재시도 버튼 | ChatHistoryDrawer | 없음 |
| renders Empty State when sessions array is empty | 빈 상태 | ChatHistoryDrawer | 없음 |
| triggers delete session confirmation popover and calls onDeleteSession | 삭제 확인 팝오버 후 onDeleteSession | ChatHistoryDrawer, DeleteConfirmPopover | 없음 |

#### frontend/src/tests/chat/ChatMessageItem.test.tsx (15) — 대상 `components/chat/ChatMessageItem.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders user message bubble cleanly | 사용자 메시지 말풍선 | ChatMessageItem | 없음 |
| faithfully preserves and renders legacy gemini model_used without distortion | 과거 Gemini 모델명을 바꾸지 않고 보여준다 | ChatMessageItem | 없음 |
| formats Haiku and Opus model names without exposing raw model IDs | Haiku/Opus 표시명을 쓰고 원시 모델 ID 를 숨긴다 | ChatMessageItem | 없음 |
| handles copy action when copy button is clicked | 복사 버튼이 본문을 클립보드에 쓴다 | ChatMessageItem | `navigator.clipboard` mock |
| renders ExportToolbar with 4-step report actions for completed assistant message | 완료된 답변에 ExportToolbar | ChatMessageItem, ExportToolbar | 없음 |
| renders error state with retry button and calls onRetry | 오류 상태와 재시도 시 onRetry | ChatMessageItem | 없음 |
| renders auto-relaxation guidance badge when is_relaxed is true | is_relaxed 면 완화 안내 배지 | ChatMessageItem | 없음 |
| renders dual citations [1] and [S1] appropriately in assistant message | [1], [S1] 인용 배지 | ChatMessageItem, CitationBadge | 없음 |
| renders WorkflowStepTracker in assistant message when step_history or current_status is present | 단계 정보가 있으면 WorkflowStepTracker | ChatMessageItem, WorkflowStepTracker | 없음 |
| renders ultra-long unspaced text with break-words, [overflow-wrap:anywhere], and flex-1 min-w-0 max-w-full bubble | 공백 없는 긴 텍스트 줄바꿈 클래스 | ChatMessageItem | 없음 |
| renders long inline code with break-all, font-mono, and border styling | 긴 인라인 코드 스타일 | ChatMessageItem | 없음 |
| renders markdown table wrapped in an isolated horizontal scroll wrapper | 표를 가로 스크롤 래퍼로 감싼다 | ChatMessageItem | 없음 |
| renders headings h1-h3, li, and blockquote with [overflow-wrap:anywhere] and break-words | 제목·목록·인용 줄바꿈 클래스 | ChatMessageItem | 없음 |
| accurately displays true backend source counts (e.g., 1 or 3) and never hardcodes 5 items | 실제 출처 개수(1, 3)를 보여주고 5 고정값이 없다 | ChatMessageItem | 없음 |
| hides source count badges while streaming (even with non-empty content and sources) and shows them only when status === "completed" | 스트리밍 중 출처 개수 배지를 숨기고 완료 시에만 보여준다 | ChatMessageItem | 없음 |

#### frontend/src/tests/chat/ChatMessageList.test.tsx (3) — 대상 `components/chat/ChatMessageList.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders Welcome Empty View with 4 suggestion prompt pills when messages array is empty | 메시지가 없으면 환영 화면과 제안 4개 | ChatMessageList | 없음 |
| renders accessible message list with role log and aria-live | role=log, aria-live 목록 | ChatMessageList | 없음 |
| enforces overflow-x-hidden, w-full, and max-w-full on message list container | 가로 넘침 방지 클래스 | ChatMessageList | 없음 |

#### frontend/src/tests/chat/ChatModelSelector.test.tsx (15) — 대상 `components/chat/ChatModelSelector.tsx`, `ModelChangeDivider.tsx`, `ModelTierBadge.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders inline chip trigger with default Sonnet 5.5 tier and icon | 기본 Sonnet 5.5 칩 트리거 | ChatModelSelector | 없음 |
| opens popover on click and renders all 3 Claude tiers with WAI-ARIA radiogroup | 클릭 시 radiogroup 팝오버에 3개 티어 | ChatModelSelector | 없음 |
| calls onSelectTier when user selects a different tier and closes popover | 다른 티어 선택 시 onSelectTier 후 닫힌다 | ChatModelSelector | 없음 |
| supports keyboard navigation: ArrowDown / ArrowUp cyclic focus and Enter selection | 화살표 순환 포커스와 Enter 선택 | ChatModelSelector | 없음 |
| closes popover on Escape key press and returns focus to trigger | Escape 로 닫고 트리거로 포커스 복귀 | ChatModelSelector | 없음 |
| disables trigger and prevents popover open when isStreaming is true | 스트리밍 중 비활성, 팝오버 안 열림 | ChatModelSelector | 없음 |
| renders header-compact variant appropriately | header-compact 변형 | ChatModelSelector | 없음 |
| renders header-chip variant appropriately and positions popover downwards | header-chip 변형과 아래쪽 팝오버 | ChatModelSelector | 없음 |
| honors forceOpen prop | forceOpen 이면 열린 상태 | ChatModelSelector | 없음 |
| renders separator with accessible role and concise model change label | 모델 변경 구분선 role 과 라벨 | ModelChangeDivider | 없음 |
| renders custom contextNotice when provided | contextNotice 표시 | ModelChangeDivider | 없음 |
| renders chip variant with tier icon, name, and relative cost | 칩 변형의 아이콘·이름·상대 비용 | ModelTierBadge | 없음 |
| renders footer variant with latency in milliseconds | footer 변형의 지연시간(ms) | ModelTierBadge | 없음 |
| renders recommendation tag when showRecommended is true for Sonnet | Sonnet 추천 태그 | ModelTierBadge | 없음 |
| can hide icon when showIcon is false | showIcon=false 면 아이콘 숨김 | ModelTierBadge | 없음 |

#### frontend/src/tests/chat/ChatPromptInput.test.tsx (7) — 대상 `components/chat/ChatPromptInput.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders textarea with accessible role and placeholder | 접근 가능한 textarea 와 placeholder | ChatPromptInput | 없음 |
| triggers onChange when typing | 입력 시 onChange | ChatPromptInput | 없음 |
| calls onSubmit on Enter key (when not composing and not shift) | Enter 로 onSubmit | ChatPromptInput | 없음 |
| does NOT call onSubmit when Shift+Enter is pressed | Shift+Enter 는 제출하지 않는다 | ChatPromptInput | 없음 |
| does NOT call onSubmit when IME is composing | IME 조합 중 Enter 는 제출하지 않는다 | ChatPromptInput | 이벤트 `isComposing` 속성 지정 |
| renders Stop generating button when isStreaming is true and calls onStopGenerating | 스트리밍 중 중지 버튼과 onStopGenerating | ChatPromptInput | 없음 |
| displays character counter and highlights warning when length exceeds maxLength | 글자 수 표시와 초과 경고 | ChatPromptInput | 없음 |

#### frontend/src/tests/chat/ChatSessionWorkflow.test.tsx (5) — 대상 `components/chat/ChatWorkspace.tsx`, `useChatSessions.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders initial clean slate and generates new session UUID without auto-loading past session | 처음엔 빈 화면, 새 세션 UUID, 과거 세션 자동 로드 없음 | ChatWorkspace | MSW 세션 핸들러, `resetMockSessionStore`, next/navigation mock, localStorage 초기화 |
| hydrates full 4-pillar context (messages, scopeMode, activeSource) when selecting a past session | 과거 세션 선택 시 메시지·scope·출처 복원 | ChatWorkspace, useChatSessions | 같음 |
| allows continuous multi-turn chat after session hydration | 복원 후 연속 대화 | ChatWorkspace | 같음 (MSW 스트림) |
| resets to new session and empty state when "+ 새 대화" is clicked | "+ 새 대화" 로 새 세션·빈 상태 | ChatWorkspace | 같음 |
| deletes a session via DELETE API and resets active conversation if deleted session was active | DELETE 후 활성 세션이면 대화 초기화 | ChatWorkspace, useChatSessions | 같음 |

#### frontend/src/tests/chat/ChatSidebar.test.tsx (10) — 대상 `components/chat/ChatSidebar.tsx`, `ChatHistoryDrawer.tsx`, `SessionItemCard.tsx`, `DeleteConfirmPopover.tsx`, `SessionList.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders desktop navigation panel with header, + 새 대화 button, search input, and session items | 데스크톱 패널의 헤더·새 대화·검색·세션 목록 | ChatSidebar | 없음 |
| filters session items based on searchQuery | 검색어로 세션 필터 | ChatSidebar, SessionList | 없음 |
| renders skeleton loading state when isLoading is true | 로딩 스켈레톤 | ChatSidebar | 없음 |
| renders error state and triggers retry when load fails | 오류 상태와 재시도 | ChatSidebar | 없음 |
| renders empty state when there are no saved sessions | 빈 상태 | ChatSidebar | 없음 |
| renders mobile slide-over drawer with backdrop and close button when isOpen is true | 모바일 드로어의 배경·닫기 버튼 | ChatHistoryDrawer | 없음 |
| calls onClose when backdrop is clicked or Escape key is pressed | 배경 클릭·Escape 로 onClose | ChatHistoryDrawer | 없음 |
| renders active session highlight with border-l-indigo-600 and bg-indigo-50 | 활성 세션 강조 클래스 | SessionItemCard | 없음 |
| renders truncated title, relative time, and scope badge | 잘린 제목·상대 시간·scope 배지 | SessionItemCard | 없음 |
| opens delete confirmation popover on delete click, cancels on 취소, and executes onDelete on 삭제 | 삭제 팝오버의 취소/삭제 | SessionItemCard, DeleteConfirmPopover | 없음 |

#### frontend/src/tests/chat/ChatWorkspace.test.tsx (18) — 대상 `components/chat/ChatWorkspace.tsx`
공통 mock: 파일 자체 `vi.mock('next/navigation')`(`useSearchParams().get` 을 `mockGet` 으로), `beforeEach` 에서 localStorage 초기화, 네트워크는 MSW 채팅 핸들러(`mocks/handlers/chat.ts`)가 받는다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders initial empty workspace with welcome view when no search params | 검색 파라미터가 없으면 환영 화면과 입력창 | ChatWorkspace | 공통 |
| fetches source metadata and switches to scoped mode when sourceId is present in searchParams | sourceId 가 있으면 출처를 불러와 scoped 로 바뀐다 | ChatWorkspace | 공통 (MSW `GET /api/chat/sources/:id`) |
| handles 404 for invalid sourceId by showing warning and falling back to global mode | 없는 sourceId 면 경고 후 global | ChatWorkspace | 공통 |
| sends question, streams response via MSW, and renders assistant answer | 질문 전송, 스트림 수신, 답 표시 | ChatWorkspace | 공통 (MSW `POST /api/chat/stream`) |
| allows user to stop streaming and preserves partial answer | 중지 시 부분 답 유지 | ChatWorkspace | 공통 |
| resets conversation when 새 대화 button is clicked | 새 대화로 초기화 | ChatWorkspace | 공통 |
| renders FocusCapsule and opens FocusBottomSheet when clicked | 포커스 캡슐 클릭 시 바텀시트 | ChatWorkspace, FocusCapsule, FocusBottomSheet | 공통 |
| sends filters payload and displays auto-relaxation banner when is_relaxed is true | 필터 payload 전송, 완화 배너 | ChatWorkspace | 공통 |
| displays clear error card and retry button on LLM 502 failure, and clicking retry re-sends question | 502 오류 카드와 재시도 재전송 | ChatWorkspace | 공통 (MSW 오류 트리거) |
| displays clear error card and retry button on LLM 503 provider unavailable | 503 오류 카드 | ChatWorkspace | 공통 |
| displays error card and retry button when mid-stream SSE error occurs | 스트림 중 error 이벤트 처리 | ChatWorkspace | 공통 |
| receives SSE status events, renders WorkflowStepTracker and dual citations upon completion | status 이벤트로 단계 표시, 완료 후 인용 | ChatWorkspace, WorkflowStepTracker | 공통 |
| switches Claude model mid-session and renders ModelChangeDivider in timeline | 세션 중 모델 변경 구분선 | ChatWorkspace, ModelChangeDivider | 공통 |
| synchronizes selectedTier bidirectionally between ChatHeader and ChatPromptInput with 0ms delay (REQ-UI-008, POL-UI-006) | 헤더와 입력창의 티어 동기화 | ChatWorkspace | 공통 |
| correctly sends scope: scoped and source_id when article is focused, and renders customized response | scoped 요청 본문과 맞춤 응답 | ChatWorkspace | 공통 |
| dynamically displays question-specific sources chip and inline citations for global mode questions (v0.2.2) | global 질문별 출처 칩과 인용 | ChatWorkspace | 공통 |
| does not display fake hardcoded 5-count badge upon entering chat, and reflects true backend sources | 5 고정 배지 없음, 실제 출처 수 | ChatWorkspace | 공통 |
| flushes remaining decoder bytes and processes trailing SSE event block in buffer when stream ends without trailing double newline | 마지막 SSE 블록이 `\n\n` 없이 끝나고 UTF-8 이 청크 사이에서 갈려도 남은 버퍼를 처리한다 | ChatWorkspace SSE 파서 | `vi.spyOn(globalThis, 'fetch')` 로 ReadableStream 응답 |

#### frontend/src/tests/chat/CitationBadge.test.tsx (6) — 대상 `components/chat/CitationBadge.tsx`, `CitationPopover.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders inline interactive badge with accessible ARIA attributes when source is provided | 출처가 있으면 ARIA 속성이 있는 배지 | CitationBadge | fixture |
| renders non-interactive fallback span for phantom citation when source is undefined | 출처가 없으면 비대화형 span | CitationBadge | 없음 |
| opens CitationPopover dialog on click or hover and displays source details | 클릭·hover 로 팝오버와 출처 상세 | CitationBadge, CitationPopover | fixture |
| closes CitationPopover when Escape key is pressed | Escape 로 팝오버 닫기 | CitationPopover | fixture |
| visually differentiates supplementary citation [S1] with emerald styling and web search label | [S1] 보조 인용 스타일과 웹 검색 라벨 | CitationBadge | 없음 |
| renders supplementary web metadata (domain, query, snippet) in CitationPopover for [S1] | [S1] 팝오버의 도메인·질의·스니펫 | CitationPopover | 없음 |

#### frontend/src/tests/chat/ContractAndMsw.test.ts (72)
`beforeEach` 에서 `resetMockSessionStore()`. 스키마·헬퍼 테스트의 대상은 `frontend/src/types/chat.ts`, `frontend/src/types/news.ts` 이고 mock 이 없다. "MSW" 표기 테스트는 상대 경로 `fetch` 로 `frontend/src/mocks/handlers.ts`, `mocks/handlers/chat.ts` 의 핸들러 자체를 검증한다 (backend 를 부르지 않는다).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| applies standard defaults when empty object is passed | 빈 객체에 포커스 필터 기본값 | `ChatFocusFilterSchema` | 없음 |
| validates proper category, time_range, sort, and high_signal_only | 필터 필드 검증 | `ChatFocusFilterSchema` | 없음 |
| converts between UI camelCase FocusFilters and API snake_case ChatFocusFilter | camelCase ↔ snake_case 변환 | `toChatFocusFilter`, `fromChatFocusFilter` | 없음 |
| validates all 7 agentic & ReAct workflow step enum values | 단계 enum 7개 | `ChatStatusStepSchema` | 없음 |
| validates ChatStatusPayload schema with optional query and progress | status payload 의 선택 필드 | `ChatStatusPayloadSchema` | 없음 |
| validates primary source with numeric index | 숫자 index primary 출처 | `ChatSourceItemSchema` | 없음 |
| validates supplementary source with string index like S1 | "S1" index 보조 출처 | `ChatSourceItemSchema` | 없음 |
| validates ChatSourcesPayload with dual sources and counts | 이중 출처와 개수 | `ChatSourcesPayloadSchema` | 없음 |
| correctly parses event: status | SSE status 파싱 | `parseChatSseEvent` | 없음 |
| correctly parses event: sources | SSE sources 파싱 | `parseChatSseEvent` | 없음 |
| returns null for unparseable or unknown events | 알 수 없는 이벤트는 null | `parseChatSseEvent` | 없음 |
| validates standard LLM error codes | LLM 오류 코드 enum | `LlmErrorCodeSchema` | 없음 |
| validates LlmErrorResponse schema for upstream errors (502 / 503) | 502/503 오류 응답 | `LlmErrorResponseSchema` | 없음 |
| handles POST /api/chat/stream 502 error trigger | 502 트리거 응답 | `mocks/handlers/chat.ts` | MSW |
| handles POST /api/chat/stream 503 error trigger | 503 트리거 응답 | 같음 | MSW |
| handles POST /api/chat/query with filters and returns dual sources | 필터 query 의 이중 출처 | 같음 | MSW |
| handles GET /api/chat/search with category and high_signal_only filters | 검색 필터 | 같음 | MSW |
| validates ChatSessionSummarySchema correctly | 세션 요약 스키마 | `ChatSessionSummarySchema` | 없음 |
| rejects invalid UUID in ChatSessionSummarySchema | 잘못된 UUID 거부 | 같음 | 없음 |
| validates ChatMessageItemSchema and coerces numeric id to string | 숫자 id 를 문자열로 | `ChatMessageItemSchema` | 없음 |
| validates ChatSessionDetailSchema with full message history | 세션 상세와 메시지 이력 | `ChatSessionDetailSchema` | 없음 |
| validates ChatSessionCreateRequestSchema with defaults | 세션 생성 요청 기본값 | `ChatSessionCreateRequestSchema` | 없음 |
| validates GenericSuccessResponseSchema | 일반 성공 응답 | `GenericSuccessResponseSchema` | 없음 |
| generateAutoTitle correctly trims markdown and limits to 30 characters | 자동 제목의 마크다운 제거·30자 제한 | `generateAutoTitle` | 없음 |
| applySlidingWindow correctly limits turns to 10 and respects token heuristic | 대화 10턴·토큰 휴리스틱 제한 | `applySlidingWindow` | 없음 |
| converts bidirectionally between ChatMessageItem and UI ChatMessage | API 메시지 ↔ UI 메시지 변환 | `chatMessageItemToUiMessage`, `uiMessageToChatMessageItem` | 없음 |
| handles GET /api/chat/sessions (200 OK) sorted by updated_at DESC | 세션 목록 정렬 | `mocks/handlers/chat.ts` | MSW |
| handles GET /api/chat/sessions 500 error trigger | 목록 500 트리거 | 같음 | MSW |
| handles POST /api/chat/sessions (201 Created) | 세션 생성 201 | 같음 | MSW |
| handles POST /api/chat/sessions 400 error trigger | 생성 400 트리거 | 같음 | MSW |
| handles POST /api/chat/sessions 500 error trigger | 생성 500 트리거 | 같음 | MSW |
| handles GET /api/chat/sessions/:session_id (200 OK) | 상세 200 | 같음 | MSW |
| handles GET /api/chat/sessions/:session_id (404 Not Found) | 상세 404 | 같음 | MSW |
| handles GET /api/chat/sessions/:session_id 500 error trigger | 상세 500 트리거 | 같음 | MSW |
| handles DELETE /api/chat/sessions/:session_id (200 OK CASCADE) | 삭제 200 | 같음 | MSW |
| handles DELETE /api/chat/sessions/:session_id (404 Not Found) | 삭제 404 | 같음 | MSW |
| handles DELETE /api/chat/sessions/:session_id 500 error trigger | 삭제 500 트리거 | 같음 | MSW |
| auto-persists conversation turn to session store upon POST /api/chat/stream completion | 스트림 완료 후 mock 세션 저장소에 대화 저장 | 같음 | MSW |
| validates NewsItemSchema with complete attributes | 뉴스 항목 스키마 | `NewsItemSchema` | 없음 |
| validates NewsListResponseSchema with pagination envelope | 페이지네이션 응답 | `NewsListResponseSchema` | 없음 |
| validates SourceConfigSchema and SourcesResponseSchema | 소스 설정·목록 응답 | `SourceConfigSchema`, `SourcesResponseSchema` | 없음 |
| validates MessageSchema and SendMessageRequestSchema contract conformity | 메시지·전송 요청 스키마 | `MessageSchema`, `SendMessageRequestSchema` | 없음 |
| handles GET /api/news with pagination and sorting | 뉴스 목록 페이지·정렬 | `mocks/handlers.ts` | MSW |
| handles GET /api/news with category and high_signal_only filters | 뉴스 필터 | 같음 | MSW |
| handles GET /api/news 400 Bad Request fallback (invalid page) | 잘못된 page 400 | 같음 | MSW |
| handles GET /api/news 500 Internal Error trigger | 500 트리거 | 같음 | MSW |
| handles GET /api/news 503 Fallback trigger | 503 트리거 | 같음 | MSW |
| handles GET /api/news/:id 404 Not Found fallback | 상세 404 | 같음 | MSW |
| handles POST /api/news/:id/ask 503 Fallback trigger | ask 503 트리거 | 같음 | MSW |
| handles GET /api/chat/stream SSE streaming mock | GET 스트림 mock 이 status·done 을 낸다 | `mocks/handlers.ts` `sseGetChatStreamHandler` | MSW |
| validates ModelTierSchema for all 3 tiers and rejects unknown values | 티어 3개 허용, 그 밖은 거부 | `ModelTierSchema` | 없음 |
| validates ChatModelSchema allows dynamic model identifiers and rejects empty strings | 모델 ID 허용, 빈 문자열 거부 | `ChatModelSchema` | 없음 |
| verifies Claude model constants and bidirectional mappings | 모델 상수와 티어↔모델 매핑 | `CLAUDE_MODELS`, `TIER_TO_MODEL`, `MODEL_TO_TIER` | 없음 |
| verifies sanitizeModelTier preserves historical models and defaults to sonnet for claude | 과거 모델 보존, Claude 기본 sonnet | `sanitizeModelTier` | 없음 |
| verifies formatModelDisplayName and getModelLabel masks raw IDs with clean 5.5 brand names | 원시 ID 대신 표시명 | `formatModelDisplayName`, `getModelLabel` | 없음 |
| validates TokenUsageMetaSchema with prompt caching fields | 캐시 토큰 필드 | `TokenUsageMetaSchema` | 없음 |
| validates ChatStreamRequestSchema with optional model and model_tier defaults | 스트림 요청 기본 모델·티어 | `ChatStreamRequestSchema` | 없음 |
| validates ChatDonePayloadSchema with model_tier and token usage meta | done payload | `ChatDonePayloadSchema` | 없음 |
| validates Claude v4.0 error codes in LlmErrorCodeSchema | Anthropic 오류 코드 | `LlmErrorCodeSchema` | 없음 |
| preserves model_tier and usage in chatMessageItemToUiMessage and uiMessageToChatMessageItem roundtrip | 변환 왕복에서 티어·usage 유지 | 변환 헬퍼 | 없음 |
| verifies UI component prop contracts compatibility | 컴포넌트 props 타입 객체 생성 | `ChatHeaderProps` 등 타입 | 없음 |
| handles POST /api/chat/stream with model_tier=haiku and verifies ~180ms latency & Haiku usage | haiku 응답의 지연·usage | `mocks/handlers/chat.ts` | MSW |
| handles POST /api/chat/stream with model_tier=opus and verifies ~1780ms latency & Opus usage | opus 응답 | 같음 | MSW |
| handles POST /api/chat/stream default model routing to Sonnet with ~642ms latency | 기본 sonnet 응답 | 같음 | MSW |
| handles POST /api/chat/stream 400 Bad Request on invalid model_tier | 잘못된 티어 400 | 같음 | MSW |
| handles POST /api/chat/stream 401 Anthropic API Key Missing trigger | 401 트리거 | 같음 | MSW |
| handles POST /api/chat/stream 429 Anthropic Rate Limit trigger | 429 트리거 | 같음 | MSW |
| handles POST /api/chat/stream 529 Anthropic Overloaded trigger | 529 트리거 | 같음 | MSW |
| handles POST /api/chat/query with model_tier=haiku and returns full DTO contract | haiku query 응답 형식 | 같음 | MSW |
| handles GET /api/chat/stream with searchParam model_tier=opus | GET 스트림의 opus 파라미터 | `mocks/handlers.ts` | MSW |
| handles POST /api/chat/stream with scope=scoped and source_id=102 returning customized LangGraph report | scoped 102 맞춤 응답 | `mocks/handlers/chat.ts` | MSW |
| returns dynamically filtered, keyword-matched sources for global chat stream (v0.2.2) | global 스트림 출처의 키워드 필터 | 같음 | MSW |

#### frontend/src/tests/chat/ExportToolbar.test.tsx (5) — 대상 `components/chat/ExportToolbar.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders copy markdown, download .md, and notion sync buttons | 복사·다운로드·Notion 버튼 | ExportToolbar | `navigator.clipboard` mock |
| copies markdown content to clipboard and shows feedback | 마크다운 복사와 피드백 | ExportToolbar | `navigator.clipboard` mock |
| triggers .md file download with blob | Blob 으로 .md 다운로드 | ExportToolbar | `URL.createObjectURL` 교체 |
| disables buttons when isStreaming is true | 스트리밍 중 버튼 비활성 | ExportToolbar | 없음 |
| handles Notion sync and triggers callback | Notion 동기화 콜백 | ExportToolbar | 없음 (콜백 vi.fn) |

#### frontend/src/tests/chat/FocusBottomSheet.test.tsx (8) — 대상 `components/chat/FocusBottomSheet.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| does not render when isOpen is false | 닫힘이면 렌더링 안 함 | FocusBottomSheet | 없음 |
| renders modal dialog with controls and a11y role when isOpen is true | 열림 시 dialog role 과 컨트롤 | FocusBottomSheet | 없음 |
| displays guidance alert when targetCount is 0 | 대상 0건 안내 | FocusBottomSheet | 없음 |
| allows manipulating filters and calls onApplyFilters with updated values | 필터 조작 후 onApplyFilters | FocusBottomSheet | 없음 |
| calls onResetFilters when 초기화 button is clicked | 초기화 버튼 | FocusBottomSheet | 없음 |
| closes on backdrop click and Escape key press | 배경 클릭·Escape 로 닫기 | FocusBottomSheet | 없음 |
| detects 100px swipe-down gesture and triggers onClose | 100px 아래 스와이프로 닫기 | FocusBottomSheet | 터치 이벤트 |
| does not display matching count badge or alert when targetCount is undefined (initial clean state) | 초기 상태에 개수 배지 없음 | FocusBottomSheet | 없음 |

#### frontend/src/tests/chat/FocusCapsule.test.tsx (6) — 대상 `components/chat/FocusCapsule.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders default capsule [🎯 Focus: 전체 소식 ▾] with 30px minimal height and a11y attributes | 기본 캡슐 라벨·높이·접근성 | FocusCapsule | 없음 |
| triggers onClick when default capsule is clicked | 클릭 시 onClick | FocusCapsule | 없음 |
| renders filtered capsule [🎯 Focus: MCP · 최근 7일 ✕] when filters are active | 필터 적용 라벨 | FocusCapsule | 없음 |
| triggers onReset and stops propagation when reset button ✕ is clicked | ✕ 클릭 시 onReset, 전파 중단 | FocusCapsule | 없음 |
| adapts to scoped mode when scopedSource is provided | scoped 출처 표시 | FocusCapsule | 없음 |
| does not display fake count badges and renders clean label in initial state | 초기 상태에 가짜 개수 없음 | FocusCapsule | 없음 |

#### frontend/src/tests/chat/HandoverIntegration.test.tsx (5) — 대상 `components/Header.tsx`, `NewsCard.tsx`, `NewsDetailModal.tsx`, `chat/HandoverCtaButton.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders AI 챗 link in Header navigation bar pointing to /chat | 헤더의 "AI 챗" 링크 href=/chat | Header | next/navigation mock(push), **로컬 요청** (`/api/schedule/status` 가 MSW 미처리로 bypass) |
| HandoverCtaButton navigates to /chat?sourceId={id} and stops click propagation | `/chat?sourceId=101` 로 이동, 전파 중단 | HandoverCtaButton | next/navigation mock |
| HandoverCtaButton encodes draftQuestion into q query parameter | 질문을 q 파라미터로 인코딩 | HandoverCtaButton | next/navigation mock |
| NewsCard includes handover CTA button that does not trigger card selection | 카드 안 CTA 가 카드 선택을 일으키지 않는다 | NewsCard, HandoverCtaButton | next/navigation mock |
| NewsDetailModal includes handover button to transfer current question to dedicated chat | 상세 모달의 챗 이동 버튼 | NewsDetailModal | next/navigation mock |

#### frontend/src/tests/chat/MobileViewport.test.tsx (5) — 대상 `app/layout.tsx`, `components/chat/ChatPromptInput.tsx`, `ChatWorkspace.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| verifies layout viewport metadata prevents auto-zoom and enables interactiveWidget resize | `viewport` 내보내기의 확대 방지·interactiveWidget | `app/layout.tsx` `viewport` | 없음 |
| ensures ChatPromptInput textarea has text-base (16px) to block iOS auto-zoom and horizontal scroll | textarea 16px 클래스 | ChatPromptInput | 없음 |
| ensures ChatPromptInput calls scrollIntoView on focus so keyboard does not obscure input | 포커스 시 scrollIntoView | ChatPromptInput | `vi.useFakeTimers` |
| ensures ChatWorkspace has overflow-x-hidden and max-w-full to prevent horizontal scrollbars | 가로 스크롤 방지 클래스 | ChatWorkspace | MSW (세션 목록 요청) |
| dynamically adapts ChatWorkspace height when visualViewport resizes due to virtual keyboard | visualViewport 크기에 맞춰 높이 변경 | ChatWorkspace | `window.visualViewport` 정의, MSW |

#### frontend/src/tests/chat/WorkflowStepTracker.test.tsx (6) — 대상 `components/chat/WorkflowStepTracker.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders real-time step animation, label, and progress during streaming | 스트리밍 중 단계 라벨·진행률 | WorkflowStepTracker | 없음 |
| renders evaluating_sufficiency, agentic_searching and synthesizing step states accurately | 각 단계 상태 표시 | WorkflowStepTracker | 없음 |
| automatically collapses into a 28px slim accordion when isDone is true | 완료 시 28px 아코디언으로 접힘 | WorkflowStepTracker | 없음 |
| toggles accordion details on click/tap | 클릭으로 상세 토글 | WorkflowStepTracker | 없음 |
| does not render when stepHistory is empty and currentStatus is null | 단계가 없으면 렌더링 안 함 | WorkflowStepTracker | 없음 |
| renders dedicated lucide-react icons and labels for ReAct steps (thinking, tool_calling, observing) | ReAct 단계 아이콘·라벨 | WorkflowStepTracker | 없음 |

#### frontend/src/tests/CommandPalette.test.tsx (9) — 대상 `components/CommandPalette.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders dialog and search input when isOpen is true | 열림 시 dialog 와 검색창 | CommandPalette | next/navigation mock |
| does not render when isOpen is false | 닫힘이면 렌더링 안 함 | CommandPalette | 같음 |
| renders 5 core actions in Idle state | 기본 상태 액션 5개 | CommandPalette | 같음 |
| filters actions when searching | 검색으로 액션 필터 | CommandPalette | 같음 |
| displays Empty State when no actions match search query | 일치 없음 상태 | CommandPalette | 같음 |
| navigates through items with ArrowDown and ArrowUp and executes with Enter | 화살표 이동, Enter 실행 | CommandPalette | 같음 |
| executes action callback and closes palette on action item click | 클릭 실행 후 닫기 | CommandPalette | 같음 |
| calls onClose when backdrop or close button is clicked | 배경·닫기 버튼으로 onClose | CommandPalette | 같음 |
| calls onClose when Escape key is pressed | Escape 로 onClose | CommandPalette | 같음 |

#### frontend/src/tests/HotkeyListener.test.tsx (8) — 대상 `components/HotkeyListener.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| triggers onNavigateFeed when j or k key is pressed | j/k 로 피드 이동 | HotkeyListener | 없음 |
| triggers onFocusSearch and prevents default when / key is pressed | / 로 검색 포커스, 기본 동작 막음 | HotkeyListener | `preventDefault` spy |
| triggers onToggleBookmark on b key and onHandoverChat on c key | b 북마크, c 챗 이동 | HotkeyListener | 없음 |
| triggers onToggleTheme on t key | t 로 테마 전환 | HotkeyListener | 없음 |
| triggers onCloseOverlays on Escape key | Escape 로 오버레이 닫기 | HotkeyListener | 없음 |
| triggers onToggleCommandPalette on Cmd+K or Ctrl+K and prevents default | Cmd/Ctrl+K 로 팔레트, 기본 동작 막음 | HotkeyListener | `preventDefault` spy |
| enforces Input Isolation Rule: ignores single-key shortcuts when typing in an input element | 입력창 안에서는 단일 키 단축키 무시 | HotkeyListener | 없음 |
| ignores hotkeys during IME composition (isComposing = true) | IME 조합 중 무시 | HotkeyListener | 없음 |

#### frontend/src/tests/NewsCard.test.tsx (5) — 대상 `components/NewsCard.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders title, category, insight, and tech stack correctly | 제목·카테고리·인사이트·기술 스택 | NewsCard | 전역 next/navigation mock |
| renders Must-Read high signal badge when is_high_signal is true | 고신호 배지 | NewsCard | 같음 |
| calls onToggleBookmark with stopPropagation when bookmark button is clicked | 북마크 클릭 시 onToggleBookmark, 전파 중단 | NewsCard | 같음 |
| triggers onSelect when card is clicked | 카드 클릭 시 onSelect | NewsCard | 같음 |
| applies focus ring and data-focused attribute when isFocused is true | 포커스 링과 data-focused | NewsCard | 같음 |

#### frontend/src/tests/ResponsiveLayout.test.tsx (4) — 대상 `components/chat/ChatMessageItem.tsx`, `components/MarkdownViewer.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| enforces min-w-0 and max-w-full flex constraints on ChatMessageItem container | 메시지 컨테이너 flex 제약 클래스 | ChatMessageItem | 없음 |
| isolates code block horizontal scrolling with overscroll-x-contain and local overflow-x-auto | 코드 블록 가로 스크롤 격리 | ChatMessageItem | 없음 |
| isolates markdown table scrolling within div.table-wrapper with overscroll-x-contain | 표 스크롤 격리 | ChatMessageItem | 없음 |
| ensures MarkdownViewer standalone component enforces 0px overflow classes | MarkdownViewer 넘침 방지 클래스 | MarkdownViewer | 없음 |

#### frontend/src/tests/ThemeSystem.test.tsx (5) — 대상 `context/ThemeContext.tsx`, `components/ThemeToggle.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| initializes with defaultTheme system and resolves OS preference | 기본 system 테마와 OS 선호 해석 | ThemeProvider, useTheme | `window.matchMedia` mock, localStorage |
| loads saved theme from localStorage if present | 저장된 테마 로드 | ThemeProvider | 같음 |
| cycles through light -> dark -> system -> light when toggleTheme is called | light→dark→system→light 순환과 저장 | ThemeProvider | 같음 |
| updates resolvedTheme when OS theme changes in system mode | system 모드에서 OS 변경 반영 | ThemeProvider | matchMedia change 리스너 호출 |
| renders ThemeToggle button with proper aria-label and accessible title | 토글 버튼 aria-label 과 title | ThemeToggle | 같음 |

## 기능 영역별 커버리지
"있음" 은 테스트가 검증하는 동작, "없음" 은 코드에 있지만 이를 직접 부르거나 단언하는 테스트를 찾지 못한 동작이다.

### 뉴스 피드
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 뉴스 목록 기본 조회, `size=1` 조회 | `test_api.py::test_news`, `test_ask_ai_endpoint` |
| 있음 | 통계, RSS 피드, 전체 삭제 | `test_api.py::test_stats`, `test_rss`, `test_reset_and_delete.py::test_delete_all_news_endpoint` |
| 있음 | 뉴스 카드 렌더링·북마크·선택·포커스, 상세 모달의 챗 이동 버튼 | `NewsCard.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 뉴스 목록 MSW 핸들러와 `NewsItemSchema` 계약 | `ContractAndMsw.test.ts` (MSW News 절) |
| 없음 | 목록 필터·정렬·검색·페이지(`category`, `source`, `search`, `sort`, `high_signal_only`, `page`) | `backend/app/api/news.py:47-95` |
| 없음 | 단건 조회 `GET /api/news/{id}`, ask 의 404 | `backend/app/api/news.py:104-119` |
| 없음 | RSS 의 `category` 파라미터 | `backend/app/api/news.py:169-197` |
| 없음 | 피드 메인 화면, 피드 훅, 북마크 훅, 필터 컴포넌트 | `frontend/src/app/page.tsx`, `frontend/src/hooks/useNewsFeed.ts`, `frontend/src/hooks/useBookmarks.ts`, `frontend/src/components/CategoryFilter.tsx`, `SourceFilter.tsx` |
| 없음 | 프론트 API 클라이언트 함수(타임아웃, ask 스트림의 직접 연결·대체 경로) | `frontend/src/lib/api.ts:25-169` |

### 수집·분류·요약
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 키워드 분류, dedup 해시, hotness 감쇠, 비 AI 잡음 거절 | `test_collectors.py` |
| 있음 | 품질 점수, 기술 스택 추출, TL;DR 합성 | `test_llm_processor.py` |
| 있음 | LLM 평가의 pre-filter 거절과 통과 | `test_collectors.py::test_evaluate_content_with_llm_strict_gate` (라이브 응답 의존) |
| 있음 | Anthropic 구조화 요약 파싱 | `test_anthropic_provider.py::test_anthropic_generate_structured_summary_with_caching` |
| 있음 | 기사 본문 스크랩(캐시, 단일 비행, 403/타임아웃, readability 대체, 빈 본문) | `test_agentic_workflow.py` 스크래퍼 테스트 5개 |
| 있음 | 초기화 후 재수집 엔드포인트 (수집은 mock) | `test_reset_and_delete.py::test_reset_and_collect_endpoint` |
| 없음 | 수집 오케스트레이션과 배치 저장(LLM 평가 → 합성 → 저장) | `backend/app/collectors/manager.py:72-259` |
| 없음 | 소스별 수집기 전부 | `backend/app/collectors/sources/arxiv.py`, `github.py`, `hackernews.py`, `huggingface.py`, `reddit.py`, `rss.py` |
| 없음 | 수동 수집 시작·진행률 엔드포인트 | `backend/app/api/schedule.py:43-67` |
| 없음 | 스케줄러 시작·중지와 예약 작업(수집, 딥 리서치, 브리핑 발송) | `backend/app/scheduler.py:11-68` (상수 `SCHEDULED_HOURS` 만 테스트) |
| 없음 | 헤더의 수집·초기화 버튼과 진행률 폴링 | `frontend/src/components/Header.tsx:51-107`, `ScheduleModal.tsx` |

### AI 챗
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | global/scoped query·stream, 입력 검증(빈 값, 2000자 초과, 잘못된 scope, 없는 출처) | `test_chat.py` |
| 있음 | ReAct 흐름(검색 도구, 잡담 생략, LLM planner, 인용 필터) | `test_agentic_workflow.py` |
| 있음 | 503/502/429 오류 매핑(stream 사전 검사, query), 스트림 중간 오류 이벤트 | `test_chat.py` 7개 |
| 있음 | FTS 검색, 품질 컷, 포커스 필터, 시간 완화, 동적 출처 수, LIKE 대체 | `test_chat.py`, `test_dynamic_rag_retrieval.py` |
| 있음 | 세션 CRUD, FIFO 30, 자동 제목, 스트림 자동 저장, 오류 분기 | `test_chat_sessions.py` |
| 있음 | 3-tier 모델 해석·라우팅, Anthropic HTTP·SSE·오류 매핑, 모델명 보존 | `test_anthropic_provider.py`, `test_scoped_chat_grounding.py` |
| 있음 | 챗 화면 전체(스트림, 중지, 재시도, 필터, 모델 변경, 세션 복원·삭제)와 하위 컴포넌트 | `frontend/src/tests/chat/*.test.tsx` |
| 있음 | 프론트 채팅 계약(zod)과 MSW 핸들러 | `ContractAndMsw.test.ts` |
| 없음 | API 수준 401(키 누락)·529(과부하) 응답 | `backend/app/api/chat.py:212-237`, `350-375` (프론트 MSW 트리거만 있음) |
| 없음 | 대화 history 를 담은 요청이 프롬프트에 반영되는지 | `backend/app/services/chat_service.py:222` `_build_grounding_prompt` (backend 테스트 중 history 를 보내는 것이 없다) |
| 없음 | 보조 웹 검색 전체 흐름 `evaluate_and_search` | `backend/app/services/agentic_search.py:221-246` (단위 함수만 테스트, 서비스 호출처 없음) |
| 없음 | 뉴스 상세의 Ask AI 실제 질의 흐름 | `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/lib/api.ts:70-169` (패널 렌더링만 테스트) |

### 브리핑·공유
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 오늘 브리핑 구조(제목, 4개 카테고리, action_items) | `test_briefing_notion_email.py::test_today_briefing_structure`, `test_api.py::test_daily_briefing_endpoint` |
| 있음 | Notion ID 정리, 연결 테스트, 페이지 생성(POST mock), 엔드포인트 | `test_briefing_notion_email.py` |
| 있음 | 이메일 HTML, SMTP 연결 테스트(mock), 엔드포인트 | `test_briefing_notion_email.py` |
| 있음 | 브리핑 설정 조회·저장 | `test_briefing_notion_email.py::test_briefing_settings_get_and_post` |
| 있음 | 웹훅 제공자 판별, payload 생성, 잘못된 URL 400 | `test_trends_and_webhook.py` |
| 있음 | 챗 답변 내보내기(복사, .md, Notion 콜백) | `ExportToolbar.test.tsx` |
| 없음 | 브리핑 재생성 `POST /api/briefing/generate` | `backend/app/api/briefing.py:40-53` |
| 없음 | 자동 발송(Notion/이메일/웹훅) | `backend/app/services/briefing_service.py:210-259` |
| 없음 | 웹훅 실제 전송과 브리핑 웹훅 엔드포인트 | `backend/app/services/webhook_service.py:17-32`, `154-162`, `backend/app/api/webhook.py:28-43` |
| 없음 | 이메일 브리핑 발송 본체 | `backend/app/services/email_service.py:226-266` |
| 없음 | 브리핑 배너·모달·설정 모달·웹훅 설정 모달 | `frontend/src/components/DailyBriefingBanner.tsx`, `DailyBriefingModal.tsx`, `BriefingSettingsModal.tsx`, `WebhookSettingsModal.tsx` |

### 소스·리서치
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | sources 읽기, 활성 피드, RSS 추가·토글·삭제(서비스) | `test_sources_and_research.py` |
| 있음 | 후보 탐색(카탈로그), URL 검사(GitHub), 후보 등록 | `test_sources_and_research.py` |
| 있음 | 딥 리서치 피드 탐지·평가·실행·감사 로그·API | `test_deep_researcher.py` |
| 있음 | 소스 목록 계약(`SourceConfigSchema`) | `ContractAndMsw.test.ts` |
| 없음 | 소스 관리 API(RSS 추가, GitHub 저장소 추가, 토글, 삭제) | `backend/app/api/sources.py:49-91` |
| 없음 | GitHub 저장소 추가 서비스 | `backend/app/services/sources_service.py:212-233` |
| 없음 | `POST /api/research/inspect-url` | `backend/app/api/research.py:24-33` |
| 없음 | 일반 웹사이트(HTML link 태그, 표준 경로 탐침) 피드 탐지 | `backend/app/services/source_researcher.py:204-268`, `deep_researcher.py:223-265` (테스트는 GitHub 분기만 지난다) |
| 없음 | 소스 모달과 탭 | `frontend/src/components/SourcesModal.tsx`, `sources/SourcesListTab.tsx`, `sources/DeepResearcherTab.tsx` |

### MCP 서버
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | `/api/mcp/info` 응답의 tools 개수 (정적 목록) | `test_api.py::test_mcp_info` |
| 없음 | MCP 도구 4개의 실제 동작 | `backend/app/mcp/server.py:10-50` |
| 없음 | MCP 안내 모달 | `frontend/src/components/McpModal.tsx` |

### UI 공통
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 테마 시스템, 단축키, 커맨드 팔레트 | `ThemeSystem.test.tsx`, `HotkeyListener.test.tsx`, `CommandPalette.test.tsx` |
| 있음 | 가로 넘침 방지, 모바일 viewport·가상 키보드 | `ResponsiveLayout.test.tsx`, `MobileViewport.test.tsx` |
| 있음 | 헤더의 "AI 챗" 링크 | `HandoverIntegration.test.tsx` |
| 있음 | 트렌드 태그 분류와 레이더 응답 형식 | `test_trends_and_webhook.py` |
| 없음 | 트렌드 레이더 집계 로직의 값 | `backend/app/services/trend_service.py:40-139` (키 존재만 단언) |
| 없음 | 트렌드 레이더 화면 | `frontend/src/components/TechRadar.tsx` |
| 없음 | 프론트 헬스 라우트, 챗 페이지 래퍼 | `frontend/src/app/api/health/route.ts`, `frontend/src/app/chat/page.tsx` |

### 설정·DB
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | config.json 탐색·로드, 임의 값 조회, 버전, 기본 모델 | `test_config_and_live_llm.py`, `test_dynamic_rag_retrieval.py::test_version_0_2_2_consistency`, `test_anthropic_provider.py::test_anthropic_config_and_schema_defaults` |
| 있음 | 설정 저장(`save_json_config`) 성공 경로 | `test_briefing_settings_get_and_post` |
| 있음 | 스키마 생성(fixture), FTS 테이블 동기화, 채팅 저장 컬럼(model_tier, usage) | `conftest.py`, `test_dynamic_rag_retrieval.py::test_ensure_fts_table_creates_table_and_indexes_items`, `test_anthropic_provider.py::test_chat_session_persistence_with_model_tier_and_usage` |
| 없음 | production 모드 SECRET_KEY 길이 검사 | `backend/app/config.py:140-141` |
| 없음 | 설정 저장 실패 경로(500) | `backend/app/config.py:171-173`, `backend/app/api/briefing.py:208-209` |
| 없음 | 옛 DB 의 컬럼 추가(ALTER) 분기 | `backend/app/database.py:49-70` |
| 없음 | 앱 lifespan(빈 DB 초기 수집, 스케줄러) | `backend/app/main.py:13-26` |
| 없음 | 프론트 환경변수 검증 | `frontend/src/lib/env.ts` |

## 외부 호출 판정
판정 기준: "외부 호출함" 은 mock 없이 인터넷 호스트로 요청을 보내는 경로가 테스트에서 항상 실행된다는 뜻이다. "조건부" 는 키·설정·캐시·로컬 서비스 상태에 따라 갈린다. 로컬호스트(Ollama, jsdom origin) 요청은 판정 칸에 "로컬" 로 따로 적는다.

### test-strategy.md '외부 호출 가능성 (미확정)' 항목
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `config.py` 가 `.env`, `backend/.env` 를 읽는가 | 읽는다 (외부 호출의 전제 조건) | `backend/app/config.py:8-10` 이 import 시 `cwd/.env`, `cwd/backend/.env`, `cwd.parent/.env`, `backend/.env` 를 `load_dotenv(override=False)` 로 읽고, `config.py:102-105` 의 pydantic `env_file` 도 같은 파일을 읽는다. `make check` 는 `backend/` 에서 pytest 를 돌리므로 `backend/.env` 와 루트 `.env` 가 모두 읽힌다. 현재 두 파일에 `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` 값이 있고 `OPENAI_API_KEY` 는 비어 있다(값 길이만 확인) |
| `is_test_environment()` 가 라이브 호출을 막는가 | 막지 않는다 (ReAct planner 1곳만 막는다) | 조건: `settings.TESTING` 이 참, 환경변수 `TESTING` 또는 `CI` 가 true/1/yes, 또는 `"pytest" in sys.modules` (`backend/app/services/llm_processor.py:229-240`). pytest 실행 중에는 마지막 조건으로 항상 True 다. 호출처는 `backend/app/services/chat_service.py:381` 한 곳뿐이고, global 챗의 planner LLM 호출만 건너뛴다. `generate_live_answer`(`llm_processor.py:289`), `stream_tokens`(`:359`), `evaluate_content_with_llm`(`:580`), `answer_question_with_meta`(`:748`), `stream_question_answer`(`:863`), `has_live_provider` 의 Ollama 탐침(`:267-275`)은 이 판정을 보지 않는다 |
| `conftest.py` 의 환경변수 설정 | `DATABASE_URL` 만 바꾼다 | `backend/tests/conftest.py:6-7`. `TESTING`, `CI` 를 설정하지 않고 LLM 키를 지우지 않는다. `config.py:131-132` 는 `TESTING` 환경변수가 있을 때만 `settings.TESTING` 에 반영한다 |
| `test_config_and_live_llm.py::test_config_json_found_and_loaded`, `test_get_custom_json_value` | 안 함 | 설정 파일 읽기만 한다 (`config.py:14-35`) |
| `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` | 조건부 (키 있으면 외부 호출함) | `answer_question` → `answer_question_with_meta` (`llm_processor.py:941-944`, `717-753`) → `_generate_live_answer` → `generate_live_answer` → Anthropic 키가 있으면 `httpx.AsyncClient.post("https://api.anthropic.com/v1/messages")` (`anthropic_provider.py:233-234`). 키가 없으면 로컬 Ollama 탐침(`llm_processor.py:267-275`) 뒤 휴리스틱 답. 예외: 같은 프로세스에서 `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 먼저 돌면 같은 캐시 키(제목+질문)로 휴리스틱 답이 `_qa_cache` 에 들어가고(`llm_processor.py:938`), 이 테스트는 캐시를 돌려받아 호출하지 않는다(`llm_processor.py:726-729`). 파일 이름순 실행에서는 그 테스트가 먼저 돈다 |
| `test_deep_researcher.py::test_probe_and_discover_feed_github` | 외부 호출함 | GitHub 분기(`deep_researcher.py:216-221`) → `_fetch_and_parse_feed` 가 `https://github.com/All-Hands-AI/OpenHands/releases.atom` 을 httpx GET 하고 `feedparser.parse(resp.text)` 로 로컬 파싱한다(`deep_researcher.py:267-278`). 네트워크가 없으면 status 가 success 가 아니어서 실패한다 |
| `test_deep_researcher.py::test_evaluate_and_decide_scoring` | 안 함 | `evaluate_and_decide` 는 sources.json 읽기와 휴리스틱 점수만 쓴다 (`deep_researcher.py:304-374`, `llm_processor.py:477-541`) |
| `test_deep_researcher.py::test_deep_research_run_and_audit` | 외부 호출함 (파일 쓰기 가능) | `run_deep_research(max_candidates=2)` 가 시드 앞 2개(`https://lilianweng.github.io`, `https://eugeneyan.com`, `deep_researcher.py:23-31`, `395-412`)를 probe 한다: 페이지 GET, 표준 경로 HEAD 탐침, 피드 GET (`deep_researcher.py:223-263`, `269-271`). 점수 8.2 이상이면 `sources_service.add_rss_source` 로 sources.json 에 추가하고(`deep_researcher.py:441-449`) 테스트는 지우지 않는다. 네트워크가 실패해도 REJECTED 로그가 남아 테스트는 통과한다 |
| `test_deep_researcher.py::test_deep_research_api_endpoints` | 조건부 | `/status`, `/audit-logs` 는 호출 없음. `POST /run-deep?max_candidates=1` 은 `asyncio.create_task(run_deep_research(...))` 로 시드 1개 probe 를 시작한다(`backend/app/api/research.py:87`). 테스트는 응답만 확인하고 끝나므로, 테스트 이벤트 루프가 닫히기 전까지 태스크가 어디까지 진행되는지는 확인하지 못했다 |
| `test_sources_and_research.py::test_sources_service_load`, `test_sources_service_active_feeds` | 안 함 | sources.json 읽기 (`sources_service.py:35-45`, `124-129`) |
| `test_sources_and_research.py::test_sources_toggle_and_crud` | 안 함 (파일 수정함) | `add_rss_source`·`toggle_source`·`delete_source` 가 매번 `save_sources` 로 파일을 쓴다 (`sources_service.py:159-210`, `235-252`, `101-108`) |
| `test_sources_and_research.py::test_source_researcher_discover` | 안 함 | `discover_sources` 는 메모리 상수 `CURATED_ECOSYSTEM_CATALOG` 만 거른다 (`source_researcher.py:331-383`). docstring 의 "live feed probing" 과 달리 네트워크 호출이 없다 |
| `test_sources_and_research.py::test_source_researcher_inspect_url` | 외부 호출함 | GitHub 분기(`source_researcher.py:193-198`) → `https://github.com/princeton-nlp/SWE-bench/releases.atom` httpx GET 후 feedparser 파싱 (`source_researcher.py:270-281`). 실패하면 status 가 found 가 아니어서 실패한다 |
| `test_sources_and_research.py::test_sources_and_research_api_endpoints` | 안 함 (파일 수정함) | `GET /api/sources` 는 파일 읽기, `POST /api/research/discover` 는 메모리 카탈로그, `register-candidate` 는 `add_rss_source` 로 파일을 쓰고(`source_researcher.py:397-404`) 테스트 끝에서 `delete_source` 로 지운다 (finally 블록이 아니다) |
| `test_sources_toggle_and_crud` 가 고치는 sources.json | 저장소 루트 `sources.json` (git 추적 파일) | `find_sources_file` 후보 순서: `cwd/sources.json` → `cwd.parent/sources.json` → `<저장소 루트>/sources.json` → `backend/app/config/sources.json` (`sources_service.py:11-24`). `make check` 는 `cd backend && pytest` 라 `backend/sources.json`(없음) 다음의 `../sources.json` = 루트 파일이 잡힌다. 루트에서 pytest 를 돌려도 `cwd/sources.json` 이 같은 루트 파일이다. `backend/app/config/sources.json` 은 루트 파일이 없을 때만 쓰인다. 쓰기는 `.tmp` 에 쓴 뒤 `replace` 한다 (`sources_service.py:101-108`) |

### 그 밖에 찾은 외부 호출 테스트
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `test_anthropic_provider.py::test_chat_stream_3tier_model_routing` | 조건부 (키 있으면 외부 호출함) | LLM mock 이 없다. `api/chat.py:349` `check_provider_available` → `chat_service.py:748` `stream_tokens(model="claude-haiku-5-5")` → Anthropic SSE (`anthropic_provider.py:246` 이하). 키가 없으면 로컬 Ollama 를 시도하고, 모두 실패하면 `event: error` 만 나와 done 이 없어 실패한다 |
| `test_anthropic_provider.py::test_chat_query_3tier_model_routing` | 조건부 (키 있으면 외부 호출함) | `chat_service.py:546` `generate_live_answer(model="claude-opus-5-5")` → Anthropic POST. 프로바이더가 없으면 503/502 로 실패한다 |
| `test_api.py::test_ask_ai_endpoint` | 조건부 (키 있으면 외부 호출함) | `api/news.py:122` → `answer_question_with_meta` → `generate_live_answer` |
| `test_api.py::test_ask_ai_stream_endpoint` | 조건부 (키 있으면 외부 호출함) | `api/news.py:150` → `stream_question_answer` → `anthropic_provider.stream_chat` (`llm_processor.py:863-866`). 실패하면 휴리스틱으로 대체 |
| `test_llm_processor.py::test_answer_question` | 조건부 (키 있으면 외부 호출함) | `test_llm_processor_fallback_and_answer` 와 같은 경로, 다른 캐시 키 |
| `test_collectors.py::test_evaluate_content_with_llm_strict_gate` | 조건부 (키 있으면 외부 호출함) | 첫 호출은 pre-filter 로 끝난다(`llm_processor.py:564-576`). 두 번째(AI 글)는 `has_live_provider()` 가 참이면 `_generate_live_answer` 를 부른다(`llm_processor.py:580-610`). 이때 `is_worthwhile`, `quality_score ≥ 7.0` 단언은 LLM 응답에 따른다 |
| `test_llm_processor.py::test_chat_stream_end_to_end_with_mocked_llm` | 조건부 (로컬) | `stream_tokens` 만 mock 이고 `check_provider_available` 은 실제다(`api/chat.py:349`). Anthropic 키가 있으면 네트워크 없이 True(`llm_processor.py:254-255`), 없으면 `GET {OLLAMA_BASE_URL}/api/tags` 로컬 탐침(`:267-275`), 실패하면 503 으로 테스트 실패 |
| `test_llm_processor.py::test_scoped_chat_stream_end_to_end_with_mocked_llm` | 외부 호출함 | 위 조건에 더해 item 999 (`https://example.com/isolated-scoped-benchmark`, `full_content` 없음)를 스크래퍼가 GET 한다 (`chat_service.py:622-629` → `scraper.py:74-75`). 실패는 잡혀서 진행된다 |
| `test_chat.py::test_chat_query_scoped_mode_success`, `test_chat_stream_scoped_sse_success` | 외부 호출함 (URL 별 프로세스 첫 회) | scoped 경로가 스크래퍼를 mock 없이 부른다 (`chat_service.py:495-502`, `622-629` → `scraper.py:126-174`). 대상은 item 101 `https://github.com/jlowin/fastmcp`. L1 캐시가 클래스 속성(`scraper.py:35`)이라 같은 URL 은 프로세스에서 한 번만 요청한다. 성공하면 본문이 테스트 DB 에 저장된다(`scraper.py:157-165`). 이 테스트들이 patch 하는 `AgenticSearchService.evaluate_and_search` 는 서비스에 호출처가 없다 |
| `test_chat_sessions.py::test_chat_stream_auto_persists_turn_and_auto_titles` | 외부 호출함 | scoped `source_id=1` 의 URL `https://github.com/example/langgraph-harness` (`conftest.py:25`)를 스크래퍼가 GET 한다. 실패는 잡혀서 진행된다 |
| `test_briefing_notion_email.py::test_notion_export_page_mock` | 외부 호출함 | `httpx.AsyncClient.post` 만 patch 한다. `create_briefing_page` 의 `GET https://api.notion.com/v1/databases/{id}` (`notion_service.py:238-239`)는 patch 되지 않아 가짜 키 `secret_test123` 으로 실제 요청을 보낸다. 예외·비 200 은 무시된다(`:240-246`) |
| `test_briefing_notion_email.py::test_email_api_endpoints` (`/test/email` 부분) | 조건부 (현재 config.json 으로는 외부 호출함) | 요청의 `smtp_host` 가 "" 이라 `settings.SMTP_HOST` 를 쓴다(`email_service.py:190`). 커밋된 루트 `config.json` 의 `briefing.email.smtp_host` 는 "smtp.gmail.com", `smtp_to` 는 "team@example.com" 이라 수신자가 생기고(`:200-202`), `smtplib.SMTP("smtp.gmail.com", 587)` 연결과 STARTTLS 를 시도한다(`:158-164`). `config.json` 의 smtp_user/smtp_password 값은 확인하지 못했다. 값이 있으면 로그인과 발송까지 간다(`:166-169`). 실패하면 400 이 나와 테스트는 통과한다 |
| `test_briefing_notion_email.py::test_notion_api_endpoints` (`/test/notion` 부분) | 조건부 | 요청 키가 "" 이라 `settings.NOTION_API_KEY` 를 쓴다(`notion_service.py:35`). 이 값이 비어 있으면 호출 없이 400, 값이 있으면 `GET https://api.notion.com/v1/users/me` 를 보낸다(`:41-43`). config.json 의 Notion 키 값은 확인하지 못했다 |
| `test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens` | 조건부 (로컬) | `settings.OLLAMA_BASE_URL` 을 "" 로 patch 하지만 `has_live_provider` 는 config.json 의 `ollama_base_url`(http://localhost:11434)로 되돌아가 `GET /api/tags` 를 보낸다(`llm_processor.py:267-275`). 로컬 Ollama 가 응답하면 기대한 예외가 나지 않아 실패할 수 있다 |
| `test_llm_processor.py::test_stream_tokens_fails_fast_without_mock_fallback` | 조건부 (로컬) | `llm_processor.ollama_url` 을 "" 로 patch 하지만 `stream_tokens` 는 `settings.OLLAMA_BASE_URL` 을 읽어(`llm_processor.py:437`) 로컬 Ollama 스트림 POST 를 시도한다(`:441-442`). Ollama 가 토큰을 내면 실패할 수 있다 |
| 키가 없을 때 `has_live_provider()` 를 지나는 모든 테스트 | 조건부 (로컬) | Anthropic·OpenAI 키가 없으면 `httpx.Client.get(f"{ollama_url}/api/tags")` 를 보낸다 (`llm_processor.py:267-275`) |
| frontend `HandoverIntegration.test.tsx` 의 Header 테스트 | 조건부 (로컬) | Header 가 마운트 시 `fetchScheduleStatus()` 로 `/api/schedule/status` 를 요청한다(`frontend/src/components/Header.tsx:38-49`, `frontend/src/lib/api.ts:171-173`). MSW 핸들러에 schedule 경로가 없고 `onUnhandledRequest: 'bypass'` (`frontend/src/tests/setup.ts:27`)라 jsdom 문서 origin 으로 실제 fetch 가 나간다. 실패는 `catch {}` 로 무시된다(`Header.tsx:42`) |
| 그 밖의 frontend 테스트 | 안 함 | 채팅·뉴스 요청은 상대 경로이고 MSW `*/api/...` 핸들러가 받는다 (`frontend/src/mocks/handlers.ts:218-480`, `mocks/handlers/chat.ts:243-1098`) |

## 알려진 불일치·위험

### 테스트가 저장소 파일을 고친다
- `test_briefing_notion_email.py::test_briefing_settings_get_and_post` 는 `POST /api/briefing/settings` 로 `save_json_config` 를 불러(`backend/app/api/briefing.py:207`, `backend/app/config.py:161-169`) 루트 `config.json`(git 추적 파일)을 덮어쓰고 `settings.reload()` 한다. 커밋된 `config.json` 에는 이 테스트의 값(`notion.page_id: "test_notion_parent_page"`, `email.smtp_host: "smtp.gmail.com"`, `email.smtp_to: "team@example.com"`, `test_briefing_notion_email.py:145-150`)이 이미 들어 있다.
- 위 값 때문에 `test_email_api_endpoints` 의 `/test/email` 이 실제 SMTP 연결을 시도한다 (`## 외부 호출 판정` 참조).
- 루트 `sources.json`(git 추적 파일)을 `test_sources_toggle_and_crud`, `test_sources_and_research_api_endpoints`, `test_deep_research_run_and_audit` 가 쓴다. 앞의 둘은 추가 후 지우지만 try/finally 가 없어 중간 단언이 실패하면 항목(`test_feed_discovery`, `test_autogen_blog`)이 남는다. 딥 리서치는 AUTO_ADOPTED 소스를 지우지 않는다. 내용이 같아도 `json.dump(..., indent=2, ensure_ascii=False)` 로 다시 쓰므로(`sources_service.py:105-108`) 파일 서식이 바뀔 수 있는지는 확인하지 못했다.

### 테스트 DB
- `backend/tests/test_agentlens.db`, `-shm`, `-wal` 은 로컬에 있지만(2026-11-02 수정, WAL 약 4.2MB) git 에 커밋돼 있지 않다. `git ls-files backend/tests` 에 없고 `.gitignore` 가 `backend/tests/test_agentlens.db`, `*.db-shm`, `*.db-wal` 을 무시한다.
- conftest 는 `create_all` 로 없는 테이블만 만들고 데이터를 지우지 않는다(`backend/app/database.py:45-48`, `conftest.py:13-44`). `docs/test-strategy.md` 의 "테스트마다 스키마를 만든다" 는 기존 테이블·행을 유지한다는 점에서 코드와 다르다. 고정 id 시드(1, 101~103, 201, 9001~9005), 스크래퍼가 저장한 `full_content`, 자동 저장된 채팅이 실행 사이에 남는다.
- 개발 DB 격리는 지켜진다: conftest 가 `DATABASE_URL` 을 먼저 설정하고, `load_dotenv(override=False)` 와 pydantic 의 "환경변수 우선" 규칙 때문에 `.env` 의 `DATABASE_URL` 이 덮지 못한다 (`config.py:8-10`, `conftest.py:6-7`).

### 순서 의존
- `_qa_cache` 공유: `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 남긴 휴리스틱 답을 `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` 가 같은 키로 받는다 (`llm_processor.py:726-729`, `938`). 단독 실행 때와 전체 실행 때 경로가 다르다.
- item 201 은 `test_chat.py::test_sqlite_fts_retriever_auto_relaxation_on_zero_matches` 만 넣는다. 같은 파일 뒤쪽 `test_chat_query_with_focus_filters_and_relaxation` 은 완화 결과가 있어야 `is_relaxed` 가 True 가 되는데(`retriever.py:569-586`), 201 이 없을 때(예: 이전 실행의 초기화 테스트로 DB 가 비워진 뒤 단독 실행)의 결과는 확인하지 못했다.
- `test_reset_and_delete.py` 두 테스트가 테스트 DB 의 뉴스(와 크롤 로그)를 모두 지운다. 다음 테스트는 fixture 가 다시 시드한다.
- 스크래퍼 L1 캐시가 클래스 속성이라(`scraper.py:35`) 프로세스 전체에서 공유된다. scoped 테스트의 외부 요청 여부가 앞선 테스트에 따라 달라진다.
- `POST /api/research/run-deep` 가 띄운 백그라운드 태스크(`research.py:87`)가 테스트 종료 후에도 남아 있을 수 있다. `deep_researcher.is_running` 이 남으면 같은 프로세스의 다음 실행이 `already_running` 을 받는다(`deep_researcher.py:385-386`). 실제 진행 범위는 확인하지 못했다.

### 실행 환경에 따라 실패할 수 있는 테스트
- 네트워크가 없으면 실패: `test_probe_and_discover_feed_github`, `test_source_researcher_inspect_url`.
- 라이브 LLM 프로바이더(Anthropic 키, OpenAI 키, 또는 로컬 Ollama)가 없으면 실패: `test_chat_stream_3tier_model_routing`, `test_chat_query_3tier_model_routing`, `test_chat_stream_end_to_end_with_mocked_llm`, `test_scoped_chat_stream_end_to_end_with_mocked_llm`.
- 로컬 Ollama 가 떠 있으면 실패할 수 있음: `test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens`, `test_stream_tokens_fails_fast_without_mock_fallback`.
- LLM 응답 내용에 따라 갈림: `test_evaluate_content_with_llm_strict_gate` 의 두 번째 단언.
- `.env` 값이 settings 를 덮는다: `VERSION`, `ANTHROPIC_*_MODEL` 이 바뀌면 `test_version_*`, `test_anthropic_config_and_schema_defaults` 가 실패한다. `test_config_json_found_and_loaded` 는 `HIGH_SIGNAL_THRESHOLD == 7.0` 을 단언하는데 이는 config.json 값이고 코드 기본값은 7.8 이다(`config.py:65`).

### 효과가 없는 patch
- `AgenticSearchService.evaluate_and_search` patch (`test_chat.py:258`, `test_agentic_workflow.py:267, 323, 435`): 서비스 코드에 호출처가 없다 (호출은 `agentic_search.py:242` 내부뿐). `test_chat_scoped_graceful_degradation_when_scrape_fails` 는 이 mock 에 보조 출처를 넣지만 단언하지 않는다.
- `llm_processor.check_provider_available` patch (`test_agentic_workflow.py:268, 324`): 테스트가 `ChatService.stream_chat` 을 직접 부르는데 서비스는 이 함수를 부르지 않는다 (호출은 `api/chat.py:349`).
- `llm_processor.ollama_url` patch (`test_llm_processor.py:116`, `test_anthropic_provider.py:401`): `stream_tokens` 는 `settings.OLLAMA_BASE_URL` 을 읽는다 (`llm_processor.py:437`).

### 이름·설명과 실제 단언의 불일치
- `test_version_0_2_2_consistency`, `test_version_is_0_2_2` 는 0.3.1 을 단언한다. `test_config_json_found_and_loaded` 는 허용 버전 튜플을 하드코딩한다. 버전을 바꾸면 이 세 곳을 함께 고쳐야 한다.
- `test_article_scraper_l1_l2_cache_and_db_persistence` 의 세 번째 단계는 "새 인스턴스는 L2(DB)에서 읽는다" 고 설명하지만 L1 캐시가 클래스 속성이라 새 인스턴스도 L1 에서 읽는다 (`scraper.py:35`, `136-138`). 단언(HTTP 1회)은 L1/L2 를 구분하지 못한다.
- `test_chat_query_scoped_with_agentic_workflow_success` 의 docstring 은 "dual sources, supplementary_count>=1" 이지만 단언은 `supplementary_count == 0` 이다.
- `test_unit_test_mock_provider` 는 테스트 파일 안에 정의한 클래스만 검증한다.

### 건너뛰는 테스트·계약
- `skip`, `xfail`, `.only`, `.todo` 마커는 backend·frontend 어디에도 없다. 테스트를 실행하지 않았으므로 현재 깨진 테스트가 있는지는 확인하지 못했다.
- `make check` 는 `pytest -v tests/` 를 마커 구분 없이 돌린다. 라이브 호출 테스트를 따로 고르는 마커나 설정이 없다 (`Makefile` check, `backend/pytest.ini`).
- MSW 에만 있는 엔드포인트: `GET /api/chat/stream` (`frontend/src/mocks/handlers.ts:480`)을 `ContractAndMsw.test.ts` 두 테스트가 검증하지만 backend 에는 `POST /api/chat/stream` 만 있다 (`backend/app/api/chat.py:276`).
- `ContractAndMsw.test.ts` 의 MSW 테스트는 mock 핸들러의 동작을 검증하며 backend 와의 일치를 확인하지 않는다. backend 응답 형식과 frontend zod 스키마를 함께 대조하는 테스트는 없다.
