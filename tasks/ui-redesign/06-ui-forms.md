# Task 06: 공통 부품: 폼·표시

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 6
Status: done
Session: implementer B
Agent: a7d62a4c682b3b182
Updated: 2026-11-06

## 한 일
- spec 설계 2 표의 폼·표시 부품을 새로 만들었다 (토큰 유틸리티만, named + default export, 묶음 index 없음).
  - `TextField`: `<label htmlFor>`(useId), `hideLabel` → `sr-only`, `description`·`error` → `aria-describedby`, `error` → `aria-invalid` + `text-danger`, `text-base md:text-sm`, `h-11 md:h-9`, `leadingIcon`, `trailing` 칸. 라벨 틀 `FieldFrame`·`useFieldIds`·필드 클래스를 함께 내보내 `Textarea`·`Select` 가 쓴다.
  - `SearchField`: `<form role="search">` + `type="search"`, Enter 시 `onSubmit(value)`, `onClear` 가 있고 값이 있으면 `IconButton label="검색어 지우기"`(누르면 입력창으로 포커스). form 에는 `aria-label` 을 달지 않았다 (`getByLabelText` 가 두 요소를 찾지 않게).
  - `Textarea`: 같은 라벨 규칙, 자동 높이(`autoResize` 기본 true, `maxHeight` 기본 240px, 넘으면 세로 스크롤), `ref` 는 `useImperativeHandle` 로 전달.
  - `Select`: 네이티브 `<select>` + `options`, `hideLabel`, 높이 `h-11 md:h-9`.
  - `Switch`: `button role="switch" aria-checked`, 보이는 라벨은 `aria-labelledby`, `hideLabel` 이면 `aria-label`. 누르는 영역 `h-11 min-w-11 md:h-9`.
  - `Chip`(`aria-pressed`, `count`, `h-11 md:h-8`, `rounded-full`) / `ChipGroup`(`role="group" aria-label`, `scrollable` 이면 한 줄 `overflow-x-auto overscroll-x-contain snap-x` + 양 끝 mask).
  - `SegmentedControl`: `role="group"` + 버튼 `aria-pressed`, 누르면 항상 `onChange(value)`.
  - `Tabs`/`TabPanel`: tablist/tab/tabpanel, `aria-selected`, `aria-controls`↔`aria-labelledby`, 로빙 tabIndex, ←/→ 순환·Home·End(자동 활성화 + 포커스 이동), 넘치면 가로 스크롤.
  - `Card`(`as`, `interactive`, `padding`), `Skeleton`(`aria-hidden`, `motion-safe:animate-pulse bg-surface-muted`), `EmptyState`, `ErrorState`(`role="alert"`, `다시 시도` Button).
  - `CodeBlock`: 언어(없으면 `snippet`), `useCopyToClipboard` 복사 버튼(`복사`/`복사됨`/`복사 실패`), `<pre tabIndex=0 aria-label="가로 스크롤 가능한 코드 블록" class="overflow-x-auto overscroll-x-contain">`, 틀에 `w-full max-w-full min-w-0 overflow-hidden` 기본 + `className`(MarkdownViewer 가 `code-block-wrapper` 를 넘김), `codeClassName`.
- `hooks/useCopyToClipboard.ts`: `copyText()` = clipboard.writeText → 없거나 실패하면 숨긴 textarea focus·select + `execCommand('copy')` → 실패면 false. 훅은 `status`(idle/copied/failed)·`label`·`copy`·`reset`, 결과를 2초 유지, 언마운트 시 타이머 정리.
- `lib/labels.ts`: `NewsCard` 의 `CATEGORY_NAMES`·`SOURCE_NAMES` 값을 그대로 `CATEGORY_LABELS`·`SOURCE_LABELS` 로, `categoryLabel()`·`sourceLabel()`(모르는 id 는 그대로, 프로토타입 키 무시). `NewsCard` 는 이 단계에서 고치지 않았다 (03·10 담당).
- 테스트 3개 파일 추가.
- 후속 (웨이브 2 커밋 5103778 뒤, 메인 요청):
  - `components/ui/Chip.tsx`: 선택 prop `tone?: 'accent' | 'warning'`(기본 `accent`)을 더했다. `warning` 이면 선택 상태가 `border-warning bg-warning-soft text-warning`, 건수 글자도 `text-warning`. 선택 안 됨 상태와 기존 API·동작은 그대로. spec 설계 4.1 Must-Read 칩용 (FeedToolbar 적용은 A 가 다음 단계에서 한다).
  - `lib/labels.ts`: `rss` 라벨을 `Blog` → `Global Blogs`(원래 피드 필터의 화면 문구)로 되돌렸다.
  - `tests/ui/FormControls.test.tsx`: Chip tone 테스트 1개 추가(기본 accent, `tone="warning"` 선택 시 warning 토큰·accent 없음, 선택 안 됨이면 warning 없음). `sourceLabel('rss')` 기대값을 `'Blog'` → `'Global Blogs'` 로 바꿨다 — 이 단계(06)에서 내가 쓴 단언이고, 요청이 바로 이 값을 바꾸는 것이라 기대값을 새 요구에 맞췄다. 이 라벨을 단언하는 다른 테스트는 없다 (grep).
  - 검사: `pnpm exec eslint src/components/ui/Chip.tsx src/lib/labels.ts src/tests/ui/FormControls.test.tsx` 종료 0, `pnpm exec tsc --noEmit` 종료 0, `pnpm exec vitest run src/tests/ui src/tests/feed` → `Test Files 10 passed (10)`, `Tests 104 passed (104)`.

