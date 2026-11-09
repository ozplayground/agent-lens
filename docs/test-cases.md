# 테스트 명세: AgentLens
Updated: 2026-11-09

이 문서는 저장소의 테스트 코드를 읽어 정리한 명세다. backend 개수는 `cd backend && ../.venv/bin/pytest --collect-only -q tests/` (수집만 함)로 확인했다 (2026-11-09, 21개 파일, 217개. 같은 날 `make check` 로 모두 통과). frontend 개수는 `cd frontend && pnpm test` 를 실행해 확인했다 (2026-11-07, 52개 파일, 649개 모두 통과). `pnpm exec vitest list` 는 `it.each` 를 한 줄로 세어 576개를 보인다 (`design/TokenContrast.test.ts` 가 3개, `modals/DeepResearcherTab.test.tsx` 가 2개, `feed/FeedToolbar.test.tsx` 가 20개, `NewsCard.test.tsx` 가 32개로 나온다).

| 구분 | 파일 수 | 테스트 수 |
|---|---|---|
| backend (`backend/tests/test_*.py`) | 21 (+ `conftest.py`, 흉내 도움 모듈 `llm_fakes.py`) | 217 |
| frontend (`frontend/src/tests/**/*.test.ts(x)`) | 52 (+ `setup.ts`) | 649 |

표기:
- **ASGI**: `httpx.AsyncClient(transport=ASGITransport(app=app))` 로 FastAPI 앱을 같은 프로세스 안에서 부른다. 이 호출 자체는 네트워크를 쓰지 않는다. `ASGITransport` 는 lifespan 이벤트를 보내지 않으므로 `backend/app/main.py:23-47` 의 lifespan(초기 수집, 스케줄러 시작)은 이 호출로는 돌지 않는다. lifespan 은 `test_startup_seed.py` 가 `app.router.lifespan_context` 로 따로 돌린다.
- **실호출**: mock 없이 외부 네트워크로 나가는 경로가 있다. 자세한 근거는 `## 외부 호출 판정` 에 둔다. LLM 호스트(Anthropic, OpenAI, Gemini, 포트 11434)로 가는 요청은 여기에 들지 않는다: `conftest.py` 의 하네스가 모든 테스트에서 흉내로 답하거나 막는다.
- **흉내 Claude**: 테스트 코드에 LLM mock 이 없어 코드가 Anthropic 을 부르는 경로다. 하네스가 `settings.ANTHROPIC_API_KEY` 를 가짜 값으로 두고 `api.anthropic.com/v1/messages` 요청에 흉내 Claude 가 고정 한국어 마크다운 답(비스트림 JSON 또는 SSE)을 준다. `.env` 의 키, 로컬 Ollama 와 상관없다.

## 테스트 목록

### backend

#### backend/tests/conftest.py (fixture)
| 이름 | 종류 | 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|---|
| (모듈 수준 코드) | import 시점 | `os.environ["DATABASE_URL"]` 을 `sqlite+aiosqlite:///backend/tests/test_agentlens.db` 로 바꾼 뒤 `app.database` 를 import 한다 (`conftest.py:6-9`). `TESTING`, `CI` 는 설정하지 않는다. LLM 키는 아래 `llm_isolation` 이 테스트마다 지운다 | `app/config.py`, `app/database.py` | 없음 |
| `init_db` | autouse async fixture, 함수 범위 | 테스트마다 `ensure_db_schema()` 를 부르고(`create_all` 이라 없는 테이블만 만든다), id=1 `NewsItem`(LangGraph Harness, quality 8.5) 이 없으면 넣는다. teardown 이 없어 데이터는 테스트·실행 사이에 남는다 | `app/database.py:45` `ensure_db_schema`, `app/models` | 없음 |
| `settings_file_copies` | 세션 fixture | 세션 임시 폴더에 루트 `config.json` 사본(`llm` 절의 `anthropic_api_key`·`openai_api_key`·`gemini_api_key`·`ollama_base_url` 을 빈 값으로)과 `find_sources_file()` 이 찾은 `sources.json` 사본을 만든다. 원본은 읽기만 한다 | `app/config.py` `load_json_config`, `app/services/sources_service.py` `find_sources_file` | 없음 |
| `llm_isolation` | autouse fixture, 함수 범위 | LLM 환경 변수 다섯 개(`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`)를 지우고, `settings` 의 같은 필드를 비우고(`OLLAMA_MODEL` 은 `llama3.2:latest`), `llm_processor.openai_key`·`ollama_url` 을 `None`, `gemini_key` 를 빈 값으로 둔 뒤 `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"`. `app.config.find_config_json`·`_json_data` 와 `sources_service._file_path`·`_mirror_path` 를 세션 사본으로, `Settings.model_config["env_file"]` 을 `None` 으로 바꾼다. `fake_llm` 을 설치하고 정리 단계에서 `assert_no_unmocked()` 로 흉내 없는 LLM 요청이 있었으면 테스트를 실패시킨다 | `app/config.py`, `app/services/llm_processor.py`, `app/services/sources_service.py` | `monkeypatch`, 흉내 LLM |
| `fake_llm` | fixture, 함수 범위 | `llm_fakes.install` 로 `httpx`·`httpx2` 의 `HTTPTransport.handle_request`·`AsyncHTTPTransport.handle_async_request` 를 감싼 흉내 객체(`llm_fakes.FakeLLM`)를 돌려준다. 흉내 Claude 는 기본 등록, `register_openai()`, `register_ollama(url, state="up"\|"down", models=[…])` 로 더 등록한다. `requests(provider, path)` 로 받은 요청(method, url, JSON 본문, timeout)을 조회하고, 등록되지 않은 LLM 호스트 요청은 `ConnectError` 를 내며 `unmocked` 에 남긴다 (`assert_no_unmocked`, `take_unmocked`) | `backend/tests/llm_fakes.py` | 흉내 LLM |
| `llm_sources` | fixture, 함수 범위 | 기본 상태 위에서 Anthropic 키까지 비우고, 세션 사본에서 테스트별 `config.json` 사본을 만들어 `find_config_json` 을 돌린다. 메서드: `anthropic(key)`, `gemini(key)`, `openai(key, source="settings"\|"env"\|"config")`, `ollama_url(url, source="settings"\|"config")`, `ollama_model(model, source=…)`, `override(openai_key=…, ollama_url=…)` | `backend/tests/conftest.py` `LLMSources` | `monkeypatch` |

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
| test_chat_stream_3tier_model_routing | `POST /api/chat/stream` 의 done 이벤트에 `model_tier: haiku` 와 usage 가 있다 | `api/chat.py` `chat_stream`, `ChatService.stream_chat` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |
| test_chat_query_3tier_model_routing | `POST /api/chat/query` 가 `model_tier: opus`, model 에 opus, usage 를 돌려준다 | `chat_query`, `query_chat` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |
| test_chat_session_persistence_with_model_tier_and_usage | `persist_turn` 이 model_tier·usage 를 저장하고 상세 조회로 복원한다 | `services/chat_session_service.py` | 없음 (테스트 DB) |
| test_anti_gemini_has_live_provider_ignores_gemini_key | Gemini 키만 있으면 `has_live_provider()` 가 False | `has_live_provider` | settings·environ·`load_json_config`·`is_available` patch |
| test_anti_gemini_model_sanitization | 과거 모델명(Gemini 등)을 그대로 두고 빈 값은 `claude-sonnet-5-5` | `sanitize_model_identifier` | 없음 |
| test_anthropic_config_and_schema_defaults | `DEFAULT_MODEL`, 설정, 채팅 스키마 기본 모델이 `claude-sonnet-5-5` | `anthropic_provider.DEFAULT_MODEL`, `config.py`, `schemas/chat.py` | 없음 (`.env` 의 모델 값에 영향받는다) |
| test_anti_gemini_isolation_in_generate_live_answer | 가용 프로바이더가 없으면 `LLMProviderUnavailableException`, `_call_gemini` 미호출 | `generate_live_answer` | settings·`is_available`·`_call_gemini` patch |
| test_anti_gemini_isolation_in_stream_tokens | 같은 조건에서 `stream_tokens` 가 예외를 던진다 | `stream_tokens` | settings·`is_available` patch |
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
| test_ask_ai_endpoint | `POST /api/news/{id}/ask` 200, answer 키 (뉴스 항목이 있을 때만 단언) | `news.py:111-135`, `llm_processor.answer_question_with_meta` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |
| test_ask_ai_stream_endpoint | `POST /api/news/{id}/ask/stream` 이 text/event-stream, `data: ` 포함 | `news.py:137-167`, `stream_question_answer` | ASGI, 흉내 Claude (하네스, 실제 호출 없음) |

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
| test_briefing_settings_get_and_post | 설정 조회에 title/notion/email/webhooks, 갱신 응답 success | `briefing.py` `get/update_briefing_settings`, `config.save_json_config` | 없음, 세션 사본 `config.json` 에 쓴다 (루트 파일은 바뀌지 않음) |

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

#### backend/tests/test_collect_script.py (5)
`scripts/collect.py` 를 경로로 불러와(`importlib`) `main(env)` 를 작업 스레드에서 돌린다 (`asyncio.run` 이 pytest-asyncio 루프와 섞이지 않게). API 모드는 같은 파일 안 `http.server` 스텁(`/health`, `GET /api/schedule/progress`, `POST /api/schedule/trigger` 만 응답)에 붙는다. 모든 스텁 경우에서 받은 경로에 `reset-and-collect` 가 없음을 단언한다.
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_auto_api_mode_success | `auto` + healthy 스텁: 첫 줄 `API 모드: <URL>`, trigger 를 보내고 `last_crawl_time` 이 바뀌면 수집·저장 건수를 내고 종료 0 | `scripts/collect.py` `main`, `run_api` | 스텁 HTTP 서버, `POLL_INTERVAL` 0.05 |
| test_api_mode_error_finish | running 뒤 `last_crawl_time` 그대로 끝나면 종료 1, 마지막 `step_message` 를 낸다 | `run_api` | 스텁 HTTP 서버 |
| test_api_mode_timeout | `COLLECT_TIMEOUT=1` 과 계속 running 이면 종료 1, 5초 안에 끝난다 | `run_api` | 스텁 HTTP 서버 |
| test_auto_direct_mode | 응답 없는 URL + `auto`: 첫 줄 `직접 모드:`, `ensure_db_schema`·`collect_all` 이 한 번씩 불리고 종료 0, `실패한 소스: B` 줄 | `run_direct` | `app.database.ensure_db_schema`·`collector_manager.collect_all` AsyncMock |
| test_api_mode_without_backend | `COLLECT_MODE=api` + 응답 없는 URL: 종료 1, "backend 가 없다", `collect_all` 이 불리지 않음 | `main` | `collect_all` AsyncMock |

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
| test_evaluate_content_with_llm_strict_gate | 비 AI 글은 pre-filter 로 거절, AI 글은 통과(quality ≥ 7.0) | `llm_processor.evaluate_content_with_llm` | 흉내 Claude (하네스, 실제 호출 없음): 두 번째 호출의 흉내 답은 JSON 이 아니라 휴리스틱 폴백으로 판정된다 |

#### backend/tests/test_config_and_live_llm.py (3)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_config_json_found_and_loaded | config.json 을 찾고 PROJECT_NAME, VERSION(허용 목록), 스케줄, 품질 임계값(5.0, 7.0)을 읽는다 | `config.py` `find_config_json`, `Settings` | 없음 |
| test_get_custom_json_value | 임의 섹션 값 조회와 기본값 | `Settings.get_custom_json_value` | 없음 |
| test_llm_processor_fallback_and_answer | `answer_question` 이 20자 넘는 문자열을 돌려준다 | `llm_processor.answer_question` | 흉내 Claude (하네스, 실제 호출 없음), 캐시 상태에 따라 다름 |

#### backend/tests/test_deep_researcher.py (4)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_probe_and_discover_feed_github | GitHub 저장소 URL 에서 releases.atom 피드를 찾아 항목을 읽는다 | `services/deep_researcher.py` `probe_and_discover_feed` | **실호출** (github.com) |
| test_evaluate_and_decide_scoring | 하네스 관련 피드를 AUTO_ADOPTED 또는 WATCHLIST, 점수 ≥ 7.5 로 판정한다 | `evaluate_and_decide` | 없음 (sources.json 읽기, 휴리스틱) |
| test_deep_research_run_and_audit | 후보 2개를 평가하고 `SourceResearchLog` 감사 로그를 남긴다 | `run_deep_research` | **실호출** (시드 사이트 2곳), 세션 사본 sources.json 쓰기 가능 |
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
| test_version_0_2_2_consistency | `settings.VERSION` 과 config.json `app.version` 이 0.4.0 | `config.py` | 없음 |
| test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k | "WinDbg MCP 서버" 는 9004 한 건만 돌려준다 | `retrieve` | 없음 |
| test_dynamic_retrieval_returns_empty_when_no_relevant_articles_exist | 무관한 질의는 0건 | `retrieve` | 없음 |
| test_chat_service_global_rag_returns_dynamic_source_count | `_resolve_sources` 가 1건/0건을 그대로 돌려준다 | `ChatService._resolve_sources` | 없음 |

#### backend/tests/test_llm_processor.py (13)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_extract_tech_stack | 텍스트에서 Claude 3.7, DeepSeek-R1, SWE-bench, LangGraph, FastMCP 를 뽑는다 | `extract_tech_stack` | 없음 |
| test_evaluate_quality_and_signal | 하네스 글은 quality ≥ 7.0 통과, 스팸은 5.0 미만 거절 | `evaluate_quality_and_signal` | 없음 |
| test_generate_synthesis | TL;DR 2개 이상, why_it_matters, tech_stack 에 MCP | `generate_synthesis` | 없음 |
| test_answer_question | `answer_question` 이 20자 넘는 문자열 | `answer_question` | 흉내 Claude (하네스, 실제 호출 없음) |
| test_base_llm_provider_interface | `BaseLLMProvider` 가 추상이고 4개 추상 메서드를 가진다 | `llm_providers/base.py` | 없음 |
| test_unit_test_mock_provider | 테스트 안에 정의한 mock 프로바이더가 동작한다 (제품 코드 검증 아님) | 테스트 파일 내부 클래스 | 없음 |
| test_check_provider_available_production_gate | 프로바이더가 없으면 `LLMProviderUnavailableException` | `check_provider_available` | `has_live_provider` patch |
| test_generate_live_answer_fails_fast_without_mock_fallback | 모든 프로바이더 실패 시 `LLMUpstreamException` | `generate_live_answer` | `has_live_provider`·`is_available`·`_call_openai`·`_call_ollama` patch |
| test_stream_tokens_fails_fast_without_mock_fallback | 모든 프로바이더 실패 시 `stream_tokens` 가 `LLMUpstreamException` | `stream_tokens` | `has_live_provider`·`is_available`·`openai_key`·`ollama_url` patch (빈 값 덮어쓰기로 OpenAI·Ollama 갈래가 꺼진다) |
| test_chat_stream_end_to_end_with_mocked_llm | `/api/chat/stream` 이 sources·token·done 과 모델명을 낸다 | `chat_stream` | ASGI, `stream_tokens` patch, `check_provider_available` 은 실제 (하네스의 가짜 Anthropic 키로 True) |
| test_chat_query_end_to_end_with_mocked_llm | `/api/chat/query` 가 mock 답과 모델명을 돌려준다 | `chat_query` | ASGI, `generate_live_answer` patch |
| test_scoped_chat_stream_end_to_end_with_mocked_llm | scoped 스트림이 status·sources·token·done 을 내고 mock fallback 문구가 없다 (item 999 를 만들고 finally 에서 지운다) | `chat_stream` (scoped) | ASGI, `stream_tokens` patch, **실호출** (`https://example.com/isolated-scoped-benchmark` 스크랩) |
| test_mock_llm_provider_removed_from_app_services | `llm_providers.mock_provider` import 가 실패한다 | 모듈 존재 여부 | 없음 |

#### backend/tests/test_llm_provider_isolation.py (14)
모든 테스트가 `llm_sources`(Anthropic 키까지 비운 시작 상태)와 `fake_llm` 을 쓴다. 행 테스트(가드 제외)는 fixture `gemini_spy` 로 `settings.GEMINI_API_KEY` 를 두고 `_call_gemini` 를 `AsyncMock` 으로 감싸 `call_count == 0` 을 단언한다. 흉내 Ollama 주소는 `http://fake-ollama.test:11434`, 설치 모델은 `llama3.2:latest`.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_t1_claude_key_skips_ollama_probe | Anthropic 키 있음, Ollama 연결 안 됨: `has_live_provider()` True, Ollama 요청 0회, 생성·스트림이 흉내 Claude 답과 `claude-` 모델 | `has_live_provider`, `generate_live_answer`, `stream_tokens` | 흉내 Claude·Ollama(`down`) |
| test_t2_claude_preferred_over_installed_ollama | Anthropic 키 있음, Ollama 설정 모델 설치: True, `/api/tags`·`/api/generate` 0회, 생성·스트림 Claude 답 | 같음 | 흉내 Claude·Ollama(`up`) |
| test_t3_no_provider_when_ollama_unreachable | 키 없음, Ollama 연결 안 됨: False, 생성·스트림 `LLMProviderUnavailableException` | 같음 | 흉내 Ollama(`down`) |
| test_t4_missing_ollama_model_is_unavailable | 키 없음, Ollama 는 떠 있고 다른 모델(`gpt-oss:20b`)만: False, 생성·스트림 `LLMProviderUnavailableException`, `/api/generate` 0회 | `_ollama_status` | 흉내 Ollama(`up`) |
| test_t5_installed_ollama_model_used[settings_model] | 키 없음, 설정 모델 설치(`settings.OLLAMA_MODEL`): True, 생성·스트림 흉내 Ollama 답, `/api/generate` 요청 `model` 두 번 모두 `llama3.2:latest` | `_resolve_ollama_generate_model`, `_call_ollama`, `stream_tokens` | 흉내 Ollama(`up`) |
| test_t5_installed_ollama_model_used[config_model] | 같은 조건에서 `settings.OLLAMA_MODEL` 이 비고 테스트별 `config.json` 의 `llm.ollama_model` 이 모델을 줄 때 생성·스트림이 같은 모델을 쓴다 | 같음 | 흉내 Ollama(`up`) |
| test_t6_openai_key_only | OpenAI 키만(`settings`): True, 생성은 흉내 OpenAI 답, 스트림(openai SDK)은 흉내 SSE 조각을 이은 답, OpenAI 요청 2회 | `_call_openai`, `stream_tokens` OpenAI 갈래 | 흉내 OpenAI(`httpx`·`httpx2`), Ollama(`down`) |
| test_t7_ollama_url_from_config_json_when_settings_empty | `settings.OLLAMA_BASE_URL` 이 비고 테스트별 `config.json` 의 `llm.ollama_base_url` 만 있을 때 판정·생성·스트림이 그 주소를 쓴다 | `_resolve_ollama_url` | 흉내 Ollama(`up`) |
| test_t7b_empty_overrides_disable_openai_and_ollama | OpenAI 키(settings·환경 변수·config)와 Ollama 주소(settings·config)가 있어도 덮어쓰기 `openai_key = ""`·`ollama_url = ""` 면 False, 생성·스트림 `LLMProviderUnavailableException`, OpenAI·Ollama 요청 0회 | `_resolve_openai_key`, `_resolve_ollama_url` | 흉내 OpenAI·Ollama(`up`) |
| test_t8_untagged_model_matches_latest_tag | 설정 모델 `llama3.2` 가 설치된 `llama3.2:latest` 와 맞아 True, 생성이 흉내 Ollama 답 | `_ollama_status` | 흉내 Ollama(`up`) |
| test_ollama_probe_is_single_request_with_1s_timeout | `has_live_provider()` 한 번에 `/api/tags` 요청 1회, 요청 timeout 값이 모두 1.0 | `_ollama_status` | 흉내 Ollama(`up`) |
| test_api_chat_stream_503_when_ollama_model_missing | T4 조건에서 `POST /api/chat/stream` 이 스트림을 열기 전 503 `ERR_LLM_PROVIDER_UNAVAILABLE` | `api/chat.py` `chat_stream`, `check_provider_available` | ASGI, 흉내 Ollama(`up`) |
| test_api_chat_query_503_when_ollama_model_missing | T4 조건에서 `POST /api/chat/query` 503 `ERR_LLM_PROVIDER_UNAVAILABLE`, WARNING 로그에 `설정 모델 미설치` | `chat_query`, `check_provider_available` | ASGI, 흉내 Ollama(`up`), `caplog` |
| test_guard_records_unmocked_llm_request | 흉내 Ollama 등록 없이 `httpx.Client().get("http://localhost:11434/api/tags")` 가 `ConnectError`, `assert_no_unmocked()` 가 `AssertionError`, `take_unmocked()` 로 기록을 비운다 | `llm_fakes.FakeLLM` 가드 | 흉내 LLM 가드 |

