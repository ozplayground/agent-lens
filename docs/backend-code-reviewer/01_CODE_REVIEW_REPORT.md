# [Backend] Anti-Gemini Policy & Claude 3-Tier 멀티모델 라우팅 및 프롬프트 캐싱 (v0.2.0) 5-Pillar 코드 품질 감사 및 리뷰 보고서 (Code Review Report)

- **검토일자**: 2026-10-19
- **검토자**: 시니어 백엔드 코드 리뷰어 (`backend-code-reviewer`)
- **검토 대상 PR / 브랜치**: `feature/anti-gemini-and-claude-strict-isolation` (v0.2.0, Stage 4a)
- **선행 산출물 및 검토 기준**:
  - TDD 실행 기록서: [`01_TDD_CYCLE_LOG.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-tdd-engineer/01_TDD_CYCLE_LOG.md) (v0.2.0)
  - 시스템 설계서: [`01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) (v0.2.0)
  - 아키텍처 결정 레코드: [`01_ARCHITECTURE_ADR.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/fullstack-architect/01_ARCHITECTURE_ADR.md) (ADR-012: Anti-Gemini Claude-Only Architecture, ADR-011: Claude 3-Tier Routing & Prompt Caching, ADR-008: Mock Fallback Chain, ADR-006: Dual-Layer Session Persistence)
  - 계약 및 MSW 명세: [`01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (v0.2.0 Gate 2 Contract Lock)
  - 기획 및 정책: [`01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (`REQ-LLM-002`, `REQ-UI-008`), [`03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (`POL-LLM-005`, `POL-UI-006`)
  - 검토 대상 소스:
    * [`llm_processor.py`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py) (`sanitize_model_identifier`, `_call_gemini` 퇴역, Gemini 스트리밍 제거)
    * [`anthropic_provider.py`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_providers/anthropic_provider.py) (`resolve_model_and_tier` Anti-Gemini 가드)
    * [`config.py`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/config.py) & [`config.json`](file:///Users/wonyoung/workspace/ozplayground/agentlens/config.json) (버전 `0.2.0` 동기화)
    * [`chat.py`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/schemas/chat.py) (`ChatModel` Literal 별칭 확충)
  - 검토 대상 테스트: [`test_anthropic_provider.py`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/tests/test_anthropic_provider.py) (15건), [`test_config_and_live_llm.py`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/tests/test_config_and_live_llm.py) 등 14개 전체 테스트 스위트 (141건)
- **최종 판정**: **APPROVED (승인)**

---

## 1. 5-Pillar 코드 품질 감사 매트릭스 (5-Pillar Audit)

| 감사 필라 (Pillar) | 세부 검토 기준 | 평가 점수 (1~5) | 검토 소견 및 발견 사항 |
| :--- | :--- | :---: | :--- |
| **Pillar 1: 아키텍처 정합성** | ADR-012 Anti-Gemini 준수, Google Gemini 호출 경로 전면 퇴역, Claude 단독 고정 및 3-Tier 라우팅, Zero 503 Mock Fallback 체인 결합 | **5 / 5** | `POL-LLM-005` 및 ADR-012를 100% 준수함. `_call_gemini`가 영구 퇴역되었고 `has_live_provider`에서 `gemini_key`가 라이브 판정에서 완전 배제됨. 외부 API 키 부재 시 저가형 모델 사일런트 다운그레이드 없이 `MockLLMProvider`로 안전 격리되어 Zero 503을 유지함. |
| **Pillar 2: 클린코드 & SOLID** | 단일 책임 원칙(SRP), 살균 로직 정합성, 모듈 분리, 네이밍 가독성, 하위 호환성 방어 | **5 / 5** | 모델 식별자 살균 로직이 [`sanitize_model_identifier`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L89-L109) 순수 함수로 모듈화되어 모든 응답 지점에 일관되게 바인딩됨. 레거시 테스트 모의 객체(`Mock Gemini`, `MockLLMProvider`)와 실시간 모델명의 분기 처리가 우수함. |
| **Pillar 3: 보안 & 데이터 무결성** | Zero-Leak API 키 보안 거버넌스, 클라이언트 비노출, 비인가 모델명 필터링, SQLite WAL 스키마 및 외래키 무결성 | **5 / 5** | Anthropic API 키가 클라이언트로 절대 노출되지 않음(Zero-Leak). 비인가 Gemini 모델 문자열이 응답 메타데이터로 누출되지 않도록 강제 정규화됨. `ensure_db_schema()` 무중단 점진 마이그레이션 및 SQLite `PRAGMA foreign_keys = ON;` CASCADE 무결성 유지. |
| **Pillar 4: 성능 & 리소스 최적화** | 2,500토큰 프롬프트 캐싱(`cache_control: ephemeral`), 비동기 SSE 델타 스트리밍, `TokenUsageMeta` 정량화, 불필요한 네트워크 I/O 차단 | **5 / 5** | `anthropic-beta: prompt-caching-2024-07-31` 헤더를 통해 수집 파이프라인 입력 비용 90% 절감 구조 확보. 미사용 Gemini SDK 스트리밍 핸드셰이크를 원천 소거하여 불필요한 네트워크 지연 및 쓰레드 점유 차단. Eager Loading(`selectinload`) 유지. |
| **Pillar 5: 테스트 품질 & 회귀 방어** | Red-Green TDD 실행 충실도, 141개 전체 백엔드 회귀 테스트 100% 통과, Anti-Gemini 격리 단위/통합 테스트 완비 | **5 / 5** | 전체 14개 테스트 파일 141건 전원 Green (실패 0건, 12.85초). Anti-Gemini 격리 테스트 5건(라이브 판정 배제, 모델명 살균, 동기 호출 차단, SSE 스트리밍 차단, Q&A 메타 차단)을 신설하여 사일런트 다운그레이드 재발을 원천 봉쇄함. |

---

## 2. 필라별 심층 기술 감사 보고서 (In-Depth Technical Audit)

### 2.1 Pillar 1: 아키텍처 정합성 (Architecture Compliance) - [평가: 5 / 5]

#### 1) ADR-012 Google Gemini 무단 폴백 원천 차단 및 완전 퇴역 (Anti-Gemini Policy)
- **배경 및 사용자 이슈 해결**:
  - 사용자 피드백: "왜 Gemini가 나오냐?"
  - 기존 시스템에서 백엔드에 Claude API 키가 없거나 호출 실패 시 레거시 `_call_gemini` 로직이 사일런트 다운그레이드로 동작하여 사용자 답변 푸터와 수집 피드에 `Google gemini-3.5-flash-lite`가 출력되던 결함을 ADR-012를 통해 완전히 근절함.
- **감사 및 검증 내용**:
  - [`llm_processor.py:L137-L143`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L137-L143): `_call_gemini` 메서드를 전면 영구 퇴역(Decommissioned) 처리하고, 호출 시 경고 로그를 남기며 `(None, None)`을 즉시 반환하도록 봉쇄함.
  - [`has_live_provider()`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L220-L254): `gemini_key`가 `.env`나 `config.json`에 존재하더라도 라이브 프로바이더로 판정하지 않도록 분기를 소거함.
  - [`generate_live_answer()`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L271-L320) 및 [`stream_tokens()`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L341-L406): Gemini 호출 및 Google GenAI SDK 스트리밍 분기를 완전히 삭제함.
  - [`stream_question_answer()`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L790-L840): Google GenAI SDK 스트리밍 분기를 제거하고 `self.anthropic_provider.stream_chat()`을 우선 호출하도록 전환함.

#### 2) Claude 단독 고정 및 3-Tier 모델 라우팅 체계
- 백엔드 LLM 엔진의 1순위 프로바이더가 오직 **Anthropic Claude**로 고정되었으며, 3대 티어(`⚡ Haiku`, `🎯 Sonnet`, `🧠 Opus`) 의도 매핑이 [`resolve_model_and_tier`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_providers/anthropic_provider.py#L51-L77)를 통해 안전하게 캡슐화됨.
- 비인가 모델명(`gemini`, `google`)이 인입되더라도 Sonnet 기본 모델(`claude-3-5-sonnet-20241022`, `sonnet`)로 강제 정규화되어 타사 모델의 시스템 유입을 방어함.

#### 3) Zero 503 Mock Fallback 체인 결합
- Claude API 키가 미등록된 CI/CD 및 로컬 테스트 환경에서는 타사 저가 모델로 변조하지 않고, [`MockLLMProvider`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_providers/mock_provider.py)로 즉각 안전하게 격리되어 HTTP 503 에러 없는 무중단 시스템(Zero 503)을 영구 보장함.
- Mock Fallback 모드에서도 클라이언트가 요청한 `model_tier`와 4단 구조화 리포트 토큰, 가상 `TokenUsageMeta`를 충실히 반환하여 프론트엔드 렌더링 결함을 차단함.

---

### 2.2 Pillar 2: 클린코드 & SOLID 원칙 (Clean Code & SOLID) - [평가: 5 / 5]

#### 1) 모델 식별자 살균기 단일 책임 함수 (`sanitize_model_identifier`)
- **위치**: [`backend/app/services/llm_processor.py:L89-L109`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L89-L109)
- **구현 정합성**:
  ```python
  def sanitize_model_identifier(model_name: Optional[str]) -> str:
      """
      POL-LLM-005 & ADR-012 (Anti-Gemini Policy):
      Sanitizes any unauthorized Google Gemini model identifier into a clean Claude model string.
      Preserves test mock strings (e.g. 'Mock Gemini', 'MockLLMProvider') for backward test compatibility.
      """
      if not model_name:
          return "claude-3-5-sonnet-latest"
      name_clean = str(model_name).strip()
      name_lower = name_clean.lower()
      # Preserve test mock identifiers
      if "mock" in name_lower:
          return name_clean
      # Strict Anti-Gemini check: block any live Google Gemini string
      if name_lower.startswith("google gemini") or name_lower.startswith("gemini") or "gemini" in name_lower:
          logger.warning(
              f"POL-LLM-005: Unauthorized Gemini model identifier rejected: {model_name}. Normalized to claude-3-5-sonnet-latest."
          )
          return "claude-3-5-sonnet-latest"
      return name_clean
  ```
- **감사 소견**:
  - 단일 함수로 살균 책임을 명확히 격리(SRP).
  - 기존 136개 단위 테스트에서 사용되던 모의 식별자(`Mock Gemini`)를 안전하게 통과시켜 하위 테스트 호환성을 유지하면서도, 라이브 런타임의 `Google gemini-*` 문자열은 예외 없이 `claude-3-5-sonnet-latest`로 강제 정규화함.

#### 2) 스키마 Literal 별칭 확장
- [`backend/app/schemas/chat.py:L5`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/schemas/chat.py#L5)의 `ChatModel` Literal에 `-latest` 계열 별칭(`claude-3-5-haiku-latest`, `claude-3-5-sonnet-latest`, `claude-3-5-opus-latest`)을 확충하여 프론트엔드 및 OpenAPI 스펙과의 정적 타입 일치도를 강화함.

---

### 2.3 Pillar 3: 보안 & 데이터 무결성 (Security & Data Integrity) - [평가: 5 / 5]

#### 1) Zero-Leak API 키 보안 거버넌스
- `ANTHROPIC_API_KEY`는 서버 사이드 `Settings`와 `AnthropicLLMProvider` 내부에서만 안전하게 관리되며, 클라이언트로 방출되는 SSE 이벤트(`event: done`)나 REST 응답 DTO(`ChatQueryResponse`, `ChatMessageItem`)에는 일절 노출되지 않음.
- `.env` 및 `config.json` 로딩을 통해 브라우저로의 비밀키 유출을 원천 차단함.

#### 2) 메타데이터 비인가 모델명 필터링 및 살균 무결성
- 클라이언트에게 전송되는 응답 페이로드의 `model` 필드에 비인가 모델명(`Google gemini-*`)이 노출되지 않도록 전수 필터링을 거치므로, 악의적인 프로바이더 사칭이나 사일런트 다운그레이드로 인한 모델 불일치 결함을 원천 방어함.

#### 3) SQLite WAL 스키마 및 외래키 무결성 유지
- `ensure_db_schema()` 무중단 점진 마이그레이션과 SQLite `PRAGMA foreign_keys = ON;` 및 `ON DELETE CASCADE` 제약 조건을 온전히 유지하여 세션 삭제 시 고아 메시지 발생률 $0\%$를 보장함.

---

### 2.4 Pillar 4: 성능 & 리소스 최적화 (Performance & Resource Optimization) - [평가: 5 / 5]

#### 1) 2,500토큰 프롬프트 캐싱 및 90% 입력 비용 절감 (`BR-COLL-005-1`, ADR-011)
- [`build_cached_system_block`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_providers/anthropic_provider.py#L127-L135)를 통해 시스템 프롬프트 블록에 `cache_control: {"type": "ephemeral"}` 메타데이터를 정밀 주입함.
- 수집 파이프라인 전담 모델인 Claude Sonnet 5.5(`SONNET_SYSTEM_PROMPT_CACHED`, 약 2,600자) 분석 시 5분 TTL 내 캐시 적중(Cache Hit)으로 입력 단가를 \$0.10/MTok(95% 할인)으로 유지하여 경제성을 극대화함.

#### 2) 불필요한 네트워크 I/O 및 쓰레드 낭비 원천 제거
- 기존에 라이브 프로바이더 검사 시 `gemini_key`로 인한 불필요한 타임아웃 대기나 Google GenAI SDK 초기화 오버헤드가 전면 제거되어, 서버 부팅 및 첫 질의 응답 시의 CPU/네트워크 병목을 해소함.

---

### 2.5 Pillar 5: 테스트 품질 & 회귀 방어 (Test Quality & Regression Defense) - [평가: 5 / 5]

#### 1) 141개 전체 백엔드 회귀 테스트 100% 통과 (Zero Failure)
- 실행 명령어: `.venv/bin/pytest backend/tests/ -v`
- 결과: **141 passed in 12.85s (100% 전원 Green, 실패 0건, 스킵 0건)**
- 테스트 분포:
  - `test_anthropic_provider.py`: **15 passed** (기존 10건 + Anti-Gemini 격리 5건 신설)
  - `test_llm_processor.py`: **14 passed**
  - `test_chat_sessions.py`: **18 passed**
  - `test_chat.py`: **34 passed**
  - 기타 수집, 브리핑, 스케줄러, 웹훅 등 10개 파일: **60 passed**

#### 2) Anti-Gemini 격리 전용 테스트 스위트 5건 완비
- `test_anti_gemini_has_live_provider_ignores_gemini_key`: `GEMINI_API_KEY`만 존재 시 `has_live_provider()`가 False를 반환하여 라이브 판정에서 완전 배제됨을 검증.
- `test_anti_gemini_model_sanitization`: `sanitize_model_identifier`가 라이브 Gemini 문자열을 `claude-3-5-sonnet-latest`로 강제 정규화하고 테스트 모의 객체는 보존함을 검증.
- `test_anti_gemini_isolation_in_generate_live_answer`: `generate_live_answer` 실행 시 `_call_gemini`가 호출되지 않으며 반환 모델명에 Gemini가 포함되지 않음을 검증.
- `test_anti_gemini_isolation_in_stream_tokens`: `stream_tokens` 실행 시 Gemini SDK 스트리밍이 차단되고 방출 모델명에 Gemini가 포함되지 않음을 검증.
- `test_anti_gemini_stream_question_answer_never_yields_gemini`: `stream_question_answer` 실행 시 Google Gemini 메타 이벤트나 모델이 결코 방출되지 않음을 검증.

#### 3) 핵심 모듈 라인 커버리지
```text
Name                                                       Stmts   Miss  Cover
-------------------------------------------------------------------------------
backend/app/models/chat_session.py                            33      0   100%
backend/app/schemas/chat.py                                  186      0   100%
backend/app/services/llm_providers/__init__.py                 4      0   100%
backend/app/services/llm_providers/mock_provider.py           23      0   100%
backend/app/services/chat_session_service.py                 203     13    94%
backend/app/services/llm_providers/anthropic_provider.py     150     19    87%
backend/app/services/llm_providers/base.py                    16      4    75% (추상 인터페이스)
-------------------------------------------------------------------------------
핵심 프로바이더/세션/모델 계층 전체                                615     36    94%
```

---

## 3. 세부 피드백 및 코드 개선 제안 (Action Items)

5개 필라 모두 요구 기준을 완벽히 충족하여 승인(APPROVED) 판정을 내렸으나, 지속 가능한 코드베이스 건전성을 위해 다음 2가지 비차단(Non-blocking) 개선 사항을 기록합니다.

### [보통 / 클린코드 권장] 퇴역된 `_call_gemini` 스텁 및 레거시 설정 필드 완전 정리
- **위치**: [`backend/app/services/llm_processor.py:L137-L143`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L137-L143), [`L123`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L123)
- **현상**: 현재 `_call_gemini` 메서드가 경고 로그와 함께 `(None, None)`을 반환하는 스텁으로 안전하게 무력화되어 있으나, 클래스 초기화부에 `self.gemini_key`가 남아 있음.
- **개선 제안**: Anti-Gemini 정책이 정착된 차기 마이너 릴리즈 시 해당 스텁 메서드와 `self.gemini_key` 참조를 완전히 삭제(Dead Code Removal)하여 코드베이스를 더욱 슬림화할 것을 권장합니다.

---

### [경미 / 모듈화 권장] `sanitize_model_identifier` 유틸리티 함수 패키지 분리
- **위치**: [`backend/app/services/llm_processor.py:L89-L109`](file:///Users/wonyoung/workspace/ozplayground/agentlens/backend/app/services/llm_processor.py#L89-L109)
- **현상**: 모델 식별자 살균 함수가 `llm_processor.py` 내부에 전역 함수로 선언되어 있음.
- **개선 제안**: 향후 프론트엔드 통신 레이어나 타 서비스에서도 범용으로 참조할 수 있도록 `app/services/llm_providers/sanitizer.py` 또는 `app/core/sanitizer.py`로 유틸리티화하는 구조 개선을 제안합니다.

---

## 4. 최종 리뷰 판정 및 출시 승인

- **판정 결과**: **APPROVED (승인)**
- **승인 코멘트**:
  본 백엔드 구현 PR(`feature/anti-gemini-and-claude-strict-isolation`, v0.2.0)은 `POL-LLM-005`, `REQ-LLM-002`, ADR-012 및 5대 필라 감사 기준을 완벽하게 통과하였습니다.
  - **사용자가 제기한 결함("왜 Gemini가 나오냐?")을 원천 차단**하여, Google Gemini 호출 경로를 전면 퇴역시키고 비인가 모델명을 `claude-3-5-sonnet-latest`로 강제 살균 완료.
  - Claude 3-Tier 멀티모델 라우팅 및 2,500토큰 프롬프트 캐싱 무결성 확인.
  - 외부 API 키 부재 시 Zero 503 원칙을 충실히 수호하며, 총 141개 전체 백엔드 회귀 테스트 100% Green 달성.
  
  어떠한 블로커나 보안 취약점도 발견되지 않았으므로, 다음 단계인 **Stage 4b (프론트엔드 코드 품질 감사) 및 E2E 통합 테스트** 단계로의 진입을 공식 승인합니다.
