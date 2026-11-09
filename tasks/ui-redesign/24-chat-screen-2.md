# Task 24: 챗 화면: 줄바꿈·열 맞춤·알림 위치·기록 버튼·라벨

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 24
Status: done
Session: main
Agent: ae45fb4787df1dd15 (implementer F)
Updated: 2026-11-06

## 한 일
- 먼저 실패하는 테스트 3개를 쓰고 예상 이유로 실패하는 것을 확인해 커밋 (`b9cfa74`).
- 구현 커밋 (`5a8ac3c`):
  - `ChatHeader` (C-1, R24): 기록 버튼 `aria-controls` 는 `isHistoryOpen` 일 때만 (`chat-history-sidebar`/`chat-history-drawer`), `aria-expanded` 는 늘.
  - `ChatMessageList` (14.6): 추천 질문 버튼에 `text-left` 직접. 메시지 열 상자(`mx-auto w-full max-w-3xl`)에 `data-chat-column`. 빈 화면(환영)도 같은 열 규칙(바깥 `px-4 md:px-6`, 안쪽 `data-chat-column` `max-w-3xl`, 그 안에 기존 `max-w-2xl` 가운데 내용)으로 바꿨다 — `/chat` 기본·경고 알림 상태는 메시지가 없어 `chatAlign`·`toast` 가 열을 찾아야 하기 때문. `role="log"`·`aria-live`·`overflow-x-hidden w-full max-w-full` 유지.
  - `ChatContextBar` (F14): 바깥에 `data-chat-context-bar`, `px-4 md:px-6`, `md:h-11`(테두리 포함 44px). 안쪽은 `ScrollRow label="검색 스코프"` + `mx-auto w-full max-w-3xl`. 스코프 토글·기사 칩 구조와 이름 그대로.
  - `ChatSidebarHeader`: 머리 영역 전체 `data-chat-sidebar-head`, 1줄 `h-14`(`+ 새 대화`, 접기), 2줄 `md:h-11`(`대화 검색`, 아래 테두리를 이 줄 높이 안에 둠). 1024 이상에서 아래 경계 56+44 = 100px = 챗 헤더(`h-14`, 테두리 포함) + 맥락 줄(`md:h-11`, 테두리 포함). 768 미만 드로어에서는 2줄이 `min-h-11 pb-2`.
  - `ChatWorkspace` (C-2): 입력 영역을 `relative w-full max-w-full shrink-0` 감싸개로 싸고 그 안 첫 자식으로 `<ToastRegion placement="composer" />`. 감싸개는 입력 영역의 `overflow-x-hidden` 상자 밖이다. 기존 `<ToastRegion />` 는 지움(layout.tsx 의 global 은 그대로). 입력 영역 바깥 상자 `px-3 md:px-4` → `px-4 md:px-6`, 안쪽 `max-w-3xl` 상자에 `data-composer` 와 `pt-3`·아래 안전 영역 여백을 옮김. 루트 요소(첫 자식, `overflow-x-hidden`·`max-w-full`·인라인 높이)는 그대로.
  - `ActiveSourceChip` (C-3): `categoryShortLabel(source.category)` 를 자기 `<span>` 으로 (제목과 다른 요소).
  - `FocusCapsule`: 자체 `CATEGORY_LABELS` 표를 지우고 `categoryShortLabel()`. `all` 의 `전체 소식` 은 그대로.
  - `CitationPopover`: `categoryLabel` → `categoryShortLabel`.
  - `ChatSidebar.tsx`·`ChatHistoryDrawer.tsx`·`FocusBottomSheet.tsx` 는 고치지 않았다 (필요 없음 / 우려 18).

## 바꾼 파일
- `frontend/src/tests/chat/ChatHeader.test.tsx` (추가만: `기록 버튼 aria-controls (C-1, R24)` describe 2개 it)
- `frontend/src/tests/chat/ChatMessageList.test.tsx` (추가만: `추천 질문 버튼마다 text-left 를 직접 단다`)
- `frontend/src/tests/chat/ActiveSourceChip.test.tsx` (19행 `'mcp_plugins_skills'` → `'MCP'`, 우려 10 표)
- `frontend/src/components/chat/ChatHeader.tsx`
- `frontend/src/components/chat/ChatMessageList.tsx`
- `frontend/src/components/chat/ChatContextBar.tsx`
- `frontend/src/components/chat/ChatSidebarHeader.tsx`
- `frontend/src/components/chat/ChatWorkspace.tsx`
- `frontend/src/components/chat/ActiveSourceChip.tsx`
- `frontend/src/components/chat/FocusCapsule.tsx`
- `frontend/src/components/chat/CitationPopover.tsx`