#### backend/tests/test_make_targets.py (34)
Makefile·`docker-compose.yml` 회귀 검사. `make` 는 `-n` 으로만 부르고(대상을 실제로 실행하지 않는다), 부르기 전마다 Makefile 에 `$(MAKE)`·`${MAKE}`·`$(shell`·`${shell`·`+` 접두 레시피 줄이 없음을 단언한다. 환경에서 `MAKEFLAGS`·`MFLAGS`·`MAKELEVEL` 과 Makefile 변수 5개를 지운다.
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_t1_defined_targets_match_list | Makefile 에 정의된 대상이 12개 목록과 같다 | `Makefile` | 없음 (파일 읽기) |
| test_t1_phony_targets_match_list | `.PHONY` 이름 합집합이 12개 목록과 같다 | `Makefile:3` | 없음 |
| test_t1_shell_is_bash | `SHELL := /bin/bash` 줄 | `Makefile:1` | 없음 |
| test_t2_dry_run_executes_nothing | `make -n` 이 실제로 실행하는 구문이 없다 | `Makefile` | 없음 |
| test_t2_make_dry_run_succeeds (12, 대상별) | `make -n <대상>` 종료 0, stderr 빈 값 | `Makefile` | `make -n` 하위 프로세스 |
| test_t2_test_target_equals_check | `make -n test` 출력 == `make -n check` 출력 | `Makefile:44, 98-101` | `make -n` |
| test_t3_referenced_file_exists (7, 파일별) | `scripts/dev.sh`, `scripts/collect.py`, `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `backend/requirements.txt`, `frontend/pnpm-lock.yaml` 가 있다 | 레시피가 부르는 파일 | 없음 |
| test_t3_dev_script_is_executable_and_parses | `scripts/dev.sh` 실행 권한, `bash -n` 종료 0 | `scripts/dev.sh` | `bash -n` |
| test_t3_collect_script_compiles | `scripts/collect.py` 가 `py_compile` 된다 (바이트코드는 `tmp_path`) | `scripts/collect.py` | 없음 |
| test_t4_makefile_has_no_or_true | Makefile 에 `\|\| true` 가 없다 | `Makefile` | 없음 |
| test_t4_compose_config_json_is_writable | compose 에 `config.json` 읽기 전용 마운트가 없고 `./config.json:/app/config.json:rw` 가 있다 | `docker-compose.yml:38` | 없음 |
| test_t4_compose_config_is_valid | `docker compose config -q` 종료 0 (docker CLI 가 없으면 skip) | `docker-compose.yml` | docker CLI (daemon 불필요) |
| test_t5_reset_uses_api_url_variable | `make -n reset AGENTLENS_API_URL=http://127.0.0.1:9` 출력에 그 URL·`curl`·`reset-and-collect` 가 있고 `localhost:8000` 이 없다 | `Makefile:57-73` | `make -n` |
| test_t5b_docker_logs_user_stop_is_success (4, 종료 코드별) | `make -n docker-logs` 레시피를 가짜 `docker` 가 앞선 PATH 에서 bash 로 돌려 docker 종료 0→0, 130→0, 1→1, 2→2 | `Makefile:90-96` | 가짜 `docker` 스크립트 |

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
| test_version_is_0_2_2 | `settings.VERSION == "0.4.0"` | `config.py` | 없음 |
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
| test_sources_toggle_and_crud | RSS 추가 → 토글(비활성) → 삭제 | `add_rss_source`, `toggle_source`, `delete_source` | 없음, 세션 사본 sources.json 에 쓴다 |
| test_source_researcher_discover | "harness" 질의로 후보를 찾고 첫 후보 점수 ≥ 7.0 | `services/source_researcher.py` `discover_sources` | 없음 (메모리 카탈로그) |
| test_source_researcher_inspect_url | GitHub 저장소 URL 에서 releases.atom 피드를 찾는다 | `inspect_url` | **실호출** (github.com) |
| test_sources_and_research_api_endpoints | `GET /api/sources` 통계, `POST /api/research/discover`, `POST /api/research/register-candidate` 성공 후 정리 | `api/sources.py`, `api/research.py` | ASGI, 세션 사본 sources.json 에 쓰고 지운다 |

#### backend/tests/test_sources_write_fallback.py (2)
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_save_sources_falls_back_to_in_place_write_on_ebusy | `Path.replace` 가 `OSError(EBUSY)` 를 내도 `save_sources` 가 True, 파일 내용이 새 값(갱신된 `updated_at` 포함), `sources.tmp` 가 남지 않는다 | `services/sources_service.py:102-132` | `pathlib.Path.replace` monkeypatch, 세션 사본 sources.json 에 쓴다 |
| test_save_sources_uses_atomic_replace_normally | 평소에는 `replace` 가 한 번 불리고 내용이 같고 `.tmp` 가 없다 | `save_sources` | `Path.replace` 감시 함수, 세션 사본 |

#### backend/tests/test_startup_seed.py (2)
`app.main` 의 `AsyncSessionLocal`·`engine` 을 `tmp_path` 의 SQLite 로, `ensure_db_schema` 를 AsyncMock 으로, `start_scheduler`·`stop_scheduler` 를 빈 함수로 바꿔 lifespan 을 직접 돌린다 (공용 테스트 DB 의 기사를 지우지 않는다).
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| test_empty_db_seed_runs_in_background_and_is_cancelled_on_shutdown | 빈 DB: lifespan 진입이 1초 안, 안에서 `GET /health` 200 과 `running: true`, 빠져나올 때 수집 태스크가 취소되고 `is_running` 이 false | `main.py:23-47` | 오래 걸리는 `collect_all` 흉내, ASGI |
| test_db_with_items_does_not_seed | 기사 1건 DB: lifespan 출입 뒤 `collect_all` 을 부르지 않는다 | `main.py:28-36` | `collect_all` AsyncMock |

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
| `window.matchMedia` | jsdom 에 없는 함수를 폭 1280px 데스크톱으로 가정한 mock 으로 채운다. `(min-width: Npx)` 는 N ≤ 1280 이면 참, `(max-width: Npx)` 는 N ≥ 1280 이면 참, `prefers-color-scheme` 등 그 밖의 특성은 거짓, 리스너 등록은 아무것도 하지 않는다. 쓰기 가능이라 테스트가 `window.matchMedia = …` 로 바꿀 수 있다 (`setup.ts:9-55`) |
| `vi.mock('next/navigation')` | `useRouter`(push/replace/prefetch/back), `useSearchParams().get → null`, `usePathname → ''` 를 기본 mock 으로 둔다. 여러 테스트 파일이 자체 mock 으로 덮어쓴다 |
| MSW `server` | `beforeAll` 에서 `server.listen({ onUnhandledRequest: 'bypass' })`, `afterEach` 에서 `resetHandlers`, `afterAll` 에서 `close`. 핸들러는 `frontend/src/mocks/handlers.ts` (+ `mocks/handlers/chat.ts`)의 `*/api/...` 경로다. 핸들러가 없는 요청은 실제 네트워크로 그대로 나간다 (`setup.ts:70`) |

frontend 공통: 아래 표에서 "없음" 은 콜백을 `vi.fn()` 으로 넘기는 것 말고는 mock 이 없다는 뜻이다. setup.ts 의 전역 mock 은 항상 켜져 있다.

#### frontend/src/tests/AskAiPanel.test.tsx (8) — 대상 `components/news-detail/AskAiPanel.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders quick prompts and placeholder when chat history is empty | 대화 기록이 없으면 빠른 질문 프롬프트와 placeholder 를 보여준다 | AskAiPanel | 없음 |
| triggers onAsk with prompt text when quick prompt pill is clicked | 빠른 질문 pill(`핵심 원리 및 구조`) 클릭 시 그 질문문으로 onAsk 를 부른다 | AskAiPanel | 없음 |
| draws a decorative icon before each quick prompt label instead of an emoji (R44) | `빠른 질문` 그룹의 빠른 질문 버튼마다 `svg[aria-hidden="true"]` 가 하나 있고, 라벨(`QUICK_PROMPTS[].label`)에 그림 이모지가 없다 | AskAiPanel | 없음 |
| renders chat messages correctly when chat history exists | 대화 기록이 있으면 메시지를 보여준다 | AskAiPanel | 없음 |
| uses the short placeholder 이 기사에 대해 질문하세요 | `질문 입력` 입력창의 자리표시가 `이 기사에 대해 질문하세요` 다 | AskAiPanel | 없음 |
| shows 복사 실패 on the failed answer copy button with a polite live region (copyFailedIndex) | `copyFailedIndex` 의 답변 `답변 복사` 버튼만 `복사 실패` 를 보이고, `복사 실패` 를 읽는 `aria-live="polite"` `sr-only` 영역이 하나 있다 | AskAiPanel | 없음 |
| keeps the plain 복사 label when copyFailedIndex is null | `copyFailedIndex` 가 null 이면 어느 복사 버튼에도 `복사 실패` 가 없다 | AskAiPanel | 없음 |
| renders quick prompts in a single scroll row named 빠른 질문 | 빠른 질문이 `빠른 질문` 이름의 그룹 하나(`data-scroll-row`, `data-overflow`)에 모두 있다 | AskAiPanel, ScrollRow | 없음 |

#### frontend/src/tests/chat/ActiveSourceChip.test.tsx (4) — 대상 `components/chat/ActiveSourceChip.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders category and title accurately | 카테고리 짧은 라벨(`mcp_plugins_skills` → `MCP`)과 제목을 보여준다 | ActiveSourceChip, `lib/labels.ts` | fixture `mocks/fixtures/chat.ts` |
| calls onRemove when the remove button is clicked | 제거 버튼 클릭 시 onRemove | ActiveSourceChip | 없음 |
| does not trigger onRemove when disabled | disabled 면 onRemove 를 부르지 않는다 | ActiveSourceChip | 없음 |
| calls onPreviewClick when title or preview button is clicked | 제목·미리보기 클릭 시 onPreviewClick | ActiveSourceChip | 없음 |

#### frontend/src/tests/chat/ChatHeader.test.tsx (12) — 대상 `components/chat/ChatHeader.tsx`
마지막 두 테스트(`새 대화` 표시 조건)는 `window.matchMedia` 를 지정한 폭으로 답하는 mock 으로 바꾸고 `afterEach` 에서 되돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders navigation back link to feed and brand title | 피드로 돌아가는 링크와 브랜드 제목 | ChatHeader | 없음 |
| renders scope segmented controls and calls onScopeChange | scope 세그먼트 컨트롤과 onScopeChange 호출 | ChatHeader | 없음 |
| renders ActiveSourceChip when activeSource is provided | activeSource 가 있으면 칩을 보여준다 | ChatHeader, ActiveSourceChip | fixture |
| calls onNewChat when 새 대화 button is clicked | "새 대화" 클릭 시 onNewChat | ChatHeader | 없음 |
| disables new chat button when streaming | 스트리밍 중 새 대화 버튼 비활성 | ChatHeader | 없음 |
| does not render a model selector in the header (R39: the composer is the only place) | 헤더에 `Claude 모델 선택` 버튼이 없다 (`queryByRole` null). 모델 선택은 입력창 한 곳 | ChatHeader | 없음 |
| names the two scope tabs exactly 단일 기사 and 전체 소식 inside the 검색 스코프 모드 group (R37·R38) | 그룹 `검색 스코프 모드` 안 두 버튼의 접근 이름이 정확히 `단일 기사`·`전체 소식` | ChatHeader, ChatContextBar | 없음 |
| puts the 피드로 돌아가기 link before the 대화 기록 보기 button, as the first control in the header (R43) | `피드로 돌아가기` 링크가 `대화 기록 보기` 버튼보다 DOM 앞이고, `header` 안 첫 `a[href]`·`button` 이 그 링크다 | ChatHeader | 없음 |
| 기록이 닫혀 있으면 aria-controls 를 달지 않고 aria-expanded 는 false | `isHistoryOpen=false` 면 `대화 기록 보기` 버튼에 `aria-controls` 가 없고 `aria-expanded="false"` | ChatHeader | 없음 |
| 기록이 열려 있으면 aria-controls 와 aria-expanded="true" 를 단다 | `isHistoryOpen=true` 면 `aria-expanded="true"` 와 `chat-history-sidebar` 또는 `chat-history-drawer` 를 가리키는 `aria-controls` | ChatHeader | 없음 |
| shows 새 대화 below 1024px even when the sidebar is open, and calls onNewChat | 폭 800px 에서는 사이드바가 열려 있어도 "새 대화" 버튼이 보이고 누르면 onNewChat | ChatHeader (`!isDesktop \|\| !isSidebarOpen`) | `window.matchMedia` 폭 800 mock |
| hides 새 대화 at 1024px and above while the sidebar is open | 폭 1280px 에서 사이드바가 열려 있으면 "새 대화" 버튼이 없다 | ChatHeader | `window.matchMedia` 폭 1280 mock |

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
| renders dual citations [1] and [S1] appropriately in assistant message | [1], [S1] 인용 배지. [S1] 은 `data-tone="supplementary"` 와 `text-success` 클래스 | ChatMessageItem, CitationBadge | 없음 |
| renders WorkflowStepTracker in assistant message when step_history or current_status is present | 단계 정보가 있으면 WorkflowStepTracker | ChatMessageItem, WorkflowStepTracker | 없음 |
| renders ultra-long unspaced text with break-words, [overflow-wrap:anywhere], and flex-1 min-w-0 max-w-full bubble | 공백 없는 긴 텍스트 줄바꿈 클래스 | ChatMessageItem | 없음 |
| renders long inline code with break-all, font-mono, and border styling | 긴 인라인 코드 스타일 (`break-all`, `font-mono`, `text-[12px]`, 배경 토큰 `bg-surface-muted`) | ChatMessageItem | 없음 |
| renders markdown table wrapped in an isolated horizontal scroll wrapper | 표를 가로 스크롤 래퍼로 감싼다 | ChatMessageItem | 없음 |
| renders headings h1-h3, li, and blockquote with [overflow-wrap:anywhere] and break-words | 제목·목록·인용 줄바꿈 클래스 | ChatMessageItem | 없음 |
| accurately displays true backend source counts (e.g., 1 or 3) and never hardcodes 5 items | 실제 출처 개수(1, 3)를 보여주고 5 고정값이 없다 | ChatMessageItem | 없음 |
| hides source count badges while streaming (even with non-empty content and sources) and shows them only when status === "completed" | 스트리밍 중 출처 개수 배지를 숨기고 완료 시에만 보여준다 | ChatMessageItem | 없음 |

#### frontend/src/tests/chat/ChatMessageList.test.tsx (5) — 대상 `components/chat/ChatMessageList.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders Welcome Empty View with 4 suggestion prompt pills when messages array is empty | 메시지가 없으면 환영 화면과 제안 4개 | ChatMessageList | 없음 |
| renders accessible message list with role log and aria-live | role=log, aria-live 목록 | ChatMessageList | 없음 |
| enforces overflow-x-hidden, w-full, and max-w-full on message list container | 가로 넘침 방지 클래스 | ChatMessageList | 없음 |
| 추천 질문 버튼마다 text-left 를 직접 단다 (spec 14.6) | 추천 질문 버튼 4개가 모두 `text-left` 클래스를 가진다 (글자 왼쪽 정렬) | ChatMessageList | 없음 |
| sends the suggestion text without emoji and draws one decorative lucide icon per card (R44) | 첫 추천 카드를 누르면 `onSelectPromptSuggestion('FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법')`(이모지 없음). 카드마다 첫 자식이 `svg.text-accent[aria-hidden="true"]` 하나이고 글자에 그림 이모지가 없다 | ChatMessageList | 없음 |

#### frontend/src/tests/chat/ChatModelSelector.test.tsx (15) — 대상 `components/chat/ChatModelSelector.tsx`, `ModelChangeDivider.tsx`, `ModelTierBadge.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders inline chip trigger with default Sonnet 5.5 tier and icon | 기본 Sonnet 5.5 칩 트리거. 트리거 안 `[data-tier-icon="sonnet"]` 가 `svg` 이고 `aria-hidden="true"`, 트리거 글자에 그림 이모지가 없다 | ChatModelSelector, TierIcon | 없음 |
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
| renders chip variant with tier icon, name, and relative cost | 칩 변형의 티어 아이콘(`[data-tier-icon="haiku"]`)·이름·상대 비용 | ModelTierBadge, TierIcon | 없음 |
| renders footer variant with latency in milliseconds | footer 변형의 티어 아이콘(`[data-tier-icon="sonnet"]`)과 지연시간(ms) | ModelTierBadge, TierIcon | 없음 |
| renders recommendation tag when showRecommended is true for Sonnet | Sonnet 추천 태그 | ModelTierBadge | 없음 |
| can hide icon when showIcon is false | showIcon=false 면 `[data-tier-icon]` 이 없다 | ModelTierBadge | 없음 |

#### frontend/src/tests/chat/ChatPromptInput.test.tsx (9) — 대상 `components/chat/ChatPromptInput.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders textarea with accessible role and placeholder | 접근 가능한 textarea 와 placeholder | ChatPromptInput | 없음 |
| triggers onChange when typing | 입력 시 onChange | ChatPromptInput | 없음 |
| calls onSubmit on Enter key (when not composing and not shift) | Enter 로 onSubmit | ChatPromptInput | 없음 |
| does NOT call onSubmit when Shift+Enter is pressed | Shift+Enter 는 제출하지 않는다 | ChatPromptInput | 없음 |
| does NOT call onSubmit when IME is composing | IME 조합 중 Enter 는 제출하지 않는다 | ChatPromptInput | 이벤트 `isComposing` 속성 지정 |
| renders Stop generating button when isStreaming is true and calls onStopGenerating | 스트리밍 중 중지 버튼과 onStopGenerating | ChatPromptInput | 없음 |
| displays character counter and highlights warning when length exceeds maxLength | 글자 수 표시와 초과 경고 | ChatPromptInput | 없음 |
| renders the model trigger with Sonnet 5.5 and calls onSelectTier with haiku | `selectedTier`·`onSelectTier` 를 넘기면 `Claude 모델 선택` 버튼 글자가 `Sonnet 5.5`, `Haiku 5.5` 를 고르면 `onSelectTier('haiku')` | ChatPromptInput, ChatModelSelector | 없음 |
| disables the model trigger while streaming | `isStreaming` 이면 `Claude 모델 선택` 버튼이 `disabled` | ChatPromptInput, ChatModelSelector | 없음 |

#### frontend/src/tests/chat/ChatSessionWorkflow.test.tsx (5) — 대상 `components/chat/ChatWorkspace.tsx`, `useChatSessions.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders initial clean slate and generates new session UUID without auto-loading past session | 처음엔 빈 화면, 새 세션 UUID, 과거 세션 자동 로드 없음 | ChatWorkspace | MSW 세션 핸들러, `resetMockSessionStore`, next/navigation mock, localStorage 초기화 |
| hydrates full 4-pillar context (messages, scopeMode, activeSource) when selecting a past session | 과거 세션 선택 시 메시지·scope·출처 복원 (스코프 탭은 접근 이름 정확히 `단일 기사` 로 찾아 `aria-pressed="true"` 확인. 세션 카드 이름 `…, 단일 기사 모드` 와 겹치지 않게 정확 일치) | ChatWorkspace, useChatSessions | 같음 |
| allows continuous multi-turn chat after session hydration | 복원 후 연속 대화 | ChatWorkspace | 같음 (MSW 스트림) |
| resets to new session and empty state when "+ 새 대화" is clicked | "+ 새 대화" 로 새 세션·빈 상태 | ChatWorkspace | 같음 |
| deletes a session via DELETE API and resets active conversation if deleted session was active | DELETE 후 활성 세션이면 대화 초기화 | ChatWorkspace, useChatSessions | 같음 |

#### frontend/src/tests/chat/ChatSidebar.test.tsx (11) — 대상 `components/chat/ChatSidebar.tsx`, `ChatHistoryDrawer.tsx`, `SessionItemCard.tsx`, `DeleteConfirmPopover.tsx`, `SessionList.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders desktop navigation panel with header, + 새 대화 button, search input, and session items | 데스크톱 패널의 헤더·새 대화·검색·세션 목록 | ChatSidebar | 없음 |
| filters session items based on searchQuery | 검색어로 세션 필터 | ChatSidebar, SessionList | 없음 |
| renders skeleton loading state when isLoading is true | 로딩 스켈레톤 | ChatSidebar | 없음 |
| renders error state and triggers retry when load fails | 오류 상태와 재시도 | ChatSidebar | 없음 |
| renders empty state when there are no saved sessions | 빈 상태 | ChatSidebar | 없음 |
| renders mobile slide-over drawer with backdrop and close button when isOpen is true | 모바일 드로어의 배경·닫기 버튼 | ChatHistoryDrawer | 없음 |
| calls onClose when backdrop is clicked or Escape key is pressed | 배경 클릭·Escape 로 onClose | ChatHistoryDrawer | 없음 |
| renders active session highlight with data-active, bg-accent-soft and border-accent | 활성 세션은 `aria-current="true"`, `data-active="true"`, 토큰 클래스 `bg-accent-soft`·`border-accent` | SessionItemCard | 없음 |
| renders truncated title, relative time, and scope badge | 잘린 제목·상대 시간·scope 배지(`단일 기사`) | SessionItemCard | 없음 |
| uses 단일 기사 / 전체 소식 for the scope badge and accessible name, with no Scoped·Global text (R38) | `global` 세션 배지 `전체 소식`, 카드 접근 이름에 `단일 기사 모드`/`전체 소식 모드`, 화면에 `Scoped`·`Global` 글자 없음 | SessionItemCard | 없음 |
| opens delete confirmation popover on delete click, cancels on 취소, and executes onDelete on 삭제 | 삭제 팝오버의 취소/삭제 | SessionItemCard, DeleteConfirmPopover | 없음 |

