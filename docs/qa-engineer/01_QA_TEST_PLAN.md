# [AgentLens] Anthropic 공식 Claude 5.5 모델 규격 및 UI 노출 정규화 (v0.2.1) 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: 2026-10-19
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.2.1 (공식 Anthropic Claude 5.5 모델 규격 적용, 3.5 잔재 완전 박멸, UI 내 날것의 모델 식별자 차단 및 브랜드 정규화, Anti-Gemini 격리, 듀얼 모델 셀렉터 0ms 동기화, Zero 503 복원력 및 Zero-Leak 보안 거버넌스 전수 검증)
- **상태**: Approved
- **선행 산출물 및 기준 문서**:
  - 제품 요구사항 명세서: [`01_PRD.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/01_PRD.md) (v0.2.0: `REQ-LLM-002`, `REQ-UI-008`, `REQ-CLAUDE-001`, `REQ-THEME-001`, `REQ-SHORTCUT-001`, `REQ-EXPORT-001`, `REQ-CHAT-011`, `REQ-CHAT-012`)
  - 비즈니스 정책 및 엣지 케이스: [`03_POLICIES_AND_EDGES.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/03_POLICIES_AND_EDGES.md) (`POL-LLM-005`: Anti-Gemini Policy, `POL-UI-006`: Dual Model Selector Sync)
  - 상세 기능 정의서:
    - [`05_AI_CHAT_SPECIFICATION.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/05_AI_CHAT_SPECIFICATION.md) (`FUNC-CHAT-013`: Claude 3-Tier 멀티모델 선택기, `FUNC-CHAT-014`: 듀얼 모델 셀렉터 및 Anti-Gemini 격리)
    - [`06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/06_UI_THEME_AND_HOTKEYS_SPECIFICATION.md) (`FUNC-THEME-001`, `FUNC-NAV-001`)
    - [`01_NEWS_FEED_SPECIFICATION.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/spec-writer/fsd/01_NEWS_FEED_SPECIFICATION.md) (`FUNC-FEED-007`)
  - 시스템 설계서 & OpenAPI: [`01_SYSTEM_DESIGN.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/01_SYSTEM_DESIGN.md) (v0.2.0), [`02_OPENAPI_SPEC.yaml`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/system-designer/02_OPENAPI_SPEC.yaml) (OpenAPI 3.1.0 v4.0.0)
  - UI 컴포넌트 명세서: [`01_COMPONENT_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/ui-system-designer/01_COMPONENT_SPEC.md) (v0.2.0: `ChatHeader`, `ChatPromptInput`, `ChatModelSelector`, `ModelTierBadge`, `ModelChangeDivider`)
  - 데이터 계약 및 MSW 명세서: [`01_CONTRACT_AND_MSW_SPEC.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (v0.2.0 Stage 2d Contract Lock)
  - 5-Pillar 코드 품질 감사 보고서:
    - 백엔드: [`docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.1 APPROVED)
    - 프론트엔드: [`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.1 APPROVED)

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상 (Test Scope)
기획 요구사항(`01_PRD.md`), 상세 기능정의서(FSD 01~06), 그리고 공식 Claude 5.5 모델 연동 규약에 따른 핵심 검증 항목:

1. **공식 Anthropic Claude 5.5 모델 규격 및 단일 소스(SSOT) 매핑 (`REQ-CLAUDE-001`, `ADR-011`)**:
   - 백엔드 `MODEL_TIER_MAPPING`:
     * Haiku: `claude-haiku-5-5`
     * Sonnet: `claude-sonnet-5-5` (기본값)
     * Opus: `claude-opus-5-5`
   - 기본 모델 및 티어 전역 상수 통일: `DEFAULT_MODEL = "claude-sonnet-5-5"`, `DEFAULT_TIER = "sonnet"`
   - `backend/app/config.py`, `backend/app/schemas/chat.py`, `backend/app/services/llm_processor.py`, `backend/app/config/sources.json`, `.env.example` 전역 일관성 검증
2. **UI 내 날것의 모델 ID 및 3.5 잔재 노출 원천 차단 (`POL-UI-006`, `formatModelDisplayName`)**:
   - 화면 어디에도 `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5` 등의 내부 기술 식별자나 레거시 `claude-3-5-...`가 노출되지 않음
   - 뷰 렌더링 시 반드시 `formatModelDisplayName`(별칭 `getModelLabel`) 헬퍼를 통해 `Claude Sonnet 5.5`, `Claude Haiku 5.5`, `Claude Opus 5.5`로 정규화 표출
   - `ChatMessageItem`, `ChatWorkspace`, `ModelTierBadge`, `ChatModelSelector`, `ModelChangeDivider` 전수 점검
3. **Anti-Gemini 정책 및 모델 라우팅 정합성 (`POL-LLM-005`, `REQ-LLM-002`)**:
   - 백엔드: `_call_gemini` 영구 퇴역, `has_live_provider()`에서 Gemini 배제, `sanitize_model_identifier()`를 통해 Gemini 인입 시 `claude-sonnet-5-5`로 강제 정규화
   - 프론트엔드: `sanitizeModelTier()`에서 Gemini 및 비인가 문자열 인입 시 경고 로그 후 `sonnet`으로 자동 격리
4. **듀얼 모델 셀렉터 배치 및 0ms 양방향 상태 동기화 (`REQ-UI-008`, `POL-UI-006`)**:
   - 상단 헤더 우측(`ChatHeader`의 `header-chip`) 및 하단 컴포저 좌하단(`ChatPromptInput`의 `inline-chip`) 동시 마운트
   - `ChatWorkspace` 단일 진실 공급원(SSOT) 상태를 통한 0ms 즉각 양방향 동기화
   - 헤더 칩(하향 우측: `top-full right-0`), 컴포저 칩(상향 좌측: `bottom-full left-0`) 스마트 포지셔닝
5. **무손실 모델 인라인 전환 및 타임라인 구분선 (`ModelChangeDivider`, Zero Context Erasure)**:
   - 대화 중간 모델 변경 시 기존 대화 이력(`messages`, `activeSource`, `focusFilters`) 100% 무손실 유지
   - 타임라인 상 시맨틱 구분선(`role="separator"`)을 통해 "Claude Sonnet 5.5로 모델 변경됨 (맥락 100% 보존)" 명확히 안내
6. **스트리밍 중 듀얼 모델 선택기 잠금 (Streaming Lock)**:
   - SSE 토큰 스트리밍 진행 중(`isStreaming === true`) 헤더 및 컴포저 선택기 동시 `disabled` 처리 및 툴팁 고지
7. **어시스턴트 메시지 푸터 모델 배지 및 실시간 레이턴시 표출 (`ModelTierBadge`)**:
   - 어시스턴트 응답 완료 시 `ModelTierBadge`를 통해 사용된 모델명(`Haiku 5.5` / `Sonnet 5.5` / `Opus 5.5`), 지연시간(ms), 상대 비용($/$$/$$$) 표출
8. **Claude Sonnet 5.5 데이터 수집 파이프라인 프롬프트 캐싱 메타데이터 (`TokenUsageMeta`)**:
   - 2,500토큰 초과 시스템 프롬프트 요청 시 `anthropic-beta: prompt-caching-2024-07-31` 헤더 운용
   - `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` 정량 추적
9. **Multi-LLM 장애 복원력 및 Zero 503 Mock Fallback 체인**:
   - Anthropic API 키 부재 및 테스트/CI 환경에서 503 에러 없이 `MockLLMProvider`를 통한 안정적인 4단 리포트 공급
10. **Zero-Leak API 키 보안 거버넌스**:
    - 브라우저 스크립트 번들 및 Network 탭에 Anthropic API 키 0바이트 노출 (FastAPI 백엔드 프록시 완벽 격리)
11. **전역 자동화 테스트 회귀 방어**:
    - 백엔드 pytest 전체 142건 및 프론트엔드 vitest 전체 230건 (총 372건) 100% Green 통과

### 1.2 테스트 환경 (Test Environment)
- **API 서버**: 로컬 라이브 인스턴스 (`http://localhost:8000`), Python 3.11.9, FastAPI 0.115.6, SQLite 3.43+ WAL (`PRAGMA foreign_keys = ON;`)
- **웹 클라이언트**: Next.js 16.3.4 (App Router, Turbopack, React 19.2.8), Tailwind CSS v4, MSW v2.15.0
- **검증 뷰포트**:
  - 모바일: 375px (iPhone SE) / 390px (iPhone 15 Pro)
  - 태블릿: 768px (iPad Mini)
  - 데스크톱: 1440px / 1280px (MacBook Pro / Desktop Wide)
- **타깃 브라우저 엔진**: Chromium (Chrome, Edge), Gecko (Firefox), WebKit (Safari)

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

| 케이스 ID | 테스트 구분 | 검증 시나리오 | 사전 조건 및 입력 데이터 | 기대 결과 (Pass Criteria) |
| :--- | :---: | :--- | :--- | :--- |
| `TC-ANTIGEM-001`| 보안/정합성 | **백엔드 Anti-Gemini 격리 및 공식 5.5 모델 매핑 검증** | `GEMINI_API_KEY` 설정 후 백엔드 라이브 프로바이더 조회 및 Q&A 실행 | • `has_live_provider()`에서 Gemini 배제 확인<br>• `_call_gemini` 영구 퇴역 확인<br>• `sanitize_model_identifier`를 통해 Gemini 문자열 인입 시 `claude-sonnet-5-5`로 강제 정규화 |
| `TC-ANTIGEM-002`| UI/보안 | **프론트엔드 Anti-Gemini UI 살균 및 5.5 마스킹 검증** | 레거시 또는 오염된 모델 식별자(`gemini-2.5-flash` 등) 주입 | • `sanitizeModelTier`에서 경고 로그 출력 후 `sonnet`으로 자동 대체<br>• `formatModelDisplayName`을 통해 `Claude Sonnet 5.5`로 안전 변환<br>• `ChatMessageItem` 및 UI 전역에서 Gemini 문자열 노출 0건 입증 |
| `TC-CLAUDE-001`| E2E 정상 | **Claude 3-Tier 멀티모델 선택기 UX 및 공식 5.5 브랜드 렌더링** | `/chat` 진입 후 모델 셀렉터 확인 및 팝오버 오픈 | • 초기 기본 모델로 `🎯 Sonnet 5.5` 표출<br>• 팝오버 오픈 시 `⚡ Haiku 5.5`, `🎯 Sonnet 5.5`, `🧠 Opus 5.5` 3대 티어 정규 명칭 표출<br>• WAI-ARIA `role="radiogroup"` 및 키보드 방향키 탐색 동작 |
| `TC-CLAUDE-002`| E2E 정상 | **대화 도중 모델 변경 시 타임라인 구분선 및 무손실 맥락 인계** | 1턴 Sonnet 5.5 대화 후 Opus 5.5로 모델 변경 및 2턴 질의 전송 | • 이전 대화 메시지 및 세션 컨텍스트 100% 무손실 보존 (Zero Context Erasure)<br>• 타임라인 상에 시맨틱 `ModelChangeDivider`(`role="separator"`) 자동 삽입<br>• "Claude Opus 5.5로 모델 변경됨 (맥락 100% 보존)" 표출 확인 |
| `TC-CLAUDE-003`| UI/보안 | **답변 스트리밍 중 듀얼 모델 선택기 동시 잠금 (Streaming Lock)** | AI 챗 답변이 실시간 SSE 스트리밍 중인 상태 | • 상단 헤더 및 하단 컴포저의 `ChatModelSelector` 트리거 버튼 동시 비활성화(`disabled cursor-not-allowed`)<br>• 클릭 시 "답변 생성 중에는 모델을 변경할 수 없습니다" 안내 툴팁 노출 |
| `TC-CLAUDE-004`| E2E 정상 | **어시스턴트 메시지 푸터 모델 배지 및 실시간 레이턴시 표출** | 질의 전송 후 답변 스트리밍 완료 (`event: done`) | • 어시스턴트 말풍선 우하단에 `ModelTierBadge` 렌더링<br>• 사용된 모델명(`Haiku 5.5` / `Sonnet 5.5` / `Opus 5.5`) 및 실시간 응답 지연시간(ms), 상대 비용($/$$/$$$) 표출 확인 |
| `TC-CLAUDE-005`| 데이터/성능 | **Claude Sonnet 5.5 수집 파이프라인 프롬프트 캐싱 메타데이터** | 2,500토큰 초과 시스템 프롬프트 요청 및 스트리밍 완료 | • `anthropic-beta: prompt-caching-2024-07-31` 헤더 전송<br>• `event: done` 페이로드에 `usage` 메타데이터(`input_tokens`, `output_tokens`, `cache_read_input_tokens`) 정상 수화 및 직렬화 보존 |
| `TC-CLAUDE-006`| 장애/복원 | **외부 API 키 부재 시 Zero 503 Mock Fallback 무중단 복원력** | `ANTHROPIC_API_KEY` 미설정 또는 테스트 환경에서 챗 질의 전송 | • 503 다운타임 없이 `MockLLMProvider`로 안전하게 우아한 폴백 수행<br>• 요청된 `model_tier`가 무손실 보존되며 4단 엔지니어링 리포트 마크다운 정상 스트리밍 |
| `TC-CLAUDE-007`| 보안 거버넌스 | **Zero-Leak API 키 보안 거버넌스 검증** | 브라우저 전역 스크립트 번들 및 Network 요청 탭 전수 감사 | • `ANTHROPIC_API_KEY`가 클라이언트 번들, DOM, LocalStorage, SSE 페이로드에 0바이트 노출<br>• 오직 FastAPI 백엔드 프록시(`POST /api/chat/stream`)를 통해서만 서버-투-서버 통신 수행 |
| `TC-CLAUDE-008`| UI 음성검증 | **UI 내 날것의 기술 식별자 및 3.5 잔재 노출 원천 차단 (Negative Assertion)** | `ChatMessageItem` 및 UI 렌더링 뷰 전수 검사 | • `claude-3-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-opus-5-5` 등 기술 식별자 노출 0건<br>• 오직 `Claude Sonnet 5.5`, `Claude Haiku 5.5`, `Claude Opus 5.5` 또는 단축형(`Sonnet 5.5` 등)만 렌더링됨을 단언 |
| `TC-DUAL-001`  | E2E 정상 | **듀얼 모델 셀렉터 배치 및 0ms 양방향 동기화** | `/chat` 진입 후 상단 헤더 칩 및 하단 컴포저 칩 확인, 상단에서 Opus 선택 | • 상단 헤더 우측 및 하단 컴포저 좌하단에 모델 칩 동시 마운트<br>• 상단 헤더에서 Opus 선택 시 하단 컴포저 칩도 0ms 즉시 `🧠 Opus 5.5`로 동기화 |
| `TC-DUAL-002`  | UI/UX | **듀얼 셀렉터 드롭다운 전개 방향 최적화** | 상단 헤더 칩 클릭 후 팝오버 위치 확인, 하단 컴포저 칩 클릭 후 위치 확인 | • 상단 헤더 칩: 하향 우측(`top-full right-0 mt-2`)으로 전개<br>• 하단 컴포저 칩: 상향 좌측(`bottom-full left-0 mb-2`)으로 전개되어 뷰포트 잘림 방지 |
| `TC-THEME-001` | E2E 정상 | **전역 테마 순환 전환 (`t` 키 및 헤더 버튼)** | 초기 라이트 모드 상태에서 헤더 토글 클릭 또는 단축키 `t` 3회 입력 | • `Light` $\rightarrow$ `Dark` $\rightarrow$ `System` 순환 전환 및 `<html>`의 `dark` 클래스, LocalStorage 영속화 확인 |
| `TC-THEME-002` | E2E 정상 | **Zero-Flicker SSR 하이드레이션 검증** | `theme=dark`가 저장된 브라우저에서 페이지 새로고침(F5) | • HTML 파싱 단계에서 인라인 스크립트 선행 평가로 하얀 화면 번쩍임(FOUC) 0건 |
| `TC-THEME-003` | 엣지/시스템 | **OS 시스템 다크모드 실시간 동기화** | 테마 설정이 `system`인 상태에서 OS 테마를 라이트 $\rightarrow$ 다크로 전환 | • 새로고침 없이 즉시 `dark` 모드 전환 및 WCAG 2.1 AA 명도 대비(4.5:1 이상) 준수 |
| `TC-HOTKEY-001`| E2E 정상 | **뉴스 피드 카드 `j`/`k` 키보드 내비게이션** | 메인 피드(`/`) 화면 진입 후 `j`, `k` 키 연속 입력 | • `j`/`k` 입력 시 카드 간 인디고 포커스 링 순환 이동 및 경계 초과 방지 |
| `TC-HOTKEY-002`| E2E 정상 | **포커스 카드 원클릭 액션 (`c` 핸드오버 & `b` 북마크)** | 특정 카드에 포커스 위치 후 `b` 입력 후 `c` 입력 | • `b` 입력 즉시 북마크 토글, `c` 입력 즉시 해당 기사 컨텍스트 장착된 `/chat` 핸드오버 |
| `TC-HOTKEY-003`| 보안/접근성 | **텍스트 입력 필드 이벤트 격리 (Input Isolation Rule)** | 피드 검색창(`<input>`) 또는 챗 프롬프트창(`<textarea>`)에 포커스 후 타이핑 | • 단축키 미실행 및 텍스트 정상 타이핑, 한글 IME 조합 중 오작동 0건 |
| `TC-PALETTE-001`| E2E 정상 | **전역 커맨드 팔레트 호출 (`Cmd+K` / `Ctrl+K`)** | 애플리케이션 어느 화면에서든 `Cmd+K` (macOS) 또는 `Ctrl+K` (Windows) 입력 | • `CommandPalette` 모달 팝업, 검색창 자동 포커스 및 배경 스크롤 락(`overflow: hidden`) 적용 |
| `TC-PALETTE-002`| E2E 정상 | **커맨드 팔레트 검색, 키보드 탐색 및 실행** | 커맨드 팔레트 오픈 후 `"테마"` 검색, `ArrowDown` 1회 후 `Enter` 입력 | • 검색어 실시간 필터링, 방향키 탐색 및 `Enter` 입력 즉시 테마 전환 액션 실행 |
| `TC-PALETTE-003`| 접근성 | **커맨드 팔레트 Escape 닫기 및 포커스 복원** | 커맨드 팔레트 오픈 상태에서 `Escape` 키 입력 | • 모달 즉시 닫힘 및 직전 포커스 엘리먼트로 포커스 100% 복원 |
| `TC-EXPORT-001`| E2E 정상 | **4단 리포트 마크다운 클립보드 원클릭 복사** | AI 챗 답변 생성 완료 후 `ExportToolbar`의 [마크다운 복사] 버튼 클릭 | • 클립보드 API를 통해 마크다운 복사 및 2초간 시각적 피드백 노출 |
| `TC-EXPORT-002`| E2E 정상 | **특수문자 살균 처리된 `.md` 리포트 파일 다운로드** | 질문: `"Claude 5.5: Sonnet vs Opus?"` 질의 후 [다운로드] 버튼 클릭 | • 파일명 내 특수문자 언더스코어 치환 살균(`agentlens_report_Claude_5.5_Sonnet_vs_Opus.md`) 및 안전 다운로드 |
| `TC-EXPORT-003`| UI/상태 | **답변 스트리밍 중 익스포트 툴바 비활성화 가드** | AI 챗 답변 토큰이 실시간 수신(스트리밍) 중인 상태 | • 복사/다운로드/노션 버튼 비활성화(`disabled opacity-50`), `event: done` 후 활성화 |
| `TC-CHAT-001`  | E2E 정상 | **글로벌 자율 지식 검색 챗 질의 및 SSE 스트리밍** | `/chat` 진입 후 질문: `"FastMCP 아키텍처 핵심 요약"` 전송 | • `POST /api/chat/stream` 호출 후 SSE 연결 수립, 4단 구조화 섹션 완비 |
| `TC-CHAT-002`  | E2E 정상 | **특정 기사 컨텍스트 고정 스코프 챗 질의** | 특정 기사 카드에서 [Ask AI]로 진입 후 Scoped 질의 전송 | • `[Scoped: 기사제목]` 활성 기사 칩 마운트, 기사 본문 캐시 참조 및 인라인 인용 뱃지 연동 |
| `TC-SESS-001`  | E2E 정상 | **Clean Slate 기본 신규 세션 진입 원칙** | `/chat` URL 직접 진입 또는 사이드바 `+ 새 대화` 버튼 클릭 | • 직전 대화 임의 로드 없이 신규 UUID 발급 및 빈 상태(Empty State) 웰컴 뷰 렌더링 |
| `TC-SESS-002`  | E2E 정상 | **Dual-Layer 영속화 & 첫 턴 30자 자동 타이틀링** | 신규 세션에서 질문 전송 후 스트리밍 완료 (`event: done`) | • 첫 턴 30자 정규화 살균 타이틀 확정 및 `localStorage`(L1) + SQLite WAL(L2) 원자적 커밋 |
| `TC-SESS-003`  | E2E 정상 | **4대 컨텍스트 완전 복원 및 멀티턴 대화 지속** | 과거 세션 카드 클릭 후 후속 질의 전송 | • 4대 컨텍스트(`messages`, `scopeMode`, `activeSource`, `focusFilters`) 100% 수화 및 10턴 슬라이딩 윈도우 질의 성공 |
| `TC-SESS-004`  | 데이터 무결성 | **원자적 세션 인라인 삭제 & SQLite 외래키 CASCADE** | 세션 카드의 휴지통 아이콘 클릭 후 `DeleteConfirmPopover`에서 [삭제] 확정 | • [취소] 버튼 자동 포커스, 확정 시 `ON DELETE CASCADE` 연관 자식 메시지 일괄 소거, 클린 리셋 |
| `TC-SESS-005`  | 성능/용량 | **FIFO 30개 보존 정책 (Eviction Policy)** | 세션이 30개 존재하는 상태에서 31번째 세션 생성 | • 총 세션 수 30개 엄격 유지, 가장 오래된 세션 1건 자동 영구 소거 |
| `TC-RESP-001`  | 반응형/뷰포트 | **0px 가로스크롤 방어 (전체 뷰포트 375px/768px/1440px)** | 모바일(375px), 태블릿(768px), 데스크톱(1440px) 환경에서 긴 텍스트/표 열람 | • `document.documentElement.scrollWidth === document.documentElement.clientWidth` (가로스크롤바 0px 유지) |
| `TC-RESP-002`  | 반응형/UI | **모바일 슬라이드 드로어 및 스크롤 락** | 375px 모바일 뷰포트에서 헤더 메뉴 탭하여 `ChatHistoryDrawer` 오픈 | • 좌측 드로어 슬라이드오버, 바디 스크롤 락(`overflow: hidden`), 백드롭 터치 닫힘 확인 |
| `TC-SEC-001`   | 보안/유효성 | **유효하지 않은 UUID 및 세션 미존재 방어** | `GET /api/chat/sessions/invalid-uuid-123` 또는 미존재 UUID 호출 | • 비정상 UUID: 400 Bad Request, 미존재 UUID: 404 Not Found 및 클라이언트 안전 리셋 |
| `TC-EDGE-001`  | 엣지/네트워크 | **스트리밍 중 세션 전환 및 네트워크 단절 대응** | 답변 수신 중 타 세션 클릭 또는 오프라인 전환 | • SSE 요청 즉시 `AbortController.abort()` 중단, 오프라인 시 L1 `localStorage` 캐시 열람 |
| `TC-REG-001`   | 통합 회귀 | **전체 백엔드 API(142건) & 프론트엔드 컴포넌트(230건) 자동화 회귀** | pytest 142건 및 vitest 230건 전체 스위트 실행 | • 백엔드 142개 테스트 100% 통과 (0 Failure)<br>• 프론트엔드 230개 테스트 100% 통과 (0 Failure)<br>• TypeScript 컴파일 에러 0건 (`pnpm tsc --noEmit`) |

---

## 3. 테스트 실행 지침 및 하드 게이트 (Execution Guidelines & Quality Gates)

1. **자동화 검증 스위트 실행 파이프라인**:
   - 백엔드 pytest 전체 회귀 스위트: `cd backend && ../.venv/bin/pytest -v` (**142개 테스트 전원 Green**)
   - 프론트엔드 vitest 전체 회귀 스위트: `cd frontend && pnpm test:run` (**230개 테스트 전원 Green**)
   - 프론트엔드 정적 타입 검증: `cd frontend && pnpm tsc --noEmit` (**0 에러, Exit Code 0**)
2. **하드 퀄리티 게이트 통과 기준 (Hard Quality Gate Criteria)**:
   - 자동화 테스트 통과율: **100% (Pass Rate = 100%, 372/372건)**
   - UI 날것의 모델 ID 노출: **0건 (Zero Raw Model ID Leaks)**
   - UI 구버전 3.5 모델 노출: **0건 (Zero 3.5 Model Leaks)**
   - Gemini 문자열 노출: **0건 (Zero Gemini Leaks)**
   - 듀얼 셀렉터 동기화 지연: **0ms (Zero Latency Sync)**
   - Blocker 결함 수: **0건**
   - Critical 결함 수: **0건**
   - 회귀 결함: **0건**
   - 가로 스크롤 발생 폭: **0px (Zero Horizontal Scroll)**
3. **최종 보고서 연계**:
   - 본 테스트 계획서에 따른 전수 검증 결과는 `docs/qa-engineer/02_QA_TEST_REPORT.md`에 투명하게 기록하고 최종 출시 승인(RELEASE_APPROVED)을 판정합니다.