## 검사 결과
- 실패 테스트 (고치기 전, `pnpm exec vitest run src/tests/chat/ChatHeader.test.tsx src/tests/chat/ChatMessageList.test.tsx src/tests/chat/ActiveSourceChip.test.tsx`): `Tests  3 failed | 16 passed (19)`
  - `ActiveSourceChip > renders category and title accurately`: `Unable to find an element with the text: MCP` (원값 `mcp_plugins_skills` 를 그림)
  - `ChatHeader > 기록 버튼 aria-controls (C-1, R24) > 기록이 닫혀 있으면 …`: `Expected the element not to have attribute: aria-controls / Received: aria-controls="chat-history-sidebar"`
  - `ChatMessageList > 추천 질문 버튼마다 text-left …`: `expected [ 'group', 'flex', 'min-h-11', …(16) ] to include 'text-left'`
- 수정 전 증거 인용(F13 `keepAll`, F14 `chatAlign`, `toast`, 기록 버튼 `ariaControls`): 19단계의 `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` 이 아직 없어(19 진행 중) 인용하지 못했다. 27 의 전체 측정이 확인한다.
- 고친 뒤 `cd frontend && pnpm exec vitest run src/tests/chat`:
  ```
   Test Files  18 passed (18)
        Tests  212 passed (212)
  ```
- `pnpm exec eslint <바꾼 파일 11개>`: `✖ 1 problem (0 errors, 1 warning)` — `ChatWorkspace.tsx:508` `react-hooks/exhaustive-deps` 경고는 이 단계 전부터 있던 것.
- `pnpm exec tsc --noEmit`: 종료 2. 오류는 모두 23단계 진행 중 파일(`src/hooks/useNewsFeed.ts` is not a module → `src/app/page.tsx:26,215`, `src/tests/hooks/useNewsFeed.test.tsx:6,136`). 이 단계 파일 오류 0.
- 전체 `pnpm test`: `Test Files  2 failed | 46 passed (48)`, `Tests  6 failed | 524 passed (530)` — 실패는 `feed/FeedToolbar.test.tsx` 3개, `feed/InsightsBar.test.tsx` 3개로 23단계의 먼저 실패하는 테스트(구현 진행 중).
- `git diff -U0 1ec8a9b -- frontend/src/tests/chat | grep -E '^-[^-]'`: `ActiveSourceChip.test.tsx` 의 `mcp_plugins_skills` 한 줄뿐.


