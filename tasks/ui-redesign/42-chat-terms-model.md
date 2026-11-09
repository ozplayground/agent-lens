# Task 42: 챗 용어·모델 선택 한 곳·포커스 시트 라벨

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 42 (보정 7)
Status: done
Session: main
Agent: ae45fb4787df1dd15 (implementer F)
Updated: 2026-11-07

## 한 일
- 먼저 실패하는 테스트를 썼다. 표의 줄 변경과 새 단언을 넣고 예상 이유로 실패하는 것을 확인한 뒤 테스트 6파일만 경로를 지정해 커밋했다 (`8b451d5`).
  - `ChatHeader.test.tsx`
    - `:71-90` 은 헤더에 모델 선택이 없다는 단언으로 바꿨다. 예전 모델 prop 을 `as object` 로 넘겨도 `queryByRole('button', { name: /Claude 모델 선택/ })` 가 null 이어야 한다. 그래야 고치기 전에 실패한다.
    - `:92-105` 는 지웠다.
    - 새 단언: `검색 스코프 모드` 그룹의 두 버튼 글자가 정확히 `['단일 기사', '전체 소식']`. 접근 이름이 정확히 일치해야 하고, `Scoped|Global|코퍼스` 가 없어야 한다.
  - `ChatPromptInput.test.tsx` (추가만): 트리거에 `Sonnet 5.5`, `Haiku 5.5` 를 고르면 `onSelectTier('haiku')`, `isStreaming` 이면 `disabled`. 이미 통과하는 '옮긴 단언'이다 (plan 의 예상대로).
  - `ChatWorkspace.test.tsx`
    - `:55` 는 `전체 소식 모드`, `:142` 는 `하네스 & 벤치마크` 로 바꿨다.
    - `:295-321` 은 제목 `shows a single model selector under the composer and reflects tier changes immediately (R39)` 로 바꿨다. 트리거는 1개, 처음 값은 `Sonnet 5.5`, 질문 입력창 뒤(DOM 순서)에 있어야 하고, Haiku·Opus 를 고르면 바로 반영돼야 한다.
  - `FocusBottomSheet.test.tsx`
    - `:41-42`, `:90` 을 바꿨다.
    - 새 단언: 칩 글자 순서가 `['전체 소식', '하네스 & 벤치마크', 'MCP & 생태계', '에이전트 아키텍처', '최신 AI 동향']` 이고 예전 라벨이 없어야 한다.
  - `FocusCapsule.test.tsx`: 제목 `:8`·`:48` 과 `:140` 을 `포커스: 전체 소식` 으로 바꿨다.
  - `ChatSidebar.test.tsx`
    - `:256` 을 `getByText('단일 기사')` 로 바꿨다.
    - 새 단언: `global` 세션의 배지가 `전체 소식`, 접근 이름 끝이 `전체 소식 모드`/`단일 기사 모드`, `Scoped|Global` 글자 없음.
- 구현: 처음에는 표 밖 단언이 깨져 커밋하지 않고 blocked 로 두었다. 메인 세션이 안 A 를 골랐고 spec `17b6bc9`·plan `ee9a45d` 정정이 승인됐다. 그 뒤 plan 표대로 `ChatSessionWorkflow.test.tsx:58` 을 `getByRole('button', { name: '단일 기사' })` (정확 일치)로 바꾸고, 구현 7파일과 함께 경로를 지정해 커밋했다 (`738425e`). `:59` 의 `aria-pressed` 단언은 그대로다. 바꾼 내용:
  - `ChatContextBar.tsx`: 탭 라벨을 `scopeLabel('scoped')`·`scopeLabel('global')` 로 바꿨다. 그룹 이름 `검색 스코프 모드` 는 그대로다.
  - `SessionItemCard.tsx`: 배지 글자를 `scopeLabel(mode)` 로, 접근 이름 끝을 `${scopeLabel(mode)} 모드` 로 바꿨다.
  - `FocusCapsule.tsx`: 앞말을 `포커스:` 로, 기본값을 `ALL_CATEGORY_LABEL` 로 바꿨다.
  - `FocusBottomSheet.tsx`: 칩 표를 `[{ id: 'all', label: ALL_CATEGORY_LABEL }, ...(4개 id).map((id) => ({ id, label: categoryLabel(id) }))]` 로 바꿨다.
  - `ChatHeader.tsx`: 모델 선택과 자체 인터페이스의 `selectedTier`·`onSelectTier`, 그리고 `ChatModelSelector`·`ModelTier` import 를 지웠다.
  - `ChatWorkspace.tsx`
    - 헤더로 모델을 넘기던 줄을 지웠다. 입력창 쪽 전달(`selectedTier`·`onSelectTier`)은 그대로다.
    - `SOURCE_NOT_FOUND_MESSAGE` 를 `요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다.` 로 바꿨다.
  - `ChatMessageList.tsx`: `수집된 소식 기반의`.
  - `types/chat.ts`, `ChatPromptInput.tsx`, `ChatModelSelector.tsx` 는 고치지 않았다.

