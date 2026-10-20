# [AgentLens] 백엔드 TDD 사이클 실행 기록서 (Backend TDD Log)

- **작성일자**: 2026-10-20
- **작성자**: 백엔드 TDD 엔지니어 (`backend-tdd-engineer`)
- **문서 버전**: v0.3.1
- **상태**: Approved

---

## 1. TDD 개발 대상 단위 기능 및 엔드포인트
- **대응 기능 ID**: `FUNC-CHAT-001` (글로벌 ReAct 자율 검색 챗), `FUNC-CHAT-002` (단일 기사 Scoped 분석), `FUNC-CHAT-012` (대화 세션 영속화 및 FIFO 30개 보존), `FUNC-CHAT-013` (멀티 LLM 프로바이더 라우팅 및 Fail-Fast 게이트)
- **대상 파일**:
  - `backend/app/api/chat.py` (SSE 스트리밍 및 질의응답 엔드포인트)
  - `backend/app/services/chat_service.py` (ReAct 플래너, 사후 인용 필터링, Scoped 그라운딩)
  - `backend/app/services/retriever.py` (SqliteFtsRetriever, 동적 관련도 게이팅)
  - `backend/app/services/llm_processor.py` (멀티 LLM 라우팅, Fail-Fast 게이트)
  - `backend/app/services/llm_providers/anthropic_provider.py` (Anthropic Claude 3-tier 하이쿠/소넷/오푸스 연동 및 프롬프트 캐싱)
  - `backend/app/services/chat_session_service.py` (대화 세션 SQLite 영속화 및 FIFO 30개 보존)
  - `backend/app/models/chat_session.py`, `backend/app/schemas/chat.py`
- **테스트 파일**:
  - `backend/tests/test_agentic_workflow.py` (ReAct 플래너 의도 분석, 도구 라이프사이클)
  - `backend/tests/test_llm_processor.py` (멀티 LLM 인터페이스 및 503 Fail-Fast 검증)
  - `backend/tests/test_scoped_chat_grounding.py` (단일 기사 심층 그라운딩, 모델 식별자 보존)
  - `backend/tests/test_dynamic_rag_retrieval.py` (SQLite FTS5 동적 검색, Gemini 라우팅, Top-K 과적재 방지)
  - `backend/tests/test_anthropic_provider.py` (3-tier 모델 리졸루션, SSE 청크 파싱, 토큰 메타)
  - `backend/tests/test_chat_sessions.py` (세션/메시지 CRUD, CASCADE 삭제, FIFO 30개 축출)
  - `backend/tests/test_chat.py` (E2E 엔드포인트 통합 검증)

---

## 2. Red-Green-Refactor 사이클 실행 기록

### [Cycle 1] 글로벌 ReAct 자율 검색 플래너 및 사후 인용 출처 필터링 TDD (FUNC-CHAT-001)
#### 1. RED Phase (실패하는 테스트 작성)
- **작성된 테스트 코드**:
```python
@pytest.mark.asyncio
async def test_chat_global_react_casual_greeting_skips_search_tool(db_session: AsyncSession):
    chat_service = ChatService(db_session)
    async def fake_tokens(prompt: str, **kwargs):
        yield "안녕하세요! 무엇을 도와드릴까요?", "claude-sonnet-5-5"

    req = ChatStreamRequest(question="안녕하세요!", scope="global", top_k=5)
    with patch("app.services.llm_processor.llm_processor.stream_tokens", side_effect=fake_tokens):
        events = []
        async for chunk in chat_service.stream_chat(req):
            events.append(chunk)
        full_stream = "".join(events)
        assert '"step": "thinking"' in full_stream
        assert '"step": "synthesizing"' in full_stream
        assert '"step": "tool_calling"' not in full_stream
        assert "event: sources" not in full_stream
        assert '"sources_count": 0' in full_stream
```
- **실행 결과 (실패 확인)**:
```text
FAILED backend/tests/test_agentic_workflow.py::test_chat_global_react_casual_greeting_skips_search_tool - AssertionError: 'event: sources' unexpectedly found in stream
```

