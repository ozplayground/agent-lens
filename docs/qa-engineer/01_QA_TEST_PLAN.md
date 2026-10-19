# [AgentLens] Anti-Gemini 격리, 듀얼 모델 셀렉터 및 전역 UI 워크스페이스 (v0.2.0) 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: 2026-10-19
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v0.2.0 (Anti-Gemini 정책에 따른 Gemini 전면 퇴역, 듀얼 모델 셀렉터 0ms 양방향 동기화, Claude 3-Tier 멀티모델 라우팅, 무손실 모델 전환 타임라인 구분선, Zero 503 복원력 및 Zero-Leak 보안 거버넌스 전수 검증)
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
    - 백엔드: [`docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/backend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.0 APPROVED)
    - 프론트엔드: [`docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md`](file:///Users/wonyoung/workspace/ozplayground/agentlens/docs/frontend-code-reviewer/01_CODE_REVIEW_REPORT.md) (v0.2.0 APPROVED)

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)

### 1.1 테스트 대상 (Test Scope)
기획 요구사항(`01_PRD.md`) 및 상세 기능정의서(`02_FUNCTIONAL_SPECIFICATION.md`, FSD 01~06)에 정의된 v0.2.0 핵심 기능 전수:

1. **Anti-Gemini 격리 및 Gemini 전면 퇴역 검증 (`POL-LLM-005`, `REQ-LLM-002`)**:
   - 백엔드 `_call_gemini` 영구 퇴역 확인 및 라이브 프로바이더 판정에서 Gemini 완전 배제
   - 모델 식별자 살균 함수(`sanitize_model_identifier`)를 통한 비인가 Gemini 문자열 차단 및 Sonnet 자동 대체
   - 프론트엔드 `sanitizeModelTier` 및 `displayModelName`을 통해 UI 전역 Gemini 명칭 0바이트 노출 방어
2. **듀얼 모델 셀렉터 배치 및 0ms 양방향 상태 동기화 (`REQ-UI-008`, `POL-UI-006`)**:
   - 상단 헤더 우측 액션바(`ChatHeader`의 `header-chip`) 및 하단 컴포저 좌하단(`ChatPromptInput`의 `inline-chip`) 동시 마운트
   - `ChatWorkspace`의 단일 진실 공급원(SSOT) 상태를 기반으로 상단/하단 어느 곳에서 모델을 변경해도 **0ms 즉시 양방향 동기화**
   - 상단 헤더는 하향 우측 전개(`top-full right-0`), 하단 컴포저는 상향 좌측 전개(`bottom-full left-0`) 스마트 포지셔닝
3. **Anthropic Claude 3-Tier 멀티모델 선택기 UX (`FUNC-CHAT-013`, `REQ-CLAUDE-001`)**:
   - ⚡ **Haiku 5.5 (`claude-3-5-haiku`)**: 초고속 경량 요약 (~180ms)
   - 🎯 **Sonnet 5.5 (`claude-3-5-sonnet`)**: 기본 고신호 심층 분석 (~642ms, 기본 선택값)
   - 🧠 **Opus 5.5 (`claude-3-5-opus`)**: 복합 아키텍처 및 다중 리포지토리 심층 종합 (~1780ms)
   - WAI-ARIA `role="radiogroup"` / `role="radio"`, 방향키 탐색, `Escape` 닫기 및 포커스 복원
4. **무손실 모델 인라인 전환 및 타임라인 구분선 (`ModelChangeDivider`, Zero Context Erasure)**:
   - 대화 스레드 진행 중 모델 티어 변경 시 기존 대화 컨텍스트(`messages`, `activeSource`, `focusFilters`) 100% 무손실 유지
   - 메시지 타임라인 상에 시맨틱 구분선(`ModelChangeDivider`, `role="separator"`)을 자동 삽입하여 모델 변경 시점과 이전/이후 모델 정보 시각적 안내
5. **스트리밍 중 듀얼 모델 선택기 잠금 (Streaming Lock)**:
   - SSE 토큰 스트리밍 진행 중(`isStreaming === true`) 헤더 및 컴포저 선택기 동시 비활성화(`disabled cursor-not-allowed`) 및 툴팁 고지
   - 스트리밍 도중 모델 변경으로 인한 세션 충돌 및 레이스 컨디션 원천 차단
6. **어시스턴트 메시지 푸터 모델 배지 및 실시간 레이턴시 표출 (`ModelTierBadge`)**:
   - 어시스턴트 응답 완료 시 해당 답변을 생성한 모델 티어 아이콘, 모델명, 실제 응답 지연시간(ms) 및 상대 비용($/$$/$$$) 표출
7. **Claude Sonnet 5.5 데이터 수집 파이프라인 프롬프트 캐싱 메타데이터 (`TokenUsageMeta`)**:
   - 2,500토큰 이상의 프롬프트 캐싱 헤더(`anthropic-beta: prompt-caching-2024-07-31`) 운용
   - `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` 정량 메타데이터 추적
8. **Multi-LLM 장애 복원력 및 Zero 503 Mock Fallback 체인**:
   - Anthropic API 키 부재 및 테스트/CI 환경(`TESTING=True`, `ALLOW_MOCK_FALLBACK=True`)에서 503 에러 없이 `MockLLMProvider`를 통한 안정적인 4단 리포트 스트림 공급
   - 클라이언트 요청 `model_tier` 무손실 보존 및 가상 토큰 메타데이터 공급
9. **Zero-Leak API 키 보안 거버넌스**:
   - 클라이언트 번들 및 브라우저 Network 탭에 Anthropic API 키 0바이트 노출 원천 차단 (FastAPI 백엔드 프록시 완벽 격리)
10. **전역 UI 테마 시스템, 키보드 단축키, 커맨드 팔레트, 4단 리포트 익스포트, 대화 세션 Dual-Layer 영속화, 0px 가로스크롤 방어 전수 회귀**:
   - v0.2.0 기구축 핵심 기능 100% 회귀 방어 및 무결점 상호 운용성 검증

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
| `TC-ANTIGEM-001`| 보안/정합성 | **백엔드 Anti-Gemini 격리 검증** | `GEMINI_API_KEY` 설정 후 백엔드 라이브 프로바이더 조회 및 Q&A 실행 | • `has_live_provider()`에서 Gemini 배제 확인<br>• `_call_gemini` 호출 차단 및 `sanitize_model_identifier`를 통해 Gemini 문자열 인입 시 `claude-3-5-sonnet-latest`로 강제 정규화 |
| `TC-ANTIGEM-002`| UI/보안 | **프론트엔드 Anti-Gemini UI 살균 검증** | 레거시 또는 오염된 모델 식별자(`gemini-2.5-flash` 등) 주입 | • `sanitizeModelTier`에서 경고 로그 출력 후 `sonnet`으로 자동 대체<br>• `ChatMessageItem` 및 UI 전역에서 Gemini 문자열 노출 0건 입증 |
| `TC-DUAL-001`  | E2E 정상 | **듀얼 모델 셀렉터 배치 및 0ms 양방향 동기화** | `/chat` 진입 후 상단 헤더 칩 및 하단 컴포저 칩 확인, 상단에서 Opus 선택 | • 상단 헤더 우측 및 하단 컴포저 좌하단에 모델 칩 동시 마운트<br>• 상단 헤더에서 Opus 선택 시 하단 컴포저 칩도 0ms 즉시 `🧠 Opus 5.5`로 동기화 |
| `TC-DUAL-002`  | UI/UX | **듀얼 셀렉터 드롭다운 전개 방향 최적화** | 상단 헤더 칩 클릭 후 팝오버 위치 확인, 하단 컴포저 칩 클릭 후 위치 확인 | • 상단 헤더 칩: 하향 우측(`top-full right-0 mt-2`)으로 전개되어 헤더 위로 잘리지 않음<br>• 하단 컴포저 칩: 상향 좌측(`bottom-full left-0 mb-2`)으로 전개되어 가상 키보드 영역 침범 방지 |
| `TC-CLAUDE-001`| E2E 정상 | **Claude 3-Tier 멀티모델 선택기 UX 및 기본값 검증** | `/chat` 진입 후 프롬프트 입력창 하단 모델 칩 확인 및 클릭 | • 초기 기본 모델로 `🎯 Sonnet 5.5`가 표시됨<br>• 팝오버 오픈 시 `⚡ Haiku 5.5`, `🎯 Sonnet 5.5`, `🧠 Opus 5.5` 3대 티어의 속도/비용 정보가 라디오그룹(`role="radiogroup"`)으로 노출됨<br>• 키보드 방향키 탐색 및 `Enter`로 모델 변경 가능 |
| `TC-CLAUDE-002`| E2E 정상 | **대화 도중 모델 변경 시 타임라인 구분선 및 무손실 맥락 인계** | 1턴 Sonnet 5.5 대화 후 Opus 5.5로 모델 변경 및 2턴 질의 전송 | • 이전 대화 메시지 및 세션 컨텍스트가 100% 무손실 보존됨 (Zero Context Erasure)<br>• 타임라인 상에 시맨틱 `ModelChangeDivider`(`role="separator"`)가 자동 삽입되어 모델 전환 이력이 명확히 안내됨<br>• 2턴 질의 시 Opus 5.5 기반으로 정상 응답 수신 |
| `TC-CLAUDE-003`| UI/보안 | **답변 스트리밍 중 듀얼 모델 선택기 동시 잠금 (Streaming Lock)** | AI 챗 답변이 실시간 SSE 스트리밍 중인 상태 | • 상단 헤더 및 하단 컴포저의 `ChatModelSelector` 트리거 버튼 동시 비활성화(`disabled cursor-not-allowed`)<br>• 클릭 시 "답변 생성 중에는 모델을 변경할 수 없습니다" 안내 툴팁 노출 및 선택 팝오버 차단 |
| `TC-CLAUDE-004`| E2E 정상 | **어시스턴트 메시지 푸터 모델 배지 및 실시간 레이턴시 표출** | 질의 전송 후 답변 스트리밍 완료 (`event: done`) | • 어시스턴트 말풍선 우하단에 `ModelTierBadge` 렌더링<br>• 사용된 모델명(`Haiku 5.5` / `Sonnet 5.5` / `Opus 5.5`) 및 실시간 응답 지연시간(ms) 표출 확인 |
| `TC-CLAUDE-005`| 데이터/성능 | **Claude Sonnet 5.5 수집 파이프라인 프롬프트 캐싱 메타데이터** | 2,500토큰 초과 시스템 프롬프트 요청 및 스트리밍 완료 | • `anthropic-beta: prompt-caching-2024-07-31` 헤더 전송<br>• `event: done` 페이로드에 `usage` 메타데이터(`input_tokens`, `output_tokens`, `cache_read_input_tokens`) 정상 수화 및 직렬화 보존 |
| `TC-CLAUDE-006`| 장애/복원 | **외부 API 키 부재 시 Zero 503 Mock Fallback 무중단 복원력** | `ANTHROPIC_API_KEY` 미설정 또는 테스트 환경에서 챗 질의 전송 | • 503 다운타임 없이 `MockLLMProvider`로 안전하게 우아한 폴백 수행<br>• 요청된 `model_tier`가 무손실 보존되며 4단 엔지니어링 리포트 마크다운 정상 스트리밍 |
| `TC-CLAUDE-007`| 보안 거버넌스 | **Zero-Leak API 키 보안 거버넌스 검증** | 브라우저 전역 스크립트 번들 및 Network 요청 탭 전수 감사 | • `ANTHROPIC_API_KEY`가 클라이언트 번들, DOM, LocalStorage, SSE 페이로드에 0바이트 노출<br>• 오직 FastAPI 백엔드 프록시(`POST /api/chat/stream`)를 통해서만 서버-투-서버 통신 수행 |
| `TC-THEME-001` | E2E 정상 | **전역 테마 순환 전환 (`t` 키 및 헤더 버튼)** | 초기 라이트 모드 상태에서 헤더 토글 클릭 또는 단축키 `t` 3회 입력 | • `Light` $\rightarrow$ `Dark` $\rightarrow$ `System` 순으로 정확히 순환 전환됨<br>• `<html>` 태그에 `dark` 클래스가 동적으로 추가/제거됨<br>• `localStorage.getItem('theme')`에 선택 모드가 즉각 영속화됨 |
| `TC-THEME-002` | E2E 정상 | **Zero-Flicker SSR 하이드레이션 검증** | `theme=dark`가 저장된 브라우저에서 페이지 새로고침(F5) | • HTML 파싱 단계에서 인라인 스크립트가 `class="dark"`를 부여함<br>• 하얀 화면 번쩍임(FOUC) 발생 0건 및 콘솔 하이드레이션 불일치 경고 0건 |
| `TC-THEME-003` | 엣지/시스템 | **OS 시스템 다크모드 실시간 동기화** | 테마 설정이 `system`인 상태에서 OS 테마를 라이트 $\rightarrow$ 다크로 전환 | • 새로고침 없이 즉시 `<html>` 태그가 `dark` 모드로 자동 전환됨<br>• WCAG 2.1 AA 기준 텍스트 명도 대비(4.5:1 이상) 유지 |
| `TC-HOTKEY-001`| E2E 정상 | **뉴스 피드 카드 `j`/`k` 키보드 내비게이션** | 메인 피드(`/`) 화면 진입 후 `j`, `k` 키 연속 입력 | • `j` 입력 시 다음 카드로 시각적 인디고 포커스 링 이동<br>• `k` 입력 시 이전 카드로 포커스 이동<br>• 마지막/첫 카드에서 경계 초과 없이 안전 고정 |
| `TC-HOTKEY-002`| E2E 정상 | **포커스 카드 원클릭 액션 (`c` 핸드오버 & `b` 북마크)** | 특정 카드에 포커스 위치 후 `b` 입력 후 `c` 입력 | • `b` 입력 즉시 해당 카드 북마크 상태 토글 및 스토리지 동기화<br>• `c` 입력 즉시 해당 기사 컨텍스트가 부착된 전용 AI 챗(`/chat?source_id=...`)으로 매끄럽게 핸드오버 |
| `TC-HOTKEY-003`| 보안/접근성 | **텍스트 입력 필드 이벤트 격리 (Input Isolation Rule)** | 피드 검색창(`<input>`) 또는 챗 프롬프트창(`<textarea>`)에 포커스 후 `j`, `k`, `t`, `c`, `b` 타이핑 | • 단축키가 실행되지 않고 입력 필드에 해당 알파벳이 정상 타이핑됨<br>• 한글 조합 중(`e.isComposing === true`) 키 입력 시 단축키 오작동 0건 |
| `TC-PALETTE-001`| E2E 정상 | **전역 커맨드 팔레트 호출 (`Cmd+K` / `Ctrl+K`)** | 애플리케이션 어느 화면에서든 `Cmd+K` (macOS) 또는 `Ctrl+K` (Windows) 입력 | • 화면 중앙에 `CommandPalette` 모달 팝업 및 검색창 자동 포커스 진입<br>• 배경 딤 오버레이 및 배경 본문 스크롤 락(`overflow: hidden`) 적용 |
| `TC-PALETTE-002`| E2E 정상 | **커맨드 팔레트 검색, 키보드 탐색 및 실행** | 커맨드 팔레트 오픈 후 `"테마"` 검색, `ArrowDown` 1회 후 `Enter` 입력 | • 검색어 실시간 필터링 반영<br>• `ArrowDown`/`ArrowUp`으로 항목 하이라이트 순환 이동<br>• `Enter` 입력 즉시 테마 전환 액션 실행 후 팔레트 자동 닫힘 |
| `TC-PALETTE-003`| 접근성 | **커맨드 팔레트 Escape 닫기 및 포커스 복원** | 커맨드 팔레트 오픈 상태에서 `Escape` 키 입력 | • 팔레트 모달이 즉시 닫힘<br>• 팔레트를 열기 직전에 포커스되어 있던 원래 DOM 요소로 포커스 100% 복원 |
| `TC-EXPORT-001`| E2E 정상 | **4단 리포트 마크다운 클립보드 원클릭 복사** | AI 챗 답변 생성 완료 후 `ExportToolbar`의 [마크다운 복사] 버튼 클릭 | • 클립보드 API를 통해 시니어 스태프 4단 리포트 원문이 복사됨<br>• "복사 완료!" 시각적 피드백 토스트가 2초간 노출됨 |
| `TC-EXPORT-002`| E2E 정상 | **특수문자 살균 처리된 `.md` 리포트 파일 다운로드** | 질문: `"Claude 3.5: Sonnet vs Opus?"` 질의 후 [다운로드] 버튼 클릭 | • 파일명 내 특수문자가 언더스코어로 살균(`agentlens_report_Claude_3.5_Sonnet_vs_Opus.md`)되어 안전 다운로드<br>• Path Traversal 위험 0건 |
| `TC-EXPORT-003`| UI/상태 | **답변 스트리밍 중 익스포트 툴바 비활성화 가드** | AI 챗 답변 토큰이 실시간 수신(스트리밍) 중인 상태 | • 복사/다운로드/노션 버튼이 비활성화(`disabled cursor-not-allowed opacity-50`) 상태 유지<br>• `event: done` 수신 즉시 정상 활성화 전환 |
| `TC-CHAT-001`  | E2E 정상 | **글로벌 자율 지식 검색 챗 질의 및 SSE 스트리밍** | `/chat` 진입 후 질문: `"FastMCP 아키텍처 핵심 요약"` 전송 | • `POST /api/chat/stream` 호출 후 SSE 연결 수립<br>• `status` ➔ `sources` ➔ `token` ➔ `done` 이벤트 순차 수신 및 실시간 타이핑 렌더링<br>• 4단 구조화 섹션(핵심 원리, 기능 구현, 차별점, 트레이드오프) 완비 |
| `TC-CHAT-002`  | E2E 정상 | **특정 기사 컨텍스트 고정 스코프 챗 질의** | 특정 기사(ID: 101) 카드에서 [Ask AI]로 진입 후 Scoped 질의 전송 | • 상단에 `[Scoped: 기사제목]` 활성 기사 칩 마운트<br>• 기사 본문 스크래핑 캐시(L1/L2)를 참조하여 대상 기사 특화 답변 스트리밍<br>• 인라인 인용 뱃지(`CitationBadge`) 클릭 시 기사 프리뷰 팝오버 노출 |
| `TC-SESS-001`  | E2E 정상 | **Clean Slate 기본 신규 세션 진입 원칙** | `/chat` URL 직접 진입 또는 사이드바 `+ 새 대화` 버튼 클릭 | • 과거 대화를 임의로 자동 로드하지 않음<br>• 신규 세션 UUID(`crypto.randomUUID()`) 발급 및 빈 상태(Empty State) 웰컴 뷰 렌더링 |
| `TC-SESS-002`  | E2E 정상 | **Dual-Layer 영속화 & 첫 턴 30자 자동 타이틀링** | 신규 세션에서 질문 전송 후 스트리밍 완료 (`event: done`) | • 첫 턴 사용자 질문의 마크다운/특수문자 살균 후 앞 30자로 세션 제목 자동 확정<br>• 브라우저 `localStorage`(L1) 및 SQLite `chat_sessions`/`chat_messages`(L2)에 원자적 동기 커밋 |
| `TC-SESS-003`  | E2E 정상 | **4대 컨텍스트 완전 복원 및 멀티턴 대화 지속** | 과거 세션 카드 클릭 후 후속 질의 전송 | • 4대 컨텍스트(`messages`, `scopeMode`, `activeSource`, `focusFilters`) 100% 수화 완료<br>• 후속 질의 시 슬라이딩 윈도우(최근 최대 10턴/20개 메시지)가 서버로 전달되어 맥락 연속성 유지 |
| `TC-SESS-004`  | 데이터 무결성 | **원자적 세션 인라인 삭제 & SQLite 외래키 CASCADE** | 세션 카드의 휴지통 아이콘 클릭 후 `DeleteConfirmPopover`에서 [삭제] 확정 | • `DeleteConfirmPopover` 오픈 시 [취소] 버튼 자동 포커스<br>• 삭제 확정 시 SQLite `ON DELETE CASCADE`로 연관 자식 메시지 일괄 소거(고아 레코드 0건)<br>• 활성 세션 삭제 시 신규 클린 세션으로 안전 리셋 |
| `TC-SESS-005`  | 성능/용량 | **FIFO 30개 보존 정책 (Eviction Policy)** | 세션이 30개 존재하는 상태에서 31번째 세션 생성 | • 총 세션 수가 30개로 엄격 유지됨<br>• `updated_at`이 가장 오래된 세션 1건이 DB 및 `localStorage`에서 자동 영구 소거됨 |
| `TC-RESP-001`  | 반응형/뷰포트 | **0px 가로스크롤 방어 (전체 뷰포트 375px/768px/1440px)** | 모바일(375px), 태블릿(768px), 데스크톱(1440px) 환경에서 긴 텍스트/표/코드블록 열람 | • `document.documentElement.scrollWidth === document.documentElement.clientWidth` (가로스크롤바 0px)<br>• 긴 URL 및 한국어/영문 복합 텍스트 `[overflow-wrap: anywhere]` 자동 줄바꿈<br>• 코드 블록 및 테이블만 국소 가로 스크롤 허용 |
| `TC-RESP-002`  | 반응형/UI | **모바일 슬라이드 드로어 및 스크롤 락** | 375px 모바일 뷰포트에서 헤더 메뉴 탭하여 `ChatHistoryDrawer` 오픈 | • 좌측 슬라이드오버 드로어 부드럽게 노출 및 백드롭 오버레이 렌더링<br>• 모바일 바디 스크롤 비활성화(`document.body.style.overflow = 'hidden'`)<br>• 세션 카드 선택 또는 백드롭 탭 시 드로어 자동 닫힘 |
| `TC-SEC-001`   | 보안/유효성 | **유효하지 않은 UUID 및 세션 미존재 방어** | `GET /api/chat/sessions/invalid-uuid-123` 또는 미존재 UUID 호출 | • 비정상 UUID: 400 Bad Request (`ERR_SESSION_INVALID_UUID`) 반환<br>• 미존재 UUID: 404 Not Found (`ERR_SESSION_NOT_FOUND`) 반환 및 클라이언트 안전 리셋 |
| `TC-EDGE-001`  | 엣지/네트워크 | **스트리밍 중 세션 전환 및 네트워크 단절 대응** | 답변 수신 중 타 세션 클릭 또는 오프라인 전환 | • 진행 중인 SSE 요청 즉시 `AbortController.abort()` 중단<br>• L1 `localStorage` 캐시를 활용하여 오프라인 상태에서도 과거 대화 0ms 즉각 열람 |
| `TC-REG-001`   | 통합 회귀 | **전체 백엔드 API & 프론트엔드 컴포넌트 369개 자동화 회귀** | pytest 141건 및 vitest 228건 전체 스위트 실행 | • 백엔드 141개 테스트 100% 통과 (0 Failure)<br>• 프론트엔드 228개 테스트 100% 통과 (0 Failure)<br>• TypeScript 컴파일 에러 0건 (`pnpm tsc --noEmit`) |

---

## 3. 테스트 실행 지침 및 하드 게이트 (Execution Guidelines & Quality Gates)

1. **자동화 검증 스위트 실행 파이프라인**:
   - 백엔드 pytest 전체 회귀 스위트: `.venv/bin/pytest backend/tests/ -v` (141개 테스트)
   - 프론트엔드 vitest 전체 회귀 스위트: `pnpm test` in `frontend/` (228개 테스트)
   - 프론트엔드 정적 타입 검증: `pnpm tsc --noEmit` in `frontend/` (0 에러)
2. **하드 퀄리티 게이트 통과 기준 (Hard Quality Gate Criteria)**:
   - 자동화 테스트 통과율: **100% (Pass Rate = 100%, 369/369건)**
   - Gemini 문자열 노출: **0건 (Zero Gemini Leaks)**
   - 듀얼 셀렉터 동기화 지연: **0ms (Zero Latency Sync)**
   - Blocker 결함 수: **0건**
   - Critical 결함 수: **0건**
   - 회귀 결함: **0건**
   - 가로 스크롤 발생 폭: **0px (Zero Horizontal Scroll)**
3. **최종 보고서 연계**:
   - 본 테스트 계획서에 따른 전수 검증 결과는 `docs/qa-engineer/02_QA_TEST_REPORT.md`에 투명하게 기록하고 최종 출시 승인(RELEASE_APPROVED)을 판정합니다.