#### frontend/src/tests/chat/ChatWorkspace.test.tsx (18) — 대상 `components/chat/ChatWorkspace.tsx`
공통 mock: 파일 자체 `vi.mock('next/navigation')`(`useSearchParams().get` 을 `mockGet` 으로), `beforeEach` 에서 localStorage 초기화, 네트워크는 MSW 채팅 핸들러(`mocks/handlers/chat.ts`)가 받는다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders initial empty workspace with welcome view when no search params | 검색 파라미터가 없으면 환영 화면과 입력창 | ChatWorkspace | 공통 |
| fetches source metadata and switches to scoped mode when sourceId is present in searchParams | sourceId 가 있으면 출처를 불러와 scoped 로 바뀐다 | ChatWorkspace | 공통 (MSW `GET /api/chat/sources/:id`) |
| handles 404 for invalid sourceId by showing warning and falling back to global mode | 없는 sourceId 면 경고 `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다` 후 global | ChatWorkspace | 공통 |
| sends question, streams response via MSW, and renders assistant answer | 질문 전송, 스트림 수신, 답 표시 | ChatWorkspace | 공통 (MSW `POST /api/chat/stream`) |
| allows user to stop streaming and preserves partial answer | 중지 시 부분 답 유지 | ChatWorkspace | 공통 |
| resets conversation when 새 대화 button is clicked | 새 대화로 초기화 | ChatWorkspace | 공통 |
| renders FocusCapsule and opens FocusBottomSheet when clicked | 포커스 캡슐 클릭 시 바텀시트 (시트의 `하네스 & 벤치마크` 칩을 찾는다) | ChatWorkspace, FocusCapsule, FocusBottomSheet | 공통 |
| sends filters payload and displays auto-relaxation banner when is_relaxed is true | 필터 payload 전송, 완화 배너 | ChatWorkspace | 공통 |
| displays clear error card and retry button on LLM 502 failure, and clicking retry re-sends question | 502 오류 카드와 재시도 재전송 | ChatWorkspace | 공통 (MSW 오류 트리거) |
| displays clear error card and retry button on LLM 503 provider unavailable | 503 오류 카드 | ChatWorkspace | 공통 |
| displays error card and retry button when mid-stream SSE error occurs | 스트림 중 error 이벤트 처리 | ChatWorkspace | 공통 |
| receives SSE status events, renders WorkflowStepTracker and dual citations upon completion | status 이벤트로 단계 표시, 완료 후 인용. 보충 인용 [S1] 은 `data-tone="supplementary"` 와 `text-success` | ChatWorkspace, WorkflowStepTracker | 공통 |
| switches Claude model mid-session and renders ModelChangeDivider in timeline | 세션 중 모델 변경 구분선 | ChatWorkspace, ModelChangeDivider | 공통 |
| shows a single model selector under the composer and reflects tier changes immediately (R39) | `Claude 모델 선택` 트리거가 정확히 1개이고 질문 입력창 뒤(DOM 순서)에 있다. 처음 `Sonnet 5.5`, `Haiku 5.5`·`Opus 5.5` 를 고르면 트리거 글자가 즉시 바뀐다 | ChatWorkspace, ChatPromptInput, ChatModelSelector | 공통 |
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
| visually differentiates supplementary citation [S1] with emerald styling and web search label | [S1] 보조 인용은 `data-tone="supplementary"` 와 `text-success` 클래스, 웹 검색 라벨 (이름의 emerald 는 옛 색 이름이다) | CitationBadge | 없음 |
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

#### frontend/src/tests/chat/FocusBottomSheet.test.tsx (9) — 대상 `components/chat/FocusBottomSheet.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| does not render when isOpen is false | 닫힘이면 렌더링 안 함 | FocusBottomSheet | 없음 |
| renders modal dialog with controls and a11y role when isOpen is true | 열림 시 dialog role 과 컨트롤 (`하네스 & 벤치마크`·`MCP & 생태계` 칩) | FocusBottomSheet | 없음 |
| displays guidance alert when targetCount is 0 | 대상 0건 안내 | FocusBottomSheet | 없음 |
| allows manipulating filters and calls onApplyFilters with updated values | 필터 조작(`MCP & 생태계` 칩 등) 후 onApplyFilters | FocusBottomSheet | 없음 |
| calls onResetFilters when 초기화 button is clicked | 초기화 버튼 | FocusBottomSheet | 없음 |
| closes on backdrop click and Escape key press | 배경 클릭·Escape 로 닫기 | FocusBottomSheet | 없음 |
| detects 100px swipe-down gesture and triggers onClose | 100px 아래 스와이프로 닫기 | FocusBottomSheet | 터치 이벤트 |
| does not display matching count badge or alert when targetCount is undefined (initial clean state) | 초기 상태에 개수 배지 없음 | FocusBottomSheet | 없음 |
| labels the category chips with 전체 소식 and the long category labels, in order (R40) | 카테고리 칩 글자 순서가 `전체 소식`, `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` 이고, 예전 시트 전용 라벨 버튼이 없다 | FocusBottomSheet, `lib/labels.ts` | 없음 |

#### frontend/src/tests/chat/FocusCapsule.test.tsx (6) — 대상 `components/chat/FocusCapsule.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders default capsule [🎯 포커스: 전체 소식 ▾] with 30px minimal height and a11y attributes | 기본 캡슐 라벨 `포커스: 전체 소식`·높이·접근성 | FocusCapsule | 없음 |
| triggers onClick when default capsule is clicked | 클릭 시 onClick | FocusCapsule | 없음 |
| renders filtered capsule [🎯 포커스: MCP · 최근 7일 ✕] when filters are active | 필터 적용 라벨 | FocusCapsule | 없음 |
| triggers onReset and stops propagation when reset button ✕ is clicked | ✕ 클릭 시 onReset, 전파 중단 | FocusCapsule | 없음 |
| adapts to scoped mode when scopedSource is provided | scoped 출처 표시 | FocusCapsule | 없음 |
| does not display fake count badges and renders clean label in initial state | 초기 상태에 가짜 개수 없음 | FocusCapsule | 없음 |

#### frontend/src/tests/chat/HandoverIntegration.test.tsx (5) — 대상 `components/Header.tsx`, `NewsCard.tsx`, `NewsDetailModal.tsx`, `chat/HandoverCtaButton.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders AI 챗 link in Header navigation bar pointing to /chat | 헤더의 "AI 챗" 링크 href=/chat | Header | next/navigation mock(push), **로컬 요청** (`/api/schedule/status` 가 MSW 미처리로 bypass) |
| HandoverCtaButton navigates to /chat?sourceId={id} and stops click propagation | 카드 버튼(접근 이름 정확히 `AI 챗에서 분석`)이 `/chat?sourceId=101` 로 이동, 전파 중단 | HandoverCtaButton | next/navigation mock |
| HandoverCtaButton encodes draftQuestion into q query parameter | 배너 버튼(이름이 `AI 챗에서 분석` 으로 시작)이 질문을 q 파라미터로 인코딩 | HandoverCtaButton | next/navigation mock |
| NewsCard includes handover CTA button that does not trigger card selection | 카드 안 `AI 챗에서 분석` 버튼이 카드 선택을 일으키지 않는다 | NewsCard, HandoverCtaButton | next/navigation mock |
| NewsDetailModal includes handover button to transfer current question to dedicated chat | 상세 모달의 `AI 챗에서 분석` 배너 버튼으로 챗 이동 | NewsDetailModal | next/navigation mock |

#### frontend/src/tests/chat/MobileViewport.test.tsx (5) — 대상 `app/layout.tsx`, `components/chat/ChatPromptInput.tsx`, `ChatWorkspace.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| verifies layout viewport metadata allows user zoom and enables interactiveWidget resize | `viewport` 내보내기에 `maximumScale` 이 없고 `userScalable` 이 false 가 아니다 (확대 허용), `interactiveWidget: 'resizes-content'` | `app/layout.tsx` `viewport` | 없음 |
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

#### frontend/src/tests/CommandPalette.test.tsx (10) — 대상 `components/CommandPalette.tsx`
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
| 검색 입력 자리표시가 짧은 문구이고 ESC 안내를 담지 않는다 | `명령어 검색` combobox 의 자리표시가 `명령어 검색 또는 바로가기` 이고 `ESC` 를 담지 않는다 | CommandPalette | 같음 (`ThemeProvider` 로 감쌈) |

#### frontend/src/tests/design/TokenContrast.test.ts (57) — 대상 `app/globals.css`
`globals.css` 의 `:root`(라이트)·`.dark`(다크) 블록에서 `--al-*` 토큰 값을 읽어 WCAG 2.x 상대 휘도 공식으로 대비를 계산한다. 글자는 4.5:1, UI 경계(`border-strong`)와 포커스 링(`accent`)은 3:1 이상이어야 한다. 조합 하나가 테스트 하나다 (`it.each`).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| computes known WCAG reference ratios | 계산식이 검정/흰색 21:1, 같은 색 1:1 을 낸다 | 파일 안 `contrastRatio` | 없음 (파일 읽기) |
| `{fg} on {bg} ≥ {n}:1` (테마마다 25개) | `fg`·`fg-muted`·`fg-subtle`, `border-strong`, `accent`, `on-accent`(`accent-solid`·`accent-solid-hover`·`danger-solid`·`danger-solid-hover` 위), `accent-soft-fg`, `success`·`warning`·`danger`(표면·`*-soft` 위)의 대비가 기준 이상이다 | `globals.css` `:root`, `.dark` | 같음 |
| `focus ring (accent) on {bg} ≥ 3:1` (테마마다 3개) | 포커스 링 색이 `canvas`, `surface`, `surface-muted` 위에서 3:1 이상이다 | 같음 | 같음 |

#### frontend/src/tests/design/TokenGuard.test.ts (5) — 대상 `frontend/src/**/*.tsx`, `app/globals.css`
화면 코드가 토큰 유틸리티만 쓰는지 소스 파일을 읽어 정규식으로 검사한다. 위반은 `파일:줄  일치` 목록으로 실패 메시지에 나온다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| finds the source files to scan | 검사할 `.tsx` 파일이 50개보다 많다 (경로 오류로 빈 검사가 되지 않게) | `frontend/src` 전체 | 없음 (파일 읽기) |
| has no hex color classes in .tsx files | 임의 hex 색 클래스(`-[#…]`)가 없다 | `.tsx` 전체 | 같음 |
| has no Tailwind palette color utilities in .tsx files | `bg-slate-100`, `text-blue-600` 같은 Tailwind 기본 팔레트 색 유틸리티(`white`, `black` 포함, 변형 접두사 포함)가 없다 | `.tsx` 전체 | 같음 |
| has no legacy tailwindcss-animate classes in .tsx files | `animate-in`, `zoom-in`, `slide-in-from` 클래스가 없다 | `.tsx` 전체 | 같음 |
| globals.css has no !important and no legacy html:not(.dark) / html.dark overrides | `globals.css` 에 `!important`, `html:not(.dark)`, `html.dark` 가 없다 | `app/globals.css` | 같음 |

#### frontend/src/tests/feed/FeedInsights.test.ts (7) — 대상 `lib/feed-insights.ts`
목록에서 같은 시사점 문장이 반복되는 기사를 고르는 순수 함수 `findRepeatedInsights` 를 기사 목록 fixture 로 부른다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| returns the ids of articles whose insight sentence appears twice | 같은 시사점이 두 번 나오는 기사 id 만 돌려준다 | findRepeatedInsights | 없음 |
| groups the backend "<tech> 기반 구현에서 " prefixed variant with the plain sentence | backend 가 앞에 `{기술} 기반 구현에서 ` 를 붙인 문장도 원래 문장과 같은 것으로 센다 (끝 40자 비교) | 같음 | 없음 |
| normalizes whitespace before comparing (runs of spaces, leading and trailing spaces) | 연속 공백·앞뒤 공백을 정리한 뒤 비교한다 | 같음 | 없음 |
| ignores sentences shorter than 20 characters after normalizing | 정리 뒤 20자 미만 문장은 반복으로 보지 않는다 | 같음 | 없음 |
| excludes sentences that appear only once | 한 번만 나오는 문장은 빠진다 | 같음 | 없음 |
| excludes empty and null insights | 빈 문자열·null 시사점은 빠진다 | 같음 | 없음 |
| returns an empty set for an empty list | 빈 목록이면 빈 집합 | 같음 | 없음 |

#### frontend/src/tests/feed/FeedStatusBar.test.tsx (6) — 대상 `components/feed/FeedStatusBar.tsx`, `ui/Select.tsx`
목록 머리줄(상태 + 정렬)만 그린다. 마지막 테스트는 `window.matchMedia` 를 지정한 폭으로 답하는 mock(`mockViewport`)으로 바꾸고 `afterEach` 에서 되돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| offers four sort options in a labelled select and calls back on change | `정렬` 이름의 select 에 선택지 4개(`hot` 인기순, `quality` 품질순, `latest` 최신순, `top` 추천순, 값·글자 순서대로). `latest` 로 바꾸면 `onSortChange('latest')`·`onPageChange(1)` | FeedStatusBar, Select | 없음 |
| places sort inside [data-feed-list-header], outside the status live region and after it | `[data-feed-list-header]` 가 상태(`role="status"`)와 정렬을 담고, 정렬은 상태 밖이며 상태 뒤(DOM)다 | FeedStatusBar | 없음 |
| keeps the status as a polite live region with the page text | 상태가 `aria-live="polite"`·`data-feed-status` 이고 `페이지 2 / 5` 를 담는다 | FeedStatusBar | 없음 |
| lays out the header as one non-wrapping row: status min-w-0 flex-1, sort w-28 shrink-0 xl:w-32 | 머리줄이 `flex`·`items-start` 이고 `flex-wrap` 이 아니다. 상태가 `min-w-0 flex-1`, 정렬 감싸개가 `w-28 shrink-0 xl:w-32` | FeedStatusBar | 없음 |
| keeps sort on the first line when the status wraps: header items-start, status min-h matches the select (44 / md 36) | 필터·Must-Read 배지가 붙은 상태에서도 머리줄이 `items-start`(`items-center` 아님)라 정렬이 첫 줄 오른쪽에 남는다. 상태가 `min-h-11 md:min-h-9 items-center`, 정렬 select 가 `h-11 md:h-9` 라 한 줄일 때 세로 가운데가 같다 | FeedStatusBar, Select | 없음 |
| keeps the same sort node across widths (360 → 1440) | 폭 mock 360 → 1440 으로 다시 그려도 정렬이 같은 노드다 | FeedStatusBar | `matchMedia` 폭 mock |

#### frontend/src/tests/feed/FeedToolbar.test.tsx (26) — 대상 `components/feed/FeedToolbar.tsx`
768px 미만 넘침 표시 블록은 `window.matchMedia` 를 폭 360px 로 답하는 mock 으로 바꾸고, 스크롤 줄의 `scrollWidth`(600)·`clientWidth`(300)를 `HTMLElement.prototype` 에 정의해 넘침을 흉내 낸 뒤 `afterEach` 에서 되돌린다 (양쪽 표시 테스트는 그 테스트 안에서만 `scrollLeft` 저장 mock 을 두고 `finally` 에서 지운다). 한 트리 블록(①~⑤)은 자기 도우미를 쓴다: `mockViewport(width)`(`matchMedia` 를 `min-width`·`max-width`·복합 질의에 그 폭으로 답하게 교체), 스크롤 줄 `scrollWidth` 600·`clientWidth` 300·`scrollLeft` 저장(WeakMap) mock, `getBoundingClientRect` mock. `afterEach` 에서 모두 되돌린다. ③·④ 와 ⑤ 의 배치 테스트는 `it.each([360, 1024, 1440])` 라 각 3개다. 정렬은 이 컴포넌트에 없다 (`FeedStatusBar.test.tsx`).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders category chips with aria-pressed and counts | `카테고리` 그룹의 칩이 `aria-pressed` 와 건수를 가진다 (`전체 소식` 은 합계) | FeedToolbar, Chip | 없음 |
| selecting a category resets source to all and page to 1 | 카테고리를 고르면 소스 `all`, 1페이지로 콜백 | FeedToolbar | 없음 |
| shows the Must-Read toggle outside the source group at the end of the source row, and toggles it | `Must-Read` 버튼이 `aria-pressed="false"` 이고 `소스` 그룹 안에 없으며, 소스 그룹과 같은 `[data-toolbar-row]` 의 마지막 자식이고 소스 그룹 뒤(DOM 순서)다. `정렬` combobox 는 없다. 소스 그룹 칩 글자는 `전체7`·`GitHub5`·`arXiv2`·`북마크2`(건수가 있는 소스만)이고, 토글을 누르면 `onHighSignalChange(true)`·`onPageChange(1)` | FeedToolbar | 없음 |
| selecting a source calls back with page 1 | 소스·북마크 칩 선택 시 1페이지로 콜백 | FeedToolbar | 없음 |
| submits and clears the keyword search | `키워드 검색` searchbox 제출과 `검색어 지우기` | FeedToolbar, SearchField | 없음 |
| uses the short placeholder 키워드 검색 | 검색창 자리표시가 `키워드 검색` 이다 | FeedToolbar | 없음 |
| lays out rows as separate flex rows with the category and source groups on different rows | `[data-feed-toolbar]` 안에 `[data-toolbar-row]` 줄이 2개 이상이고 `카테고리`·`소스` 그룹이 서로 다른 줄에 있으며 툴바가 `grid` 가 아니다 | FeedToolbar | 없음 |
| hides category chip icons below xl | `카테고리` 칩 아이콘 5개(`[data-chip-icon]`)가 `max-xl:hidden` | FeedToolbar, Chip | 없음 |
| bleeds the source row to the left edge only and keeps Must-Read on the same row below 768px (R35 보정 9) | 넘치지 않는 `소스` 줄은 768px 미만에서 왼쪽만 화면 끝까지 늘어나고(`max-md:-ml-4`·`max-md:pl-4`, `max-md:-mx-4`·`max-md:-mr-4` 없음) 스냅 여백 `scroll-px-6` 이 있다. 줄 B(`[data-toolbar-row]`)가 `max-md:flex-wrap` 아님, 소스 그룹을 담은 직접 자식이 `max-md:basis-full` 아님, `Must-Read` 토글이 `max-md:ml-auto` 아님. `[data-feed-toolbar]` 안에 combobox 가 없다 | FeedToolbar, ChipGroup | 없음 |
| keeps the 768px+ row B unchanged: no unprefixed flex-wrap, basis-full or ml-auto (R35) | 줄 B 에 `flex-wrap`·`md:flex-wrap`, 소스 감싸개에 `basis-full`·`md:basis-full`, 토글에 `ml-auto`·`md:ml-auto` 가 없어 768px 이상 배치가 그대로다 | FeedToolbar | 없음 |
| has exactly one decorative hint in the source row, outside the group and before the Must-Read toggle | 360px 에서 `소스` 줄이 끝 쪽으로 넘치면(`data-overflow="end"`) 토글을 담은 툴바 줄에 장식 넘침 표시(`data-overflow-hint`, `aria-hidden`)가 정확히 하나 있고, 그룹 밖·`Must-Read` 토글 앞에 있다. 소스 줄 자체 표시(`.group/source`)는 없다 | FeedToolbar, ScrollRow | `matchMedia` 폭 360 mock, `scrollWidth`/`clientWidth` 정의 |
| shows hints on both sides of the source row when it overflows both ways (start before the group, end before the Must-Read toggle) | 360px 에서 `소스` 줄 `scrollLeft` 를 150 으로 옮겨 `data-overflow="both"` 가 되면 같은 `[data-toolbar-row]` 안에 `data-overflow-hint="start"`·`"end"` 가 하나씩 있고 둘 다 `aria-hidden`·그룹 밖이며, 순서가 `start` 표시 → `소스` 그룹 → `end` 표시 → `Must-Read` 토글이다. `start` 표시는 `max-md:-ml-4`(화면 끝 여백을 씀), `end` 표시는 `max-md:-mr-4` 가 아니다(토글 앞이라 화면 끝 여백을 쓰지 않음) | FeedToolbar, ScrollRow | 위와 같음 + 이 테스트 안 `scrollLeft` 저장 mock |
| ① reveals the selected source chip, not Must-Read, and does not move when only Must-Read toggles | `highSignalOnly` + `source='github'` 에서 줄 오른쪽 밖의 `GitHub` 칩이 보이게 처음부터 소스 줄 `scrollLeft` 가 0 보다 크고, `highSignalOnly` 만 false 로 바꿔 다시 그려도 `scrollLeft` 가 그대로다 (소스 줄 선택 칩은 `data-source-chip` 칩만) | FeedToolbar, ChipGroup `selectedSelector`, ScrollRow | 한 트리 블록 도우미 |
| ② keeps the same search input, focus, value and chip rows across widths (360 → 1024 → 1440) | 폭 mock 을 360 → 1024 → 1440 으로 바꿔 다시 그려도 검색 입력·`카테고리`·`소스` 그룹이 처음과 같은 노드이고, 검색 입력이 포커스(`document.activeElement`)와 값 `MCP` 를 유지한다 | FeedToolbar | 같음 |
| ③ orders controls 검색 → 카테고리 → 소스 → Must-Read in the DOM at %ipx (360, 1024, 1440) | 세 폭 모두 DOM 순서가 검색 입력 → `카테고리` 그룹 → `소스` 그룹 → `Must-Read` 토글이다 | FeedToolbar | 같음 |
| ⑤ places the fixed Must-Read toggle after the source group and before sort at %ipx (R34) (360, 1024, 1440) | 세 폭 모두 `Must-Read` 토글이 `소스` 그룹 뒤이고 그 줄(`[data-toolbar-row]`)의 마지막 자식이며 그룹 안에 없다 (이름의 'before sort' 는 단언하지 않는다. 정렬은 이 컴포넌트에 없다). 토글에 `data-must-read-toggle`, 클래스 `shrink-0`·`max-md:w-11`, 글자 감싸개 `max-md:sr-only` 가 있고, 소스 그룹 안에 구분선(`aria-hidden` 이고 `w-px`)이 없다 | FeedToolbar | 같음 |
| ⑤ keeps the same Must-Read node and name across widths and reflects highSignalOnly (R34·R33) | `highSignalOnly: true` 로 폭 mock 360 → 1440 을 바꿔 다시 그려도 접근 이름 `Must-Read` 인 같은 노드이고 `aria-pressed="true"` 다 | FeedToolbar | 같음 |
| ④ puts search in its own area above the filter rows and Must-Read in the source row at %ipx (360, 1024, 1440) | 세 폭 모두 `카테고리`·`소스` 그룹이 서로 다른 `[data-toolbar-row]` 에 있고, 검색 입력은 어느 줄에도 없이 `[data-feed-search]` 안이며 그 영역이 `[data-feed-toolbar]` 밖·앞(DOM)이다. `Must-Read` 토글은 `소스` 줄에 있다 | FeedToolbar | 같음 |
| puts the search field in its own [data-feed-search] area with full width | `[data-feed-search]` 가 `scroll-mt-20` 이고, 그 안 `search` 폼이 `w-full` 이며 `md:w-48`·`xl:w-72` 가 없다 | FeedToolbar, SearchField | 없음 |
| has no searchbox or combobox inside the filter area [data-feed-toolbar] | `[data-feed-toolbar]` 안에 `searchbox`·`combobox` 가 없다 | FeedToolbar | 없음 |

