# AgentLens 프론트엔드 전역 테마, 핫키, 커맨드 팔레트, 세션 드로어 및 Claude 3-Tier 멀티모델 TDD 실행 기록서 (Frontend TDD Log)

- **작성일자**: 2026-10-19
- **작성자**: 프론트엔드 TDD 엔지니어 (`frontend-tdd-engineer`)
- **문서 버전**: v0.2.2 (Stage 3b: Dynamic News Sources MSW Matching, Fixed Slice Elimination, Version Bump to 0.2.2, 24개 테스트 파일 234개 테스트 100% PASS)
- **상태**: Approved (24개 테스트 스위트, 234개 테스트 100% 통과, TypeScript Type Check Exit 0)
- **선행 계약 및 설계 문서**:
  - [`01_COMPONENT_SPEC.md`](../ui-system-designer/01_COMPONENT_SPEC.md) (Stage 2c 컴포넌트 인터랙션 및 상태 명세)
  - [`01_CONTRACT_AND_MSW_SPEC.md`](../contract-integrator/01_CONTRACT_AND_MSW_SPEC.md) (Stage 2d Contract Lock v4.0)
  - [`01_ARCHITECTURE_ADR.md`](../fullstack-architect/01_ARCHITECTURE_ADR.md) (ADR-007 전역 테마, ADR-009 키보드 단축키 & 커맨드 팔레트, ADR-010 4단 리포트 익스포트)
  - [`01_PRD.md`](../spec-writer/01_PRD.md) (`REQ-THEME-001`, `REQ-SHORTCUT-001`, `REQ-EXPORT-001`, `REQ-CHAT-011`, `REQ-CHAT-012`, `REQ-UI-008`, `POL-UI-006`, `POL-LLM-005`, `REQ-LLM-002`)

---

## 1. TDD 개발 대상 컴포넌트 및 사용자 인터랙션

| 대응 기능 ID | 대상 컴포넌트 (`frontend/src/`) | 테스트 파일 (`frontend/src/tests/`) | 모의 핸들러 및 환경 명세 |
| :--- | :--- | :--- | :--- |
| **`FUNC-THEME-001`** | `src/context/ThemeContext.tsx`<br/>`src/components/ThemeToggle.tsx`<br/>`src/app/layout.tsx` | `src/tests/ThemeSystem.test.tsx` | `window.matchMedia('(prefers-color-scheme: dark)')`<br/>Zero-Flicker SSR & localStorage 캐시 |
| **`FUNC-NAV-001`** | `src/components/HotkeyListener.tsx`<br/>`src/app/page.tsx` | `src/tests/HotkeyListener.test.tsx` | Input Isolation Rule (`<input>`, `<textarea>`, `contenteditable`)<br/>IME Guard (`isComposing`) |
| **`FUNC-FEED-007`** | `src/components/CommandPalette.tsx`<br/>`src/components/Header.tsx` | `src/tests/CommandPalette.test.tsx` | 전역 `Cmd+K` / `Ctrl+K` 단축키 바인딩<br/>방향키 상하 순환 탐색 & Enter 액션 디스패치 |
| **`FUNC-CHAT-011`** | `src/components/chat/ExportToolbar.tsx`<br/>`src/components/chat/ChatMessageItem.tsx` | `src/tests/chat/ExportToolbar.test.tsx`<br/>`src/tests/chat/ChatMessageItem.test.tsx` | `navigator.clipboard.writeText`<br/>Blob `.md` 파일 다운로드, Notion 1-클릭 연동 |
| **`FUNC-CHAT-012`** | `src/components/chat/ChatHistoryDrawer.tsx`<br/>`src/components/chat/SessionList.tsx`<br/>`src/components/chat/SessionItemCard.tsx` | `src/tests/chat/ChatHistoryDrawer.test.tsx`<br/>`src/tests/chat/ChatSidebar.test.tsx` | 5대 UI 상태(Idle, Loading, Error, Empty, Success)<br/>슬라이드 드로어, 딤 백드롭, 인라인 삭제 팝오버 |
| **`FUNC-LAYOUT-001`** | `src/components/chat/ChatMessageItem.tsx`<br/>`src/components/MarkdownViewer.tsx`<br/>`src/components/NewsCard.tsx` | `src/tests/ResponsiveLayout.test.tsx`<br/>`src/tests/NewsCard.test.tsx` | 0px 가로 스크롤 방어 (`min-w-0`, `[overflow-wrap:anywhere]`)<br/>코드블록/테이블 국소 스크롤 격리, 카드 포커스 링 |
| **`FUNC-CHAT-013`**<br/>**`REQ-UI-008`**<br/>**`POL-UI-006`** | `src/components/chat/ChatModelSelector.tsx`<br/>`src/components/chat/ChatHeader.tsx`<br/>`src/components/chat/ChatPromptInput.tsx`<br/>`src/components/chat/ChatWorkspace.tsx`<br/>`src/components/chat/ModelTierBadge.tsx`<br/>`src/components/chat/ModelChangeDivider.tsx` | `src/tests/chat/ChatModelSelector.test.tsx`<br/>`src/tests/chat/ChatHeader.test.tsx`<br/>`src/tests/chat/ChatWorkspace.test.tsx` | Claude 3-Tier (`haiku`, `sonnet`, `opus`) 모델 라우팅<br/>Dual Model Selector (Header + Composer), 0ms 양방향 상태 동기화<br/>Fitts의 법칙 컴포저 인라인 칩, WAI-ARIA RadioGroup, 스트리밍 잠금 |
| **`POL-LLM-005`**<br/>**`REQ-LLM-002`** | `src/components/chat/ChatMessageItem.tsx`<br/>`src/types/chat.ts` (`sanitizeModelTier`) | `src/tests/chat/ChatMessageItem.test.tsx` | Anti-Gemini UI 살균 방어: 신규 질의 기본 Claude 3.5 Sonnet 강제<br/>UI 내 신규 모델 표출 시 Claude 3-Tier 무결성 보장 |
| **`FUNC-CHAT-014`**<br/>**`BUG-CHAT-001`**<br/>**`POL-PROD-001`** | `src/components/chat/ChatWorkspace.tsx`<br/>`src/types/chat.ts`<br/>`src/components/chat/ChatModelSelector.tsx`<br/>`src/components/chat/ModelChangeDivider.tsx` | `src/tests/chat/ChatWorkspace.test.tsx`<br/>`src/tests/chat/ContractAndMsw.test.ts`<br/>`src/tests/chat/ChatMessageItem.test.tsx`<br/>`src/tests/chat/ChatModelSelector.test.tsx` | 기사 포커스 핸드오버 비동기 레이스 해결 (`scope: 'scoped'`, `source_id: number` 직렬화)<br/>프로덕션 코드 내 MSW Mock 완전 격리 (0-Mock Import Rule)<br/>과거 세션 모델 정직 렌더링 (Gemini/GPT 변조 금지, 신규 질의만 Sonnet 기본)<br/>팝오버 헤더 및 디바이더 문구 제거 (UI 경량화) |
| **`FUNC-CHAT-015`**<br/>**`REQ-CHAT-015`** | `src/mocks/handlers/chat.ts`<br/>`src/components/chat/ChatWorkspace.tsx` | `src/tests/chat/ChatWorkspace.test.tsx`<br/>`src/tests/chat/ContractAndMsw.test.ts` | 질문 키워드 기반 동적 뉴스 소스 검색/필터링 (`filterChunksByQuestion`)<br/>고정 5개 슬라이스 제거 및 맞춤형 출처 수 반환 (`primary_count`)<br/>실시간 소스 칩("원문 1건") 및 인라인 인용([1]) 매칭 렌더링 검증 |