## 바꾼 파일
- frontend/src/components/ui/TextField.tsx (새)
- frontend/src/components/ui/SearchField.tsx (새)
- frontend/src/components/ui/Textarea.tsx (새)
- frontend/src/components/ui/Select.tsx (새)
- frontend/src/components/ui/Switch.tsx (새)
- frontend/src/components/ui/Chip.tsx (새)
- frontend/src/components/ui/SegmentedControl.tsx (새)
- frontend/src/components/ui/Tabs.tsx (새)
- frontend/src/components/ui/Card.tsx (새)
- frontend/src/components/ui/Skeleton.tsx (새)
- frontend/src/components/ui/EmptyState.tsx (새)
- frontend/src/components/ui/ErrorState.tsx (새)
- frontend/src/components/ui/CodeBlock.tsx (새)
- frontend/src/hooks/useCopyToClipboard.ts (새)
- frontend/src/lib/labels.ts (새)
- frontend/src/tests/ui/Tabs.test.tsx (새)
- frontend/src/tests/ui/FormControls.test.tsx (새)
- frontend/src/tests/ui/useCopyToClipboard.test.tsx (새)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/ui/Tabs.test.tsx src/tests/ui/FormControls.test.tsx src/tests/ui/useCopyToClipboard.test.tsx` → `Test Files 3 passed (3)`, `Tests 36 passed (36)`
- `pnpm exec eslint <위 18개 파일>` → 출력 없음, 종료 0
- `pnpm exec tsc --noEmit` → 출력 없음, 종료 0
- 참고: 같은 시점 전체 `pnpm exec vitest run` → `Test Files 28 passed (28)`, `Tests 292 passed (292)` (07 단계의 진행 중 파일 포함)
- 바꾼 부품 파일에 팔레트 색·임의 글자 크기·`uppercase`·`tracking-`·`animate-in` 류 없음 (grep 확인).

## 결정
- `Tabs`·`TabPanel` 은 형제라서 id 를 맞추려고 둘 다 `idPrefix`(기본 `tabs`) 를 받는다. 요소 id 는 `${idPrefix}-tab-${id}`/`${idPrefix}-panel-${id}`. `TabPanel` 은 `active`(기본 true, false 면 `hidden`) — 선택된 패널만 그려도, 모두 그려도 된다. 한 화면에 탭 묶음이 둘 이상이면 서로 다른 `idPrefix` 를 줘야 한다 (design-system.md 에 적을 것).
- `Skeleton` 은 spec 1.2 "애니메이션은 `motion-safe:` 로만" 에 따라 `motion-safe:animate-pulse`.
- `SegmentedControl` 은 이미 선택된 버튼을 눌러도 `onChange` 를 부른다 (호출자가 판단. 기존 챗 스코프 토글 동작 유지).
- `CodeBlock` 은 `code` 문자열을 받는다. 끝 줄바꿈 하나를 빼고 복사한다 (지금 MarkdownViewer 와 같다).
- 공통 필드 도우미(`FieldFrame`, `useFieldIds`, `FIELD_CONTROL_CLASSES`)는 새 파일을 만들지 않고 `TextField.tsx` 에서 내보낸다.
- `copyWithExecCommand` 는 select 전에 textarea 에 focus 한다 (브라우저에서 선택이 확실히 잡히게. 테스트가 이 경로를 확인한다).

## 막힌 점
- 없음. 5단계 부품은 고치지 않았다. 지금 tsc 전체 오류 0.

## 다음
- 없음. 관문 G1 에서 메인 세션이 전체 검사·`make build`·커밋.