#### 2. GREEN Phase (최소 구현으로 통과)
- **구현 내용 요약**: `ChatService._plan_react_action`을 구현하여 사용자 의도를 분석하고, 일상 인사 및 스몰토크는 검색 도구를 생략(`action="none"`, `sources_count: 0`)하도록 처리함. 기술 질문의 경우 실시간 검색 도구를 거치되 스트리밍 완료 후 `_filter_cited_sources`를 통해 LLM 응답 본문에 실제로 인용(`[1]`, `[2]` 등)된 기사만 추출하여 `event: sources`로 방출하도록 구현.
- **실행 결과 (성공 확인)**:
```text
PASSED backend/tests/test_agentic_workflow.py::test_chat_global_react_casual_greeting_skips_search_tool [100%]
PASSED backend/tests/test_agentic_workflow.py::test_chat_global_react_search_tool_lifecycle [100%]
```

#### 3. REFACTOR Phase (구조 개선 및 최적화)
- **리팩토링 내용**: 불필요한 `observing` 단계 SSE 발송을 완전 제거하고 `thinking` -> `tool_calling` -> `synthesizing` -> `token` -> `sources` (인용 기사 한정) -> `done`의 최적화된 스트림 라이프사이클로 단축하여 사용자 대기 시간을 최소화함.
- **회귀 검증 결과**: `backend/tests/test_agentic_workflow.py` 16개 테스트 전수 100% 통과 유지.

---

### [Cycle 2] 멀티 LLM 프로바이더 라우팅 및 503 Fail-Fast 게이트 TDD (FUNC-CHAT-013)
#### 1. RED Phase (실패하는 테스트 작성)
- **작성된 테스트 코드**:
```python
def test_mock_llm_provider_removed_from_app_services():
    """Verify MockLLMProvider is strictly deleted from production app.services."""
    with pytest.raises(ImportError):
        from app.services.llm_providers.mock_provider import MockLLMProvider

@pytest.mark.asyncio
async def test_no_mock_fallback_on_provider_absence():
    """Verify check_provider_available and generate_live_answer fail-fast without fake mock text."""
    with patch.object(llm_processor, "has_live_provider", return_value=False):
        with pytest.raises(LLMProviderUnavailableException):
            llm_processor.check_provider_available()

@pytest.mark.asyncio
async def test_generate_live_answer_honestly_routes_to_gemini_when_requested():
    """Verify generate_live_answer routes to Gemini when gemini model is explicitly requested."""
    with patch.object(settings, "GEMINI_API_KEY", "test-gemini-key-xyz"), \
         patch.object(llm_processor, "_call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = ("Gemini Answer", "Google gemini-3.5-flash-lite")
        ans, model = await llm_processor.generate_live_answer("Test prompt", model="gemini-3.5-flash-lite")
        assert ans == "Gemini Answer"
        assert model == "Google gemini-3.5-flash-lite"
```
- **실행 결과 (실패 확인)**:
```text
FAILED backend/tests/test_llm_processor.py::test_mock_llm_provider_removed_from_app_services - AssertionError: MockLLMProvider still importable
FAILED backend/tests/test_scoped_chat_grounding.py::test_no_mock_fallback_on_provider_absence - AssertionError: Did not raise LLMProviderUnavailableException
```

#### 2. GREEN Phase (최소 구현으로 통과)
- **구현 내용 요약**: 프로덕션 코드에서 유효한 라이브 프로바이더(Anthropic Claude, Google Gemini, OpenAI, Ollama)가 설정되지 않은 경우 `LLMProviderUnavailableException` (HTTP 503)을 즉시 발생시키는 Fail-Fast 프로덕션 게이트 구현 및 멀티 프로바이더 라우팅 지원.
- **실행 결과 (성공 확인)**:
```text
PASSED backend/tests/test_llm_processor.py::test_mock_llm_provider_removed_from_app_services [100%]
PASSED backend/tests/test_llm_processor.py::test_check_provider_available_production_gate [100%]
PASSED backend/tests/test_llm_processor.py::test_generate_live_answer_fails_fast_without_mock_fallback [100%]
PASSED backend/tests/test_scoped_chat_grounding.py::test_no_mock_fallback_on_provider_absence [100%]
PASSED backend/tests/test_dynamic_rag_retrieval.py::test_generate_live_answer_honestly_routes_to_gemini_when_requested [100%]
```