#### frontend/src/tests/feed/InsightsBar.test.tsx (10) — 대상 `components/feed/InsightsBar.tsx`, `TrendRadarPanel.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders nothing when there is neither a briefing nor radar data | 브리핑·레이더가 모두 없으면 아무것도 그리지 않는다 | InsightsBar | 없음 |
| shows a skeleton while the radar is loading | 레이더 로딩 중 스켈레톤 | InsightsBar | 없음 |
| has no briefing button when there is no briefing | 브리핑이 없으면 브리핑 버튼 없이 `트렌드` 버튼만 | InsightsBar | 없음 |
| opens the briefing from the briefing button | `오늘의 브리핑 · {date} · {headline}` 버튼이 onOpenBriefing 을 부른다 | InsightsBar | 없음 |
| toggles the trend radar panel with aria-expanded / aria-controls | `트렌드` 버튼의 `aria-expanded`·`aria-controls` 와 `트렌드 레이더` 영역 열고 닫기 | InsightsBar, TrendRadarPanel | 없음 |
| selects a tag from the radar panel and clears it | 패널의 태그 선택과 `필터 초기화` | TrendRadarPanel | 없음 |
| marks the outer element and hides the briefing date below md | 바깥 요소에 `data-insights-bar`, 브리핑 날짜는 `max-md:hidden` | InsightsBar | 없음 |
| shows surging chips only from lg (hidden lg:flex) | `급상승` 칩 묶음이 `hidden lg:flex` (768~1023px 에서 숨김) | InsightsBar | 없음 |
| keeps showing the buttons without a skeleton while re-reading when data exists | 데이터가 있으면 `loadingRadar` 중에도 스켈레톤 대신 `트렌드`·브리핑 버튼을 그대로 보인다 | InsightsBar | 없음 |
| lays out category shares in one column on narrow screens and keeps the full name accessible | 레이더 `카테고리 분포` 목록이 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` 이고, 항목마다 이름 전체가 `title` 에 있다 | TrendRadarPanel | 없음 |

#### frontend/src/tests/feed/TrendRadarPanel.test.tsx (2) — 대상 `components/feed/TrendRadarPanel.tsx`, `lib/labels.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| shows Korean radar category labels and no English names in text or title | 레이더 `카테고리 분포` 가 응답의 영문 이름 대신 한국어 라벨(`하네스 & 벤치마크`, `프로토콜 & 도구`, `모델 & 추론`, `인프라 & 런타임`)을 글자와 `title` 에 쓴다 | TrendRadarPanel, `radarCategoryLabel` | 없음 |
| keeps an unknown radar category name as is | 모르는 카테고리 이름(`Other Stuff`)은 그대로 보인다 | 같음 | 없음 |

#### frontend/src/tests/Header.test.tsx (13) — 대상 `components/Header.tsx`, `ResetConfirmDialog.tsx`, `hooks/useCollector.ts`
공통 mock: `vi.mock('@/lib/api')` 로 `fetchScheduleStatus`(다음 수집 192분 뒤), `triggerManualCollect`, `fetchCrawlProgress`, `resetAndRecollect` 를 바꾼다. `ThemeProvider defaultTheme="light"` 로 감싼다. 폭은 setup.ts 의 1280px mock 이고, 모바일 테스트만 768px 미만으로 답하는 mock 을 쓴다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| shows v{version} when the build provides a version | 빌드가 넣은 `NEXT_PUBLIC_APP_VERSION`(`9.8.7`)이 `v9.8.7` 배지로 보인다 | Header | 공통 + `vi.stubEnv` |
| renders no version badge when the version is missing | 버전 값이 비면 배지가 없고 `AgentLens` 링크는 남는다 | Header | 공통 + `vi.stubEnv` |
| renders exactly one AI 챗 link pointing to /chat inside the main nav | `주 메뉴` 내비 안에 `AI 챗` 링크가 하나, href `/chat` | Header | 공통 |
| shows the next collection time on the schedule button and opens the schedule | `수집 스케줄 · 다음 수집 3h 12m 후` 버튼이 onOpenSchedule 을 부른다 | Header, useCollector | 공통 |
| lists the desktop more-menu items and calls each callback | 데스크톱 `더보기` 메뉴가 `소스 & 리서처`, `공유 & 알림`, `MCP 연동`, `RSS 피드`(새 탭 `/api/news/feed/rss.xml`), `초기화 & 재수집…` 순서이고 각 콜백을 부른다. 테마·수집 스케줄 항목은 없다 | Header, MenuButton | 공통 |
| opens the reset confirmation dialog from the more menu | `수집 데이터 전체 삭제 및 재수집` alertdialog, 처음 포커스 `취소`, `전체 삭제 후 다시 수집` 으로 resetAndRecollect 후 닫힘 | Header, ResetConfirmDialog | 공통 |
| shows the reset error inside the dialog instead of alert() | 초기화 실패 문구가 대화상자 안 `alert` 로 나오고 `window.alert` 를 부르지 않는다 | ResetConfirmDialog | 공통 + `resetAndRecollect` 거부, `window.alert` spy |
| adds schedule, collect and theme items to the more menu on mobile | 모바일 더보기 메뉴에 `수집 스케줄 (다음 3h 12m 후)`, `즉시 수집`, 테마 라디오 3개(`라이트`·`다크`·`시스템`)가 붙고 마지막은 `초기화 & 재수집…` | Header | 공통 + 폭 768 미만 `matchMedia` mock |
| toggles the command palette with Cmd+K / Ctrl+K | ⌘K·Ctrl+K 로 `커맨드 팔레트` 열고 닫기 | Header, useHotkey | 공통 |
| adds schedule, settings, RSS and reset commands to the palette | `커맨드 팔레트 열기` 버튼으로 연 팔레트의 명령이 9개이고 `C` 표시가 없으며, 스케줄·초기화 명령이 각 동작을 연다 | Header, CommandPalette | 공통 |
| disables the palette reset command while collecting | 수집 중에는 팔레트의 `수집 데이터 초기화 & 재수집` 이 `aria-disabled="true"` 이고 눌러도 확인 창이 열리지 않는다 | Header, CommandPalette, useCollector | 공통 |
| shows 수집 중 and the progress line on mount when a collection is already running | 마운트 때 스케줄 상태가 `is_running` 이면 `수집 중`(비활성) 버튼과 진행 줄 `실시간 소식 수집 중...` 을 보이고, 눌러도 수집 요청을 보내지 않는다 | Header, useCollector, `CollectorStatusLine` | 공통 + `fetchScheduleStatus` 가 `is_running: true` |
| ignores a progress response from a previous run after a new run starts | 즉시 수집 뒤 초기화로 새 회차가 시작되면, 늦게 도착한 이전 회차의 진행 응답(끝남)은 진행 줄에 반영되지 않는다 | useCollector, `CollectorStatusLine` | 공통 + `fetchCrawlProgress` 지연 응답 |

#### frontend/src/tests/hooks/useCollector.test.ts (6) — 대상 `hooks/useCollector.ts`
공통 mock: MSW `server.use` 로 `GET */api/schedule/status`, `GET */api/schedule/progress`, `POST */api/schedule/trigger`, `POST */api/schedule/reset-and-collect` 응답을 정하고 호출 수를 센다. 모듈 저장소가 테스트 사이에 남지 않도록 매 테스트 `vi.resetModules()` 뒤 동적 import 한다. 진행 폴링·스케줄 갱신의 `setInterval` 만 가짜 타이머다. 오래된 응답 테스트(①②)는 도우미 `deferred()` 로 MSW 핸들러 안에서 상태 응답을 붙잡아 응답 순서를 정하고, `settle()` 로 실제 `setTimeout` 만큼 기다려 응답 처리를 끝낸다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| (a) restores collecting and progress polling when the schedule status says is_running | 스케줄 상태가 `is_running` 이면 마운트 때 수집 중 상태와 진행 폴링을 되살린다 | useCollector | 공통 |
| (a) does not start progress polling when the schedule status is idle | 수집 중이 아니면 진행 폴링을 시작하지 않는다 | useCollector | 공통 |
| (b) joins the running collection with the response message when the trigger says already_running | 수동 수집 응답이 `already_running` 이면 그 메시지로 진행 중인 수집에 합류하고(폴링 시작), 다시 눌러도 요청하지 않는다 | useCollector | 공통 |
| (c) rejects with the response message when the reset says already_running | 초기화 응답이 `already_running` 이면 그 메시지로 거부하고 `삭제 완료` 안내를 보이지 않는다 | useCollector | 공통 |
| ① ignores a late is_running status response sent before the progress polling finished | 마운트 상태 `is_running: true` 로 폴링이 붙은 뒤 30초 재조회 응답(`is_running: true`)을 붙잡아 둔 채 진행 응답이 `is_running: false` 로 끝나 `수집 완료 (+2건 신규 반영)` 이 뜨고 완료 뒤 재조회가 반영되면, 붙잡은 응답을 풀어도 `isCollecting`·`status.is_running` 이 false 이고 `PROGRESS_POLL_MS` ×4 가 지나도 진행 요청 수가 그대로이며, 완료 문구로 바뀐 횟수가 1 이다 | useCollector | 공통 + `deferred()` |
| ② keeps the newer status when an older status response arrives after it | 먼저 보낸 상태 요청 A(붙잡음)와 나중 요청 B(바로 응답) 가운데 B 가 반영된 뒤 A 가 도착해도 `status.minutes_until_next_run` 이 B 값(10), `timeLeft` 가 `10m` 그대로다 | useCollector | 같음 |

#### frontend/src/tests/hooks/useNewsFeed.test.tsx (6) — 대상 `hooks/useNewsFeed.ts`
공통 mock: MSW 기본 핸들러(`mockNewsItems`, `mockDailyBriefing`)에 `server.use` 로 `GET */api/trends/radar` 를 더하고, 테스트마다 `GET */api/news`·`*/api/stats`·`*/api/briefing/today` 를 지연·실패로 바꾼다. `renderHook` 으로 훅만 돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| (a) keeps the previous items without loading while the same list key is re-read | 같은 목록 조건을 다시 읽는 동안 이전 기사를 유지하고 `loading` 이 되지 않는다 | useNewsFeed | 공통 |
| (b) applies briefing and radar even when the stats request fails | 통계 요청이 실패해도 브리핑·레이더는 반영한다 | useNewsFeed | 공통 + `*/api/stats` 500 |
| (c) keeps loadingRadar false and the previous briefing while stats are re-read | 통계를 다시 읽는 동안 `loadingRadar` 는 false 이고 이전 브리핑을 유지한다 | useNewsFeed | 공통 + 지연 응답 |
| (d) shows loading again when the list key changes | 목록 조건이 바뀌면 다시 `loading` 이다 | useNewsFeed | 공통 |
| (e) a failed re-read keeps the list and returns a reload failure signal instead of an error | 같은 조건 다시 읽기가 실패하면 목록을 유지하고 오류 대신 다시 읽기 실패 신호를 준다 | useNewsFeed | 공통 + `*/api/news` 500 |
| (e) a failed request for a changed list key is still an error (ErrorState) | 바뀐 조건의 요청이 실패하면 여전히 오류(ErrorState)다 | useNewsFeed | 공통 + `*/api/news` 500 |

#### frontend/src/tests/HotkeyGating.test.tsx (7) — 대상 `components/HotkeyListener.tsx`, `lib/overlay-stack.ts`
홈 화면처럼 `useOverlayOpen()` 값을 `blockSingleKeys` 로 넘기는 시험용 컴포넌트에 `Dialog` 를 함께 그린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| ignores j/k/b/c/t while an overlay is open | 대화상자가 열려 있으면 단일 키가 동작하지 않는다 | HotkeyListener, overlay-stack | 없음 |
| handles j/k again when no overlay is open | 대화상자가 닫히면 j/k 가 다시 동작한다 | 같음 | 없음 |
| blockSingleKeys prop blocks single keys on its own | `blockSingleKeys` 만으로 단일 키를 막는다 | HotkeyListener | 없음 |
| does not preventDefault Enter/Space when a button has focus | 버튼에 포커스가 있으면 Enter/Space 를 가로채지 않는다 | HotkeyListener | 없음 |
| opens the focused card on Enter only when the target is document.body | 대상이 `document.body` 일 때만 Enter 로 onOpenDetailModal | HotkeyListener | 없음 |
| matches letter keys by e.code when a Korean layout is active | 한글 자판(`e.key` 가 한글)이어도 `e.code` 로 글자 키를 판정한다 | HotkeyListener | 없음 |
| ignores keys during IME composition reported as keyCode 229 | `keyCode 229` 조합 중 키를 무시한다 | HotkeyListener | 없음 |

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

#### frontend/src/tests/modals/BriefingSettingsModal.test.tsx (7) — 대상 `components/BriefingSettingsModal.tsx`
공통 mock: MSW `server.use` 로 `GET */api/briefing/settings` 응답을 정한다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| is a modal dialog with a linked title | `공유 & 알림 설정` 제목이 연결된 modal dialog | BriefingSettingsModal, Dialog | 공통 |
| has three tabs and switches panels | 탭 `Notion 연동`, `이메일 (SMTP)`, `웹훅 (Slack/Discord)` 전환과 `STARTTLS 암호화 사용` 스위치 | BriefingSettingsModal, Tabs, Switch | 공통 |
| toggles secret visibility with an icon button | `토큰 보기`/`토큰 숨기기` 아이콘 버튼으로 비밀값 표시 전환 (`aria-pressed`) | BriefingSettingsModal, TextField | 공통 |
| has footer actions 연결 테스트 / 저장 / 닫기 | 바닥 버튼 `연결 테스트`, `저장`, `닫기` | BriefingSettingsModal | 공통 |
| shows the save result in an inline alert | `저장` 결과 문구가 `status` 영역에 나온다 | BriefingSettingsModal, InlineAlert | 공통 + MSW `POST */api/briefing/settings` |
| does not close on a backdrop click but closes on Escape | 배경 클릭으로는 닫히지 않고 Escape 로 닫힌다 (`dismissOnScrim={false}`) | BriefingSettingsModal, Dialog | 공통 |
| renders nothing when closed | 닫힘이면 렌더링 안 함 | BriefingSettingsModal | 없음 |

#### frontend/src/tests/modals/DailyBriefingModal.test.tsx (6) — 대상 `components/DailyBriefingModal.tsx`
뒤의 다섯 테스트는 MSW 기본 브리핑 응답(`fetchDailyBriefing`)을 읽어(필요하면 `overview` 를 바꿔) `onOpenSettings` 와 함께 그린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| points 이메일 발송 at the email form only while the form is open | `이메일 발송` 버튼은 닫혀 있을 때 `aria-expanded="false"` 이고 `aria-controls` 가 없다. 누르면 `aria-expanded="true"` 와 문서에 있는 주소 입력 줄을 가리키는 `aria-controls`, 다시 누르면 둘 다 처음대로 | DailyBriefingModal | MSW `GET */api/briefing/today` (기본 핸들러) |
| has exactly one 연동 설정 button and no 연동 설정 item in the 브리핑 작업 menu | 대화상자 안 이름에 `연동 설정` 이 든 버튼이 정확히 1개이고 누르면 `onOpenSettings` 1번. `브리핑 작업` 메뉴에는 항목이 있지만 `연동 설정` 항목은 없다 | DailyBriefingModal, Menu | 같음 |
| shows the headline exactly once | 헤드라인 글자가 화면에 정확히 1번(`getAllByText(headline)` 길이 1) | DailyBriefingModal, Dialog | 같음 |
| labels category headers with the long category labels and lucide icons instead of backend names and emoji | `카테고리별 요약` 패널의 `h3` 가 `MCP & 생태계`·`에이전트 아키텍처` 이고 각각 `svg` 아이콘이 있으며 글자에 그림 문자가 없다. backend 이름 `MCP & 플러그인 생태계` 는 패널에 없다 | DailyBriefingModal, `lib/labels.ts`, `FEED_CATEGORIES` | 같음 |
| replaces backend category names in overview lines with the long labels | 개요 `• **MCP & 플러그인 생태계**: …` 는 `MCP & 생태계:` 로, 분야 표에 없는 `모르는 분야:` 는 그대로 그린다 | DailyBriefingModal | 같음 (응답의 `overview` 를 바꿈) |
| marks the 시사점 line with an aria-hidden svg icon and the plain 시사점: text | 시사점 라벨마다 글자가 정확히 `시사점:` 이고 그 문단에 `svg[aria-hidden="true"]` 가 있다 | DailyBriefingModal | 같음 |

#### frontend/src/tests/modals/DeepResearcherTab.test.tsx (5) — 대상 `components/sources/DeepResearcherTab.tsx`
`researchStatus={null}`, 빈 감사 일지로 탭만 그린다. 네 지표는 `it.each` 하나로 돈다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| 정기 스케줄 값 상자가 말줄임 없이 줄을 바꾼다 | `정기 스케줄` 값 `매일 03:00, 15:00 UTC` 상자에 `truncate`·`whitespace-nowrap`·`text-ellipsis` 가 없고 `break-words` 가 있다 | DeepResearcherTab `Metric` | 없음 |
| `%s 값 상자가 말줄임 없이 줄을 바꾼다` (지표 4개) | `자동 채택된 소스`, `자동 채택 기준`, `최근 리서치 일시`, `정기 스케줄` 값 상자 모두 같은 단언 | 같음 | 없음 |

#### frontend/src/tests/modals/NewsDetailModal.test.tsx (10) — 대상 `components/NewsDetailModal.tsx`, `news-detail/AskAiPanel.tsx`
공통 mock: 파일 자체 `vi.mock('next/navigation')`, 기사는 `mocks/handlers.ts` 의 `mockNewsItems`.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| is a modal dialog labelled by the article title | 기사 제목이 대화상자 이름이다 | NewsDetailModal, Dialog | 공통 |
| shows the summary tab first with Korean section headings | 첫 탭 `AI 요약 & 시사점`, 절 제목 `개발자 시사점`·`핵심 요약 3줄`·`기술 스택`·`상세 본문 요약`, 이름이 `AI 챗에서 분석` 으로 시작하는 배너 버튼 하나 | NewsDetailModal, Tabs | 공통 |
| switches tabs with click and arrow keys | 클릭·화살표 키로 이름이 `AI 질의응답` 으로 시작하는 탭 전환, `질문 입력` 입력창 | NewsDetailModal, Tabs, AskAiPanel | 공통 |
| opens a ConfirmDialog for 대화 초기화 without window.confirm, and clears on confirm | 빠른 질문 `핵심 원리 및 구조` 로 대화 하나를 만들면 탭에 건수 `1` 이 붙고, `대화 초기화` 가 `window.confirm` 대신 alertdialog 를 열고(처음 포커스 `취소`) `초기화` 로 대화를 비운다 | NewsDetailModal, ConfirmDialog | 공통 + MSW `POST */api/news/:news_id/ask/stream`, `window.confirm` spy (불리지 않음을 단언) |
| closes with Escape and resets to the summary tab when reopened | Escape 로 닫고 다시 열면 요약 탭 | NewsDetailModal | 공통 |
| closes with the 닫기 button and the backdrop | `닫기` 버튼·배경 클릭으로 닫기 | NewsDetailModal, Dialog | 공통 |
| shows the source label and the original link in the footer | 바닥에 출처 라벨과 `원문 링크 방문` 링크 | NewsDetailModal, `lib/labels.ts` | 공통 |
| Escape in the Ask AI question input keeps the dialog, the text and moves focus to the Ask AI panel; the next Escape closes | `AI 질의응답` 탭 `질문 입력` 에서 Escape 를 누르면 대화상자와 입력 글자가 남고 포커스가 그 탭 패널로 가며, 다음 Escape 에 닫힌다 | NewsDetailModal, AskAiPanel, overlay-stack | 공통 |
| Escape during IME composition in the question input does nothing | IME 조합 중 Escape 는 아무 일도 하지 않는다 (포커스도 입력창에 남음) | 같음 | 공통 |
| shows 복사 실패 on the answer for 2 seconds when copying fails | 답변 복사가 실패하면 `답변 복사` 버튼이 2초 동안 `복사 실패` 를 보이고 `aria-live="polite"` 영역이 읽는다 | NewsDetailModal, AskAiPanel, useCopyToClipboard | 공통 + MSW 질문 스트림, `navigator.clipboard.writeText` 거부·`execCommand` false |

#### frontend/src/tests/modals/ScheduleModal.test.tsx (5) — 대상 `components/ScheduleModal.tsx`
공통 mock: `vi.mock('@/lib/api')` 로 `fetchScheduleStatus`, `triggerManualCollect`, `fetchCrawlProgress`, `resetAndRecollect` 를 바꾼다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders nothing when closed | 닫힘이면 렌더링 안 함 | ScheduleModal | 공통 |
| is a labelled modal dialog with the schedule and next run | `자동 수집 스케줄` 대화상자에 수집 주기와 다음 예정 | ScheduleModal | 공통 |
| closes with the header close button and Escape | `닫기` 버튼과 Escape 로 onClose | ScheduleModal, Dialog | 공통 |
| triggers a manual collection from the footer button | 바닥 `즉시 수집` 이 triggerManualCollect 를 부른다 | ScheduleModal, useCollector | 공통 |
| opens the reset confirmation from the danger zone and Escape closes only the confirmation | `위험 영역` 의 `초기화 & 재수집…` 이 확인 창을 열고, Escape 한 번은 확인 창만 닫는다 | ScheduleModal, ResetConfirmDialog, overlay-stack | 공통 |