### 수정 전 증거 (기준선 인용, 메인 세션이 verifier 편차 B 에 따라 추가)
출처: `docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json` (1ec8a9b 프로덕션 빌드, 19단계 측정, verifier 재실행으로 같은 328건 확인).
- chatAlign:
  - `chat-light-1024x768` `chatAlign` 건수 1, 예:  — 대상 없음: [data-chat-sidebar-head], [data-chat-context-bar], [d
  - `chat-light-1440x900` `chatAlign` 건수 1, 예:  — 대상 없음: [data-chat-sidebar-head], [data-chat-context-bar], [d
  - `chat-dark-1024x768` `chatAlign` 건수 1, 예:  — 대상 없음: [data-chat-sidebar-head], [data-chat-context-bar], [d
  - `chat-dark-1440x900` `chatAlign` 건수 1, 예:  — 대상 없음: [data-chat-sidebar-head], [data-chat-context-bar], [d
- toast:
  - `chat-light-360x780-toast` `toast` 건수 1, 예:  — 대상 없음: [data-composer]
  - `chat-light-390x844-toast` `toast` 건수 1, 예:  — 대상 없음: [data-composer]
  - `chat-light-768x1024-toast` `toast` 건수 1, 예:  — 대상 없음: [data-composer], [data-chat-column]
  - `chat-light-1024x768-toast` `toast` 건수 1, 예:  — 대상 없음: [data-composer], [data-chat-column]
  - `chat-light-1440x900-toast` `toast` 건수 1, 예:  — 대상 없음: [data-composer], [data-chat-column]
  - `chat-dark-360x780-toast` `toast` 건수 1, 예:  — 대상 없음: [data-composer]
  - … 외 4건
- ariaControls (/chat):
  - `chat-light-360x780` `ariaControls` 건수 1, 예: 대화 기록 보기 — 문서에 없는 id 를 가리킴
  - `chat-light-360x780-source` `ariaControls` 건수 1, 예: 대화 기록 보기 — 문서에 없는 id 를 가리킴
  - `chat-light-360x780-toast` `ariaControls` 건수 1, 예: 대화 기록 보기 — 문서에 없는 id 를 가리킴
  - `chat-light-390x844` `ariaControls` 건수 1, 예: 대화 기록 보기 — 문서에 없는 id 를 가리킴
  - `chat-light-390x844-source` `ariaControls` 건수 1, 예: 대화 기록 보기 — 문서에 없는 id 를 가리킴
  - `chat-light-390x844-toast` `ariaControls` 건수 1, 예: 대화 기록 보기 — 문서에 없는 id 를 가리킴
  - … 외 12건
- keepAll (/chat):
  - `chat-light-360x780` `keepAll` 건수 5, 예: AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `chat-light-360x780-source` `keepAll` 건수 5, 예: AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `chat-light-360x780-toast` `keepAll` 건수 6, 예: AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `chat-light-390x844` `keepAll` 건수 5, 예: AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `chat-light-390x844-source` `keepAll` 건수 5, 예: AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - `chat-light-390x844-toast` `keepAll` 건수 6, 예: AI 에이전트·하네스·MCP 기술 심층 질의 및 수집된 코퍼스 기반의 고 — 두 줄 이상 한국어 글자의 word-break 가 normal
  - … 외 24건

## 결정
- 관문 G3 의 19단계 self-test 가 끝나기 전에 메인 세션 판단으로 시작했다.
- `data-composer` 는 입력 영역의 바깥 `border-t` 상자가 아니라 안쪽 `max-w-3xl` 상자에 단다. ui-audit `chatAlign` 은 입력 영역 왼쪽 끝을 메시지 열과 비교하고(바깥 상자는 본문 열 왼쪽 끝이라 어긋남), `toast` 는 알림 아래 끝 ↔ 입력 영역 위 끝 간격 16px 이하를 본다. 그래서 `pt-3` 을 안쪽 상자로 옮겨 안쪽 상자 위 끝이 테두리 바로 아래가 되게 했다 (알림 `mb-2` 8px + 테두리 1px ≈ 9px).
- 빈 화면에도 `data-chat-column` 을 둔다 (위 '한 일'). 기존 `max-w-2xl` 환영 내용은 열 안에서 가운데.
- 사이드바 머리·맥락 줄 모두 테두리를 높이 안에 넣어 아래 경계를 100px 로 맞췄다 (spec 14.6 의 '아래 경계 100px').

## 막힌 점
- 없음 (단계 완료). 아래는 다른 단계가 확인할 점:
  - ui-audit `chatAlign` 의 맥락 줄 기준은 '첫 조작 요소'(`SegmentedControl` 첫 버튼)다. `SegmentedControl` 상자에 `p-0.5` 가 있어 첫 버튼 왼쪽 끝이 열 왼쪽 끝보다 2px 안쪽이다 (허용 1px). 이 단계는 보이는 가장자리(토글 상자 배경)를 열에 맞췄다. 27 측정에서 2px 어긋남으로 실패하면 판정 기준(첫 조작 요소 → 맥락 줄 첫 자식 상자)을 19 의 연장으로 볼지, 화면에 `-ml-0.5` 를 줄지 정해야 한다. `SegmentedControl`·`ui-audit.mjs` 는 이 단계 파일이 아니라 고치지 않았다.
  - 21 의 composer 알림 영역 안쪽은 `mx-auto max-w-3xl px-4 md:px-6` 라서 넓은 화면에서 알림 폭이 메시지 열(768)보다 48px 좁다 (열 안이라 `toast` 판정은 통과할 것). 부품 문제로 보지 않아 고치지 않았다.
  - 23단계 진행 중인 변경으로 tsc 와 피드 테스트 6개가 실패 중 (위 검사 결과).

## 다음
- 메인 세션: 관문 G4 에서 `make check`. 27 의 프로덕션 측정에서 `chatAlign`·`toast`·`ariaControls`·`keepAll` 확인 (위 2px 항목 포함).
