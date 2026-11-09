# Task 13: 챗 셸

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 13
Status: done
Session: implementer D
Agent: a8cccceeeb8d0557d
Updated: 2026-11-06

## 한 일
- `ChatHeader.tsx`: `h-14` 한 줄 `<header>`(sticky `z-30`, `bg-surface/95 backdrop-blur`). 기록 `IconButton "대화 기록 보기"`(`aria-expanded`, `aria-controls` 는 1024 이상 `chat-history-sidebar`, 미만 `chat-history-drawer`), `피드로 돌아가기` 링크(md 이상 `피드` 글자), 제목 `<h1>AI 챗</h1>`(따로 된 요소), 모델 칩 `hidden md:inline-flex` 감싸개(DOM 유지), 새 대화 `IconButton "새 대화 시작"`(표시 `showNewChatButton && (!isDesktop || !isSidebarOpen)`, `isDesktop = useMediaQuery('(min-width: 1024px)')`), 더보기 `MenuButton "더보기"`(테마 그룹 + `menuitemradio` 라이트·다크·시스템, `뉴스 피드로 이동`, 768 미만이고 팔레트 prop 이 있으면 `커맨드 팔레트`). `xs:` 제거. `<header>` 바로 뒤 형제로 `ChatContextBar` 를 그린다. 새 props 는 모두 선택: `isSidebarOpen?`, `isCommandPaletteOpen?`, `onToggleCommandPalette?`(주면 md 이상 `커맨드 팔레트 열기` 버튼과 ⌘K `useHotkey('mod+k', …, {allowInInputs})`: 팔레트가 열려 있으면 닫고, 다른 레이어가 열려 있으면 무시, 아니면 연다).
- `ChatContextBar.tsx`(새): `SegmentedControl label="검색 스코프 모드"` (`단일 기사 (Scoped)` / `전체 코퍼스 (Global)`, `aria-pressed`) + `ActiveSourceChip`. 한 줄 가로 스크롤, `max-w-3xl`. 기사 제목은 칩 안에만.
- `ChatWorkspace.tsx`: `isDesktop` 을 `useMediaQuery` 로 판정하고 `window.innerWidth` 를 지웠다. 경고 배너 대신 `useToast().show({ tone: 'warning' })`(문구 그대로), 루트 맨 끝에 `<ToastRegion />` 하나. 기록 토글은 데스크톱이면 사이드바, 아니면 드로어. `isHistoryOpen` 은 폭에 맞는 쪽 값을 넘긴다. 드로어는 `isDrawerOpen && !isDesktop`. 루트는 첫 자식 그대로(`overflow-x-hidden max-w-full`, 인라인 높이)에 `bg-canvas text-fg`. 입력 영역 감싸개는 `bg-surface border-t border-border`, `max-w-3xl`. 사이드바는 그대로 항상 렌더 + `hidden lg:flex`.
- `ChatHistoryDrawer.tsx`: `Drawer side="left"`, `header`(h2 `대화 기록` + `IconButton "대화 기록 드로어 닫기"`), `labelledBy`, `backdropTestId="drawer-backdrop"`, `panelProps={{ id: 'chat-history-drawer' }}`, 안쪽 `<nav aria-label="대화 기록 목록">`. 자체 Escape 리스너와 스크롤 잠금은 지웠다 (Drawer 공통 규칙이 맡는다).
- `ChatSidebar.tsx`(`id="chat-history-sidebar"`, `w-72`, 토큰. `className` 기본값 `flex`), `ChatSidebarHeader.tsx`(`+ 새 대화` 는 `buttonClasses('primary')`, 접기 `IconButton`, 검색 입력 `h-11 md:h-9 text-base md:text-sm`, 지우기 `IconButton`), `SessionList.tsx`(오류는 `ErrorState`, 목록 토큰), `SessionItemCard.tsx`(활성 `border-l-2 border-accent bg-accent-soft` + `aria-current="true"` + `data-active="true"`, `Badge` Scoped/Global, 삭제 `IconButton`(title `대화 삭제`)은 카드 안에 남기고 md 이상에서만 hover 시 보임), `SessionEmptyState.tsx`(`EmptyState` + `Button`), `SessionListSkeleton.tsx`(`Skeleton`, `data-testid` 유지), `DeleteConfirmPopover.tsx`(`Popover role="dialog" label="이 대화를 삭제하시겠습니까?" focusOnOpen`, `취소`/`삭제`, 자체 Escape·mousedown 리스너 제거, 선택 prop `anchorRef`), `ActiveSourceChip.tsx`(토큰, 해제 버튼 44px/md 32px, 카테고리 원문 표시 유지), `app/chat/page.tsx`(팔레트 색 2곳 → `bg-canvas text-fg`, `text-fg-muted`).
- 테스트: `ChatSidebar.test.tsx:240-241` 을 plan '증명' 표대로 바꿨다 (`data-active="true"` + `bg-accent-soft` + `border-accent`). `ChatHeader.test.tsx` 에는 테스트 2개만 추가했다: 800px 목에서 사이드바가 열려 있어도 `새 대화` 가 보이고 누르면 `onNewChat`, 1280px 목 + 사이드바 열림에서는 없음.