#### frontend/src/tests/modals/SourcesModal.test.tsx (8) — 대상 `components/SourcesModal.tsx`, `sources/SourcesListTab.tsx`
공통 mock: MSW `server.use` 로 `GET */api/research/status`, `GET */api/research/audit-logs`, `DELETE */api/sources/:type/:id`(호출 기록)를 정한다. 소스 목록은 기본 MSW `GET */api/sources`. `window.confirm` spy 는 불리지 않음을 단언하는 데 쓴다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| is a modal dialog whose first tab is selected by default | `소스 & 리서처` 대화상자, 첫 탭 `AI 딥 리서처` 선택 | SourcesModal, Tabs | 공통 |
| lists sources from MSW with a switch and a delete button per source | 소스마다 `{이름} 수집 켜기` 스위치와 `{이름} 삭제` 버튼 | SourcesListTab, Switch | 공통 |
| opens a ConfirmDialog on delete and sends no request when cancelled | 삭제가 `이 소스를 목록에서 삭제하시겠습니까?` alertdialog 를 열고(처음 포커스 `취소`) 취소하면 요청이 없다 | SourcesListTab, ConfirmDialog | 공통 |
| Escape closes only the confirm dialog | Escape 한 번은 확인 창만 닫고 소스 대화상자는 남는다 | 같음, overlay-stack | 공통 |
| deletes after confirming and shows the result in the live region | `삭제` 확인 후 `DELETE rss/geeknews` 요청과 결과 안내 | SourcesListTab | 공통 |
| does not close on a backdrop click but closes on Escape and the footer button | 배경 클릭으로는 닫히지 않고 Escape·바닥 `닫기` 로 닫힌다 | SourcesModal, Dialog | 공통 |
| points 새 피드 직접 등록 at the form only while the form is open | `새 피드 직접 등록` 은 폼이 닫혀 있으면 `aria-controls` 가 없고, 열면 문서에 있는 폼을 가리키며, 다시 닫으면 없어진다 | SourcesListTab | 공통 |
| labels the category options with the long category labels and keeps the values | `카테고리 분류` 선택지가 값 `harness`·`mcp_plugins_skills`·`agent_tech`·`ai_news` 에 긴 라벨 `하네스 & 벤치마크`·`MCP & 생태계`·`에이전트 아키텍처`·`최신 AI 동향` 이고 기본값 `ai_news` | SourcesListTab, `lib/labels.ts` | 공통 |

#### frontend/src/tests/NewsCard.test.tsx (42) — 대상 `components/NewsCard.tsx`, `ui/Badge.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders title, category, insight, and tech stack correctly | 제목, 카테고리 짧은 라벨(`하네스`), 시사점, 기술 스택 | NewsCard | 전역 next/navigation mock |
| renders Must-Read high signal badge when is_high_signal is true | 고신호 배지 | NewsCard | 같음 |
| calls onToggleBookmark with stopPropagation when bookmark button is clicked | 북마크 클릭 시 onToggleBookmark, 전파 중단 | NewsCard | 같음 |
| triggers onSelect when card is clicked | 카드 클릭 시 onSelect | NewsCard | 같음 |
| applies focus ring and data-focused attribute when isFocused is true | 포커스 링과 data-focused | NewsCard | 같음 |
| renders a single meta row with the short category label, source, time and the bookmark button | 머리줄(`data-card-meta`) 한 줄에 짧은 카테고리 라벨·소스·시간과 북마크 버튼 | NewsCard | 같음 |
| keeps Must-Read, tech stack and hotness badges out of the meta row | 머리줄에 `Must-Read`·기술 스택·인기 배지가 없다 | NewsCard | 같음 |
| shows at most three tech stack badges | 기술 스택 배지는 최대 3개 | NewsCard | 같음 |
| moves the hotness score to the footer stats with an sr-only "인기 점수" label | 인기 점수가 바닥 통계에 `sr-only` `인기 점수` 와 함께 있다 | NewsCard | 같음 |
| hides the hotness stat when the score is 25 or below | `hotness_score` 25 이하면 인기 통계가 없다 | NewsCard | 같음 |
| labels the insight body with "시사점" and keeps the sentence in its own element | 본문 앞머리가 `시사점` 이고 문장은 자기 요소에 있다 | NewsCard | 같음 |
| shows the summary instead of the insight when preferSummary is set and a summary exists (R18) | `preferSummary` 이고 요약이 있으면 시사점 대신 요약 | NewsCard | 같음 |
| keeps the insight when preferSummary is set but the summary is empty | `preferSummary` 여도 요약이 비면 시사점 | NewsCard | 같음 |
| fixes the title and body to two lines and keeps an empty two-line slot without text | 제목·본문을 두 줄 높이로 고정하고, 본문이 없으면 빈 두 줄 자리를 둔다 | NewsCard | 같음 |
| keeps the handover label visible at every width (R48) | 이름 `AI 챗에서 분석` 버튼 안 글자 `AI 챗에서 분석` 의 클래스에 `sr-only` 가 없다. 버튼 묶음(버튼의 부모)이 `ml-auto`, 바닥 줄이 `flex-wrap` | NewsCard, HandoverCtaButton | 같음 |
| puts the long category label in the meta row category title (R47) | 머리줄의 짧은 라벨 `하네스` 요소의 `title` 이 `categoryLabel(category)` = `하네스 & 벤치마크` | NewsCard, `lib/labels.ts` | 같음 |
| marks the badge row and keeps it on one clipped line | 배지 줄이 `[data-card-badges]` 이고 `flex-nowrap`·`overflow-hidden` 이다 | NewsCard | 같음 |
| lets each tech badge shrink between min-w-12 and max-w-32 with a truncating text wrapper and full-name title | 기술 배지마다 `shrink`·`min-w-12`·`max-w-32` 가 있고 `shrink-0`·`max-w-full` 이 없으며, 글자 감싸개가 `min-w-0`·`truncate`, `title` 이 기술 이름 전체다 (클래스는 `classList.contains` 로 토큰 단위 비교) | NewsCard, Badge | 같음 |
| keeps the Must-Read badge from shrinking | Must-Read 배지는 `shrink-0` 이다 | NewsCard, Badge | 같음 |
| hides the synthetic raw_score for %s (rss_kr, rss, arxiv, huggingface, mystery) | 원천 지표가 없는 소스는 `raw_score` 120 이어도 `[data-card-stat="score"]` 가 없고 `스타`·`점수` 글자도 없다. 인기 점수도 합성 값이라 `[data-card-stat="hotness"]` 와 `인기 점수` 글자가 없다 (5개) | NewsCard, `lib/labels.ts` `scoreMetric` | 같음 |
| shows GitHub raw_score as stars with a Star icon | `github` 점수는 `data-metric="stars"`, `sr-only` `스타`, `title` `GitHub 스타` | NewsCard | 같음 |
| shows HackerNews raw_score as points with an ArrowBigUp icon | `hackernews` 점수는 `points`·`포인트` | NewsCard | 같음 |
| shows Reddit raw_score as upvotes with an ArrowBigUp icon | `reddit` 점수는 `upvotes`·`추천` | NewsCard | 같음 |
| hides the score stat when a native metric source has raw_score 0 | 원천 지표 소스라도 `raw_score` 0 이면 점수 통계가 없다 | NewsCard | 같음 |
| labels the GitHub count as forks with a GitFork icon | `github` 의 `comments_count` 15 는 `data-metric="forks"`·`포크` | NewsCard | 같음 |
| labels the HackerNews count as comments with a MessageSquare icon | `hackernews` 개수는 `comments`·`댓글` | NewsCard | 같음 |
| hides the count stat when comments_count is 0 | `comments_count` 0 이면 개수 통계가 없다 | NewsCard | 같음 |
| marks the hotness stat without a metric attribute | `github` 카드(`hotness_score` 84.6)의 인기 통계는 `data-card-stat="hotness"` 이고 `data-metric` 이 없으며 `sr-only` `인기 점수`·`85` | NewsCard | 같음 |
| hides the hotness stat for %s whose hotness is derived from a synthetic raw_score (R41) (rss_kr, rss, arxiv, huggingface, mystery) | 원천 지표가 없는 소스는 `hotness_score` 84.6 이어도 인기 통계·`인기 점수`·`85` 가 없다 (5개) | NewsCard, `scoreMetric` | 같음 |
| keeps the hotness stat for %s which has a native score metric (R41) (github, hackernews, reddit) | 원천 지표 소스는 `hotness_score` 84.6 이면 인기 통계가 있고 `sr-only` `인기 점수`·`85` (3개) | NewsCard | 같음 |
| never renders a bare "점수" label for any source | 어느 소스에서도 종류 없는 `점수` 라벨을 그리지 않는다 | NewsCard | 같음 |
| exposes the item source on the card as data-source | 카드(`[data-feed-card]`)에 `data-source` 가 기사 `source` 값이다 | NewsCard | 같음 |

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

#### frontend/src/tests/ui/ChipGroup.test.tsx (42) — 대상 `components/ui/Chip.tsx`(`ChipGroup scrollable`), `ScrollRow.tsx`, `hooks/useScrollOverflow.ts`
공통 mock: jsdom 은 레이아웃이 없어 스크롤 줄(`data-scroll-row` 또는 `role="group"`)의 `scrollWidth`·`clientWidth`·`scrollLeft` 를 `HTMLElement.prototype` 에 정의해 흉내 내고, `ResizeObserver` 를 `vi.stubGlobal` 로 바꾸며, 테스트마다 `window.matchMedia` 를 지정한 폭·줄어든 움직임 설정으로 바꾼다. `afterEach` 에서 모두 되돌린다. 도우미: `mockScrollingRects`(줄 상자와 칩 rect 를 `scrollLeft` 에 따라 돌려주는 `getBoundingClientRect` mock), `expectChipInsideRow`(칩이 줄 보이는 상자 안), `mockSnapStyles(scrollPaddingLeft)`(`getComputedStyle` 을 감싸 줄에 `scroll-snap-type: x proximity`·`scroll-padding-left`, 칩에 `scroll-snap-align: start` 를 돌려줌), `bleedTree`·`sideMarks`·`scrollTo`(`bleed` 줄을 그리고 표시·자리를 모으고 넘침 상태를 만듦).

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| marks a row that fits as data-overflow="none" with no mask | 넘치지 않으면 `data-overflow="none"`, 흐림 마스크 없음 | ChipGroup, useScrollOverflow | 공통 |
| allows 1px of slack before calling it overflow | 1px 차이까지는 넘침으로 보지 않는다 | 같음 | 공통 |
| reports end, both and start as the row scrolls, with a mask only while overflowing | 스크롤 위치에 따라 `end`·`both`·`start` 로 바뀌고 넘칠 때만 넘친 쪽 마스크 | 같음 | 공통 |
| re-measures when the ResizeObserver reports a size change | `ResizeObserver` 가 크기 변화를 알리면 다시 잰다 | 같음 | 공통 |
| shows a next button outside the group only on the overflowing side at >=768px | 768px 이상에서 넘친 쪽에만 `{줄 이름} 다음 항목 보기` 버튼이 그룹 밖에 있다 | ScrollRow | 공통 |
| has no scroll buttons below 768px even when overflowing | 768px 미만은 넘쳐도 스크롤 버튼이 없다 | ScrollRow | 공통 |
| scrolls by 80% of the row width with scrollBy when a button is pressed | 버튼은 줄 폭의 80% 만큼 `scrollBy` 한다 | ScrollRow | 공통 + 줄 요소의 `scrollBy` 를 `vi.fn` 으로 |
| uses behavior "auto" when reduced motion is preferred | 줄어든 움직임 설정이면 `behavior: "auto"` | ScrollRow | 공통 |
| falls back to adding to scrollLeft when scrollBy is missing | `scrollBy` 가 없으면 `scrollLeft` 를 더한다 | ScrollRow | 공통 |
| scrolls a focused chip into view with inline/block "nearest" | 포커스 받은 칩을 `scrollIntoView({inline, block: "nearest"})` 로 보이게 한다 | ScrollRow | 공통 + `scrollIntoView` spy |
| scrolls the row so the selected chip is visible on first render and when the selection changes | 처음 그릴 때와 선택이 바뀔 때 선택된 칩(`aria-pressed="true"`)이 보이도록 줄을 민다 | ScrollRow | 공통 + `getBoundingClientRect` spy |
| bleeds to the screen edges below 768px when bleed is set | `bleed` 면 768px 미만에서 줄이 좌우 화면 끝까지 늘어나고(`max-md:-mx-4`·`max-md:px-4`) 스냅 여백 `scroll-px-6` 이 있다 | ChipGroup, ScrollRow | 공통 |
| keeps a non-scrollable group as a wrapping group without a scroll row | `scrollable` 이 아니면 스크롤 줄 없이 줄바꿈 그룹이다 | ChipGroup | 공통 |
| wraps the chip icon in data-chip-icon and applies iconClassName to it | 칩 아이콘을 `data-chip-icon` 으로 감싸고 `iconClassName` 을 단다 | Chip | 공통 |
| bleeds only to the left edge below 768px when bleed="start" | `bleed="start"` 면 왼쪽으로만 늘어나고(`max-md:-ml-4`·`max-md:pl-4`, `-mx-4`·`px-4`·`-mr-4`·`pr-4` 없음) 스냅 여백 `scroll-px-6` 이 있다 | ChipGroup, ScrollRow | 공통 |
| passes rowClassName to the scroll row and className to the outer wrapper | `rowClassName` 은 스크롤 줄, `className` 은 바깥 감싸개에 붙는다 | 같음 | 공통 |
| (a) draws a decorative hint after the group when overflowing to the end below 768px | 768px 미만에서 끝 쪽으로 넘치면 그룹 뒤 형제로 장식 넘침 표시(`data-overflow-hint`, `aria-hidden`) 1개를 두고 스크롤 버튼은 없다. 양쪽으로 넘치면(`both`) 표시가 2개로, `data-overflow-hint="start"` 가 그룹 앞, `"end"` 가 그룹 뒤에 있고 둘 다 그룹 밖·`aria-hidden` 이다 | ScrollRow | 공통 |
| (b) gives the right bleed to the hint on a bleed row while the hint shows | 좌우 `bleed` 줄은 표시가 보이는 동안 줄을 왼쪽만 늘이고 오른쪽 여백은 표시가 쓴다 | ScrollRow | 공통 |
| draws only the start hint at start, none when it fits, and buttons instead at >=768px | 768px 미만 `start` 에서는 `data-overflow-hint="start"` 표시 1개만 그룹 앞(그룹 밖, `aria-hidden`)에 있고, 넘치지 않으면(`none`) 표시가 없으며, 768px 이상은 표시 없이 다음 버튼이 보인다 | ScrollRow | 공통 |
| (c) reveals the child matched by selectedSelector on first render | 처음 그릴 때 `selectedSelector` 에 맞는 자식이 보이도록 줄을 민다 | ScrollRow | 공통 |
| ① moves focus to the opposite button when the focused next button disappears at the end | 768px 이상 `end` 에서 `다음` 버튼에 포커스를 두고 줄을 끝까지 민 것으로 바꿔 `scroll` 을 보내면 `다음` 버튼이 없어지고 포커스가 `이전` 버튼에 있다 | ScrollRow | 공통 |
| ② moves focus to the selected chip when both buttons disappear below 768px | 같은 상태에서 폭 mock 을 768px 미만으로 바꿔 두 버튼이 사라지면 포커스가 선택 칩에 있다 | ScrollRow | 공통 |
| ③ leaves focus alone when the user already moved it to a chip before the button disappears | 버튼에서 다른 칩으로 포커스를 옮긴 뒤 버튼이 사라지면 포커스는 그 칩에 그대로다 | ScrollRow | 공통 |
| ④ reveals the chip matched by selectedSelector and ignores the default aria-pressed chip | `ChipGroup selectedSelector` 를 넘기면 그 선택자의 칩 기준으로 `scrollLeft` 가 움직이고 기본 선택자(`aria-pressed="true"`)의 첫 칩은 무시한다 | ChipGroup, ScrollRow | 공통 + `getBoundingClientRect` spy |
| re-reveals the selected chip after the overflow hint appears and narrows the row below 768px | 768px 미만에서 넘침 표시가 나타나 줄이 좁아지면 선택 칩을 다시 줄 안에 보이게 한다 | ScrollRow | 공통 + `mockScrollingRects` |
| re-reveals the selected chip when it grows (e.g. counts arrive) and the ResizeObserver fires | 선택 칩이 커지고(건수가 늦게 들어옴) `ResizeObserver` 가 알리면 선택 칩을 다시 보이게 한다 | ScrollRow | 같음 |
| does not pull the row back after the user scrolled, but still reveals a newly selected chip | 사용자가 줄을 민 뒤(가로 휠 `fireEvent.wheel(group, { deltaX: 40 })` 뒤 `scrollLeft` 10)에는 칩 크기가 바뀌어도 `scrollLeft` 를 되돌리지 않고, 새로 선택한 칩은 보이게 한다 | ScrollRow | 같음 |
| turns scroll snapping off while it sets scrollLeft and restores it right after | 선택 칩을 보이게 `scrollLeft` 를 둘 때 그 순간만 `style.scrollSnapType` 이 `none` 이고 바로 원래 값(빈 문자열)으로 돌아온다 | ScrollRow | 공통 + `scrollLeft` setter 기록 |
| moves to the snap position that shows the whole chip instead of an in-between offset snapping would undo | 스냅 줄(보이는 폭 207px, `scroll-padding-left` 16px)에서 흐림 밖에 다 드는 스냅 위치가 없으면 보이는 상자 안에 칩이 다 드는 스냅 위치 가운데 지금 위치와 가장 가까운 102 로 민다 | ScrollRow | 공통 + `mockSnapStyles('16px')`, `mockScrollingRects` |
| prefers a snap position that keeps the chip clear of the 24px fades | 흐림 24px 밖에 칩이 다 드는 스냅 위치(102)를 고른다 | ScrollRow | 같음 |
| ① shows a start hint before and an end hint after the group for each overflowing side | 768px 미만 `start`·`end`·`both` 마다 보이는 표시의 개수·`data-overflow-hint` 값·그룹 앞뒤 위치 | ScrollRow | 공통 + `bleedTree`·`sideMarks`·`scrollTo` |
| ② drops the bleed on the side whose hint shows (bleed row: end → left only, start → right only, both → none, none → both) | 좌우 `bleed` 줄의 768px 미만 클래스가 넘침 상태별로 `end` → 왼쪽만, `start` → 오른쪽만, `both` → 없음, `none` → 좌우 | ScrollRow | 같음 |
| ③ keeps an invisible slot on a side without bleed while the row overflows and that side does not | `bleed` 없는 쪽(`bleed="start"` 줄의 오른쪽, `bleed` 없는 줄의 양쪽)은 넘치는 동안 `data-overflow-slot` 자리가 있고 그쪽이 넘치지 않으면 `invisible` 이다 | ScrollRow | 같음 |
| ④ cancels the wrapper gap on hints and gives the bleed side page margin to the hint | 표시의 간격 상쇄 클래스(왼쪽 `-mr-1`, 오른쪽 `-ml-1`)와 `bleed` 쪽 여백 클래스(`max-md:-ml-4`/`max-md:-mr-4`) | ScrollRow | 같음 |
| ⑤ puts scroll-px-6 and data-selected-selector on every scroll row | 모든 스크롤 줄에 `scroll-px-6` 이 있고 `data-selected-selector` 가 넘긴 `selectedSelector` 값(주지 않으면 기본값)이다 | ScrollRow | 같음 |
| ⑥ shows buttons and no hints or slots at >=768px | 768px 이상에서는 표시·자리 없이 스크롤 버튼만 있다 | ScrollRow | 같음 |
| ① re-reveals the selected chip on resize after a scroll that came without any input (browser clamp/snap) | 입력 없이 `scrollLeft` 가 바뀐 뒤(브라우저 자르기·스냅 재맞춤 흉내) 선택 칩이 커지고 `ResizeObserver` 가 알리면 선택 칩을 다시 줄 안에 보이게 한다 | ScrollRow | 공통 + `mockScrollingRects` |
| ② keeps the user position on resize after pointerdown, touchstart, keydown or a scroll button click | `pointerdown`·`touchstart`·`keydown` 각각 뒤 `scrollLeft` 10, 스크롤 버튼 클릭 뒤 `scroll`(240)이면 칩이 커져도 `scrollLeft` 가 그대로다 | ScrollRow | 같음 |
| ③ ends the interaction when no scroll follows the input within 1,000ms | 가로 휠(`{ deltaX: 40 }`, 입력 신호) 뒤 1,100ms 동안 `scroll` 이 없으면 '사용자 조작 중' 이 끝나, 그 뒤 입력 없는 `scrollLeft` 변경은 사용자 스크롤이 아니라 선택 칩을 다시 보이게 한다 | ScrollRow | 같음 + 가짜 타이머(`setTimeout`·`clearTimeout`) |
| ④ does not treat the focus moved by "keep focus" as an input signal | 768px 이상 `다음` 버튼에 포커스를 두고 폭 mock 을 360 으로 바꿔 포커스 유지가 선택 칩으로 포커스를 옮긴 뒤, 입력 없는 `scrollLeft` 변경과 칩 크기 변화에서 선택 칩을 다시 보이게 한다 (옮긴 포커스의 `focusin` 은 입력 신호가 아니다) | ScrollRow | 같음 |
| ⑤ does not count a vertical wheel (page scroll over the row) as an input signal | 세로 휠(`fireEvent.wheel(group, { deltaY: 100 })`, `deltaX` 0, Shift 없음) 뒤 `scrollLeft` 를 10 으로 바꾸고 선택 칩이 커져 `ResizeObserver` 가 알리면 선택 칩을 다시 줄 안에 보이게 한다 (세로 휠은 입력 신호가 아니다) | ScrollRow | 같음 (도우미 `setupGrowingRow`) |
| ⑥ counts a wheel with deltaX > deltaY and a Shift + vertical wheel as input signals | `{ deltaX: 40, deltaY: 10 }` 휠, `{ deltaY: 100, shiftKey: true }` 휠 각각 뒤 `scrollLeft` 10 이면 칩이 커져도 `scrollLeft` 가 그대로다 (가로 의도 휠은 입력 신호다) | ScrollRow | 같음 |

