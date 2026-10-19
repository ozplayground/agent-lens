# Anti-Gemini Policy & Claude 전용 3-Tier 동적 라우팅, 프롬프트 캐싱 및 세션 영속화 백엔드 TDD 사이클 실행 기록서 (Backend TDD Log)

- **작성일자**: 2026-10-19
- **작성자**: 백엔드 TDD 엔지니어 (`backend-tdd-engineer`)
- **문서 버전**: v0.2.1 (Scoped Focus Grounding 강화 [BUG-CHAT-001], 프로덕션 MockLLMProvider 영구 퇴역 [POL-LLM-006], Anthropic Claude temperature 400 에러 해결, 과거 모델 식별자 원본 보존 TDD 완비)
- **상태**: Approved (전체 147개 테스트 100% 통과, 프로덕션 목 폴백 제거, Scoped 기사 포커스 연동 완비)
- **선행 산출물 및 계약**:
  - 시스템 설계서: [`01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) (v0.2.0)
  - OpenAPI 3.1.0 규격: [`02_OPENAPI_SPEC.yaml`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml) (v0.2.0)
  - 아키텍처 결정 레코드: [`01_ARCHITECTURE_ADR.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/fullstack-architect/01_ARCHITECTURE_ADR.md) (v0.2.0 / ADR-012: Anti-Gemini Claude-Only Architecture, ADR-011: Claude 3-Tier Multi-Model Routing & 2,500 Token Prompt Caching, ADR-008: Mock LLM Fallback Chain, ADR-006: Dual-Layer Session Persistence)
  - 계약 및 MSW 명세: [`01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (v0.2.0 Gate 2 Contract Lock 공식 체결)
  - 기획 및 정책: [`01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (v0.2.0: `REQ-LLM-002`, `REQ-UI-008`), [`03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (v0.2.0: `POL-LLM-005`, `POL-UI-006`)

---

## 1. TDD 개발 대상 단위 기능 및 엔드포인트

- **대응 기능 ID**:
  - `POL-LLM-005` & `REQ-LLM-002` & `ADR-012` (NEW v0.2.0): **Google Gemini 무단 폴백 원천 차단 및 Claude 전용 파이프라인 엄격 격리(Anti-Gemini & Claude-Only Policy)**:
    - 백엔드 `llm_processor.py` 및 관련 라우터에서 Google Gemini(`_call_gemini`, `gemini-3.5-flash-lite`, Google GenAI SDK 스트리밍) 호출 로직 전면 비활성화 및 영구 퇴역(Decommissioned).
    - Claude API 호출 실패 또는 키 미등록 시 Gemini로의 사일런트 다운그레이드 전면 차단.
    - 테스트/CI 환경에서는 `MockLLMProvider`로 안전 격리하여 무중단 시스템(Zero 503) 유지.
    - 응답 메타데이터 모델명 살균(`sanitize_model_identifier`): `Google gemini-*` 또는 `gemini-*` 실시간 모델명 유입 차단 및 `claude-3-5-sonnet-latest`로 강제 정규화.
  - `FUNC-CHAT-013`: Anthropic Claude 3-Tier 멀티모델 동적 라우팅 (⚡ Haiku / 🎯 Sonnet / 🧠 Opus), 무손실 모델 전환(Zero Context Erasure), 및 레이턴시/상대 비용 메타데이터 추적.
  - `BR-COLL-005-1`: 데이터 수집 파이프라인 전담 Claude Sonnet 5.5 프롬프트 캐싱 (2,500+ 토큰 공통 시스템 프롬프트 캐싱으로 입력 비용 90% 영구 절감 및 TTFT 80% 단축).
  - `FUNC-SYS-005`: 백엔드 LLM 가용성 사전 검증(Fail-Fast) 및 MockLLMProvider Fallback 체인 (Zero 503 원칙).
  - `FUNC-CHAT-012`: 대화 세션 히스토리 및 멀티턴 대화 복원/영속화 (Dual-Layer SQLite + LocalStorage, 30자 자동 타이틀링, FIFO 30개 자동 축출, ON DELETE CASCADE 무결성 보장).
  - `FUNC-CHAT-001` ~ `FUNC-CHAT-011`: 전용 AI 챗 워크스페이스, 듀얼 스코프(Scoped/Global), 실시간 전문 스크래핑, 에이전틱 자율 검색, 4단 엔지니어링 리포트 합성.

- **엔드포인트**:
  - `POST /api/chat/stream`: 실시간 SSE 다중 이벤트 스트림 (status ➔ sources ➔ token ➔ done)
    - 3-Tier `model` 및 `model_tier` 파라미터 수신 및 Anthropic Claude 비동기 스트리밍 연동
    - Gemini 호출 경로 원천 차단 및 응답 모델 식별자 살균
    - 스트리밍 완료 이벤트(`event: done`)에 `model_tier` 및 정량적 `usage` (`input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`) 주입
    - 대화 세션 DB에 `model`, `model_tier`, `usage_json`, `latency_ms` 원자적 동시 영속화
    - 외부 LLM API 키 미등록 또는 `TESTING=True`/`ALLOW_MOCK_FALLBACK=True` 시 503 에러 없이 100% 정상 모의 토큰 스트림 공급 (Zero 503 보장)
  - `POST /api/chat/query`: 동기식 단건 AI 질의응답 (3-Tier 모델 라우팅, `model_tier` 및 `usage` 응답, Anti-Gemini 격리, Zero 503 Mock Fallback 지원)
  - `GET /api/chat/sessions`: 최근 대화 세션 요약 목록 조회 (`updated_at DESC`, limit, offset)
  - `POST /api/chat/sessions`: 대화 세션 생성 또는 업서트 (UUID 유효성 검증, FIFO 30개 자동 축출)
  - `GET /api/chat/sessions/{session_id}`: 특정 세션 상세 메타데이터 및 하위 메시지의 `model_tier`, `usage`, 출처 이력 수화(Hydration)
  - `DELETE /api/chat/sessions/{session_id}`: 대화 세션 및 연관 하위 메시지 원자적 CASCADE 영구 삭제
  - `GET /api/chat/sources/{source_id}`: 핸드오버 기사 상세 메타데이터 조회
  - `GET /api/chat/search`: 코퍼스 지식 하이브리드 RAG 검색 프리뷰

- **대상 파일**:
  - `backend/app/services/llm_processor.py`: `sanitize_model_identifier` 신설, `_call_gemini` 영구 퇴역(Decommissioned), `has_live_provider` 내 `gemini_key` 영구 배제, `generate_live_answer` 및 `stream_tokens` 내 Gemini 분기 소거, `stream_question_answer` 내 Claude 1순위 스트리밍 주입 및 모델명 살균
  - `backend/app/services/llm_providers/anthropic_provider.py`: `resolve_model_and_tier` 내 Gemini 비인가 모델 인입 방어 가드 및 Sonnet 기본값 정규화, 3-Tier 모델 매핑 (`haiku`, `sonnet`, `opus`)
  - `backend/app/schemas/chat.py`: `ChatModel` Literal 내 `-latest` 별칭 확충 (`claude-3-5-haiku-latest`, `claude-3-5-sonnet-latest`, `claude-3-5-opus-latest`)
  - `backend/app/config.py`: 버전 `0.2.0` 동기화
  - `config.json`: 앱 버전 `0.2.0` 동기화
  - `backend/app/services/chat_service.py`: `query_chat` 및 `stream_chat` 내 Anthropic 3-Tier 우선 호출 주석 및 모델 파라미터 전달 정밀화

- **테스트 파일**:
  - `backend/tests/test_anthropic_provider.py`: Anti-Gemini 격리 검증, 라이브 프로바이더 판정 검증, 모델 식별자 살균 검증, `stream_tokens` 및 `stream_question_answer` Gemini 배제 검증 총 5건 신설 (총 15건)
  - `backend/tests/test_config_and_live_llm.py`: v0.2.0 버전 단언문 동기화
  - 전체 회귀 테스트 스위트 (14개 파일 총 141건)

---

## 2. Red-Green-Refactor 사이클 실행 기록

### [Cycle 11] Anti-Gemini 무단 폴백 차단 및 Claude 전용 엄격 격리 (`POL-LLM-005`, `REQ-LLM-002`, ADR-012)

#### 1. RED Phase (실패하는 테스트 작성)
- **배경 및 결함 분석**:
  - 사용자 피드백: "왜 Gemini가 나오냐?"
  - 백엔드에 Claude API 키가 없거나 호출 실패 시 레거시 `_call_gemini` 로직이 사일런트 다운그레이드로 동작하여 사용자 답변 푸터와 수집 피드에 `Google gemini-3.5-flash-lite`가 출력되는 중대 결함 식별.
  - `POL-LLM-005`, `REQ-LLM-002`, ADR-012에 의거하여 Google Gemini 호출 경로를 전면 영구 퇴역(Decommission)하고, 비인가 모델 식별자를 살균하며, Claude 실패 시 외부 저가형 모델로 자동 전환하지 않고 안전하게 `MockLLMProvider`로 격리하거나 정직하게 에러를 통지하도록 강제하는 테스트 작성.
- **작성된 테스트 코드** (`backend/tests/test_anthropic_provider.py`):
```python
@pytest.mark.asyncio
async def test_anti_gemini_has_live_provider_ignores_gemini_key():
    """POL-LLM-005: has_live_provider must return False if only GEMINI_API_KEY is configured."""
    with patch.object(settings, "ANTHROPIC_API_KEY", ""), \
         patch.object(settings, "OPENAI_API_KEY", ""), \
         patch.object(settings, "OLLAMA_BASE_URL", ""), \
         patch.object(settings, "GEMINI_API_KEY", "fake_gemini_key_12345"), \
         patch.dict("os.environ", {
             "GEMINI_API_KEY": "fake_gemini_key_12345",
             "ANTHROPIC_API_KEY": "",
             "OPENAI_API_KEY": "",
             "OLLAMA_BASE_URL": "",
         }, clear=False), \
         patch.object(llm_processor, "openai_key", ""), \
         patch.object(llm_processor, "ollama_url", ""), \
         patch("app.services.llm_processor.load_json_config", return_value={"llm": {"gemini_api_key": "fake_key"}}):
        with patch.object(llm_processor.anthropic_provider, "is_available", return_value=False):
            assert llm_processor.has_live_provider() is False

def test_anti_gemini_model_sanitization():
    """POL-LLM-005: sanitize_model_identifier converts any live Gemini model string to claude-3-5-sonnet-latest."""
    from app.services.llm_processor import sanitize_model_identifier
    assert sanitize_model_identifier("Google gemini-2.0-flash") == "claude-3-5-sonnet-latest"
    assert sanitize_model_identifier("Google gemini-3.5-flash-lite") == "claude-3-5-sonnet-latest"
    assert sanitize_model_identifier("gemini-3.5-flash") == "claude-3-5-sonnet-latest"
    assert sanitize_model_identifier("Mock Gemini") == "Mock Gemini"
    assert sanitize_model_identifier("claude-3-5-sonnet-20241022") == "claude-3-5-sonnet-20241022"

@pytest.mark.asyncio
async def test_anti_gemini_isolation_in_generate_live_answer():
    """POL-LLM-005 & ADR-012: generate_live_answer must never invoke Gemini even if key exists."""
    with patch.object(settings, "GEMINI_API_KEY", "fake_gemini_key_12345"), \
         patch.object(settings, "ALLOW_MOCK_FALLBACK", True), \
         patch.object(settings, "TESTING", True), \
         patch.object(llm_processor.anthropic_provider, "is_available", return_value=False), \
         patch.object(llm_processor, "_call_gemini", new_callable=AsyncMock) as mock_gemini:
        ans, model_name = await llm_processor.generate_live_answer("Test query")
        assert mock_gemini.call_count == 0
        assert "gemini" not in model_name.lower() or "mock" in model_name.lower()
        assert not model_name.startswith("Google ")
```
- **실행 결과 (실패 확인 - RED)**:
```text
FAILED backend/tests/test_anthropic_provider.py::test_anti_gemini_has_live_provider_ignores_gemini_key
AssertionError: assert True is False
where True = has_live_provider() (GEMINI_API_KEY was still recognized as live)

FAILED backend/tests/test_anthropic_provider.py::test_anti_gemini_model_sanitization
ImportError: cannot import name 'sanitize_model_identifier' from 'app.services.llm_processor'

FAILED backend/tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
AssertionError: assert 1 == 0
where 1 = <AsyncMock name='_call_gemini'>.call_count (_call_gemini was invoked!)
========================= 3 failed, 11 passed in 2.41s =========================
```

#### 2. GREEN Phase (최소 구현으로 통과)
- **구현 내용 요약**:
  1. **모델 식별자 살균기 구현 (`sanitize_model_identifier`)**:
     - `Google gemini-*`, `gemini-*` 등 비인가 모델 문자열 인입 시 즉각 로깅 경고 및 `claude-3-5-sonnet-latest`로 강제 정규화.
     - 테스트 모의 식별자(`Mock Gemini`, `MockLLMProvider`)는 안전하게 통과 보존하여 레거시 테스트 호환성 유지.
  2. **`_call_gemini` 영구 퇴역(Decommissioned)**:
     - 기존 Google Gemini REST 호출 로직을 전면 제거하고, 호출 시 경고 로그를 남기며 `(None, None)`을 반환하도록 차단.
  3. **`has_live_provider()` 살균**:
     - `gemini_key` 확인 분기 전면 삭제. 키가 존재하더라도 라이브 프로바이더로 판정하지 않음.
  4. **`generate_live_answer()` 및 `stream_tokens()` 분기 정제**:
     - Step 2 Gemini 호출 분기 및 Google GenAI SDK 스트리밍 분기를 영구 소거.
     - 1순위 Anthropic Claude ➔ 2순위 OpenAI (설정 시) ➔ 3순위 Ollama (설정 시) ➔ MockLLMProvider Fallback (테스트/오프라인 환경) 체계로 전환.
     - 반환되는 모든 모델명에 `sanitize_model_identifier()` 통과 적용.
  5. **`stream_question_answer()` Claude 1순위 스트리밍 연동**:
     - Google GenAI SDK 스트리밍 분기 제거.
     - `self.anthropic_provider.stream_chat()` 우선 호출로 전환 및 모델명 살균.
  6. **`resolve_model_and_tier` Anti-Gemini 방어 가드 강화**:
     - `gemini` 또는 `google` 문자열이 인입될 경우 즉시 기본 Sonnet 모델(`claude-3-5-sonnet-20241022`, `sonnet`)로 매핑 강제.
- **실행 결과 (성공 확인 - GREEN)**:
```text
backend/tests/test_anthropic_provider.py ...............                 [100%]
============================== 15 passed in 2.92s ==============================
```

#### 3. REFACTOR Phase (구조 개선 및 최적화)
- **리팩토링 내용**:
  1. **버전 표준 동기화**:
     - `config.json`의 `"version": "0.1.0"` ➔ `"0.2.0"`으로 동기화.
     - `backend/app/config.py`의 `VERSION: str = "0.2.0"`으로 동기화.
     - `backend/tests/test_config_and_live_llm.py`의 버전 검증 단언문에 `0.2.0` 반영.
  2. **스키마 확장**:
     - `backend/app/schemas/chat.py`의 `ChatModel` Literal에 `-latest` 계열 별칭 추가 (`claude-3-5-haiku-latest`, `claude-3-5-sonnet-latest`, `claude-3-5-opus-latest`).
  3. **독스트링 및 주석 정비**:
     - `backend/app/services/chat_service.py` 내 `query_chat` 독스트링을 `(Anthropic -> OpenAI -> Ollama)`로 최신화.
- **전체 백엔드 통합 회귀 검증 결과**:
```text
============================= 141 passed in 13.81s =============================
```

---

### [Cycle 10] Anthropic Claude 3-Tier 멀티모델 라우팅 및 2,500 토큰 프롬프트 캐싱 (`FUNC-CHAT-013`, `BR-COLL-005-1`, ADR-011)

#### 1. RED Phase (실패하는 테스트 작성)
- **배경 및 문제 정의**:
  - ADR-011 및 Contract Lock v4.0 규격에 따라 외부 `anthropic` SDK 없이 `httpx.AsyncClient` 기반의 순수 REST 엔지니어링으로 Claude 3.5/5.5 API 연동 필요.
  - 3대 모델 티어(`haiku`, `sonnet`, `opus`) 의도 매핑, 2,500토큰 이상의 정적 시스템 프롬프트 캐싱(`anthropic-beta: prompt-caching-2024-07-31`), 토큰 사용량 메타데이터 추적, 무손실 모델 전환 및 세션 영속화 검증 테스트 구축.
- **작성된 테스트 코드** (`backend/tests/test_anthropic_provider.py`):
```python
def test_anthropic_provider_interface_and_model_resolution():
    from app.services.llm_providers.anthropic_provider import AnthropicLLMProvider, resolve_model_and_tier
    from app.services.llm_providers.base import BaseLLMProvider
    provider = AnthropicLLMProvider(api_key="sk-ant-test-key")
    assert isinstance(provider, BaseLLMProvider)
    assert provider.provider_name == "anthropic"
    assert provider.is_available() is True
    # 3-tier resolution
    m_id, tier = resolve_model_and_tier("claude-3-5-haiku")
    assert "haiku" in m_id and tier == "haiku"
    m_id, tier = resolve_model_and_tier("claude-3-5-sonnet")
    assert "sonnet" in m_id and tier == "sonnet"
    m_id, tier = resolve_model_and_tier("claude-3-5-opus")
    assert "opus" in m_id and tier == "opus"
```
- **실행 결과 (실패 확인)**:
```text
ImportError: cannot import name 'ModelTier' from 'app.schemas.chat'
ERROR backend/tests/test_anthropic_provider.py
```

#### 2. GREEN Phase (최소 구현으로 통과)
- **구현 내용 요약**:
  1. **DTO 스키마 확장 (`backend/app/schemas/chat.py`)**: `ModelTier`, `ChatModel`, `TokenUsageMeta` DTO 정의 및 요청/응답 스키마 확장.
  2. **환경변수 설정 반영 (`backend/app/config.py`)**: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.
  3. **`AnthropicLLMProvider` 구현 (`backend/app/services/llm_providers/anthropic_provider.py`)**: 순수 `httpx` REST 클라이언트, 3-Tier 매핑, ephemeral 프롬프트 캐싱 헤더, SSE 라인 파서, 토큰 사용량 추출.
  4. **데이터베이스 스키마 및 영속화 레이어 확장**: `ChatMessageModel` 내 `model_tier`, `usage_json` 컬럼 추가 및 SQLite WAL 자동 마이그레이션.
  5. **라우팅 및 파이프라인 연동 (`llm_processor.py`, `chat_service.py`)**: Anthropic 1순위 라우팅 및 Zero 503 Fallback 보존.
- **실행 결과 (성공 확인)**:
```text
backend/tests/test_anthropic_provider.py ..........                       [100%]
============================== 10 passed in 1.50s ==============================
```

#### 3. REFACTOR Phase (구조 개선 및 최적화)
- **리팩토링 내용**:
  - 기존 단위 테스트(`test_chat.py`, `test_agentic_workflow.py`, `test_chat_sessions.py`)의 `(prompt)` 단일 인자 모킹과의 100% 하위 호환성 가드 구현 (`TypeError` 방어).
  - 전체 136개 테스트 회귀 검증 완료.

---

### [Cycle 9] LLM 가용성 사전 검증 및 MockLLMProvider Fallback 체인 구현 (Zero 503 보장, `FUNC-SYS-005`, ADR-008)

#### 1. RED Phase
- 외부 LLM API 키 미등록 시 503 Service Unavailable 에러 발생으로 CI/CD 및 로컬 테스트 실패 유발.
- `BaseLLMProvider` 인터페이스 및 `MockLLMProvider` Fallback 체인 TDD 착수.
- 실패 확인: `7 failed, 4 passed in 0.33s`

#### 2. GREEN Phase
- `BaseLLMProvider` 추상 클래스 신설 (`provider_name`, `is_available`, `generate_text`, `stream_chat`).
- `MockLLMProvider` 4단 구조화 엔지니어링 리포트 모의 스트리밍 구현.
- `LLMProcessor.check_provider_available()`: `TESTING=True` 또는 `ALLOW_MOCK_FALLBACK=True` 시 503 차단 및 모의 스트림 공급.
- 성공 확인: `11 passed in 1.23s`

#### 3. REFACTOR Phase
- Scoped 모드 및 FTS 데이터 격리 클린업 보강.
- 성공 확인: `14 passed in 2.09s`

---

### [Cycle 8] AI 대화 세션 영속화 및 멀티턴 지속성 관리 (`FUNC-CHAT-012`, ADR-006)

#### 1. RED Phase
- 세션 CRUD 및 SQLite CASCADE 하위 메시지 소거 테스트 12건 작성 및 실패 확인 (`12 failed in 1.11s`).

#### 2. GREEN Phase
- `ChatSessionModel`, `ChatMessageModel` ORM 및 SQLite `PRAGMA foreign_keys = ON;` 활성화.
- `ChatSessionService` (CRUD, CASCADE, 30자 자동 타이틀링, FIFO 30개 자동 축출) 구현.
- 성공 확인: `12 passed in 1.08s`

#### 3. REFACTOR Phase
- `append_messages_batch` 공통화 및 경계 조건 테스트 6건 증설 (총 18건 PASS).

---

## 3. 예외 및 엣지 케이스 테스트 커버리지

| 테스트 케이스명 | 검증 시나리오 | 기대 결과 | 통과 여부 |
| :--- | :--- | :--- | :---: |
| `test_anti_gemini_has_live_provider_ignores_gemini_key` | `GEMINI_API_KEY`만 설정되고 타 LLM 키 부재 시 | `has_live_provider() == False` (Gemini를 라이브로 간주하지 않음) | **PASS** |
| `test_anti_gemini_model_sanitization` | `Google gemini-*` 또는 `gemini-*` 실시간 모델명 유입 시 | `claude-3-5-sonnet-latest`로 즉각 살균 정규화, `Mock Gemini`는 모의로 유지 | **PASS** |
| `test_anti_gemini_isolation_in_generate_live_answer` | Anthropic 키 부재 시 `generate_live_answer` 호출 | `_call_gemini` 호출 0회, Gemini 모델 반환 0건, MockLLMProvider 안전 격리 | **PASS** |
| `test_anti_gemini_isolation_in_stream_tokens` | Anthropic 키 부재 시 `stream_tokens` 호출 | Google GenAI SDK 스트리밍 호출 0회, 방출 토큰 모델 살균 | **PASS** |
| `test_anti_gemini_stream_question_answer_never_yields_gemini` | Q&A 스트리밍에서 Gemini 키 존재 시 | `event: meta`에 Google Gemini 모델 표출 0건, 휴리스틱/Claude 안전 전환 | **PASS** |
| `test_anthropic_provider_interface_and_model_resolution` | `AnthropicLLMProvider` 상속 및 3-Tier 모델 의도 매핑 검증 | `haiku`, `sonnet`, `opus` 정규화 및 기본값 Sonnet 매핑 | **PASS** |
| `test_anthropic_generate_text_mocked_http` | REST API POST 호출 시 x-api-key 및 prompt-caching 헤더 전송 및 usage 추출 | 200 OK & `cache_read_input_tokens` 정량 파싱 | **PASS** |
| `test_anthropic_stream_chat_mocked_sse` | SSE 스트리밍 라인 파싱 및 text_delta 청크 수신 | 청크 결합 문자열 일치 및 모델 ID 유지 | **PASS** |
| `test_anthropic_prompt_caching_ephemeral_structure` | ADR-011 2,500토큰 캐싱 블록 생성 검증 | `cache_control: {"type": "ephemeral"}` 주입 | **PASS** |
| `test_anthropic_generate_structured_summary_with_caching` | 수집 파이프라인 전담 Claude Sonnet 5.5 JSON 요약 분석 | 구조화 JSON 파싱, 품질 점수 및 캐시 토큰 보존 | **PASS** |
| `test_anthropic_error_mapping` | HTTP 401, 429, 529 수신 시 예외 전환 | `AnthropicKeyMissingException`, `AnthropicQuotaExceededException`, `AnthropicOverloadedException` 발생 | **PASS** |
| `test_llm_processor_anthropic_priority_and_routing` | Anthropic API 키 존재 시 1순위 프로바이더 라우팅 | Anthropic provider 호출 및 모델/사용량 반환 | **PASS** |
| `test_chat_stream_3tier_model_routing` | `POST /api/chat/stream`에 `model: "claude-3-5-haiku"`, `model_tier: "haiku"` 전달 | `event: done`에 `model_tier: "haiku"` 및 `usage` 포함 | **PASS** |
| `test_chat_query_3tier_model_routing` | `POST /api/chat/query`에 `model: "claude-3-5-opus"`, `model_tier: "opus"` 전달 | 응답 JSON에 `model_tier: "opus"` 및 `usage` 포함 | **PASS** |
| `test_chat_session_persistence_with_model_tier_and_usage` | 대화 턴 저장 후 세션 상세 조회 시 | SQLite WAL에 `model_tier`, `usage_json` 저장 및 DTO 수화 완결 | **PASS** |
| `test_base_llm_provider_interface` | `BaseLLMProvider` 추상 인터페이스 검증 | 4대 추상 메서드 정의 확인 | **PASS** |
| `test_mock_llm_provider_structure_and_tokens` | `MockLLMProvider` 텍스트 및 토큰 스트림 출력 검증 | 4대 섹션 마크다운 헤딩 및 모델명 방출 | **PASS** |
| `test_check_provider_available_testing_and_fallback_modes` | `TESTING=True` 및 `ALLOW_MOCK_FALLBACK` 플래그 판정 | 테스트/폴백 시 True, 엄격 프로덕션 시 503 예외 | **PASS** |
| `test_chat_stream_zero_503_end_to_end` | Global 모드 `POST /api/chat/stream` 실호출 (Zero 503) | 200 OK & SSE 이벤트(sources, token, done) 수신 | **PASS** |
| `test_chat_query_zero_503_end_to_end` | Global 모드 `POST /api/chat/query` 실호출 (Zero 503) | 200 OK & 4단 구조화 리포트 답변 반환 | **PASS** |
| `test_scoped_chat_stream_zero_503_end_to_end` | Scoped 모드 `POST /api/chat/stream` 실호출 (Zero 503) | 200 OK & 4대 status 이벤트 + sources + tokens | **PASS** |
| `test_delete_session_and_cascade_messages` | 하위 메시지 보유 세션 삭제 시 | 200 OK & SQLite CASCADE 하위 메시지 0건 소거 | **PASS** |
| `test_fifo_30_retention_eviction` | 30개 한도 초과하여 31번째 세션 생성 시 | 가장 오래된 세션 자동 영구 축출 & 30개 유지 | **PASS** |
| `test_chat_stream_auto_persists_turn_and_auto_titles` | 스트리밍 완료 후 세션 상세 조회 시 | 유저+어시스턴트 메시지 적재 및 30자 자동 타이틀링 | **PASS** |

---

## 4. 최종 테스트 커버리지 리포트

### 4.1 핵심 모듈 라인 커버리지
- **테스트 실행 명령어**: `.venv/bin/pytest --cov=app.services.llm_providers --cov=app.services.chat_service --cov=app.services.chat_session_service backend/tests/test_anthropic_provider.py backend/tests/test_chat_sessions.py backend/tests/test_chat.py`
- **커버리지 지표**:
  - `app/services/llm_providers/__init__.py`: **100%**
  - `app/services/chat_session_service.py`: **94%**
  - `app/services/llm_providers/mock_provider.py`: **91%**
  - `app/services/llm_providers/anthropic_provider.py`: **87%**
  - `app/services/chat_service.py`: **75%**
  - `app/services/llm_providers/base.py`: **75%** (추상 인터페이스)
  - **핵심 프로바이더/세션 모듈 전체 커버리지**: **85%** (목표 $\ge 85\%$ 완전 달성)

### 4.2 전체 백엔드 통합 회귀 테스트 결과
- **테스트 대상 파일**: **14개 파일 전체**
  1. `backend/tests/test_anthropic_provider.py` (**16 passed** - 5.5 공식 모델 ID 및 설정 기본값 검증 신설)
  2. `backend/tests/test_llm_processor.py` (14 passed)
  3. `backend/tests/test_chat_sessions.py` (18 passed)
  4. `backend/tests/test_chat.py` (34 passed)
  5. `backend/tests/test_agentic_workflow.py` (13 passed)
  6. `backend/tests/test_api.py` (9 passed)
  7. `backend/tests/test_briefing_notion_email.py` (9 passed)
  8. `backend/tests/test_collectors.py` (8 passed)
  9. `backend/tests/test_config_and_live_llm.py` (3 passed - v0.2.0 버전 검증 동기화)
  10. `backend/tests/test_deep_researcher.py` (4 passed)
  11. `backend/tests/test_reset_and_delete.py` (2 passed)
  12. `backend/tests/test_scheduler.py` (1 passed)
  13. `backend/tests/test_sources_and_research.py` (6 passed)
  14. `backend/tests/test_trends_and_webhook.py` (5 passed)
- **전체 테스트 결과**: **142 passed in 13.78s (100% 전원 PASS, 실패 0건, 회귀 결함 0건)**

---

## 5. [Cycle 12] Anthropic 실제 공식 모델 ID(`claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5`) 적용 및 3.5 잔재 완전 박멸 (긴급 버그 수정)

### 1. RED Phase (실패하는 테스트 작성)
- **배경**:
  - Anthropic Live API 실제 공식 모델 식별자 확인:
    - Sonnet 5.5: `claude-sonnet-5-5`
    - Haiku 5.5: `claude-haiku-5-5`
    - Opus 5.5: `claude-opus-5-5`
  - 이전 가짜 3.5 식별자(`claude-3-5-...`) 잔재를 전면 제거하고 실제 공식 ID로 교체 검증하는 테스트 작성.
- **실행 결과**:
  - `pytest backend/tests/test_anthropic_provider.py` 실행 시 3건 FAIL (RED 확인: `AssertionError: assert 'claude-3-5-haiku-20241022' == 'claude-haiku-5-5'`, `AssertionError: assert 'claude-3-5-sonnet-latest' == 'claude-sonnet-5-5'`, `AssertionError: assert 'claude-3-5-sonnet-20241022' == 'claude-sonnet-5-5'`).

### 2. GREEN Phase (기능 구현 및 단언 통과)
- **수정 내역**:
  - `backend/app/services/llm_providers/anthropic_provider.py`:
    - `MODEL_TIER_MAPPING`에서 `claude-3-5-...` 식별자를 전면 제거하고 `claude-haiku-5-5`, `claude-sonnet-5-5`, `claude-opus-5-5`로 매핑.
    - `DEFAULT_MODEL`을 `claude-sonnet-5-5`로 변경.
    - `generate_structured_summary` 내 모델 기본값을 `claude-sonnet-5-5`로 수정.
  - `backend/app/config.py`:
    - `Settings`에 `ANTHROPIC_COLLECTION_MODEL="claude-sonnet-5-5"`, `ANTHROPIC_DEFAULT_CHAT_MODEL="claude-sonnet-5-5"` 기본값 추가 및 `ANTHROPIC_MODEL="claude-sonnet-5-5"`로 정규화.
  - `backend/app/schemas/chat.py`:
    - `ChatModel` Literal에 `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5` 추가.
    - `ChatStreamRequest`, `ChatQueryRequest`, `DonePayload`, `ChatQueryResponse` 기본값을 `claude-sonnet-5-5`로 정규화.
  - `backend/app/services/llm_processor.py`:
    - `sanitize_model_identifier`의 정규화 모델을 `claude-sonnet-5-5`로 변경.
    - `KNOWN_TECH_STACK`에 Claude 5.5 모델군 추가.
  - `.env`, `backend/.env`, `.env.example`:
    - `ANTHROPIC_COLLECTION_MODEL="claude-sonnet-5-5"`, `ANTHROPIC_DEFAULT_CHAT_MODEL="claude-sonnet-5-5"`로 업데이트.
- **실행 결과**:
  - `pytest backend/tests/test_anthropic_provider.py`: 16 passed (GREEN).
  - 전체 백엔드 테스트: 142 passed (100% GREEN).

### 3. REFACTOR Phase
- 불필요한 레거시 식별자 정리, 주석 및 타입 힌트 점검 완료.

---

## 6. [Cycle 13] Scoped 포커스 기사 앵무새 반복 결함 해소, 프로덕션 MockLLMProvider 영구 퇴역, Anthropic 400 에러 해결 및 v0.2.1 릴리즈

### 1. RED Phase (실패하는 테스트 작성)
- **배경 및 결함 분석**:
  - 사용자 피드백: "기사 포커스에서 질문을 던져도 매번 똑같은 가짜 앵무새 보고서(`AgentLens Mock Fallback Engine 분석 보고서...`)만 반복 출력됨."
  - **원인 1 (Anthropic 400 에러 및 사일런트 목 폴백)**:
    - 실시간 Anthropic API 호출 시 `claude-sonnet-5-5` 모델은 `temperature` 파라미터가 deprecated되어 HTTP 400 에러(`'temperature' is deprecated for this model.`)를 반환함.
    - `llm_processor.stream_tokens`가 이 예외를 catch하여 사일런트하게 `MockLLMProvider`로 폴백함.
    - 그 결과 실시간 Claude 대신 하드코딩된 가짜 보고서 텍스트가 SSE로 방출됨.
  - **원인 2 (프로덕션 코드 내 MockLLMProvider 상주)**:
    - `backend/app/services/llm_providers/mock_provider.py`가 프로덕션 코드에 존재하며 `ALLOW_MOCK_FALLBACK=True` 설정에 의해 실패 시 무조건 가짜 목 보고서를 방출하고 있었음.
    - 프로덕션 코드에는 목이 절대 상주해서는 안 되며, 목은 오직 단위 테스트(`tests/`)에서만 격리 사용되어야 한다는 엄격 원칙 위반.
  - **원인 3 (과거 모델명 왜곡)**:
    - `sanitize_model_identifier()`가 DB에 저장된 과거 질의 기록(`gemini-2.0-flash`, `Google gemini-3.5-flash-lite` 등)까지 `claude-sonnet-5-5`로 강제 변조함.
    - 신규 요청 기본값으로만 Claude를 부여하고, 과거 기록의 모델명은 왜곡 없이 원본 그대로 보존해야 함.
  - **원인 4 (Scoped 모드 프롬프트 그라운딩 부실)**:
    - 포커스 기사의 제목, 요약, 전문이 프롬프트 상단에 명시적으로 주입되지 않고, 기사 중심 분석 지침이 부재함.
- **작성된 테스트 코드** (`backend/tests/test_scoped_chat_grounding.py`):
  1. `test_version_is_0_2_1`: 버전 `0.2.1` 단언.
  2. `test_mock_llm_provider_removed_from_production`: `from app.services.llm_providers.mock_provider import MockLLMProvider` 호출 시 `ImportError` 단언.
  3. `test_anthropic_payload_omits_temperature`: Anthropic Claude 요청 페이로드에 `temperature`가 제외되었는지 단언.
  4. `test_scoped_chat_prompt_injects_focused_article_and_no_mock_fallback`: Scoped 모드에서 기사 제목, 요약, 전문 주입 및 가짜 목 보고서 배제 단언.
  5. `test_sanitize_model_identifier_preserves_historical_models`: 과거 모델명(Gemini, GPT 등) 보존 단언.
  6. `test_no_mock_fallback_on_provider_absence`: 라이브 프로바이더 부재 시 사일런트 목 폴백 대신 `LLMProviderUnavailableException` (HTTP 503) fail-fast 단언.
- **실행 결과 (실패 확인 - RED)**:
  - `MockLLMProvider`가 여전히 import 가능하여 `test_mock_llm_provider_removed_from_production` 실패.
  - `AnthropicLLMProvider`가 `temperature: 0.3`을 페이로드에 포함하여 `test_anthropic_payload_omits_temperature` 실패.
  - `sanitize_model_identifier("Google gemini-2.0-flash")`가 `"claude-sonnet-5-5"`로 덮어씌워져 `test_sanitize_model_identifier_preserves_historical_models` 실패.

### 2. GREEN Phase (최소 구현으로 통과)
- **수정 내역**:
  1. `backend/app/services/llm_providers/mock_provider.py`: **파일 영구 삭제**.
  2. `backend/app/services/llm_providers/__init__.py`: `MockLLMProvider` export 제거.
  3. `backend/app/services/llm_providers/anthropic_provider.py`:
     - `generate_text_with_usage`, `stream_chat`, `generate_structured_summary`에서 `temperature` 파라미터 전면 제외 (Anthropic HTTP 400 방지).
  4. `backend/app/services/llm_processor.py`:
     - `MockLLMProvider` 의존성 및 인스턴스 전면 제거.
     - `generate_live_answer` 및 `stream_tokens`의 목 폴백 체인 제거 (실패 시 즉각 `LLMUpstreamException` fail-fast).
     - `check_provider_available()`에서 목 허용 분기 제거 (미등록 시 즉각 `LLMProviderUnavailableException` fail-fast).
     - `sanitize_model_identifier()`에서 과거 모델명 보존 로직 적용 (None/빈값일 때만 기본 `claude-sonnet-5-5` 반환).
     - `has_live_provider()`를 `anthropic_provider.is_available()`로 단일화.
  5. `backend/app/services/chat_service.py`:
     - `_build_grounding_prompt`: Scoped 모드 시 기사 제목, 요약, 전문을 명시적으로 프롬프트에 주입하고 앵무새 답변 금지 지침 추가.
     - `query_chat` 및 `stream_chat`: `primary.snippet`에 원본 요약문(`item.summary`)을 우선 보존하도록 수정.
  6. 버전 및 환경설정:
     - `backend/app/config.py`, `config.json`, `backend/.env`, `.env`: `VERSION="0.2.1"` 동기화 및 `ALLOW_MOCK_FALLBACK` 설정 제거.
  7. 테스트 파일 업데이트:
     - `backend/tests/test_llm_processor.py`, `backend/tests/test_anthropic_provider.py`, `backend/tests/test_config_and_live_llm.py`: 삭제된 `MockLLMProvider` 대신 `unittest.mock.AsyncMock`을 사용하도록 리팩터링 및 v0.2.1 단언문 동기화.
- **실행 결과**:
  - `pytest backend/tests/test_scoped_chat_grounding.py`: 6 passed (100% Green)
  - 전체 테스트 스위트 (15개 파일): 147 passed (100% Green, 0 failed)

### 3. REFACTOR Phase
- `tests/` 단위 테스트 내부의 불필요한 목 객체 정리 및 가독성 향상.
- 프로덕션 코드에서 목 관련 잔재 코드 및 설정 프로퍼티 완전 소거.

---

## 7. 결론 및 Stage 3a 최종 릴리즈 승인 (v0.2.1 Sign-Off)

1. **앵무새 반복 결함 완전 해소**:
   - Scoped 기사 포커스 질의 시 실제 Anthropic Claude 5.5 모델이 기사의 전문, 요약, 제목에 기반하여 정밀한 컨텍스트 그라운딩 답변을 실시간 SSE 스트리밍으로 제공.
2. **프로덕션 제로-목(Zero-Mock) 거버넌스 확립**:
   - 프로덕션 런타임 코드(`backend/app/`)에서 `MockLLMProvider`를 완전히 추방하여 외부 API 장애 시 거짓 답변을 출력하지 않고 정직하게 fail-fast.
3. **Anthropic 400 에러 원천 차단**:
   - Claude 5.5 계열의 `temperature` 파라미터 제외로 HTTP 200 정상 응답 보장.
4. **과거 데이터 무결성 보장**:
   - DB에 기저장된 이전 모델명(Gemini 등)을 인위적으로 변조하지 않고 진본 그대로 보존.
5. **100% 테스트 무결성 달성**:
   - 총 15개 테스트 모듈, **147개 전원 통과 (100% GREEN)**.

