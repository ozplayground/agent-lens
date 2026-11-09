# Task 14: 챗 메시지·입력

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 14
Status: done
Session: implementer E
Agent: a564b03defe6def6d
Updated: 2026-11-06

## 한 일
- 메시지 열(spec 6): `ChatMessageList` 는 `role="log" aria-live="polite"`·`overflow-x-hidden w-full max-w-full` 유지, 안쪽 열 `max-w-3xl`, 빈 화면(`AgentLens AI 챗 워크스페이스`, 제안 4개 `min-h-11`)을 토큰으로. `ChatMessageItem`: 사용자 말풍선 `bg-accent-soft text-fg`(아바타 제거), 답변은 배경 없이(`.rounded-2xl.p-4` + `flex-1 min-w-0 max-w-full` 유지, 640 미만 좌우 여백 0, 오류만 `bg-danger-soft`), 원문/보충 건수는 `Badge`, `답변 복사`는 `useCopyToClipboard` + 모바일 44px 아이콘 버튼, 완화 안내는 `InlineAlert warning`, 다시 시도는 `Button`. 인라인 코드 `break-all font-mono text-[12px] bg-surface-muted`, 코드 블록은 `ui/CodeBlock`(`code-block-wrapper`).
- `CitationBadge`: 보충 `[S1]` 은 `text-success` + 안쪽 알약 `bg-success-soft` + `data-tone="supplementary"`(원문은 `data-tone="primary"`, `accent-soft`), `aria-haspopup="dialog"`, 모바일 누름 영역 44px(음수 세로 여백으로 줄 높이 유지). `CitationPopover`: `Popover role="dialog"`(배지를 `anchorRef` 로 받음, 선택 prop 추가), 자체 Escape·mousedown 리스너 제거, 카테고리 라벨은 `lib/labels.ts`.
- `WorkflowStepTracker`: 토큰, 머리줄 `.flex.items-center.gap-2.font-medium` 유지, 진행 막대 `bg-accent`, 접힘 버튼 `min-h-11 md:min-h-7`. `ExportToolbar`: `Button ghost sm` 3개, 768 미만은 글자를 `sr-only` 로 숨긴 44px 아이콘 버튼, 접근 이름 유지, 복사는 `useCopyToClipboard`(실패 시 `복사 실패`), `role="group"`. `ModelTierBadge`(`TIER_META` 의 색 필드를 토큰으로, 필드 이름 유지)·`ModelChangeDivider` 토큰.
- `ChatModelSelector`: `Popover role="radiogroup"`(헤더형은 아래·오른쪽 맞춤 `top-full`, 입력창형은 위), 자체 Escape·바깥 클릭 리스너 제거, 방향키·Home/End·Enter 는 감싼 요소에서 처리(Popover 가 `onKeyDown` 을 받지 않음), 트리거 `text-xs`·헤더칩 `font-semibold` 유지, 모바일 44px, props 불변.
- `ChatPromptInput`: `ui/Textarea`(라벨 `질문 입력` sr-only, `text-base md:text-sm` + `sm:text-sm`, 최대 180px), 전송·중단 `IconButton`(모바일 44px), 안내 `Enter: 전송, Shift+Enter: 줄바꿈` 은 lg 이상만, placeholder 에서 안내 제거. 범위 표시(`Scoped Focus`/`Global RAG`)는 맥락 줄과 겹쳐 뺐다.
- `FocusCapsule`: 버튼 안 버튼(div role=button + button)을 형제 버튼 둘로, 모바일 44px. `FocusBottomSheet`: `Dialog size="sm" mobile="sheet" closeLabel="필터 닫기" backdropTestId="bottom-sheet-backdrop"`, 제목 `수집 소식 타깃팅 포커스 필터`, `Chip`/`ChipGroup`, `Switch`(이름 `Must-Read 고신호 전용 토글`), 결과 `Badge`/`InlineAlert`, 바닥 `초기화`·`적용하기`. 자체 Escape·스와이프 코드 제거(Dialog 공통 동작).
- `MarkdownViewer`: 토큰, 모든 폭 `text-sm`(14px), `.markdown-viewer`·`.table-wrapper`·줄바꿈 클래스 유지, 코드는 새 `MarkdownCode`(블록 → `ui/CodeBlock` + `code-block-wrapper`). 옛 `CodeBlock` 이름 내보내기는 지웠다(쓰던 곳은 `ChatMessageItem` 하나).
- 테스트 단언 변경 (plan '증명' 표 그대로): `ChatMessageItem.test.tsx:188`, `:266`, `CitationBadge.test.tsx:99-100`, `ChatWorkspace.test.tsx:261`. 줄 수를 바꾸지 않으려고 두 단언을 한 줄에 둔 곳이 있다.