## 바꾼 파일
- frontend/src/components/chat/ChatHeader.tsx
- frontend/src/components/chat/ChatContextBar.tsx (새 파일)
- frontend/src/components/chat/ChatWorkspace.tsx
- frontend/src/components/chat/ChatHistoryDrawer.tsx
- frontend/src/components/chat/ChatSidebar.tsx
- frontend/src/components/chat/ChatSidebarHeader.tsx
- frontend/src/components/chat/SessionList.tsx
- frontend/src/components/chat/SessionItemCard.tsx
- frontend/src/components/chat/SessionEmptyState.tsx
- frontend/src/components/chat/SessionListSkeleton.tsx
- frontend/src/components/chat/DeleteConfirmPopover.tsx
- frontend/src/components/chat/ActiveSourceChip.tsx
- frontend/src/app/chat/page.tsx
- frontend/src/tests/chat/ChatSidebar.test.tsx (240-241행)
- frontend/src/tests/chat/ChatHeader.test.tsx (추가만)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/chat/ChatHeader.test.tsx src/tests/chat/ChatSidebar.test.tsx src/tests/chat/ChatHistoryDrawer.test.tsx src/tests/chat/ChatSessionWorkflow.test.tsx src/tests/chat/ActiveSourceChip.test.tsx src/tests/chat/MobileViewport.test.tsx`
  ```
   Test Files  6 passed (6)
        Tests  43 passed (43)
  ```
- 참고: `pnpm exec vitest run src/tests/chat/ChatWorkspace.test.tsx` → `Test Files 1 passed (1)`, `Tests 18 passed (18)` (14 와 함께 G2 에서 다시 본다).
- `pnpm exec eslint <바꾼 15개 파일>` → `✖ 4 problems (0 errors, 4 warnings)`. 경고는 모두 원래 있던 것이다: `ChatWorkspace.tsx:502` exhaustive-deps, `ChatSidebar.test.tsx` 의 쓰지 않는 import 3개.
- `pnpm exec tsc --noEmit` → 출력 없음, 종료 코드 0.
- 바꾼 파일의 팔레트 색·hex·`animate-in` 류·임의 글자 크기·`uppercase`·`xs:` grep → 0건.

## 결정
- `ChatHeader` 안에서 `useMediaQuery` 로 새 대화 표시를 정한다 (plan 의 새 테스트가 `ChatHeader` 단독 렌더에서 폭을 바꿔 확인한다). `isSidebarOpen` 의 기본값은 `false` 다. 그래야 기존 `ChatHeader.test` 의 단독 렌더(데스크톱 기본 목)에서 버튼이 보인다. 기존 `showNewChatButton` prop 은 끄는 용도로 남겼다.
- 헤더의 기록 버튼은 폭마다 하나만 그린다. 1024 이상에서는 사이드바를 접고 펴며 `aria-controls="chat-history-sidebar"` 를 쓰고, 그래서 사이드바 `<aside>` 에 그 id 를 달았다.
- `ChatContextBar` 높이: 모바일 `SegmentedControl` 버튼이 44px(`h-11`)에 안쪽 여백 2px 이 붙어 `h-11` 고정 줄에 들어가지 않는다. 그래서 모바일은 `min-h-11 py-1`, md 이상은 `h-11` 로 했다 (R6 우선).
- `ActiveSourceChip` 의 카테고리는 `lib/labels.ts` 라벨이 아니라 원래 값을 쓴다 (`ActiveSourceChip.test.tsx` 가 `mcp_plugins_skills` 를 찾는다). 고정폭·대문자 표기는 지웠다.
- `ToastRegion` 은 `ChatWorkspace` 에도 둔다. 레이아웃 쪽이 먼저 마운트돼 있으면 레이아웃 쪽이 그리므로, spec 6 의 "챗은 입력창 위" 위치를 이 단계에서 줄 수 없다. 부품 API(`className`)는 그리는 쪽에만 먹는다. G2 뒤 화면 확인 때 볼 일로 남긴다.

## 막힌 점
- 없음. 챗 커맨드 팔레트 연결은 09 가 done 이 될 때까지 기다렸다가 했다 (아래 '팔레트 연결').
- 참고: 팔레트를 연결한 직후 `ChatWorkspace.test.tsx` 의 "dual citations" 테스트가 한 번 실패했다. 같은 시각에 14 가 `CitationBadge.tsx` 와 `ChatWorkspace.test.tsx:261` 을 고치고 있었다. 단독 실행과 이후 전체 파일 실행 두 번은 모두 통과했다 (`Tests 27 passed (27)`, CommandPalette.test 포함). G2 에서 다시 본다.

## 팔레트 연결 (09 done 뒤)
- `ChatWorkspace.tsx`: `isPaletteOpen` 상태를 두고 `<CommandPalette isOpen onClose commands={paletteCommands} />` 를 단다. 명령은 `뉴스 피드로 이동`(`router.push('/')`), 테마 순환(제목은 피드 팔레트 규칙 그대로), `새 대화 시작`, `대화 기록 열기`(데스크톱은 사이드바 열기, 아니면 드로어 열기). `ChatHeader` 에 `isCommandPaletteOpen`·`onToggleCommandPalette` 를 넘긴다.
- `ChatHeader.tsx`: ⌘K 판정을 09 의 `Header` 와 같게 `overlayStack.getLayers().length` 로 바꿨다. 팔레트가 열려 있으면 레이어가 1개 이하일 때만 닫고, 다른 레이어가 있으면 무시하고, 아니면 연다.
- 다시 돌린 끝 기준:
  - 끝 기준 테스트 6개 파일 `Test Files 6 passed (6)`, `Tests 43 passed (43)`
  - `ChatWorkspace.test.tsx` + `CommandPalette.test.tsx` `Tests 27 passed (27)`
  - eslint `✖ 4 problems (0 errors, 4 warnings)` (원래 있던 경고)
  - `tsc --noEmit` 출력 없음

## 다음
- 관문 G2 에서 전체 `pnpm test && pnpm lint && pnpm exec tsc --noEmit` 와 `make build` 를 돈다. 챗 쪽 `ToastRegion` 위치(입력창 위)는 화면 확인 때 본다 ('결정' 참고).