#### frontend/src/tests/ui/ConfirmDialog.test.tsx (5) — 대상 `components/ui/ConfirmDialog.tsx`, `hooks/useFocusTrap.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| keeps focus on the dialog container while busy (buttons are disabled) | 확인 버튼에 포커스가 있던 채로 `busy` 가 되면 두 버튼이 비활성이고 포커스는 대화상자 컨테이너에 남는다 | ConfirmDialog | 없음 |
| moves focus to the error message when busy ends with an error | `busy` 가 오류와 함께 끝나면 포커스가 오류 문구로 간다 | ConfirmDialog | 없음 |
| moves focus to the confirm button when busy ends without an error | 오류 없이 끝나면 확인 버튼으로 간다 | ConfirmDialog | 없음 |
| still focuses cancel first when opened (not busy) | 처음 열 때는 `취소` 에 포커스 | ConfirmDialog | 없음 |
| returns focus to the dialog when the focused element loses focus to the body | 포커스가 `body` 로 빠지면 대화상자로 되돌린다 | Dialog, useFocusTrap | 없음 |

#### frontend/src/tests/ui/Dialog.test.tsx (16) — 대상 `components/ui/Dialog.tsx`, `Drawer.tsx`, `ConfirmDialog.tsx`, `hooks/useFocusTrap.ts`, `hooks/useScrollLock.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders role, aria-modal and links the title and description | `role="dialog"`, `aria-modal`, 제목·설명 연결 | Dialog | 없음 |
| focuses the first focusable element of the body, or initialFocusRef | 본문 첫 포커스 요소 또는 `initialFocusRef` 로 포커스 | Dialog, useFocusTrap | 없음 |
| cycles Tab and Shift+Tab inside the dialog | Tab/Shift+Tab 포커스 트랩 | 같음 | 없음 |
| returns focus to the opener when closed | 닫으면 연 요소로 포커스 복귀 | 같음 | 없음 |
| closes on the close button and on the backdrop by default | 기본은 닫기 버튼·배경 클릭으로 닫힌다 | Dialog | 없음 |
| does not close on the backdrop when dismissOnScrim is false | `dismissOnScrim={false}` 면 배경 클릭으로 안 닫힌다 | Dialog | 없음 |
| sets inert on #app-shell and locks body scroll while open, and releases both on close | 열린 동안 `#app-shell` 에 `inert`, body 스크롤 잠금, 닫으면 둘 다 해제 | Dialog, useScrollLock, overlay-stack | 없음 |
| leaves the stack when unmounted while open | 열린 채 언마운트되면 스택에서 빠진다 | Dialog, overlay-stack | 없음 |
| closes only the top dialog with one Escape when two are stacked | 두 개가 쌓이면 Escape 한 번에 위의 것만 닫힌다 | 같음 | 없음 |
| supports ariaLabel, header + labelledBy, closeLabel and panelProps | `ariaLabel`, `header`+`labelledBy`, `closeLabel`, `panelProps` | Dialog | 없음 |
| closes a sheet on a 100px swipe down | 시트는 100px 아래 스와이프로 닫힌다 | Dialog (`mobile="sheet"`) | 터치 이벤트 |
| is a modal dialog with the given close label and backdrop test id | Drawer 의 modal dialog, 닫기 라벨, 배경 test id | Drawer | 없음 |
| is an alertdialog that focuses cancel first | ConfirmDialog 는 `alertdialog` 이고 처음 포커스가 취소 | ConfirmDialog | 없음 |
| calls onConfirm / onCancel | 확인·취소 콜백 | ConfirmDialog | 없음 |
| ignores Escape and the backdrop while busy and disables both buttons | `busy` 면 Escape·배경 클릭 무시, 두 버튼 비활성 | ConfirmDialog | 없음 |
| shows the error inside the dialog | 오류를 창 안에 보인다 | ConfirmDialog | 없음 |

#### frontend/src/tests/ui/FormControls.test.tsx (32) — 대상 `components/ui/` 의 입력·표시 부품, `lib/labels.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| links the label to the input | 라벨과 입력 연결 | TextField | 없음 |
| keeps a hidden label as sr-only text | 숨긴 라벨은 `sr-only` 글자로 남는다 | TextField | 없음 |
| points aria-describedby at the description and the error | `aria-describedby` 가 도움말·오류를 가리킨다 | TextField | 없음 |
| sets aria-invalid only when there is an error | 오류가 있을 때만 `aria-invalid` | TextField | 없음 |
| uses 16px text on mobile to avoid iOS auto-zoom | 모바일 16px 글자 (iOS 자동 확대 방지) | TextField | 없음 |
| forwards ref to the input | ref 를 input 으로 넘긴다 | TextField | 없음 |
| renders a search landmark with a searchbox | `search` 랜드마크와 searchbox | SearchField | 없음 |
| submits the current value on Enter | Enter 로 현재 값 제출 | SearchField | 없음 |
| clears with the 검색어 지우기 button and returns focus to the input | `검색어 지우기` 후 입력창으로 포커스 | SearchField | 없음 |
| links the label and error like TextField | 라벨·오류 연결 | Textarea | 없음 |
| links the label to a native select with the given options | 라벨과 네이티브 select, 선택지 | Select | 없음 |
| keeps a hidden label accessible | 숨긴 라벨도 접근 이름이 된다 | Select | 없음 |
| is a role="switch" button with aria-checked and toggles through onChange | `role="switch"`, `aria-checked`, onChange 토글 | Switch | 없음 |
| uses aria-label when the label is hidden | 라벨을 숨기면 `aria-label` | Switch | 없음 |
| does not call onChange when disabled | 비활성이면 onChange 없음 | Switch | 없음 |
| renders chips as buttons with aria-pressed inside a labelled group | 이름 있는 그룹 안 `aria-pressed` 버튼 | Chip, ChipGroup | 없음 |
| uses accent tone by default and warning tokens when tone="warning" is selected | 기본 accent 톤, `tone="warning"` 선택 시 warning 토큰 | Chip | 없음 |
| scrolls horizontally on one line when scrollable | `scrollable` 이면 한 줄 가로 스크롤 | ChipGroup | 없음 |
| is a labelled group of aria-pressed buttons | 이름 있는 `aria-pressed` 버튼 그룹 | SegmentedControl | 없음 |
| Card renders the requested element | `as` 로 요소 지정 | Card | 없음 |
| Skeleton is hidden from assistive tech and pulses | 보조기술에서 숨기고 깜빡임 | Skeleton | 없음 |
| EmptyState shows title, description and action | 제목·설명·동작 | EmptyState | 없음 |
| ErrorState is an alert with a retry button | `alert` 와 재시도 버튼 | ErrorState | 없음 |
| CodeBlock shows the language, a copy button and a scrollable pre, and accepts className | 언어 라벨, 복사 버튼, 가로 스크롤 `pre`, `className` | CodeBlock | 없음 |
| maps category and source ids to the NewsCard labels and falls back to the id | 카테고리 id 의 긴 라벨(`하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향`)과 소스 id 의 라벨, 모르는 값은 id 그대로 | `lib/labels.ts` | 없음 |
| maps category ids to the short labels used on cards and chips | 짧은 라벨 `하네스`, `MCP`, `에이전트`, `AI 동향` | `categoryShortLabel` | 없음 |
| falls back to the raw id for unknown categories in the short labels | 모르는 id 와 `constructor`·`toString` 같은 프로토타입 키는 그대로 돌려준다 | 같음 | 없음 |
| maps trend radar category names to Korean labels | 레이더 이름 4개를 한국어 라벨로 바꾼다 | `radarCategoryLabel` | 없음 |
| falls back to the raw name for unknown radar categories and prototype keys | 모르는 이름·프로토타입 키는 그대로 | 같음 | 없음 |
| maps sources to their native score metric and hides synthetic scores (R36) | `scoreMetric('github') === 'stars'`, `hackernews` → `points`, `reddit` → `upvotes`, `rss_kr`·`huggingface` 등 → `null`, 라벨 `스타`·`포인트`·`추천` | `scoreMetric`, `SCORE_METRIC_LABELS` | 없음 |
| labels the GitHub count as forks and every other count as comments (R36) | `countMetric('github') === 'forks'`, `countMetric('hackernews') === 'comments'`, 라벨 `포크`·`댓글` | `countMetric`, `COUNT_METRIC_LABELS` | 없음 |
| names the search scopes in Korean with the shared all-category label (R38) | `scopeLabel('scoped') === '단일 기사'`, `scopeLabel('global') === ALL_CATEGORY_LABEL === '전체 소식'` | `scopeLabel`, `SCOPE_LABELS`, `ALL_CATEGORY_LABEL` | 없음 |

#### frontend/src/tests/ui/IconGuard.test.ts (3) — 대상 `frontend/src/components/**`, `frontend/src/app/**` 의 `.ts`·`.tsx`
node 환경에서 파일 글자를 읽는 정적 검사다. 판정식은 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu` 이고 허용 목록은 없다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| finds the source files to scan in components/** and app/** | 대상 파일이 `components` 와 `app` 양쪽에 있고 50개를 넘는다 (대상을 못 찾아 빈 검사로 통과하지 않게) | 파일 목록 | 파일 읽기 |
| the rule matches pictographic emoji but not text-presentation symbols | `💡🔄📊⚡🎯🧠🔒` 7개, `🛠️⚖️⚠️`(U+FE0F) 3개를 세고 `© ® ↔ ➔ ✓` 는 0개 | 판정식 | 없음 |
| has no pictographic emoji in UI source text | 대상 파일 전체에서 걸리는 글자가 없다 (실패하면 `파일:줄 글자(U+XXXX)` 목록) | 대상 파일 | 파일 읽기 |

#### frontend/src/tests/ui/Menu.test.tsx (11) — 대상 `components/ui/Menu.tsx`, `ThemeMenu.tsx`, `Popover.tsx`, `components/ThemeToggle.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| exposes aria-haspopup / aria-expanded / aria-controls on the trigger | 트리거의 `aria-haspopup`·`aria-expanded`·`aria-controls` | MenuButton | 없음 |
| focuses the first item when opened and moves with arrows, Home and End (skipping disabled) | 열면 첫 항목 포커스, 화살표·Home·End 이동(비활성 건너뜀) | MenuButton | 없음 |
| runs the item on Enter, closes and returns focus to the trigger | Enter 로 실행 후 닫고 트리거로 포커스 | MenuButton | 없음 |
| closes on Escape and focuses the trigger | Escape 로 닫고 트리거 포커스 | MenuButton | 없음 |
| closes on an outside pointerdown and on Tab | 바깥 pointerdown·Tab 으로 닫기 | MenuButton | 없음 |
| opens with ArrowUp on the trigger focusing the last item | 트리거에서 ArrowUp 이면 마지막 항목 포커스 | MenuButton | 없음 |
| Escape inside a dialog closes only the menu | 대화상자 안 메뉴는 Escape 한 번에 메뉴만 닫힌다 | MenuButton, Dialog, overlay-stack | 없음 |
| renders three menuitemradio entries with aria-checked and switches theme | `menuitemradio` 3개와 `aria-checked`, 테마 전환 | ThemeMenu, ThemeProvider | localStorage |
| ThemeToggle showDropdown renders the theme menu; default stays a single toggle button | `showDropdown` 이면 테마 메뉴, 기본은 토글 버튼 하나 | ThemeToggle | localStorage |
| renders next to the anchor (no portal), focuses inside, closes on Escape back to the anchor | 앵커 옆에 그리고(포털 없음) 안으로 포커스, Escape 로 닫고 앵커로 복귀 | Popover | 없음 |
| closes on an outside pointerdown but not on the anchor or inside | 바깥 pointerdown 으로 닫히고 앵커·안쪽 클릭으로는 안 닫힌다 | Popover | 없음 |

#### frontend/src/tests/ui/OverlayStack.test.tsx (11) — 대상 `lib/overlay-stack.ts`, `components/ui/Dialog.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| push / remove keeps order and the top layer | 등록·제거 순서와 맨 위 레이어 | overlayStack | 없음 |
| calls only the top layer onEscape and prevents default | Escape 는 맨 위 레이어의 onEscape 만 부르고 기본 동작을 막는다 | overlayStack | 없음 |
| ignores Escape while IME composition is in progress | IME 조합 중 Escape 무시 | overlayStack | 없음 |
| attaches the window listener only while the stack is non-empty | 스택이 비어 있지 않을 때만 window 리스너 | overlayStack | `window.addEventListener`/`removeEventListener` spy |
| sets inert on #app-shell while a modal is open and removes it after | 모달이 열린 동안 `#app-shell` 에 `inert` | overlayStack | 없음 |
| useOverlayOpen follows the stack | `useOverlayOpen` 이 스택 상태를 따른다 | useOverlayOpen | 없음 |
| a component layer handles window Escape and leaves the stack on unmount | 컴포넌트 레이어가 Escape 를 받고 언마운트 때 빠진다 | useOverlayLayer | 없음 |
| removes the layer when open becomes false | `open` 이 false 가 되면 레이어 제거 | useOverlayLayer | 없음 |
| calls the latest onEscape after re-render | 다시 그린 뒤 최신 onEscape 를 부른다 | useOverlayLayer | 없음 |
| 자식이 맨 위이고 Escape 한 번에 자식만 닫히며 부모는 inert 다 | 같은 렌더에서 함께 연 부모·자식 대화상자 중 자식이 스택 맨 위이고 부모는 `inert`, Escape 한 번에 자식만, 다음 Escape 에 부모가 닫힌다 | overlayStack, Dialog | 없음 |
| StrictMode 이중 렌더에서도 자식이 맨 위다 | `StrictMode` 에서도 같은 결과 | 같음 | 없음 |

#### frontend/src/tests/ui/Primitives.test.tsx (16) — 대상 `lib/cn.ts`, `components/ui/Button.tsx`, `IconButton.tsx`, `Spinner.tsx`, `InlineAlert.tsx`, `Badge.tsx`, `Kbd.tsx`, `hooks/useMediaQuery.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| joins truthy class names and skips falsy values | 참인 클래스만 잇는다 | cn | 없음 |
| defaults to type="button" | 기본 `type="button"` | Button | 없음 |
| keeps an explicit type | 지정한 type 유지 | Button | 없음 |
| is disabled and aria-busy while loading | 로딩 중 비활성과 `aria-busy` | Button | 없음 |
| has no aria-busy when not loading | 로딩이 아니면 `aria-busy` 없음 | Button | 없음 |
| exposes buttonClasses for links styled as buttons | 링크용 `buttonClasses` | Button | 없음 |
| uses label for aria-label and title | `label` 이 `aria-label`·`title` | IconButton | 없음 |
| sets aria-pressed when pressed is given | `pressed` 면 `aria-pressed` | IconButton | 없음 |
| Spinner renders an sr-only label | `sr-only` 라벨 | Spinner | 없음 |
| InlineAlert uses role="alert" for danger and role="status" otherwise | danger 는 `alert`, 그 밖은 `status` | InlineAlert | 없음 |
| Badge renders its text | 글자 표시 | Badge | 없음 |
| Badge shrink replaces shrink-0 and max-w-full with shrink and leaves the width limits to className | `shrink` 면 `shrink-0`·`max-w-full` 대신 `shrink` 만 붙고 폭 한계는 `className` 으로 준 것뿐이다 | Badge | 없음 |
| Kbd renders a kbd element hidden below 640px | `kbd` 요소, 640px 미만 숨김 | Kbd | 없음 |
| follows the default desktop (1280px) matchMedia mock | setup.ts 의 1280px mock 을 따른다 | useMediaQuery | setup.ts `matchMedia` |
| returns the value of a matchMedia mock set by the test | 테스트가 바꾼 mock 값을 돌려준다 | useMediaQuery | `matchMedia` 교체 |
| returns false when matchMedia is not a function | `matchMedia` 가 없으면 false | useMediaQuery | `matchMedia` 를 undefined 로 |

#### frontend/src/tests/ui/Tabs.test.tsx (17) — 대상 `components/ui/Tabs.tsx`, `ScrollRow.tsx`
넘침 테스트는 tablist 의 `scrollWidth`·`clientWidth`·`scrollLeft` 를 `HTMLElement.prototype` 에 정의하고 `window.matchMedia` 를 바꿔 쓴 뒤 되돌린다.

| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| renders tablist, tabs and the linked tabpanel | `tablist`·`tab`·연결된 `tabpanel` | Tabs, TabPanel | 없음 |
| uses roving tabIndex: only the selected tab is in the Tab order | 선택 탭만 Tab 순서에 있다 (roving tabIndex) | Tabs | 없음 |
| activates a tab on click | 클릭으로 선택 | Tabs | 없음 |
| moves with ArrowRight/ArrowLeft and wraps around, moving focus and selection | 좌우 화살표로 순환 이동, 포커스·선택 함께 | Tabs | 없음 |
| jumps to the first and last tab with Home and End | Home·End 로 처음·끝 | Tabs | 없음 |
| renders a badge inside the tab | 탭 안 배지 | Tabs | 없음 |
| hides inactive panels with the hidden attribute | 비활성 패널은 `hidden` | TabPanel | 없음 |
| 선택된 패널만 그리면 선택되지 않은 탭에는 aria-controls 가 없다 | 패널을 선택된 것만 그리면 다른 탭에는 `aria-controls` 가 없다 | Tabs | 없음 |
| 탭을 바꾸면 aria-controls 도 새로 선택된 탭으로 옮긴다 | 선택이 바뀌면 `aria-controls` 도 옮긴다 | Tabs | 없음 |
| 모든 aria-controls 가 문서에 있는 요소를 가리킨다 | 모든 `aria-controls` 대상이 문서에 있다 | Tabs | 없음 |
| mountedPanels 로 숨겨 둔 패널이 있는 탭에도 aria-controls 를 단다 | `mountedPanels` 의 탭에도 단다 | Tabs | 없음 |
| 넘치지 않으면 tablist 가 data-scroll-row 이고 data-overflow="none", 마스크·스크롤 버튼 없음 | tablist 가 공통 스크롤 줄이고 넘치지 않으면 표시가 없다 | Tabs, ScrollRow | 레이아웃 정의 |
| 넘치면 넘친 쪽을 data-overflow 로 알리고 흐림을 주며, 768 이상에서 tablist 밖에 스크롤 버튼을 둔다 | 넘친 쪽 `data-overflow`·흐림, 768px 이상 tablist 밖 스크롤 버튼 | 같음 | 레이아웃 정의 |
| 키보드로 옮긴 탭이 보이도록 스크롤한다 | 화살표로 옮긴 탭이 보이게 줄을 민다 | 같음 | 레이아웃 정의 |
| 선택된 탭이 줄 밖에 있으면 처음 그릴 때 줄을 그 탭까지 민다 | 처음 그릴 때 선택 탭까지 민다 | 같음 | 레이아웃 정의 |
| 선택을 줄 밖 탭으로 바꾸면 줄을 그 탭 쪽으로 민다 | 선택이 줄 밖 탭으로 바뀌면 그 탭 쪽으로 민다 (`selectedSelector`) | 같음 | 레이아웃 정의 |
| 768 미만에서 탭 줄이 넘치면 tablist 밖에 장식 넘침 표시를 둔다 | 768px 미만에서 넘치면 tablist 밖에 `data-overflow-hint` | 같음 | 레이아웃 정의, `matchMedia` 폭 mock |

#### frontend/src/tests/ui/Toast.test.tsx (10) — 대상 `components/ui/Toast.tsx`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| shows a status toast and an alert toast for errors | 일반 토스트는 `status`, 오류는 `alert` | ToastRegion, useToast | 없음 |
| renders only once when ToastRegion is mounted twice | `ToastRegion` 이 두 번 마운트돼도 한 번만 그린다 | ToastRegion | 없음 |
| keeps rendering through the second region when the first unmounts | 첫 영역이 언마운트되면 둘째 영역이 이어 그린다 | ToastRegion | 없음 |
| dismisses with the close button and after the duration | 닫기 버튼과 지속 시간 뒤 사라진다 | ToastRegion | `vi.useFakeTimers` |
| 모달이 없으면 composer 영역에 그린다 | 전역·`composer` 영역이 함께 있고 모달이 없으면 `composer` 영역(`data-toast-region="composer"`)에만 그린다. `status`·`aria-live="polite"`·`알림 닫기` 는 그대로 | ToastRegion | 없음 |
| 모달 대화상자가 열려 있으면 global 영역에 그린다 | 모달 대화상자가 열려 있으면 전역 영역에만 그린다 | ToastRegion, Dialog | 없음 |
| composer 영역이 사라지면 global 영역으로 돌아간다 | `composer` 영역이 언마운트되면 전역 영역이 이어 그린다 | ToastRegion | 없음 |
| composer 에서 알린 알림은 global 로 옮겨져도 live 속성이 없고, 새 알림은 global 에서 알린다 | 전역·`composer` 영역에서 `danger` 알림이 `composer` 안에 `role="alert"` 로 뜬 뒤 모달 `Dialog` 를 열어 전역 영역으로 옮겨지면, 같은 알림 요소에 `role`·`aria-live` 가 없고 전역 영역의 `alert` 가 0개이며 닫기 버튼은 그대로다. 그 상태에서 띄운 새 `info` 알림은 전역 영역에서 `role="status"`·`aria-live="polite"` 를 갖는다 | ToastRegion, Dialog | 없음 |
| 영역이 하나일 때는 지금처럼 role·aria-live 를 갖는다 (회귀 방지) | 영역이 하나면 알림은 `status`/`polite`, 오류는 `alert`/`assertive` 다 | ToastRegion | 없음 |
| composer → global → composer 왕복 뒤 같은 알림에 role·aria-live 가 없다 | `composer` 에서 `role="alert"` 로 뜬 `danger` 알림이 모달을 열어 전역으로 옮겨졌다가 모달을 닫아 `composer` 로 돌아오면, `composer` 영역 안 같은 글자의 요소에 `role`·`aria-live` 가 없고 `alert` 가 0개다 | ToastRegion, Dialog | 없음 |