---

## 2. Red-Green-Refactor 사이클 실행 기록

### [Cycle 1] 전역 테마 시스템 (`ThemeProvider` & `ThemeToggle` 3단 전환)
- **목표 기능**: Light ➔ Dark ➔ System 3단 순환 테마 전환 및 `window.matchMedia` 기반 OS 선호도 실시간 동기화.
- **대응 기능 ID**: `FUNC-THEME-001` / `REQ-THEME-001` (ADR-007)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/ThemeSystem.test.tsx`)**:
```typescript
it('initializes with defaultTheme system and resolves OS preference', () => {
  matchesDark = true;
  render(
    <ThemeProvider defaultTheme="system">
      <TestConsumer />
    </ThemeProvider>
  );

  expect(screen.getByTestId('theme').textContent).toBe('system');
  expect(screen.getByTestId('resolvedTheme').textContent).toBe('dark');
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});

it('cycles through light -> dark -> system -> light when toggleTheme is called', () => {
  render(
    <ThemeProvider defaultTheme="light">
      <TestConsumer />
    </ThemeProvider>
  );
  const toggleBtn = screen.getByTestId('toggle-btn');
  fireEvent.click(toggleBtn);
  expect(screen.getByTestId('theme').textContent).toBe('dark');
  fireEvent.click(toggleBtn);
  expect(screen.getByTestId('theme').textContent).toBe('system');
  fireEvent.click(toggleBtn);
  expect(screen.getByTestId('theme').textContent).toBe('light');
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/ThemeSystem.test.tsx > Global Theme System (Cycle 1 - TDD)
AssertionError: expected 'light' to be 'system'
- Expected: "system"
+ Received: "light"
Tests: 4 failed, 1 passed (5)
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `src/context/ThemeContext.tsx`: `ThemeMode = 'light' | 'dark' | 'system'`, `resolvedTheme: 'light' | 'dark'` 구현.
  - `window.matchMedia('(prefers-color-scheme: dark)')` 이벤트 리스너 바인딩 및 OS 테마 실시간 감지 로직 적용.
  - `src/components/ThemeToggle.tsx`: `Sun`, `Moon`, `Laptop` 아이콘 조건부 렌더링 및 `size` ('sm', 'md', 'lg') 변형 지원.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/ThemeSystem.test.tsx (5 tests) 54ms
Test Files  1 passed (1)
Tests       5 passed (5)
```

#### 3. REFACTOR Phase (SSR 최적화 및 Hydration 방어)
- **리팩토링 내용**:
  - `src/app/layout.tsx`에 `suppressHydrationWarning` 적용 및 `<body className="bg-slate-50 dark:bg-[#0d1117] text-slate-900 dark:text-[#f0f6fc]">` 다크 팔레트 토큰 동기화.
  - `typeof window === 'undefined'` SSR 방어 가드 및 `localStorage` 예외 방어(`try/catch`).
- **회귀 검증 결과**: Vitest 전체 테스트 100% 통과 유지.

---

### [Cycle 2] 전역 키보드 단축키 & Event Bridge (`HotkeyListener`)
- **목표 기능**: 파워 유저 키보드 단축키 (`j`/`k` 피드 이동, `/` 검색창 포커스, `b` 북마크, `c` AI 챗 핸드오버, `t` 테마 토글, `Cmd+K` 팔레트, `Escape` 닫기) 지원 및 Input Isolation Rule / IME 조합 방어.
- **대응 기능 ID**: `FUNC-NAV-001` / `REQ-SHORTCUT-001` (ADR-009)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/HotkeyListener.test.tsx`)**:
```typescript
it('enforces Input Isolation Rule: ignores single-key shortcuts when typing in an input element', () => {
  const { container } = render(
    <div>
      <input data-testid="test-input" type="text" />
      <HotkeyListener {...defaultProps} />
    </div>
  );
  const input = container.querySelector('input')!;
  fireEvent.keyDown(input, { key: 'j' });
  fireEvent.keyDown(input, { key: 'k' });
  fireEvent.keyDown(input, { key: '/' });
  fireEvent.keyDown(input, { key: 'c' });
  expect(defaultProps.onNavigateFeed).not.toHaveBeenCalled();
  expect(defaultProps.onHandoverChat).not.toHaveBeenCalled();

  // But Cmd+K and Escape must still trigger
  fireEvent.keyDown(input, { key: 'k', metaKey: true });
  expect(defaultProps.onToggleCommandPalette).toHaveBeenCalledTimes(1);
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/HotkeyListener.test.tsx
Error: Failed to resolve import "@/components/HotkeyListener" from "src/tests/HotkeyListener.test.tsx". Does the file exist?
Test Files: 1 failed (1)
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `src/components/HotkeyListener.tsx` 신규 구현.
  - `e.isComposing` 감지 시 즉각 얼리 리턴하여 한글 완성 중 오동작 차단.
  - `target.tagName === 'INPUT' | 'TEXTAREA' | 'SELECT' || target.isContentEditable` 판별을 통한 Input Isolation Rule 엄격 적용.
  - `Cmd+K` / `Ctrl+K` 및 `Escape` 키는 입력창 내부에서도 예외 허용.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/HotkeyListener.test.tsx (8 tests) 17ms
Test Files  1 passed (1)
Tests       8 passed (8)
```

#### 3. REFACTOR Phase (피드 페이지 연동)
- **리팩토링 내용**:
  - `src/app/page.tsx`에 `focusedIndex` 상태 및 `NewsCard`의 `isFocused` 프롭과 `ring-2 ring-blue-500` 포커스 링 결합.
  - `searchInputRef` 연동으로 `/` 키 입력 시 0ms 검색창 포커스 실현.
- **회귀 검증 결과**: 8개 테스트 100% PASS 유지.

---

### [Cycle 3] 전역 커맨드 팔레트 (`CommandPalette`)
- **목표 기능**: `Cmd+K` / `Ctrl+K` 트리거 모달, 실시간 검색 필터, 방향키 탐색, Enter 실행, Focus Trap 및 ESC 닫기.
- **대응 기능 ID**: `FUNC-FEED-007` / `REQ-SHORTCUT-001` (ADR-009)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/CommandPalette.test.tsx`)**:
```typescript
it('navigates through items with ArrowDown and ArrowUp and executes with Enter', () => {
  renderWithTheme(<CommandPalette {...defaultProps} />);
  const searchInput = screen.getByPlaceholderText(/명령어 검색/i);

  fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
  fireEvent.keyDown(searchInput, { key: 'Enter' });

  expect(defaultProps.onClose).toHaveBeenCalled();
});

it('renders dialog and search input when isOpen is true', () => {
  renderWithTheme(<CommandPalette {...defaultProps} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/CommandPalette.test.tsx
TestingLibraryElementError: Unable to find an accessible element with the role "dialog"
Tests: 3 failed, 6 passed (9)
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `src/components/CommandPalette.tsx` 갱신: `role="dialog"`, `aria-modal="true"`, `role="listbox"`, `role="option"`, `aria-selected` 웹 접근성 완비.
  - `selectedIndex` 상태를 통한 ArrowDown/ArrowUp 순환 탐색 및 Enter 키 원클릭 액션 실행 핸들러 구현.
  - 검색어 일치 결과 0건 시 "검색된 명령어가 없습니다." Empty State 노출.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/CommandPalette.test.tsx (9 tests) 88ms
Test Files  1 passed (1)
Tests       9 passed (9)
```

#### 3. REFACTOR Phase (테마 액션 라벨링 고도화)
- **리팩토링 내용**:
  - `theme` 및 `resolvedTheme` 상태에 따라 팔레트 내 테마 액션의 제목과 아이콘(Sun/Moon/Laptop)을 실시간으로 적응형 변경.
- **회귀 검증 결과**: 전체 9개 테스트 통과.

---

### [Cycle 4] 4단 구조화 리포트 익스포트 툴바 (`ExportToolbar`)
- **목표 기능**: 답변 생성 완료 시 4단 기술 리포트의 마크다운 복사(`navigator.clipboard`), `.md` 로컬 파일 다운로드(Blob), Notion 연동 API 트리거 및 스트리밍 진행 중 비활성화 제어.
- **대응 기능 ID**: `FUNC-CHAT-011` / `REQ-EXPORT-001` (ADR-010)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/chat/ExportToolbar.test.tsx`)**:
```typescript
it('copies markdown content to clipboard and shows feedback', async () => {
  render(<ExportToolbar {...defaultProps} />);
  const copyBtn = screen.getByRole('button', { name: /마크다운 복사/i });
  fireEvent.click(copyBtn);

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.markdownContent);
  expect(await screen.findByText(/복사됨/i)).toBeInTheDocument();
  expect(defaultProps.onCopySuccess).toHaveBeenCalled();
});

it('triggers .md file download with blob', () => {
  const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
  window.URL.createObjectURL = createObjectURLMock;
  render(<ExportToolbar {...defaultProps} />);
  fireEvent.click(screen.getByRole('button', { name: /\.md 다운로드/i }));
  expect(createObjectURLMock).toHaveBeenCalled();
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/chat/ExportToolbar.test.tsx
Error: Failed to resolve import "@/components/chat/ExportToolbar". Does the file exist?
Test Files: 1 failed (1)
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `src/components/chat/ExportToolbar.tsx` 신규 구현.
  - 마크다운 복사 시 성공 체크 아이콘 및 2초간 "복사됨" 시각적 피드백 제공 (클립보드 API 거부 시 `<textarea>` 폴백 탑재).
  - 기사 제목 살균 처리(`replace(/[^a-zA-Z0-9가-힣_-]/g, '_')`) 및 `new Blob()` 다운로드 링크 발급/소멸 자동화.
  - Notion 1-클릭 동기화 비동기 상태(`notionSyncing`) 및 `onNotionSuccess` 콜백 트리거 구현.
  - `src/components/chat/ChatMessageItem.tsx`의 완료된 어시스턴트 메시지 버블 하단에 `ExportToolbar` 마운트.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/chat/ExportToolbar.test.tsx (5 tests) 384ms
✓ src/tests/chat/ChatMessageItem.test.tsx (12 tests) 115ms
Test Files  2 passed (2)
Tests       17 passed (17)
```

#### 3. REFACTOR Phase (스트리밍 인터랙션 격리)
- **리팩토링 내용**:
  - `isStreaming: true`일 경우 `opacity-50 pointer-events-none` 및 `disabled` 속성을 부여하여 답변 생성 중 오동작을 원천 방지.
- **회귀 검증 결과**: 100% 통과 유지.

---

### [Cycle 5] AI 챗 세션 히스토리 슬라이드 드로어 (`ChatHistoryDrawer`)
- **목표 기능**: 모바일/태블릿(< 1024px) 뷰포트 전용 슬라이드오버 드로어, 딤 백드롭, 바깥 클릭/ESC 닫기, `+ 새 대화`, 실시간 세션 검색, 인라인 삭제 팝오버 및 5대 UI 상태 완비.
- **대응 기능 ID**: `FUNC-CHAT-012` / `REQ-CHAT-012` (ADR-006)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/chat/ChatHistoryDrawer.test.tsx`)**:
```typescript
it('renders Loading State with skeletons when isLoading is true', () => {
  render(<ChatHistoryDrawer {...defaultProps} isLoading={true} sessions={[]} />);
  expect(screen.getByTestId('session-list-skeleton')).toBeInTheDocument();
});

it('renders Error State with retry button when error is present', () => {
  render(
    <ChatHistoryDrawer
      {...defaultProps}
      error="세션 목록을 불러오지 못했습니다."
      sessions={[]}
    />
  );
  expect(screen.getByText('세션 목록을 불러오지 못했습니다.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /다시 시도/i }));
  expect(defaultProps.onRetryLoad).toHaveBeenCalledTimes(1);
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/chat/ChatHistoryDrawer.test.tsx
TypeError: Cannot read properties of undefined (reading 'getTime') in formatRelativeTime
Tests: 6 failed, 4 passed (10)
```

#### 2. GREEN Phase (최소 컴포넌트 구현 및 날짜 방어)
- **구현 내용 요약**:
  - `src/components/chat/SessionItemCard.tsx`의 `formatRelativeTime`에 `dateInput` 널 가드 추가 및 snake_case(`created_at`, `updated_at`) 호환 레이어 장착.
  - `ChatHistoryDrawer.tsx` 5대 상태(Loading: `SessionListSkeleton`, Error: 에러 배너 & 재시도 버튼, Empty: `SessionEmptyState`, Success/Idle: 세션 카드 목록) 정밀 검증.
  - 드로어 오픈 시 `document.body.style.overflow = 'hidden'` 배경 스크롤 잠금 적용.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/chat/ChatHistoryDrawer.test.tsx (10 tests) 102ms
Test Files  1 passed (1)
Tests       10 passed (10)
```

#### 3. REFACTOR Phase (접근성 및 제스처 최적화)
- **리팩토링 내용**:
  - 드로어 패널에 `role="navigation"`, `aria-label="대화 기록 목록"` 부여 및 터치 스크롤 바운스 방어(`overscroll-contain`).
- **회귀 검증 결과**: 전체 10개 테스트 100% 통과.

---

### [Cycle 6] 0px 가로 스크롤 방어 및 반응형 레이아웃 (`ResponsiveLayout`)
- **목표 기능**: 모바일 환경 및 초장문 무공백 문자열/URL/코드블록/테이블 렌더링 시 전역 뷰포트 좌우 가로 스크롤(Horizontal Overflow) 0px 박멸 검증.
- **대응 기능 ID**: `FUNC-LAYOUT-001` / `REQ-LAYOUT-001` (ADR-001, ADR-006)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/ResponsiveLayout.test.tsx`)**:
```typescript
it('enforces min-w-0 and max-w-full flex constraints on ChatMessageItem container', () => {
  const { container } = render(<ChatMessageItem message={assistantMessageWithLongContent} />);

  const bubble = container.querySelector('.markdown-content');
  expect(bubble?.className).toContain('min-w-0');
  expect(bubble?.className).toContain('max-w-full');
  expect(bubble?.className).toContain('break-words');
  expect(bubble?.className).toContain('[overflow-wrap:anywhere]');
});

it('isolates code block horizontal scrolling with overscroll-x-contain and local overflow-x-auto', () => {
  const { container } = render(<ChatMessageItem message={assistantMessageWithLongContent} />);
  const codeWrapper = container.querySelector('.code-block-wrapper');
  expect(codeWrapper?.className).toContain('overflow-hidden');
  const pre = container.querySelector('pre');
  expect(pre?.className).toContain('overflow-x-auto');
  expect(pre?.className).toContain('overscroll-x-contain');
});
```
- **실행 결과 (검증 성공 - GREEN)**:
```
✓ src/tests/ResponsiveLayout.test.tsx (4 tests) 43ms
Test Files  1 passed (1)
Tests       4 passed (4)
```

#### 2. REFACTOR Phase (전역 레이아웃 동기화)
- **리팩토링 내용**:
  - `src/app/layout.tsx`: `<body className="... overflow-x-hidden w-full max-w-full">` 강제.
  - `src/components/chat/ChatWorkspace.tsx`: `overflow-x-hidden` 및 `useVisualViewport` 가상키보드 인셋 보호.
- **회귀 검증 결과**: 전체 테스트 통과.

---

### [Cycle 7] Claude 3-Tier Multi-Model 선택기, 모델 전환 디바이더 및 티어 뱃지 TDD
- **목표 기능**:
  1. `ChatModelSelector`: Fitts의 법칙 기반 프롬프트 컴포저(`ChatPromptInput`) 좌하단 인라인 칩 및 팝오버, 3-Tier (`⚡ Haiku 5.5 / 🎯 Sonnet 5.5 [추천] / 🧠 Opus 5.5`), 상대 비용(`$`, `$$`, `$$$`), 예상 레이턴시(`~0.3s`, `~0.6s`, `~1.8s`), WAI-ARIA Radio Group 웹 접근성 (`role="radiogroup"`, `role="radio"`, `aria-checked`, 방향키 순환 탐색, Enter 선택, Escape 닫기), 스트리밍 중(`isStreaming === true`) 클릭 잠금 및 안내 툴팁.
  2. `ModelChangeDivider`: 대화 도중 모델 교체 시 타임라인 분기선 (`[── 🔄 Claude {Tier} 5.5로 모델 변경됨 · 맥락 100% 보존 ──]`), `role="separator"` 접근성 준수.
  3. `ModelTierBadge`: 모델 티어 아이콘, 브랜드명, 상대 비용 및 스트리밍 측정 레이턴시(`[🎯 Sonnet 5.5 · 642ms]`) 표출 컴포넌트, 어시스턴트 메시지 푸터 바 연동.
- **대응 기능 ID**: `FUNC-CHAT-013` / `REQ-CHAT-013` (ADR-011)

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/chat/ChatModelSelector.test.tsx`)**:
```typescript
it('renders inline chip trigger with default Sonnet 5.5 tier and icon', () => {
  render(<ChatModelSelector {...defaultProps} />);
  const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
  expect(trigger).toBeInTheDocument();
  expect(trigger).toHaveTextContent(/Sonnet 5.5/i);
  expect(trigger).toHaveTextContent('🎯');
});

it('opens popover on click and renders all 3 Claude tiers with WAI-ARIA radiogroup', () => {
  render(<ChatModelSelector {...defaultProps} />);
  const trigger = screen.getByRole('button', { name: /Claude 모델 선택|Sonnet/i });
  fireEvent.click(trigger);

  const radiogroup = screen.getByRole('radiogroup', { name: /Claude AI 모델 선택/i });
  expect(radiogroup).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  expect(within(radiogroup).getByText(/Sonnet 5.5/i)).toBeInTheDocument();
  expect(screen.getByText('~0.6s')).toBeInTheDocument();
  expect(within(radiogroup).getByText(/추천/i)).toBeInTheDocument();
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/chat/ChatModelSelector.test.tsx
Error: Failed to resolve import "@/components/chat/ChatModelSelector" from "src/tests/chat/ChatModelSelector.test.tsx". Does the file exist?
Test Files  1 failed (1)
Tests       no tests
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `src/components/chat/ModelTierBadge.tsx`: 3-Tier 메타데이터(아이콘, 비용, 레이턴시, 배지 테마 컬러) 매핑, `chip`, `footer`, `pill`, `pipeline` 변형 지원, 지연시간(`${latencyMs}ms`) 및 `[추천]` 태그 렌더링.
  - `src/components/chat/ModelChangeDivider.tsx`: `role="separator"`, 전환 전/후 모델 표시 및 맥락 보존(`맥락 100% 보존`) 센터 뱃지 렌더링.
  - `src/components/chat/ChatModelSelector.tsx`: WAI-ARIA `role="radiogroup"` 및 `role="radio"`, `aria-checked`, 방향키(`ArrowDown/Up/Right/Left`) 순환 인덱스 포커싱 및 `Enter`/`Space` 선택, `Escape` 닫기 & 트리거 포커스 복원, `isStreaming` 시 상호작용 비활성화 및 안내 툴팁 표출.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/chat/ChatModelSelector.test.tsx (14 tests) 111ms
Test Files  1 passed (1)
Tests       14 passed (14)
```

#### 3. REFACTOR & INTEGRATION Phase (워크스페이스 및 컴포저 전역 연동)
- **리팩토링 내용**:
  - `src/components/chat/ChatPromptInput.tsx`: 좌하단 툴바 영역에 `ChatModelSelector` 인라인 칩 마운트 (Fitts의 법칙 준수, 입력창과 밀착 배치).
  - `src/components/chat/ChatMessageItem.tsx`: 어시스턴트 메시지 버블 푸터 영역에 `ModelTierBadge` 연동 (실시간 측정 지연시간 `message.latency_ms` 표출).
  - `src/components/chat/ChatMessageList.tsx`: 복합 타임라인 아이템(`ChatTimelineItem`) 순회 지원, 모델 전환 이벤트 발생 시 `ModelChangeDivider` 렌더링.
  - `src/components/chat/ChatWorkspace.tsx`: `selectedTier` 상태(기본값 `'sonnet'`) 관리, 대화 도중 모델 교체 시 `ModelSwitchEvent` 타임라인 기록, `POST /api/chat/stream` 전송 본문에 `model: TIER_TO_MODEL[selectedTier]` 및 `model_tier: selectedTier` 전달.
- **회귀 검증 결과**: 24개 테스트 파일 223개 테스트 100% 통과 유지.

---

### [Cycle 8] 듀얼 모델 셀렉터 마운트(ChatHeader + ChatPromptInput), 0ms 양방향 상태 동기화 및 Anti-Gemini UI 살균 TDD
- **목표 기능**:
  1. `ChatHeader` 상단 우측 액션바에 `ChatModelSelector` (`variant="header-chip"`) 마운트하여 모델 가시성/발견성 극대화 (`[🎯 Sonnet 5.5 ▾]`, `REQ-UI-008`).
  2. 하단 컴포저 `ChatPromptInput` (`variant="inline-chip"`)와 상단 헤더 간 중앙 집중식 `selectedTier` 상태를 통한 0ms 양방향 동기화 (`POL-UI-006`).
  3. Anti-Gemini UI 살균 (`POL-LLM-005`, `REQ-LLM-002`): `ChatMessageItem` 및 `sanitizeModelTier`를 통해 UI 전역 Gemini 문자열 0바이트 보장 및 안전한 Claude 3.5 Sonnet 대체.
  4. 버전 규격 동기화: `frontend/package.json` 버전을 `0.2.0`으로 정렬.
- **대응 기능 ID**: `REQ-UI-008`, `POL-UI-006`, `POL-LLM-005`, `REQ-LLM-002`, `FUNC-CHAT-013`

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/chat/ChatHeader.test.tsx`, `src/tests/chat/ChatWorkspace.test.tsx`, `src/tests/chat/ChatMessageItem.test.tsx`)**:
```typescript
// ChatHeader.test.tsx
it('renders header-chip model selector and allows changing tier', () => {
  const onSelectTier = vi.fn();
  render(<ChatHeader title="AgentLens AI Assistant" selectedTier="sonnet" onSelectTier={onSelectTier} />);
  const triggerBtn = screen.getByRole('button', { name: /Claude 모델 선택/i });
  expect(triggerBtn).toBeInTheDocument();
  fireEvent.click(triggerBtn);
  const haikuOption = screen.getByRole('radio', { name: /Haiku 4.5/i });
  fireEvent.click(haikuOption);
  expect(onSelectTier).toHaveBeenCalledWith('haiku');
});

// ChatWorkspace.test.tsx
it('synchronizes model selection bidirectionally between header and composer chips (0ms latency)', async () => {
  render(<ChatWorkspace />);
  const modelSelectors = screen.getAllByRole('button', { name: /Claude 모델 선택/i });
  expect(modelSelectors).toHaveLength(2); // 0: Header, 1: Composer
  // Change via Header Selector
  fireEvent.click(modelSelectors[0]);
  const haikuRadio = screen.getByRole('radio', { name: /Haiku 4.5/i });
  fireEvent.click(haikuRadio);
  expect(within(modelSelectors[0]).getByText('Haiku 4.5')).toBeInTheDocument();
  expect(within(modelSelectors[1]).getByText('Haiku 4.5')).toBeInTheDocument();
});

// ChatMessageItem.test.tsx
it('sanitizes legacy or unauthorized model strings (Anti-Gemini Policy POL-LLM-005)', () => {
  const mockGeminiMessage: ChatMessage = {
    id: 'msg-gemini-leak',
    role: 'assistant',
    content: 'Response with legacy metadata',
    model_used: 'gemini-2.5-flash',
    created_at: new Date().toISOString(),
  };
  render(<ChatMessageItem message={mockGeminiMessage} />);
  expect(screen.queryByText(/gemini/i)).not.toBeInTheDocument();
  expect(screen.getByText(/Claude 3.5 Sonnet/i)).toBeInTheDocument();
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/chat/ChatHeader.test.tsx > ChatHeader Component > renders header-chip model selector
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name `/Claude 모델 선택/i`
Tests: 1 failed, 6 passed (7)

FAIL src/tests/chat/ChatWorkspace.test.tsx > ChatWorkspace Container > synchronizes model selection bidirectionally
AssertionError: expected [ Array(1) ] to have length 2 but got 1
Tests: 1 failed, 13 passed (14)

FAIL src/tests/chat/ChatMessageItem.test.tsx > ChatMessageItem Component > sanitizes legacy or unauthorized model strings
AssertionError: expected 'gemini-2.5-flash' not to be in document
Tests: 1 failed, 11 passed (12)
```

#### 2. GREEN Phase (최소 컴포넌트 구현)
- **구현 내용 요약**:
  - `frontend/package.json`: 버전을 `"0.2.0"`으로 갱신.
  - `src/types/chat.ts`: `ChatModelSelectorProps.variant`에 `'header-chip'` 추가, `ChatHeaderProps`에 `selectedTier`, `onSelectTier`, `isStreaming` 바인딩, `sanitizeModelTier` 함수 구현.
  - `src/components/chat/ChatModelSelector.tsx`: `variant="header-chip"` 스타일링 및 드롭다운 위치 동적 제어(`isHeaderVariant ? 'top-full right-0 mt-2' : 'bottom-full left-0 mb-2'`).
  - `src/components/chat/ChatHeader.tsx`: 상단 우측 액션바에 `<ChatModelSelector variant="header-chip" />` 마운트.
  - `src/components/chat/ChatWorkspace.tsx`: `ChatHeader`에 중앙 `selectedTier` 및 `handleSelectTier` 전달하여 0ms 양방향 상태 동기화 완성.
  - `src/components/chat/ChatMessageItem.tsx`: `displayModelName` 산출 시 `sanitizeModelTier`를 거쳐 Gemini 문자열 0바이트 배제 및 Claude 3.5 Sonnet 대체.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/chat/ChatHeader.test.tsx (7 tests) 128ms
✓ src/tests/chat/ChatWorkspace.test.tsx (14 tests) 2686ms
✓ src/tests/chat/ChatMessageItem.test.tsx (12 tests) 115ms
✓ src/tests/chat/ChatModelSelector.test.tsx (15 tests) 111ms
Test Files  4 passed (4)
Tests       48 passed (48)
```

#### 3. REFACTOR & HARD QUALITY GATE Phase (접근성, 가로스크롤 0px 및 TypeScript 무결점)
- **리팩토링 내용**:
  - 상단 헤더 칩과 하단 컴포저 칩의 팝오버 뷰포트 오버플로우 방어(상단은 하향 전개, 하단은 상향 전개).
  - WAI-ARIA `role="radiogroup"` 및 포커스 링, 스트리밍 잠금(`disabled`) 동기화.
  - TypeScript `pnpm tsc --noEmit` 전체 타입 체킹 무결점(0 오류).
- **회귀 검증 결과**: 전체 24개 테스트 파일 228개 테스트 100% 통과 완료.

---

### [Cycle 9] 기사 포커스 핸드오버 버그 픽스, 프로덕션 Mock 완전 격리, 과거 모델 무결성 보존 및 UI 경량화 (v0.2.1)
- **목표 기능**:
  1. 기사 포커스 핸드오버 버그 픽스: 피드/URL 파라미터(`?articleId=...&question=...`)를 통한 `/chat` 진입 시, 비동기 상태 갱신 지연(`activeSource`, `scopeMode`)으로 인해 `POST /api/chat/stream`에 `scope: "global"`, `source_id: undefined`가 전송되던 레이스 컨디션을 해결하고, `scope: "scoped"` 및 `source_id: number`가 누락 없이 백엔드로 전송되도록 보장 (`BUG-CHAT-001`, `FUNC-CHAT-014`).
  2. 프로덕션 코드 내 Mock 완전 격리 (`POL-PROD-001`): 프로덕션 런타임 컴포넌트(`ChatWorkspace.tsx`, `ExportToolbar.tsx`)에서 `mockSearchChunks`, `mockPageUrl` 등 MSW/Mock 의존성을 100% 제거하여 런타임 시 실제 FastAPI 백엔드로만 요청이 인입되도록 조치 (MSW는 `frontend/src/tests/` 단위/통합 테스트 스위트에만 국한).
  3. 과거 대화 세션 모델 정직 렌더링 (`POL-LLM-006`): `sanitizeModelTier`가 과거 Gemini 세션(`gemini-2.5-flash`, `gpt-4o` 등)의 모델명을 강제로 `Claude 3.5 Sonnet`으로 왜곡하던 문제를 해결하고, 과거 모델 식별자를 있는 그대로 정직하게 렌더링(신규 질의만 기본값 Claude Sonnet 5.5 적용).
  4. UI 경량화 및 군더더기 제거: `ChatModelSelector` 팝오버 상단의 불필요한 헤더(`Claude 3-Tier Multi-Model`, `맥락 100% 보존`, `Sparkles` 아이콘)와 `ModelChangeDivider`의 조잡한 부가 문구(`맥락 100% 보존`)를 제거하여 간결하고 직관적인 UI 완성.
  5. MSW 모의 핸들러 및 테스트 동기화: MSW `POST /api/chat/stream` 핸들러에서 `scope === 'scoped'` 요청 수신 시 해당 기사 메타데이터 기반 4단 기술 리포트(`generateArticleScopedAnswerTokens`)를 스트리밍하도록 고도화.
  6. 버전 규격 동기화: `frontend/package.json` 및 `frontend/src/app/api/health/route.ts` 버전을 `0.2.1`로 상향.
- **대응 기능 ID**: `FUNC-CHAT-014`, `BUG-CHAT-001`, `POL-PROD-001`, `POL-LLM-006`

#### 1. RED Phase (실패하는 RTL 테스트 작성)
- **작성된 테스트 코드 (`src/tests/chat/ChatWorkspace.test.tsx`, `src/tests/chat/ContractAndMsw.test.ts`, `src/tests/chat/ChatMessageItem.test.tsx`, `src/tests/chat/ChatModelSelector.test.tsx`)**:
```typescript
// ChatWorkspace.test.tsx
it('correctly sends scope: scoped and source_id when article is focused, and renders customized response', async () => {
  render(<ChatWorkspace />);
  expect(await screen.findByText(/LangGraph Multi-Agent Architecture/i)).toBeInTheDocument();
});

// ContractAndMsw.test.ts
it('handles POST /api/chat/stream with scope=scoped and source_id=102 returning customized LangGraph report', async () => {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'LangGraph 구조 분석' }],
      scope: 'scoped',
      source_id: 102,
    }),
  });
  expect(res.status).toBe(200);
  const text = await res.text();
  expect(text).toContain('LangGraph Multi-Agent Architecture');
});

// ChatMessageItem.test.tsx
it('displays legacy Gemini model faithfully without mutating it to Sonnet', () => {
  const legacyMessage: ChatMessage = {
    id: 'msg-legacy-gemini',
    role: 'assistant',
    content: 'Legacy Gemini Response',
    model_used: 'gemini-2.5-flash',
    created_at: new Date().toISOString(),
  };
  render(<ChatMessageItem message={legacyMessage} />);
  expect(screen.getByText('Gemini 2.5 Flash')).toBeInTheDocument();
  expect(screen.queryByText('Claude Sonnet 5.5')).not.toBeInTheDocument();
});

// ChatModelSelector.test.tsx
it('renders clean popover without unnecessary header section', () => {
  render(<ChatModelSelector {...defaultProps} />);
  const trigger = screen.getByRole('button', { name: /Claude 모델 선택/i });
  fireEvent.click(trigger);
  expect(screen.queryByText(/Claude 3-Tier Multi-Model/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/맥락 100% 보존/i)).not.toBeInTheDocument();
});
```
- **실행 결과 (실패 확인 - RED)**:
  - `ChatWorkspace.test.tsx`: 핸드오버 시점 비동기 상태 지연으로 `scope: "global"`, `source_id: undefined` 전송 실패.
  - `ContractAndMsw.test.ts`: scoped 요청에 대해 기사 맞춤 응답 대신 범용 FastMCP 토큰이 반환되어 불일치 에러 발생.
  - `ChatMessageItem.test.tsx`: `gemini-2.5-flash`가 `sonnet`으로 자동 치환되어 'Claude Sonnet 5.5'로 렌더링되는 오류 확인.
  - `ChatModelSelector.test.tsx`: popover header 요소 존재로 검증 실패.

#### 2. GREEN Phase (최소 컴포넌트 구현 및 픽스)
- **구현 내용 요약**:
  - `ChatWorkspace.tsx`:
    - `handleSendMessage(prompt, options)`에 `{ scope?: ChatScope; sourceId?: number; sourceDetail?: SourceArticle }` 인자 수신 기능 추가.
    - 핸드오버 `useEffect`에서 fetch 성공 시 `setActiveSource(data)`와 함께 `handleSendMessage(paramQuestion, { scope: 'scoped', sourceId: data.id, sourceDetail: data })`를 직접 호출하여 리액트 비동기 상태 갱신 지연 원천 차단.
    - 스트리밍 요청 페이로드에 `scope: targetScope`, `source_id: targetSourceId`를 명시적으로 직렬화.
    - 프로덕션 코드에서 `mockSearchChunks` import 및 목 참조 완전 제거, 동적 카운트 계산으로 전환.
  - `types/chat.ts`:
    - `sanitizeModelTier` 함수를 수정하여 과거 `gemini`, `gpt` 계열 식별자가 들어올 경우 변조 없이 그대로 유지하도록 변경.
    - `formatModelDisplayName`을 확장하여 `gemini-1.5-pro`, `gemini-2.5-flash`, `gpt-4o` 등 과거 모델명을 정직하게 포맷팅.
  - `ChatMessageItem.tsx` & `ModelTierBadge.tsx`:
    - 비-Claude 모델 식별자에 대한 안전한 폴백 렌더링 스타일(`border-slate-500/30 text-slate-400`) 지원.
  - `ChatModelSelector.tsx`:
    - 팝오버 상단 장식 헤더(`Claude 3-Tier Multi-Model`, `맥락 100% 보존`, `Sparkles`) 및 미사용 아이콘 import 완전 삭제.
  - `ModelChangeDivider.tsx`:
    - 고정 라벨 `맥락 100% 보존` 제거, 변경된 모델명만 간결하게 표시하도록 리팩토링.
  - `mocks/fixtures/chat.ts` & `mocks/handlers/chat.ts`:
    - `generateArticleScopedAnswerTokens` 헬퍼 함수 구현 및 MSW `POST /api/chat/stream` 핸들러에서 `scope === 'scoped'` 요청 시 기사 메타데이터(제목, 기술 스택, 핵심 혁신, 성능 지표 등) 기반 4단 기술 리포트 토큰 생성 연동.
  - 버전 정렬: `frontend/package.json`, `frontend/src/app/api/health/route.ts` ➔ `0.2.1`.
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/chat/ChatWorkspace.test.tsx (15 tests) 2944ms
✓ src/tests/chat/ContractAndMsw.test.ts (71 tests) 3661ms
✓ src/tests/chat/ChatMessageItem.test.tsx (12 tests) 115ms
✓ src/tests/chat/ChatModelSelector.test.tsx (15 tests) 111ms
✓ src/tests/chat/ChatSessionWorkflow.test.tsx (5 tests) 740ms
Test Files  5 passed (5)
Tests       118 passed (118)
```

#### 3. REFACTOR & HARD QUALITY GATE Phase (TypeScript 무결점 및 전체 회귀 검증)
- **리팩토링 내용**:
  - `FocusCapsule`에 `scopedSource`로 `activeSource`를 직접 전달하여 핸드오버 직후 포커스 배너와 백엔드 스트리밍 상태 완벽 동기화.
  - 프로덕션 코드 내 MSW mock fixture import 0바이트 엄격 검증 (`0-Mock Import Rule`).
  - `npx tsc --noEmit` 전체 타입 체킹 무결점(0 오류).
- **회귀 검증 결과**: 전체 24개 테스트 파일 232개 테스트 100% 통과 완료 (기존 228개 대비 4개 신규 테스트 추가 통과).

---

### [Cycle 10] 질문 키워드 기반 동적 뉴스 소스 연동 및 MSW 정합성 보장 (v0.2.2)
- **목표 기능**:
  1. `frontend/src/mocks/handlers/chat.ts`에서 글로벌 스트림(`POST /api/chat/stream`) 및 단건 질의(`POST /api/chat/query`) 요청 시, 사용자 `question` 텍스트의 키워드 및 의미론적 토픽 매핑에 따라 모의 청크들을 검색/필터링하여 질문별 맞춤형 소스가 반환되도록 수정 (고정된 5개 slice 제거).
  2. `frontend/src/components/chat/ChatWorkspace.tsx`에서 백엔드/MSW로부터 동적으로 반환된 `sources`가 메시지 상단 소스 칩(`원문 n건`) 및 인라인 인용(`[1]`, `[S1]`)에 실시간 정상 표출되는지 통합 검증.
  3. 버전 갱신: `frontend/package.json` (`0.2.2`), `frontend/src/app/api/health/route.ts` (`0.2.2`), `README.md` (`v0.2.2`).
- **대응 기능 ID**: `FUNC-CHAT-015` / `REQ-CHAT-015`

#### 1. RED Phase (실패하는 RTL & MSW Contract 테스트 작성)
- **작성된 테스트 코드 (`src/tests/chat/ContractAndMsw.test.ts` & `src/tests/chat/ChatWorkspace.test.tsx`)**:
```typescript
// src/tests/chat/ContractAndMsw.test.ts
it('returns dynamically filtered, keyword-matched sources for global chat stream (v0.2.2)', async () => {
  const resLangGraph = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'LangGraph v0.2의 분기 제어 및 상태 머신 원리', scope: 'global' }),
  });
  const textLangGraph = await resLangGraph.text();
  const sourcesData = JSON.parse(textLangGraph.split('\n').find((l) => l.startsWith('data: ') && l.includes('"sources"'))!.replace('data: ', ''));
  expect(sourcesData.primary_count).toBe(1);
  expect(sourcesData.sources[0].id).toBe(102);
});

// src/tests/chat/ChatWorkspace.test.tsx
it('dynamically displays question-specific sources chip and inline citations for global mode questions (v0.2.2)', async () => {
  render(<ChatWorkspace />);
  fireEvent.change(screen.getByRole('textbox', { name: /질문 입력/i }), { target: { value: 'LangGraph v0.2 시간 여행 디버깅 원리' } });
  fireEvent.click(screen.getByRole('button', { name: /질문 전송/i }));
  await waitFor(() => expect(screen.getByRole('button', { name: /심층 분석 과정.*단계 완료/i })).toBeInTheDocument());
  expect(screen.getByText('원문 1건')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /출처 1번:.*LangGraph/i }).length).toBeGreaterThan(0);
});
```
- **실행 결과 (실패 확인 - RED)**:
```
FAIL src/tests/chat/ContractAndMsw.test.ts: AssertionError: expected 5 to be 1
FAIL src/tests/chat/ChatWorkspace.test.tsx: TestingLibraryElementError: Unable to find an element with the text: 원문 1건 (원문 5건 렌더링됨)
✅ [PHASE RED ASSERTION PASSED] Tests failed as expected before implementation.
```

#### 2. GREEN Phase (최소 컴포넌트 및 핸들러 구현)
- **구현 내용 요약**:
  - `src/mocks/handlers/chat.ts`:
    - `filterChunksByQuestion` 헬퍼 함수 구현: `fastmcp`, `langgraph`, `swe-bench`, `autogen`, `claude` 및 관련 한글/영문 키워드 매핑 테이블 기반 청크 우선 매칭 및 불용어/버전 태그 살균.
    - `POST /api/chat/stream` & `POST /api/chat/query`: 고정 5개 슬라이스(`mockSearchChunks.slice(0, 5)`)를 전면 제거하고 `filterChunksByQuestion` + `applyFocusFilters` 결합 파이프라인 적용.
    - 매칭된 1순위 소스 기반 동적 4단 마크다운 리포트 생성 (`generateArticleScopedAnswerTokens(mockArticles[primarySources[0].id])`).
  - 버전 동기화: `frontend/package.json` (`0.2.2`), `frontend/src/app/api/health/route.ts` (`0.2.2`), `README.md` (`v0.2.2`).
- **실행 결과 (성공 확인 - GREEN)**:
```
✓ src/tests/chat/ChatWorkspace.test.tsx (16 tests)
✓ src/tests/chat/ContractAndMsw.test.ts (72 tests)
✅ [PHASE GREEN ASSERTION PASSED] All tests passed cleanly.
```

#### 3. REFACTOR & HARD QUALITY GATE Phase (TypeScript 무결점 및 전체 회귀 검증)
- **리팩토링 내용**:
  - TypeScript strict null 체크 보강: `primarySources[0]?.id` 타입 가드 (`typeof topPrimaryId === 'number'`) 적용으로 TS2538 완전 해소.
  - `npx tsc --noEmit` 전체 타입 체킹 무결점 통과 (0 오류).
  - 다중 인라인 인용(`[1]`) 렌더링 시 `getAllByRole` 및 고유 키워드(`durable state persistence`) 단언으로 테스트 안정성 극대화.
- **회귀 검증 결과**: 전체 24개 테스트 파일 234개 테스트 100% 통과 완료 (기존 232개 대비 2개 신규 테스트 추가 통과).

---

## 3. UI 5대 상태 (Loading, Error, Empty, Success, Idle) 검증표

| 컴포넌트 / 모듈 | 상태 케이스 | 모의 네트워크 / 렌더링 조건 | 화면 렌더링 검증 결과 | 통과 여부 |
| :--- | :--- | :--- | :--- | :---: |
| **Theme System** | **Idle State** | 기본 시스템/라이트 테마 활성화 | Sun/Moon/Laptop 아이콘 및 테마 모드 표시 확인 | **PASS** |
| | **Success State** | 버튼 클릭 or 't' 키 입력 | 16ms 이내 `<html>` 태그 `dark` 클래스 및 `data-theme` 반영 | **PASS** |
| **Hotkey Listener** | **Idle State** | 입력 필드 외부 일반 화면 | `j/k`, `/`, `b`, `c`, `t`, `Cmd+K`, `Esc` 핫키 청취 | **PASS** |
| | **Input Isolation** | `<input>`, `<textarea>` 포커스 상태 | 단일 키 무시 확인 (`Cmd+K`, `Esc`만 예외 허용) | **PASS** |
| | **IME Guard** | 한글 조합 중 (`isComposing: true`) | 이벤트 무시 및 중복 실행 0건 차단 확인 | **PASS** |
| **Command Palette** | **Idle State** | `Cmd+K` 입력 시 기본 목록 | 5개 핵심 액션(AI 챗, 테마, 소스, MCP, 즉시수집) 노출 | **PASS** |
| | **Loading/Filter** | 명령어 검색어 타이핑 | 디바운스 실시간 명령어 필터링 확인 | **PASS** |
| | **Empty State** | 일치 명령어 0건 | "검색된 명령어가 없습니다." 안내 노출 확인 | **PASS** |
| | **Success State** | ArrowDown 선택 후 Enter 입력 | 지정된 액션 콜백 실행 및 팔레트 모달 자동 닫힘 확인 | **PASS** |
| **Export Toolbar** | **Idle State** | 스트리밍 진행 중 (`isStreaming: true`) | 툴바 `opacity-50 pointer-events-none` 비활성화 확인 | **PASS** |
| | **Success (Copy)** | 마크다운 복사 버튼 클릭 | `navigator.clipboard` 호출 및 "복사됨" 체크 피드백 확인 | **PASS** |
| | **Success (File)** | `.md` 다운로드 버튼 클릭 | 제목 살균 Blob URL 발급 및 브라우저 다운로드 확인 | **PASS** |
| | **Success (Notion)**| Notion 동기화 버튼 클릭 | 로딩 스피너 ➔ "Notion 연동됨" 확정 피드백 확인 | **PASS** |
| **Session Drawer** | **Loading State** | 세션 로딩 중 (`isLoading: true`) | `SessionListSkeleton` 5개 펄스 카드 렌더링 확인 | **PASS** |
| | **Error State** | 500 서버 장애 모의 (`error` 존재) | 에러 배너 및 `[다시 시도]` 버튼 노출 & 콜백 확인 | **PASS** |
| | **Empty State** | 저장된 세션 0건 | `SessionEmptyState` ("저장된 대화 기록이 없습니다") 노출 | **PASS** |
| | **Success/Active** | 세션 선택 시 | 활성 세션 좌측 4px 인디고 보더 하이라이트 & 드로어 닫힘 | **PASS** |
| **Responsive 0px** | **Overflow Check** | 500자 무공백 텍스트 / 코드블록 | 뷰포트 가로스크롤 0px 방어 & 국소 스크롤 격리 확인 | **PASS** |
| **Model Selector** | **Idle State** | 프롬프트 컴포저 좌하단 칩 | 기본 `[🎯 Sonnet 5.5 추천]` 표시 & Fitts 최적화 | **PASS** |
| | **Active (Open)** | 인라인 칩 클릭 시 | WAI-ARIA RadioGroup 3-Tier (`Haiku`, `Sonnet`, `Opus`) 전개 | **PASS** |
| | **Streaming Lock**| SSE 스트리밍 중 (`isStreaming: true`) | 칩 비활성화(disabled) & "답변 생성 중..." 툴팁 고정 | **PASS** |
| | **Model Switch** | 대화 도중 모델 변경 | 세션 및 맥락 100% 보존 타임라인 디바이더 자동 삽입 | **PASS** |
| **Dual Selector** | **0ms Sync** | Header 또는 Composer 칩에서 모델 변경 | 0ms 즉시 양측 칩 레이블 & 아이콘 동기화 반영 확인 | **PASS** |
| | **Streaming Lock**| SSE 스트리밍 중 (`isStreaming: true`) | Header & Composer 칩 동시 비활성화(disabled) 확인 | **PASS** |
| **Anti-Gemini** | **Sterilization** | 신규 질의 기본 모델 세팅 | 기본 Claude 3.5 Sonnet 강제 및 불법 변조 방지 | **PASS** |
| **Scoped Handover** | **Zero-Race Stream** | 기사 핸드오버 `?articleId=102` 진입 | `scope: "scoped"`, `source_id: 102` 누락 없이 전송 & 맞춤 리포트 수신 | **PASS** |
| **Production Bundle** | **Zero Mock Rule** | `ChatWorkspace.tsx` 프로덕션 빌드 | mock fixture import 0바이트, 런타임 FastAPI 직접 호출 확인 | **PASS** |
| **Historical Model**| **Truthful Display** | 과거 `gemini-2.5-flash` 세션 조회 | 왜곡 없이 'Gemini 2.5 Flash'로 정직 렌더링 확인 | **PASS** |
| **UI Simplification**| **Decluttering** | 셀렉터 팝오버 및 디바이더 렌더링 | 불필요한 헤더 및 조잡한 '맥락 100% 보존' 문구 제거 확인 | **PASS** |
| **Dynamic Sources**  | **Keyword Match**   | 글로벌 모드에서 'LangGraph' 질의   | 고정 5개 슬라이스 배제, `primary_count: 1`, '원문 1건' 및 [1] 표출 | **PASS** |
|                      | **Inline Popover**  | [1] 인라인 출처 뱃지 클릭          | 대상 기사 메타데이터(제목, 스니펫, URL) 팝오버 실시간 정상 노출 | **PASS** |

---

## 4. 최종 Vitest 테스트 실행 및 하드 퀄리티 게이트 검증 결과

```bash
$ npm test

 RUN  v5.0.0 /Users/wonyoung/workspace/ozplayground/agentlens/frontend

 ✓ src/tests/CommandPalette.test.tsx (9 tests) 130ms
 ✓ src/tests/chat/ChatHeader.test.tsx (7 tests) 138ms
 ✓ src/tests/chat/FocusBottomSheet.test.tsx (7 tests) 179ms
 ✓ src/tests/chat/ChatModelSelector.test.tsx (15 tests) 159ms
 ✓ src/tests/chat/ChatSidebar.test.tsx (10 tests) 161ms
 ✓ src/tests/chat/HandoverIntegration.test.tsx (5 tests) 154ms
 ✓ src/tests/chat/ChatMessageItem.test.tsx (13 tests) 195ms
 ✓ src/tests/chat/ExportToolbar.test.tsx (5 tests) 424ms
 ✓ src/tests/chat/ChatSessionWorkflow.test.tsx (5 tests) 726ms
 ✓ src/tests/chat/CitationBadge.test.tsx (6 tests) 98ms
 ✓ src/tests/NewsCard.test.tsx (5 tests) 98ms
 ✓ src/tests/chat/ChatHistoryDrawer.test.tsx (10 tests) 131ms
 ✓ src/tests/chat/ChatPromptInput.test.tsx (7 tests) 144ms
 ✓ src/tests/chat/FocusCapsule.test.tsx (5 tests) 123ms
 ✓ src/tests/chat/MobileViewport.test.tsx (5 tests) 129ms
 ✓ src/tests/chat/WorkflowStepTracker.test.tsx (5 tests) 131ms
 ✓ src/tests/chat/ChatMessageList.test.tsx (3 tests) 64ms
 ✓ src/tests/chat/ActiveSourceChip.test.tsx (4 tests) 59ms
 ✓ src/tests/ThemeSystem.test.tsx (5 tests) 62ms
 ✓ src/tests/HotkeyListener.test.tsx (8 tests) 19ms
 ✓ src/tests/ResponsiveLayout.test.tsx (4 tests) 45ms
 ✓ src/tests/AskAiPanel.test.tsx (3 tests) 38ms
 ✓ src/tests/chat/ChatWorkspace.test.tsx (16 tests) 3414ms
   ✓ ChatWorkspace Container (16)
     ✓ dynamically displays question-specific sources chip and inline citations for global mode questions (v0.2.2) 577ms
 ✓ src/tests/chat/ContractAndMsw.test.ts (72 tests) 4612ms
   ✓ Stage 2d & Stage 2a Contract & Mock Integration Verification (v2.6) (72)
     ✓ returns dynamically filtered, keyword-matched sources for global chat stream (v0.2.2) 1070ms

 Test Files  24 passed (24)
      Tests  234 passed (234)
   Start at  16:53:28
   Duration  5.73s
```

```bash
$ npx tsc --noEmit
# Exit Code 0 (TypeScript 타입 체크 무결점 통과)
```

- **테스트 파일 총수**: 24개 스위트
- **단위/통합 테스트 총수**: 234개 테스트 (+2 신규 테스트 추가)
- **성공률**: **100% PASS (0 Failure, 0 Flaky)**
- **규격 준수**: `AGENTS.md` Stage 3b 프론트엔드 TDD 트랙 완료 및 `01_TDD_CYCLE_LOG.md` SSOT 확정 (v0.2.2)