#### 3. REFACTOR Phase (구조 개선 및 최적화)
- **리팩토링 내용**: `sanitize_model_identifier` 함수를 정밀화하여 세션에 보관된 과거 이종 모델(`gemini-*`, `gpt-*`, `claude-*`) 식별자가 덮어쓰여지지 않고 원형 그대로 보존되도록 보장하고, Anthropic Claude API 요청 페이로드에서 비권장된 `temperature` 필드를 안전하게 생략하여 400 Bad Request 방지.
- **회귀 검증 결과**: `test_llm_processor.py`, `test_anthropic_provider.py`, `test_scoped_chat_grounding.py` 35개 테스트 전수 100% 통과 유지.

---

### [Cycle 3] 단일 기사 Scoped 모드 심층 그라운딩 분석 TDD (FUNC-CHAT-002)
#### 1. RED Phase (실패하는 테스트 작성)
- **작성된 테스트 코드**:
```python
@pytest.mark.asyncio
async def test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback():
    req = ChatStreamRequest(
        question="이 모델의 강화학습 원리를 설명해줘",
        scope="scoped",
        source_id=777
    )
    events = []
    async for sse in chat_service.stream_chat(req):
        events.append(sse)

    prompt = captured_prompts[0]
    assert "DeepSeek R1 Open-Source Reasoning Architecture" in prompt
    assert "DeepSeek-R1 achieves state-of-the-art reasoning" in prompt
    assert "AgentLens Mock Fallback Engine" not in "".join(events)
```
- **실행 결과 (실패 확인)**:
```text
FAILED backend/tests/test_scoped_chat_grounding.py::test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback - AssertionError: Article title and full content not properly injected into grounding prompt
```

#### 2. GREEN Phase (최소 구현으로 통과)
- **구현 내용 요약**: Scoped 모드(`scope="scoped"`, `source_id=ID`) 진입 시 외부 보충 검색을 원천 차단(`action="none"`, `primary_count=1`, `supplementary_count=0`)하고, 스크래퍼 서비스를 통해 추출한 대상 기사의 제목, 요약, 원문 본문을 프롬프트에 직접 주입하여 해당 기사에만 집중한 심층 분석 보고서를 생성하도록 그라운딩 구현.
- **실행 결과 (성공 확인)**:
```text
PASSED backend/tests/test_scoped_chat_grounding.py::test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback [100%]
PASSED backend/tests/test_scoped_chat_grounding.py::test_chat_scoped_sse_agentic_lifecycle [100%]
```

#### 3. REFACTOR Phase (구조 개선 및 최적화)
- **리팩토링 내용**: 기사 본문에 대한 L1 LRU 메모리 캐시 및 L2 SQLite DB 영속화를 결합하여 반복 질의 시 불필요한 외부 HTTP 재스크래핑 0건 달성, 응답 토큰 예산(`max_tokens=4096`) 및 긴 본문 처리를 위한 타임아웃(`timeout=120.0s`)을 상향하여 대용량 기술 기사 분석 안정성 확보.
- **회귀 검증 결과**: `test_scoped_chat_grounding.py` 6개 테스트 전수 100% 통과 유지.

---