#### frontend/src/tests/ui/useCopyToClipboard.test.tsx (5) — 대상 `hooks/useCopyToClipboard.ts`
| 테스트 이름 | 검증하는 동작 | 대상 코드 | mock/외부 호출 |
|---|---|---|---|
| copies with navigator.clipboard and shows 복사됨 for 2 seconds | `navigator.clipboard` 로 복사하고 2초 동안 `복사됨` | useCopyToClipboard | `navigator.clipboard` mock, `vi.useFakeTimers` |
| falls back to execCommand("copy") when navigator.clipboard is missing | clipboard 가 없으면 `execCommand("copy")` | useCopyToClipboard, copyText | `document.execCommand` mock |
| falls back to execCommand when navigator.clipboard.writeText rejects | `writeText` 거부 시 `execCommand` | 같음 | 같음 |
| reports failed (복사 실패) for 2 seconds when both methods fail | 둘 다 실패하면 2초 동안 `복사 실패` | useCopyToClipboard | 같음 |
| reports failed when there is no clipboard and no execCommand | 둘 다 없으면 실패 | useCopyToClipboard | 같음 |

## 기능 영역별 커버리지
"있음" 은 테스트가 검증하는 동작, "없음" 은 코드에 있지만 이를 직접 부르거나 단언하는 테스트를 찾지 못한 동작이다.

### 뉴스 피드
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 뉴스 목록 기본 조회, `size=1` 조회 | `test_api.py::test_news`, `test_ask_ai_endpoint` |
| 있음 | 통계, RSS 피드, 전체 삭제 | `test_api.py::test_stats`, `test_rss`, `test_reset_and_delete.py::test_delete_all_news_endpoint` |
| 있음 | 뉴스 카드 렌더링·북마크·선택·포커스, 고정 틀(머리줄 한 줄, 짧은 카테고리 라벨, 배지 줄과 기술 배지 줄어듦·말줄임·`title`, 머리줄 카테고리 `title` 긴 라벨, 바닥 인기 점수(원천 지표 소스만), 소스별 원천 지표(스타·포인트·추천)와 합성 점수·합성 인기 점수 숨김, GitHub 포크, `data-source`·`data-card-stat`·`data-metric`, 바닥 줄 줄바꿈과 모든 폭의 `AI 챗에서 분석` 글자, `시사점`, 반복이면 요약), 카드·상세 모달의 `AI 챗에서 분석` 이동 버튼 | `NewsCard.test.tsx`, `ui/Primitives.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 반복 시사점 판정(공백 정리, 끝 40자, 20자 미만 제외) | `feed/FeedInsights.test.ts` |
| 있음 | 뉴스 목록 MSW 핸들러와 `NewsItemSchema` 계약 | `ContractAndMsw.test.ts` (MSW News 절) |
| 있음 | 검색 영역·필터 영역(검색 영역 `[data-feed-search]` 전체 폭·`scroll-mt-20`, 필터 영역 안 검색 입력·선택 상자 없음, 카테고리·소스 칩과 건수, 소스 줄 오른쪽 끝 `Must-Read` 토글(위치·폭별 모양·같은 노드), 검색 제출·지우기, 고르면 1페이지, 줄 배치, 자리표시 `키워드 검색`, 768px 미만 소스 줄 왼쪽만 bleed·토글 같은 줄, 768px 이상 줄 B 그대로, 양쪽 넘침 표시(오른쪽은 토글 앞), 폭이 바뀌어도 같은 노드·포커스·값, 세 폭의 DOM 순서 `검색 → 카테고리 → 소스 → Must-Read`, 소스 줄 선택 칩) | `feed/FeedToolbar.test.tsx` |
| 있음 | 목록 머리줄(정렬 select 4개 선택지와 콜백·1페이지, 정렬이 상태 live 영역 밖·뒤, 상태 `aria-live`·페이지 글자, 한 줄 배치·위쪽 맞춤·상태 최소 높이, 폭이 바뀌어도 같은 정렬 노드) | `feed/FeedStatusBar.test.tsx` |
| 있음 | 요약 바(브리핑 버튼, 트렌드 레이더 펼침, 태그 선택·초기화, 폭별 표시, 다시 읽기 중 스켈레톤 없음, 레이더 카테고리 분포 배치·한국어 라벨) | `feed/InsightsBar.test.tsx`, `feed/TrendRadarPanel.test.tsx` |
| 있음 | 피드 훅의 다시 읽기(같은 조건이면 목록 유지·로딩 없음, 통계 실패해도 브리핑·레이더 반영, 실패 신호와 오류 구분) | `hooks/useNewsFeed.test.tsx` |
| 있음 | 기사 상세 대화상자(제목 이름, 탭과 화살표 키, 한국어 절 제목, `대화 초기화` 확인 창, 닫기, 바닥 출처 라벨, `AI 질의응답` 탭 입력 중 Escape, 답변 복사 실패 표시)와 질의응답 패널(자리표시, 빠른 질문 스크롤 줄, 빠른 질문 앞 lucide 아이콘) | `modals/NewsDetailModal.test.tsx`, `AskAiPanel.test.tsx` |
| 있음 | 피드 단축키의 오버레이 차단, Enter/Space 조건, 한글 자판 `e.code` 판정 | `HotkeyGating.test.tsx` |
| 없음 | 목록 필터·정렬·검색·페이지(`category`, `source`, `search`, `sort`, `high_signal_only`, `page`) | `backend/app/api/news.py:47-95` |
| 없음 | 단건 조회 `GET /api/news/{id}`, ask 의 404 | `backend/app/api/news.py:104-119` |
| 없음 | RSS 의 `category` 파라미터 | `backend/app/api/news.py:169-197` |
| 없음 | 피드 메인 화면 조립(`/` 단축키의 검색 영역 스크롤 포함), 피드 훅의 다시 읽기 밖 동작(필터 조합, 북마크 보기), 북마크 훅, 목록 머리줄 상태의 필터·북마크 배지 글자, 페이지 이동 | `frontend/src/app/page.tsx`, `frontend/src/hooks/useNewsFeed.ts`, `frontend/src/hooks/useBookmarks.ts`, `frontend/src/components/feed/FeedStatusBar.tsx`, `feed/FeedPagination.tsx` |
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
| 있음 | 헤더 수집 상태 버튼·즉시 수집(모바일 더보기)·초기화 확인 창과 창 안 오류, 수집 중 팔레트 초기화 비활성, 스케줄 대화상자의 즉시 수집·위험 영역 (API 는 mock) | `Header.test.tsx`, `modals/ScheduleModal.test.tsx` |
| 있음 | 수집 상태 복원(마운트 때 `is_running` 이면 수집 중·진행 폴링), `already_running` 응답 처리(수동 수집은 합류, 초기화는 거부), 이전 회차 진행 응답 무시, 오래된 스케줄 상태 응답 버리기(진행 폴링이 끝난 뒤 도착한 30초 재조회 응답, 더 나중 응답보다 늦게 온 응답)와 `수집 완료` 한 번 | `hooks/useCollector.test.ts`, `Header.test.tsx` |
| 없음 | 진행 줄 문구의 단계별 변화 | `frontend/src/hooks/useCollector.ts` |

### AI 챗
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | global/scoped query·stream, 입력 검증(빈 값, 2000자 초과, 잘못된 scope, 없는 출처) | `test_chat.py` |
| 있음 | ReAct 흐름(검색 도구, 잡담 생략, LLM planner, 인용 필터) | `test_agentic_workflow.py` |
| 있음 | 503/502/429 오류 매핑(stream 사전 검사, query), 스트림 중간 오류 이벤트 | `test_chat.py` 7개 |
| 있음 | FTS 검색, 품질 컷, 포커스 필터, 시간 완화, 동적 출처 수, LIKE 대체 | `test_chat.py`, `test_dynamic_rag_retrieval.py` |
| 있음 | 세션 CRUD, FIFO 30, 자동 제목, 스트림 자동 저장, 오류 분기 | `test_chat_sessions.py` |
| 있음 | 3-tier 모델 해석·라우팅, Anthropic HTTP·SSE·오류 매핑, 모델명 보존 | `test_anthropic_provider.py`, `test_scoped_chat_grounding.py` |
| 있음 | 챗 화면 전체(스트림, 중지, 재시도, 필터, 모델 변경, 입력창 아래 모델 선택 하나, 세션 복원·삭제)와 하위 컴포넌트, 검색 범위 용어(`단일 기사`·`전체 소식`: 탭 접근 이름, 세션 배지·접근 이름, 없는 기사 알림, 캡슐 `포커스:`), 포커스 필터 창 카테고리 칩 긴 라벨 순서, 모델 티어 lucide 아이콘(`data-tier-icon`), 카드·배너 이관 버튼 이름 `AI 챗에서 분석` | `frontend/src/tests/chat/*.test.tsx` |
| 있음 | 프론트 채팅 계약(zod)과 MSW 핸들러 | `ContractAndMsw.test.ts` |
| 없음 | API 수준 401(키 누락)·529(과부하) 응답 | `backend/app/api/chat.py:212-237`, `350-375` (프론트 MSW 트리거만 있음) |
| 없음 | 대화 history 를 담은 요청이 프롬프트에 반영되는지 | `backend/app/services/chat_service.py:222` `_build_grounding_prompt` (backend 테스트 중 history 를 보내는 것이 없다) |
| 없음 | 보조 웹 검색 전체 흐름 `evaluate_and_search` | `backend/app/services/agentic_search.py:221-246` (단위 함수만 테스트, 서비스 호출처 없음) |
| 없음 | 뉴스 상세 질의응답 탭의 답 스트림 처리·오류 분기 | `frontend/src/components/NewsDetailModal.tsx`, `frontend/src/lib/api.ts:70-169` (`modals/NewsDetailModal.test.tsx` 는 빠른 질문 전송과 대화 추가까지만 단언한다) |

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
| 있음 | 공유 & 알림 설정 대화상자(탭 3개, 비밀값 보기 토글, 바닥 `연결 테스트`·`저장`·`닫기`, 저장 결과 안내, 배경 클릭으로 안 닫힘) | `modals/BriefingSettingsModal.test.tsx` |
| 있음 | 요약 바의 브리핑 버튼 | `feed/InsightsBar.test.tsx` |
| 있음 | 일일 브리핑 대화상자의 `이메일 발송` `aria-controls`(주소 입력 줄이 열렸을 때만), 설정 진입 한 곳(`브리핑 작업` 메뉴에 없음), 헤드라인 한 번, 분야 머리글 긴 라벨·lucide 아이콘, 개요 분야 이름 바꾸기, 시사점 아이콘 | `modals/DailyBriefingModal.test.tsx` |
| 없음 | 일일 브리핑 대화상자의 나머지 동작(Notion 발행, 이메일 발송 요청, 복사·다운로드, 탭), 설정 대화상자의 `연결 테스트` 요청, 웹훅 설정 모달 | `frontend/src/components/DailyBriefingModal.tsx`, `BriefingSettingsModal.tsx:230` 이하, `WebhookSettingsModal.tsx` |

### 소스·리서치
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | sources 읽기, 활성 피드, RSS 추가·토글·삭제(서비스) | `test_sources_and_research.py` |
| 있음 | 후보 탐색(카탈로그), URL 검사(GitHub), 후보 등록 | `test_sources_and_research.py` |
| 있음 | 딥 리서치 피드 탐지·평가·실행·감사 로그·API | `test_deep_researcher.py` |
| 있음 | 소스 목록 계약(`SourceConfigSchema`) | `ContractAndMsw.test.ts` |
| 없음 | 소스 관리 API(RSS 추가, GitHub 저장소 추가, 토글, 삭제) | `backend/app/api/sources.py:49-91` |
| 없음 | GitHub 저장소 추가 서비스 | `backend/app/services/sources_service.py:222-243` |
| 없음 | `POST /api/research/inspect-url` | `backend/app/api/research.py:24-33` |
| 없음 | 일반 웹사이트(HTML link 태그, 표준 경로 탐침) 피드 탐지 | `backend/app/services/source_researcher.py:204-268`, `deep_researcher.py:223-265` (테스트는 GitHub 분기만 지난다) |
| 있음 | 소스 대화상자(첫 탭, 소스별 `Switch`·삭제 버튼, 삭제 `ConfirmDialog`, Escape 는 확인 창만, 배경 클릭으로 안 닫힘, `새 피드 직접 등록` 의 `aria-controls`, 카테고리 선택지 긴 라벨) | `modals/SourcesModal.test.tsx` |
| 있음 | 딥 리서처 탭 지표 값의 줄바꿈(말줄임 없음) | `modals/DeepResearcherTab.test.tsx` |
| 없음 | `Switch` 를 눌렀을 때의 토글 요청, RSS 추가 폼 제출, 딥 리서처 실행·감사 일지 동작 | `frontend/src/components/SourcesModal.tsx:107`, `sources/SourcesListTab.tsx:66`, `sources/DeepResearcherTab.tsx` |

### MCP 서버
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | `/api/mcp/info` 응답의 tools 개수 (정적 목록) | `test_api.py::test_mcp_info` |
| 없음 | MCP 도구 4개의 실제 동작 | `backend/app/mcp/server.py:10-50` |
| 없음 | MCP 안내 모달 | `frontend/src/components/McpModal.tsx` |

### UI 공통
| 구분 | 동작 | 근거 |
|---|---|---|
| 있음 | 테마 시스템, 단축키, 커맨드 팔레트(자리표시 `명령어 검색 또는 바로가기` 포함) | `ThemeSystem.test.tsx`, `HotkeyListener.test.tsx`, `CommandPalette.test.tsx` |
| 있음 | 가로 넘침 방지 클래스, 모바일 viewport(확대 허용)·가상 키보드 | `ResponsiveLayout.test.tsx`, `MobileViewport.test.tsx` |
| 있음 | 헤더(빌드 버전 배지와 값이 없을 때, `주 메뉴` 의 "AI 챗" 링크, 폭별 더보기 항목, ⌘K, 팔레트 추가 명령) | `Header.test.tsx`, `HandoverIntegration.test.tsx` |
| 있음 | 디자인 토큰 규칙(`.tsx` 의 hex·팔레트 색 클래스, `globals.css` 의 `!important` 없음)과 라이트·다크 토큰 대비 | `design/TokenGuard.test.ts`, `design/TokenContrast.test.ts` |
| 있음 | UI 글자의 그림 이모지 금지(`components/**`·`app/**` 정적 검사, 텍스트 표현 기호 허용) | `ui/IconGuard.test.ts` |
| 있음 | 공통 부품(대화상자·드로어·확인 창과 처리 중 포커스, 메뉴·팝오버·테마 메뉴, 탭과 `aria-controls`·스크롤 줄, 토스트와 `composer`·전역 영역 고르기·한 번만 알리기, 입력·표시 부품과 `Badge shrink`, 긴·짧은·레이더 라벨, 카드 지표 표·검색 범위 라벨), 가로 스크롤 줄(`ScrollRow`: 넘침 상태, 흐림, 768px 이상 버튼과 사라질 때 포커스 유지, 768px 미만 넘친 쪽마다 표시·보이지 않는 자리, 상태별 `bleed`, `scroll-px-6`·`data-selected-selector`, 선택·포커스 항목 보이기와 크기 변화 뒤 다시 보이기, 입력 신호 뒤 `scroll` 만 사용자 스크롤로 보는 판정과 가로 의도 휠만 입력 신호로 세기, 스냅 위치 고르기), 오버레이 스택(Escape 맨 위만, `inert`, 같은 렌더 부모·자식 순서), 복사 훅, `useMediaQuery` | `ui/*.test.tsx` |
| 있음 | 챗 헤더의 폭별 "새 대화" 표시 조건, 헤더에 모델 선택 없음, `피드로 돌아가기` 가 헤더 첫 조작 요소(기록 버튼 앞), 기록 버튼 `aria-controls`(열렸을 때만), 추천 질문 왼쪽 정렬·앞 lucide 아이콘·이모지 없이 보내기, 기사 칩 짧은 카테고리 라벨 | `chat/ChatHeader.test.tsx`, `chat/ChatMessageList.test.tsx`, `chat/ActiveSourceChip.test.tsx` |
| 있음 | 트렌드 태그 분류와 레이더 응답 형식 | `test_trends_and_webhook.py` |
| 없음 | 트렌드 레이더 집계 로직의 값 | `backend/app/services/trend_service.py:40-139` (키 존재만 단언) |
| 없음 | 폭별 화면 규칙(문서 가로 스크롤, 헤더 높이·한 줄, 첫 화면 카드, 44px 터치 영역, 잘림·자리표시 길이·가림, 카드 줄 맞춤, 세로 간격, 피드 세 영역 배치·끝 맞춤, 카드 바닥 글자, 챗 열 맞춤, 챗 알림 위치). jsdom 은 레이아웃을 계산하지 않는다. `frontend/scripts/ui-audit.mjs` 가 실행 중인 앱에서 따로 잰다 (`make check` 밖) | `frontend/src/app/page.tsx`, `frontend/src/components/chat/ChatWorkspace.tsx` |
| 없음 | 첫 그리기 전 테마 적용 인라인 스크립트 | `frontend/src/app/layout.tsx:23-32` |
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
| 있음 | 앱 lifespan 의 빈 DB 첫 수집(백그라운드, 종료 때 취소)과 기사가 있을 때 건너뜀 (스케줄러·스키마는 흉내) | `test_startup_seed.py` |
| 있음 | `sources.json` 저장의 `replace` 실패(`EBUSY`) 대체 경로와 평소 원자적 교체 | `test_sources_write_fallback.py` |
| 있음 | Makefile 대상 집합·`.PHONY`·`SHELL`, 12개 대상 `make -n`, `test` = `check`, 레시피가 부르는 파일, `\|\| true`·`config.json` 읽기 전용 마운트 부재, compose 파일 유효성, `reset` URL 변수, `docker-logs` 종료 130 처리 | `test_make_targets.py` |
| 없음 | 앱 lifespan 의 스케줄러 시작·중지와 실제 스키마 생성 | `backend/app/main.py:25-26, 46-47` |
| 없음 | 프론트 환경변수 검증 | `frontend/src/lib/env.ts` |

## 외부 호출 판정
판정 기준: "외부 호출함" 은 mock 없이 인터넷 호스트로 요청을 보내는 경로가 테스트에서 항상 실행된다는 뜻이다. "조건부" 는 키·설정·캐시·로컬 서비스 상태에 따라 갈린다. 로컬호스트(Ollama, jsdom origin) 요청은 판정 칸에 "로컬" 로 따로 적는다.

### test-strategy.md '외부 호출 가능성 (미확정)' 항목
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `config.py` 가 `.env`, `backend/.env` 를 읽는가 | import 때 읽지만 테스트에는 반영되지 않는다 | `backend/app/config.py:8-10` 이 import 시 `cwd/.env`, `cwd/backend/.env`, `cwd.parent/.env`, `backend/.env` 를 `load_dotenv(override=False)` 로 읽고, `config.py:102-105` 의 pydantic `env_file` 도 같은 파일을 읽는다. `make check` 는 `backend/` 에서 pytest 를 돌리므로 `backend/.env` 와 루트 `.env` 가 모두 읽힌다. 테스트마다 `llm_isolation` 이 LLM 환경 변수를 지우고 `settings` 의 LLM 필드를 고정하며 `env_file` 을 `None` 으로 둬 `settings.reload()` 도 `.env` 를 다시 읽지 않는다 (`backend/tests/conftest.py`) |
| `is_test_environment()` 가 라이브 호출을 막는가 | 막지 않는다 (ReAct planner 1곳만 막는다) | 조건: `settings.TESTING` 이 참, 환경변수 `TESTING` 또는 `CI` 가 true/1/yes, 또는 `"pytest" in sys.modules` (`backend/app/services/llm_processor.py:288-299`). pytest 실행 중에는 마지막 조건으로 항상 True 다. 호출처는 `backend/app/services/chat_service.py:381` 한 곳뿐이고, global 챗의 planner LLM 호출만 건너뛴다. `generate_live_answer`(`llm_processor.py:340`), `stream_tokens`(`:404`), `evaluate_content_with_llm`(`:619`), `answer_question_with_meta`(`:787`), `stream_question_answer`(`:901`), `has_live_provider` 의 Ollama 탐침(`:171-194`)은 이 판정을 보지 않는다. 테스트 중 실제 LLM 호출은 하네스가 막는다 |
| `conftest.py` 의 환경변수 설정 | `DATABASE_URL` 을 바꾸고, 테스트마다 LLM 환경 변수 다섯 개를 지운다 | `backend/tests/conftest.py:6-7`, `llm_isolation`. `TESTING`, `CI` 는 설정하지 않는다. `config.py:131-132` 는 `TESTING` 환경변수가 있을 때만 `settings.TESTING` 에 반영한다 |
| `test_config_and_live_llm.py::test_config_json_found_and_loaded`, `test_get_custom_json_value` | 안 함 | 설정 파일 읽기만 한다 (`config.py:14-35`) |
| `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` | 안 함 (흉내 Claude) | `answer_question` → `answer_question_with_meta` (`llm_processor.py:974-977`, `756-792`) → `_generate_live_answer` → `generate_live_answer` → `httpx.AsyncClient.post("https://api.anthropic.com/v1/messages")` (`anthropic_provider.py:233-234`) 를 하네스의 흉내 Claude 가 받는다. 예외: 같은 프로세스에서 `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 먼저 돌면 같은 캐시 키(제목+질문)로 휴리스틱 답이 `_qa_cache` 에 들어가고(`llm_processor.py:971`), 이 테스트는 캐시를 돌려받아 호출하지 않는다(`llm_processor.py:765-768`). 파일 이름순 실행에서는 그 테스트가 먼저 돈다 |
| `test_deep_researcher.py::test_probe_and_discover_feed_github` | 외부 호출함 | GitHub 분기(`deep_researcher.py:216-221`) → `_fetch_and_parse_feed` 가 `https://github.com/All-Hands-AI/OpenHands/releases.atom` 을 httpx GET 하고 `feedparser.parse(resp.text)` 로 로컬 파싱한다(`deep_researcher.py:267-278`). 네트워크가 없으면 status 가 success 가 아니어서 실패한다 |
| `test_deep_researcher.py::test_evaluate_and_decide_scoring` | 안 함 | `evaluate_and_decide` 는 sources.json 읽기와 휴리스틱 점수만 쓴다 (`deep_researcher.py:304-374`, `llm_processor.py:516-580`) |
| `test_deep_researcher.py::test_deep_research_run_and_audit` | 외부 호출함 (파일 쓰기 가능) | `run_deep_research(max_candidates=2)` 가 시드 앞 2개(`https://lilianweng.github.io`, `https://eugeneyan.com`, `deep_researcher.py:23-31`, `395-412`)를 probe 한다: 페이지 GET, 표준 경로 HEAD 탐침, 피드 GET (`deep_researcher.py:223-263`, `269-271`). 점수 8.2 이상이면 `sources_service.add_rss_source` 로 sources.json 에 추가하고(`deep_researcher.py:441-449`) 테스트는 지우지 않는다. 네트워크가 실패해도 REJECTED 로그가 남아 테스트는 통과한다 |
| `test_deep_researcher.py::test_deep_research_api_endpoints` | 조건부 | `/status`, `/audit-logs` 는 호출 없음. `POST /run-deep?max_candidates=1` 은 `asyncio.create_task(run_deep_research(...))` 로 시드 1개 probe 를 시작한다(`backend/app/api/research.py:87`). 테스트는 응답만 확인하고 끝나므로, 테스트 이벤트 루프가 닫히기 전까지 태스크가 어디까지 진행되는지는 확인하지 못했다 |
| `test_sources_and_research.py::test_sources_service_load`, `test_sources_service_active_feeds` | 안 함 | sources.json 읽기 (`sources_service.py:36-45`, `134-139`) |
| `test_sources_and_research.py::test_sources_toggle_and_crud` | 안 함 (파일 수정함) | `add_rss_source`·`toggle_source`·`delete_source` 가 매번 `save_sources` 로 파일을 쓴다 (`sources_service.py:169-220`, `245-262`, `102-132`) |
| `test_sources_and_research.py::test_source_researcher_discover` | 안 함 | `discover_sources` 는 메모리 상수 `CURATED_ECOSYSTEM_CATALOG` 만 거른다 (`source_researcher.py:331-383`). docstring 의 "live feed probing" 과 달리 네트워크 호출이 없다 |
| `test_sources_and_research.py::test_source_researcher_inspect_url` | 외부 호출함 | GitHub 분기(`source_researcher.py:193-198`) → `https://github.com/princeton-nlp/SWE-bench/releases.atom` httpx GET 후 feedparser 파싱 (`source_researcher.py:270-281`). 실패하면 status 가 found 가 아니어서 실패한다 |
| `test_sources_and_research.py::test_sources_and_research_api_endpoints` | 안 함 (파일 수정함) | `GET /api/sources` 는 파일 읽기, `POST /api/research/discover` 는 메모리 카탈로그, `register-candidate` 는 `add_rss_source` 로 파일을 쓰고(`source_researcher.py:397-404`) 테스트 끝에서 `delete_source` 로 지운다 (finally 블록이 아니다) |
| `test_sources_toggle_and_crud` 가 고치는 sources.json | 세션 임시 사본 (저장소 루트 `sources.json` 은 바뀌지 않음) | `find_sources_file` 후보 순서: `cwd/sources.json` → `cwd.parent/sources.json` → `<저장소 루트>/sources.json` → `backend/app/config/sources.json` (`sources_service.py:11-24`). `make check` 는 `cd backend && pytest` 라 `backend/sources.json`(없음) 다음의 `../sources.json` = 루트 파일이 잡힌다. 루트에서 pytest 를 돌려도 `cwd/sources.json` 이 같은 루트 파일이다. `backend/app/config/sources.json` 은 루트 파일이 없을 때만 쓰인다. 테스트에서는 `llm_isolation` 이 `sources_service._file_path` 와 거울 경로 `_mirror_path` 를 세션 사본으로 바꿔, 이 탐색 결과와 고정 거울 경로 대신 사본에 쓴다. 쓰기는 `.tmp` 에 쓴 뒤 `replace` 한다. 교체가 `OSError` 면 대상 파일에 제자리로 쓴다 (`sources_service.py:102-118`) |

### 그 밖에 찾은 외부 호출 테스트
| 항목 | 판정 | 근거 `path:line` |
|---|---|---|
| `test_anthropic_provider.py::test_chat_stream_3tier_model_routing` | 안 함 (흉내 Claude) | LLM mock 이 없다. `api/chat.py:349` `check_provider_available` → `chat_service.py:748` `stream_tokens(model="claude-haiku-5-5")` → Anthropic SSE (`anthropic_provider.py:246` 이하) 를 흉내 Claude 가 받는다 |
| `test_anthropic_provider.py::test_chat_query_3tier_model_routing` | 안 함 (흉내 Claude) | `chat_service.py:546` `generate_live_answer(model="claude-opus-5-5")` → Anthropic POST 를 흉내 Claude 가 받는다 |
| `test_api.py::test_ask_ai_endpoint` | 안 함 (흉내 Claude) | `api/news.py:122` → `answer_question_with_meta` → `generate_live_answer` |
| `test_api.py::test_ask_ai_stream_endpoint` | 안 함 (흉내 Claude) | `api/news.py:150` → `stream_question_answer` → `anthropic_provider.stream_chat` (`llm_processor.py:901-904`) 를 흉내 Claude 가 받는다 |
| `test_llm_processor.py::test_answer_question` | 안 함 (흉내 Claude) | `test_llm_processor_fallback_and_answer` 와 같은 경로, 다른 캐시 키 |
| `test_collectors.py::test_evaluate_content_with_llm_strict_gate` | 안 함 (흉내 Claude) | 첫 호출은 pre-filter 로 끝난다(`llm_processor.py:603-615`). 두 번째(AI 글)는 `has_live_provider()` 가 참(가짜 Anthropic 키)이라 `_generate_live_answer` 를 부르고(`llm_processor.py:619-649`), 흉내 답에 JSON 이 없어 휴리스틱 폴백으로 판정된다 |
| `test_llm_processor.py::test_chat_stream_end_to_end_with_mocked_llm` | 안 함 | `stream_tokens` 만 mock 이고 `check_provider_available` 은 실제다(`api/chat.py:349`). 하네스의 가짜 Anthropic 키로 네트워크 없이 True(`llm_processor.py:313-314`) |
| `test_llm_processor.py::test_scoped_chat_stream_end_to_end_with_mocked_llm` | 외부 호출함 | 위 조건에 더해 item 999 (`https://example.com/isolated-scoped-benchmark`, `full_content` 없음)를 스크래퍼가 GET 한다 (`chat_service.py:622-629` → `scraper.py:74-75`). 실패는 잡혀서 진행된다 |
| `test_chat.py::test_chat_query_scoped_mode_success`, `test_chat_stream_scoped_sse_success` | 외부 호출함 (URL 별 프로세스 첫 회) | scoped 경로가 스크래퍼를 mock 없이 부른다 (`chat_service.py:495-502`, `622-629` → `scraper.py:126-174`). 대상은 item 101 `https://github.com/jlowin/fastmcp`. L1 캐시가 클래스 속성(`scraper.py:35`)이라 같은 URL 은 프로세스에서 한 번만 요청한다. 성공하면 본문이 테스트 DB 에 저장된다(`scraper.py:157-165`). 이 테스트들이 patch 하는 `AgenticSearchService.evaluate_and_search` 는 서비스에 호출처가 없다 |
| `test_chat_sessions.py::test_chat_stream_auto_persists_turn_and_auto_titles` | 외부 호출함 | scoped `source_id=1` 의 URL `https://github.com/example/langgraph-harness` (`conftest.py:25`)를 스크래퍼가 GET 한다. 실패는 잡혀서 진행된다 |
| `test_briefing_notion_email.py::test_notion_export_page_mock` | 외부 호출함 | `httpx.AsyncClient.post` 만 patch 한다. `create_briefing_page` 의 `GET https://api.notion.com/v1/databases/{id}` (`notion_service.py:238-239`)는 patch 되지 않아 가짜 키 `secret_test123` 으로 실제 요청을 보낸다. 예외·비 200 은 무시된다(`:240-246`) |
| `test_briefing_notion_email.py::test_email_api_endpoints` (`/test/email` 부분) | 조건부 (현재 config.json 으로는 외부 호출함) | 요청의 `smtp_host` 가 "" 이라 `settings.SMTP_HOST` 를 쓴다(`email_service.py:190`). 커밋된 루트 `config.json` 의 `briefing.email.smtp_host` 는 "smtp.gmail.com", `smtp_to` 는 "team@example.com" 이라 수신자가 생기고(`:200-202`), `smtplib.SMTP("smtp.gmail.com", 587)` 연결과 STARTTLS 를 시도한다(`:158-164`). `config.json` 의 smtp_user/smtp_password 값은 확인하지 못했다. 값이 있으면 로그인과 발송까지 간다(`:166-169`). 실패하면 400 이 나와 테스트는 통과한다 |
| `test_briefing_notion_email.py::test_notion_api_endpoints` (`/test/notion` 부분) | 조건부 | 요청 키가 "" 이라 `settings.NOTION_API_KEY` 를 쓴다(`notion_service.py:35`). 이 값이 비어 있으면 호출 없이 400, 값이 있으면 `GET https://api.notion.com/v1/users/me` 를 보낸다(`:41-43`). config.json 의 Notion 키 값은 확인하지 못했다 |
| `test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer`, `test_anti_gemini_isolation_in_stream_tokens` | 안 함 | `settings.OLLAMA_BASE_URL` 을 "" 로 patch 한다. `_resolve_ollama_url` 은 다음으로 `config.json` 의 `ollama_base_url` 을 보지만 하네스의 세션 사본에서는 빈 값이고 환경 변수도 지워져 있어, Ollama 탐침 없이 판정이 False 가 된다 (`llm_processor.py:150-160, 319`) |
| `test_llm_processor.py::test_stream_tokens_fails_fast_without_mock_fallback` | 안 함 | `llm_processor.openai_key`·`ollama_url` 을 "" 로 patch 한다. 덮어쓰기가 `None` 이 아니면 그 값만 쓰므로 OpenAI·Ollama 갈래가 꺼진다 (`llm_processor.py:131-132, 152-153, 476`) |
| 키가 없을 때 `has_live_provider()` 를 지나는 테스트 | 안 함 | Anthropic·OpenAI 키가 없고 Ollama 주소가 있으면 `httpx.Client.get(f"{ollama_url}/api/tags")` 를 보낸다 (`llm_processor.py:171-194`). 하네스 기본 상태에는 가짜 Anthropic 키가 있고, 키를 비우는 테스트도 Ollama 주소가 비어 있거나 흉내 Ollama 로 간다. 흉내 없는 포트 11434 요청은 가드가 막고 테스트를 실패시킨다 |
| frontend `HandoverIntegration.test.tsx` 의 Header 테스트 | 조건부 (로컬) | Header 가 `useCollector` 로 마운트 시 `fetchScheduleStatus()` 를 불러 `/api/schedule/status` 를 요청한다(`frontend/src/components/Header.tsx:62`, `frontend/src/hooks/useCollector.ts:82-90`, `frontend/src/lib/api.ts:171-173`). MSW 핸들러에 schedule 경로가 없고 `onUnhandledRequest: 'bypass'` (`frontend/src/tests/setup.ts:70`)라 jsdom 문서 origin 으로 실제 fetch 가 나간다. 실패는 `.catch(() => {})` 로 무시된다(`useCollector.ts:89`). `Header.test.tsx`, `modals/ScheduleModal.test.tsx` 는 `vi.mock('@/lib/api')` 로 이 요청을 막는다 |
| 그 밖의 frontend 테스트 | 안 함 | 채팅·뉴스 요청은 상대 경로이고 MSW `*/api/...` 핸들러가 받는다 (`frontend/src/mocks/handlers.ts:218-480`, `mocks/handlers/chat.ts:243-1098`) |

## 알려진 불일치·위험

### 테스트가 쓰는 설정 파일
- `test_briefing_notion_email.py::test_briefing_settings_get_and_post` 는 `POST /api/briefing/settings` 로 `save_json_config` 를 불러(`backend/app/api/briefing.py:207`, `backend/app/config.py:161-169`) `config.json` 을 덮어쓰고 `settings.reload()` 한다. 테스트에서는 세션 사본에 쓰고 루트 `config.json` 은 바뀌지 않는다. 커밋된 루트 `config.json` 에는 예전 실행이 남긴 이 테스트의 값(`notion.page_id: "test_notion_parent_page"`, `email.smtp_host: "smtp.gmail.com"`, `email.smtp_to: "team@example.com"`, `test_briefing_notion_email.py:145-150`)이 들어 있고, 세션 사본이 이 값을 그대로 가져간다.
- 위 값 때문에 `test_email_api_endpoints` 의 `/test/email` 이 실제 SMTP 연결을 시도한다 (`## 외부 호출 판정` 참조).
- `test_sources_toggle_and_crud`, `test_sources_and_research_api_endpoints`, `test_deep_research_run_and_audit` 가 `sources.json` 을 쓴다. 세션 사본이라 루트 `sources.json`·`backend/app/config/sources.json` 은 바뀌지 않지만, 같은 세션의 뒤 테스트는 바뀐 사본을 본다. 앞의 둘은 추가 후 지우지만 try/finally 가 없어 중간 단언이 실패하면 항목(`test_feed_discovery`, `test_autogen_blog`)이 사본에 남는다. 딥 리서치는 AUTO_ADOPTED 소스를 지우지 않는다.