## 바꾼 파일
- 커밋됨 (`8b451d5`), 모두 `frontend/src/tests/chat/` 아래: `ChatHeader.test.tsx`, `ChatPromptInput.test.tsx`, `ChatWorkspace.test.tsx`, `FocusBottomSheet.test.tsx`, `FocusCapsule.test.tsx`, `ChatSidebar.test.tsx`
- 커밋됨 (`738425e`): `frontend/src/components/chat/` 아래 `ChatContextBar.tsx`, `SessionItemCard.tsx`, `FocusCapsule.tsx`, `FocusBottomSheet.tsx`, `ChatHeader.tsx`, `ChatWorkspace.tsx`, `ChatMessageList.tsx`, 그리고 `frontend/src/tests/chat/ChatSessionWorkflow.test.tsx` (`:58` 만, plan 보정 7 정정)

## 검사 결과
- 고치기 전 (실패 테스트 6파일, `8b451d5`): `Tests  11 failed | 53 passed (64)`. 모두 예상한 이유로 실패했다. 대표:
  - 헤더 모델 선택: `expected <button type="button" …(5)>…(4)</button> to be null`
  - 스코프 탭 글자: `expected [ '단일 기사 (Scoped)', '전체 코퍼스 (Global)' ] to deeply equal [ '단일 기사', '전체 소식' ]`
  - 세션 배지: `Unable to find an element with the text: 단일 기사` / `… 전체 소식`
  - 없는 기사 알림: `Unable to find an element with the text: /요청하신 기사를 찾을 수 없어 전체 소식 모드로 시작합니다/i`
  - 포커스 시트: `Unable to find role="button" and name /하네스 & 벤치마크/`, `expected [ '전체 소식' ] to deeply equal [ '전체 소식', '하네스 & 벤치마크', …(3) ]`
  - 모델 트리거 수: `expected 2 to be 1`
  - 캡슐 앞말: `Unable to find an element with the text: 포커스: 전체 소식`
- 1차 구현 뒤 (막혔을 때): `ChatSessionWorkflow.test.tsx:58` 이 `Found multiple elements with the role "button" and name /단일 기사|Scoped/i` 로 실패했다 (탭과 세션 카드 `… 단일 기사 모드`). plan 정정 뒤 표대로 고쳤다.
- 마무리 뒤 끝 기준 `pnpm exec vitest run src/tests/chat src/tests/ui/FormControls.test.tsx src/tests/HotkeyGating.test.tsx`: `Test Files  20 passed (20)`, `Tests  255 passed (255)`.
- `cd frontend && pnpm test`:
  ```
   Test Files  50 passed (50)
        Tests  622 passed (622)
  ```
- `pnpm lint`: `✖ 41 problems (0 errors, 41 warnings)`, 종료 0. 바꾼 파일의 경고는 모두 전부터 있던 것이다.
- `pnpm exec tsc --noEmit`: 종료 0.
- 정적 확인:
  - `rg -n "\(Scoped\)|\(Global\)|>Scoped<|>Global<|Focus:|코퍼스" frontend/src/components/chat`: 출력 없음.
  - `rg -n "'하네스·평가'|'MCP·도구'|'에이전트 기술'|'AI 뉴스'" frontend/src/components` (정정본): 출력 없음.
  - `grep -n "selectedTier\|onSelectTier" frontend/src/components/chat/ChatHeader.tsx`: 출력 없음.
- `git diff -U0 HEAD -- frontend/src/tests | grep -E '^-[^-]'` (마무리 커밋 전): `ChatSessionWorkflow.test.tsx:58` 한 줄뿐.

## 결정
- 헤더의 '모델 선택 없음' 테스트는 예전 prop 을 넘겨 보고서 판정한다. prop 을 넘기지 않으면 고치기 전에도 통과해서 '먼저 실패' 가 되지 않는다. prop 은 인터페이스에서 지웠으므로 `as object` 로 퍼뜨려 tsc 를 통과시켰다.
- 표 밖 단언이 깨져 plan 규칙대로 구현 커밋 전에 멈췄다. 메인 세션이 안 A 로 정해 plan 이 정정·재승인됐다 (`ee9a45d`). 그 뒤 마무리했다.

## 막힌 점
- 없음. 이전에 막혔던 두 건은 안 A 로 풀렸다.
  - 1: `ChatSessionWorkflow.test.tsx:58` 을 표에 더하고 정확 일치로 바꿨다.
  - 2: R40 정적 확인 정규식을 따옴표 포함 형태로 좁혔다. `SessionEmptyState.tsx:48` 은 고치지 않는다.

## 다음
- 메인 세션: 관문 G18. 그 뒤 43 의 프로덕션 측정에서 `chatScope`·`terms`·`modelPicker`·`focusLabels` 를 확인한다.