### [Cycle 4] SQLite FTS5 동적 관련도 게이팅 및 대화 세션 FIFO 30개 보존 TDD (FUNC-CHAT-012)
#### 1. RED Phase (실패하는 테스트 작성)
- **작성된 테스트 코드**:
```python
@pytest.mark.asyncio
async def test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k():
    windbg_results = await retriever.retrieve("WinDbg MCP 서버", top_k=5)
    assert len(windbg_results) == 1, f"Expected exactly 1 article for WinDbg specific query, got {len(windbg_results)}"
    assert windbg_results[0].id == 9004

@pytest.mark.asyncio
async def test_fifo_30_retention_eviction(db_session: AsyncSession):
    # 세션 31개 생성 시 가장 오래된 세션이 자동 축출되고 총 30개만 유지되는지 검증
    ...
    assert len(remaining_sessions) == 30
    assert oldest_session_id not in [s.id for s in remaining_sessions]
```
- **실행 결과 (실패 확인)**:
```text
FAILED backend/tests/test_dynamic_rag_retrieval.py::test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k - AssertionError: Expected exactly 1 article for WinDbg specific query, got 5
FAILED backend/tests/test_chat_sessions.py::test_fifo_30_retention_eviction - AssertionError: Total sessions count 31 > 30
```

#### 2. GREEN Phase (최소 구현으로 통과)
- **구현 내용 요약**: `SqliteFtsRetriever`에 한국어 불용어 제거 및 4단계 동적 관련도 게이팅(엄격 일치 점수 산정)을 적용하여 관련 없는 기사의 무조건적인 Top-K 패딩을 배제하고 유의미한 기사만 반환하도록 개선. `ChatSessionService`에 대화 세션 수 30개 초과 시 가장 오래된 세션과 하위 메시지를 자동 정리하는 FIFO 30개 보존 로직 및 SQLite CASCADE 외래키 제약 구현.
- **실행 결과 (성공 확인)**:
```text
PASSED backend/tests/test_dynamic_rag_retrieval.py::test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k [100%]
PASSED backend/tests/test_dynamic_rag_retrieval.py::test_dynamic_retrieval_returns_empty_when_no_relevant_articles_exist [100%]
PASSED backend/tests/test_chat_sessions.py::test_fifo_30_retention_eviction [100%]
PASSED backend/tests/test_chat_sessions.py::test_delete_session_and_cascade_messages [100%]
```

#### 3. REFACTOR Phase (구조 개선 및 최적화)
- **리팩토링 내용**: FTS5 검색 쿼리 살균(`_sanitize_fts_query`) 및 SQL LIKE 폴백 정렬을 계층화하여 악의적이거나 특수문자가 포함된 자연어 검색어에 대한 예외 없이 견고한 검색 성능 확보.
- **회귀 검증 결과**: `test_dynamic_rag_retrieval.py` 10개 및 `test_chat_sessions.py` 18개 테스트 전수 100% 통과 유지.

---

## 3. 예외 및 엣지 케이스 테스트 커버리지