### 테스트 DB
- `backend/tests/test_agentlens.db`, `-shm`, `-wal` 은 로컬에 있지만(2026-11-02 수정, WAL 약 4.2MB) git 에 커밋돼 있지 않다. `git ls-files backend/tests` 에 없고 `.gitignore` 가 `backend/tests/test_agentlens.db`, `*.db-shm`, `*.db-wal` 을 무시한다.
- conftest 는 `create_all` 로 없는 테이블만 만들고 데이터를 지우지 않는다(`backend/app/database.py:45-48`, `conftest.py:13-44`). `docs/test-strategy.md` 의 "테스트마다 스키마를 만든다" 는 기존 테이블·행을 유지한다는 점에서 코드와 다르다. 고정 id 시드(1, 101~103, 201, 9001~9005), 스크래퍼가 저장한 `full_content`, 자동 저장된 채팅이 실행 사이에 남는다.
- 개발 DB 격리는 지켜진다: conftest 가 `DATABASE_URL` 을 먼저 설정하고, `load_dotenv(override=False)` 와 pydantic 의 "환경변수 우선" 규칙 때문에 `.env` 의 `DATABASE_URL` 이 덮지 못한다 (`config.py:8-10`, `conftest.py:6-7`).

### 순서 의존
- `_qa_cache` 공유: `test_anthropic_provider.py::test_anti_gemini_stream_question_answer_never_yields_gemini` 가 남긴 휴리스틱 답을 `test_config_and_live_llm.py::test_llm_processor_fallback_and_answer` 가 같은 키로 받는다 (`llm_processor.py:765-768`, `938`). 단독 실행 때와 전체 실행 때 경로가 다르다.
- item 201 은 `test_chat.py::test_sqlite_fts_retriever_auto_relaxation_on_zero_matches` 만 넣는다. 같은 파일 뒤쪽 `test_chat_query_with_focus_filters_and_relaxation` 은 완화 결과가 있어야 `is_relaxed` 가 True 가 되는데(`retriever.py:569-586`), 201 이 없을 때(예: 이전 실행의 초기화 테스트로 DB 가 비워진 뒤 단독 실행)의 결과는 확인하지 못했다.
- `test_reset_and_delete.py` 두 테스트가 테스트 DB 의 뉴스(와 크롤 로그)를 모두 지운다. 다음 테스트는 fixture 가 다시 시드한다.
- 스크래퍼 L1 캐시가 클래스 속성이라(`scraper.py:35`) 프로세스 전체에서 공유된다. scoped 테스트의 외부 요청 여부가 앞선 테스트에 따라 달라진다.
- `POST /api/research/run-deep` 가 띄운 백그라운드 태스크(`research.py:87`)가 테스트 종료 후에도 남아 있을 수 있다. `deep_researcher.is_running` 이 남으면 같은 프로세스의 다음 실행이 `already_running` 을 받는다(`deep_researcher.py:385-386`). 실제 진행 범위는 확인하지 못했다.

### 실행 환경에 따라 실패할 수 있는 테스트
- 네트워크가 없으면 실패: `test_probe_and_discover_feed_github`, `test_source_researcher_inspect_url`.
- LLM 키·로컬 Ollama 상태·설치 모델에 따라서는 결과가 바뀌지 않는다 (하네스). 2026-11-08 키 있음/없음, OpenAI 키만, Ollama 연결 안 됨/설정 모델 없음/있음 여섯 조건에서 174개 모두 통과했다.
- `.env` 값이 settings 를 덮는다: `VERSION`, `ANTHROPIC_*_MODEL` 이 바뀌면 `test_version_*`, `test_anthropic_config_and_schema_defaults` 가 실패한다. `test_config_json_found_and_loaded` 는 `HIGH_SIGNAL_THRESHOLD == 7.0` 을 단언하는데 이는 config.json 값이고 코드 기본값은 7.8 이다(`config.py:65`).

### 효과가 없는 patch
- `AgenticSearchService.evaluate_and_search` patch (`test_chat.py:258`, `test_agentic_workflow.py:267, 323, 435`): 서비스 코드에 호출처가 없다 (호출은 `agentic_search.py:242` 내부뿐). `test_chat_scoped_graceful_degradation_when_scrape_fails` 는 이 mock 에 보조 출처를 넣지만 단언하지 않는다.
- `llm_processor.check_provider_available` patch (`test_agentic_workflow.py:268, 324`): 테스트가 `ChatService.stream_chat` 을 직접 부르는데 서비스는 이 함수를 부르지 않는다 (호출은 `api/chat.py:349`).

### 이름·설명과 실제 단언의 불일치
- `test_version_0_2_2_consistency`, `test_version_is_0_2_2` 는 0.4.0 을 단언한다. `test_config_json_found_and_loaded` 는 허용 버전 튜플을 하드코딩한다. 버전을 바꾸면 이 세 곳을 함께 고쳐야 한다.
- `test_article_scraper_l1_l2_cache_and_db_persistence` 의 세 번째 단계는 "새 인스턴스는 L2(DB)에서 읽는다" 고 설명하지만 L1 캐시가 클래스 속성이라 새 인스턴스도 L1 에서 읽는다 (`scraper.py:35`, `136-138`). 단언(HTTP 1회)은 L1/L2 를 구분하지 못한다.
- `test_chat_query_scoped_with_agentic_workflow_success` 의 docstring 은 "dual sources, supplementary_count>=1" 이지만 단언은 `supplementary_count == 0` 이다.
- `test_unit_test_mock_provider` 는 테스트 파일 안에 정의한 클래스만 검증한다.
- `feed/FeedToolbar.test.tsx` 의 `⑤ places the fixed Must-Read toggle after the source group and before sort at %ipx (R34)` 는 이름에 'before sort' 가 남아 있지만 정렬은 `FeedToolbar` 에 없고, 단언은 토글이 소스 그룹 뒤이고 그 줄의 마지막 자식인지만 본다.

### 건너뛰는 테스트·계약
- `skip`, `xfail`, `.only`, `.todo` 마커는 backend·frontend 어디에도 없다. 실행 중 건너뛰기는 하나다: `test_make_targets.py::test_t4_compose_config_is_valid` 가 docker CLI 가 없으면 `pytest.skip`. frontend 649개는 2026-11-09 모두 통과했다. backend 217개는 2026-11-09 모두 통과했다.
- `make check` 는 `pytest -v tests/` 를 마커 구분 없이 돌린다. 라이브 호출 테스트를 따로 고르는 마커나 설정이 없다 (`Makefile` check, `backend/pytest.ini`).
- MSW 에만 있는 엔드포인트: `GET /api/chat/stream` (`frontend/src/mocks/handlers.ts:480`)을 `ContractAndMsw.test.ts` 두 테스트가 검증하지만 backend 에는 `POST /api/chat/stream` 만 있다 (`backend/app/api/chat.py:276`).
- `ContractAndMsw.test.ts` 의 MSW 테스트는 mock 핸들러의 동작을 검증하며 backend 와의 일치를 확인하지 않는다. backend 응답 형식과 frontend zod 스키마를 함께 대조하는 테스트는 없다.