## 바꾼 파일
- frontend/src/components/chat/ChatMessageList.tsx
- frontend/src/components/chat/ChatMessageItem.tsx
- frontend/src/components/chat/CitationBadge.tsx
- frontend/src/components/chat/CitationPopover.tsx
- frontend/src/components/chat/WorkflowStepTracker.tsx
- frontend/src/components/chat/ExportToolbar.tsx
- frontend/src/components/chat/ModelTierBadge.tsx
- frontend/src/components/chat/ModelChangeDivider.tsx
- frontend/src/components/chat/ChatModelSelector.tsx
- frontend/src/components/chat/ChatPromptInput.tsx
- frontend/src/components/chat/FocusCapsule.tsx
- frontend/src/components/chat/FocusBottomSheet.tsx
- frontend/src/components/MarkdownViewer.tsx
- frontend/src/tests/chat/ChatMessageItem.test.tsx (188, 266행)
- frontend/src/tests/chat/CitationBadge.test.tsx (99~100행)
- frontend/src/tests/chat/ChatWorkspace.test.tsx (261행)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/chat/ChatMessageItem.test.tsx src/tests/chat/ChatMessageList.test.tsx src/tests/chat/CitationBadge.test.tsx src/tests/chat/WorkflowStepTracker.test.tsx src/tests/chat/ExportToolbar.test.tsx src/tests/chat/ChatModelSelector.test.tsx src/tests/chat/ChatPromptInput.test.tsx src/tests/chat/FocusCapsule.test.tsx src/tests/chat/FocusBottomSheet.test.tsx src/tests/ResponsiveLayout.test.tsx src/tests/AskAiPanel.test.tsx`
  ```
  Test Files  11 passed (11)
       Tests  78 passed (78)
  ```
- `pnpm exec eslint <바꾼 16개 파일>`: `✖ 1 problem (0 errors, 1 warning)` — 경고는 `ChatWorkspace.test.tsx:444` 의 기존 `'init' is defined but never used` (이 단계가 만든 것 아님). 종료 코드 0.
- `pnpm exec tsc --noEmit`: 출력 없음, 종료 코드 0.
- 참고 (2026-11-06 이 시점 작업 트리): `pnpm exec vitest run src/tests/chat src/tests/modals` → 22 파일 234 테스트 통과, `pnpm exec vitest run` 전체 → 38 파일 375 테스트 통과 (`ChatWorkspace.test.tsx` 포함).
- 바꾼 컴포넌트 13개에서 팔레트 색·hex·`dark:`·`animate-in`·`text-[10px]/[11px]` grep 결과 없음.

## 결정
- `답변 복사` 는 `ExportToolbar` 로 옮기지 않고 답변 머리줄에 둔다: `ChatMessageItem.test.tsx` 가 `답변 복사` 단일 조회 + `onCopy` 를 기대하고, `ExportToolbar` 단독 테스트는 3개 버튼만 본다. 네 접근 이름은 모두 유지된다.
- 인용 배지는 모바일 44px 를 위해 버튼을 투명한 44px 상자(`max-md:min-h-11 min-w-11 -my-3.5`)로 두고 색 알약을 안쪽 span 에 그렸다. 글자색(`text-success`/`text-accent-soft-fg`)과 `data-tone` 은 버튼에 있다.
- `TIER_META` 의 `badgeBg`/`textColor`/`borderColor` 값을 토큰으로 바꿨다 (opus 는 맞는 보라 토큰이 없어 `surface-muted`/`fg`/`border`).
- `MarkdownViewer` 는 인라인 코드에 `text-xs`, `ChatMessageItem` 만 `text-[12px]` (spec 의 유일한 예외).

## 막힌 점
- 없음. 공통 부품 관련 메모: `Popover` 는 `onKeyDown`·ref 를 넘기지 않아 `ChatModelSelector` 는 감싼 요소에서 키를 받는다(동작 문제 없음). 인용 팝오버는 `<p>` 안에 `div` 로 그려진다(기존과 같은 중첩, `Popover` 가 포털을 쓰지 않음).

## 다음
- G2 관문에서 메인 세션이 전체 검사(`pnpm test && pnpm lint && pnpm exec tsc --noEmit`, `make build`)와 커밋.