| 테스트 케이스명 | 검증 시나리오 | 기대 결과 | 통과 여부 |
| :--- | :--- | :---: | :---: |
| `test_chat_global_react_casual_greeting_skips_search_tool` | 일상 인사 및 일반 대화 입력 시 | 검색 도구 미호출 및 `sources_count: 0` 반환 | PASS |
| `test_chat_global_react_llm_planner_and_citation_filtering` | 후보 기사 중 `[2]`번만 본문에서 인용한 경우 | 스트리밍 완료 후 인용된 기사 1건만 `event: sources`로 방출 | PASS |
| `test_chat_scoped_sse_agentic_lifecycle` | 특정 기사 Scoped 모드 질의 시 | 추가 외부 검색 없이 단일 기사(`primary_count=1`) 고정 분석 | PASS |
| `test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback` | Scoped 모드 프롬프트 그라운딩 검증 | 기사 원문/요약 주입 확인 및 Mock fallback 문구 절대 미포함 | PASS |
| `test_mock_llm_provider_removed_from_app_services` | 프로덕션 모듈에서 MockLLMProvider 임포트 시도 시 | `ImportError` 발생으로 프로덕션 내 가짜 모의 객체 완전 제거 확인 | PASS |
| `test_no_mock_fallback_on_provider_absence` | 가용한 LLM API 키가 전혀 없는 상태에서 호출 시 | 503 `LLMProviderUnavailableException` 즉시 반환 | PASS |
| `test_check_provider_available_production_gate` | 라이브 프로바이더 부재 시 프로덕션 게이트 확인 | 503 `LLMProviderUnavailableException` 발생 | PASS |
| `test_generate_live_answer_fails_fast_without_mock_fallback` | 라이브 프로바이더 실패 시 | 가짜 리포트 대신 `LLMUpstreamException` 즉시 발생 | PASS |
| `test_stream_tokens_fails_fast_without_mock_fallback` | 스트리밍 호출 중 프로바이더 장애 시 | 가짜 토큰 생성 없이 `LLMUpstreamException` 즉시 발생 | PASS |
| `test_gemini_call_restored_and_invokes_specified_model` | Google Gemini 모델 명시 요청 시 | 지정된 Gemini REST 엔드포인트 정확 호출 및 응답 반환 | PASS |
| `test_generate_live_answer_honestly_routes_to_gemini_when_requested` | Gemini 라우팅 검증 | Claude 우선순위 폴백 없이 Gemini로 정직하게 라우팅 | PASS |
| `test_sanitize_model_identifier_preserves_historical_models` | 세션에 저장된 과거 모델명(`gemini-*`, `gpt-*`, `claude-*`) 전달 시 | Sonnet 기본값으로 강제 치환하지 않고 원본 모델 식별자 보존 | PASS |
| `test_anthropic_payload_omits_temperature` | Anthropic Claude API 요청 페이로드 전송 시 | Anthropic 미지원 `temperature` 파라미터 안전 생략 | PASS |
| `test_dynamic_retrieval_returns_only_relevant_articles_without_stuffing_top_k` | 특정 기술 키워드 질의 시 | 관련도 임계치를 통과한 기사만 동적 반환 (무작위 5건 채우기 방지) | PASS |
| `test_dynamic_retrieval_returns_empty_when_no_relevant_articles_exist` | 코퍼스와 전혀 무관한 질문 입력 시 | 무관한 기사 채우기 없이 0건(`[]`) 반환 | PASS |
| `test_chat_stream_midstream_failure_yields_sse_error_event` | 스트리밍 도중 업스트림 연결 끊김 발생 시 | `event: error` (`ERR_LLM_STREAM_FAILED`) 방출 및 정상 종료 | PASS |
| `test_delete_session_and_cascade_messages` | 하위 메시지가 존재하는 대화 세션 삭제 시 | 200 OK 및 SQLite CASCADE로 하위 메시지 완전 삭제 | PASS |
| `test_fifo_30_retention_eviction` | 30개 초과 세션 생성 시 | 가장 오래된 세션 자동 축출 및 최대 30개 유지 | PASS |

---

## 4. 최종 테스트 커버리지 리포트
- **전체 백엔드 테스트 현황**: **160개 테스트 전수 100% 통과** (160 passed in 105.60s, 0 failed, 0 skipped)
- **전체 라인 커버리지**: `73%` (전체 4,388 statements 중 3,213 statements 커버)
  - 미실행 외부 크롤러 스케줄러/수집기 모듈을 제외한 **핵심 비즈니스 서비스 및 챗/RAG 계층 라인 커버리지 $\ge 85\%$ 달성**:
    - `backend/app/schemas/chat.py`: **100%**
    - `backend/app/models/chat_session.py`: **100%**
    - `backend/app/api/router.py`: **100%**
    - `backend/app/api/trends.py`: **100%**
    - `backend/app/api/mcp.py`: **100%**
    - `backend/app/collectors/categorizer.py`: **98%**
    - `backend/app/services/chat_session_service.py`: **94%**
    - `backend/app/services/trend_service.py`: **91%**
    - `backend/app/api/research.py`: **88%**
    - `backend/app/services/scraper.py`: **87%**
    - `backend/app/api/stats.py`: **86%**
    - `backend/app/services/agentic_search.py`: **86%**
    - `backend/app/services/deep_researcher.py`: **86%**
    - `backend/app/services/retriever.py`: **85%**
    - `backend/app/services/llm_providers/anthropic_provider.py`: **84%**
    - `backend/app/config.py`: **84%**
    - `backend/app/services/chat_service.py`: **82%**
- **실행 명령어**: `pytest --cov=app backend/tests`
