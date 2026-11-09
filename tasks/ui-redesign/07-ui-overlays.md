# Task 07: 공통 부품: 오버레이

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 7
Status: done
Session: implementer C
Agent: abc3094397c406b58
Updated: 2026-11-06

## 한 일
- `lib/overlay-stack.ts`: `overlayStack.push/remove/getLayers/getTop/isTop/subscribe`, `useOverlayOpen()`, `useTopOverlayId()`, `useOverlayLayer({open, kind, onEscape, elementRef})`. 스택이 비어 있지 않을 때만 `window` keydown 리스너를 달고 비면 뗀다. Escape(IME 조합·`keyCode 229`·이미 `defaultPrevented` 제외)는 맨 위 `onEscape` 만 부르고 `preventDefault`. 모달이 있으면 `#app-shell` 과 맨 위가 아닌 모달 요소에 `inert` 를 DOM 에 바로 달고 뗀다 (스택이 단 것만 뗀다). 언마운트·`open=false` 면 스택에서 빠진다.
- `hooks/useFocusTrap.ts`(+ `getFocusableElements`), `hooks/useScrollLock.ts`(참조 수), `hooks/useHotkey.ts`(`mod+k` 등, `e.key` 또는 `e.code`, IME 무시, `allowInInputs`, `enabled`).
- `components/ui/Dialog.tsx`: `div role="dialog"` + `createPortal(document.body)`. spec 2 API + 선택 props `closeLabel`, `backdropTestId`, `ariaLabel`, `header`+`labelledBy`, `panelProps`, (내부) `role`, `className`, `bodyClassName`. 바텀시트 100px 끌어 닫기 공통. 공통 프레임 `ModalFrame` 을 `Drawer.tsx`·`ConfirmDialog.tsx` 가 쓴다.
- `ConfirmDialog`: `alertdialog`, 처음 포커스 취소, `busy` 면 두 버튼 비활성·Escape·배경막·닫기 무시, `error` 는 `InlineAlert`.
- `Menu.tsx`(`MenuButton`, 별칭 `Menu`), `Popover.tsx`(+ `useOutsidePointerDown`, 포털 없이 `absolute`, 기본 `top-full`), `Toast.tsx`(`ToastRegion`, `useToast`, `showToast`, `dismissToast`, `clearToasts`. 처음 마운트된 영역 하나만 그림, 포털), `ThemeMenu.tsx`.
- `ThemeToggle.tsx`: `IconButton` + 토큰, 이름 `테마 전환`·title 문구 유지, `showDropdown` 이면 `ThemeMenu`. 프로바이더 없이도 동작.
- `app/layout.tsx`: `<ToastRegion />` 를 `#app-shell` 뒤(ThemeProvider 안)에 마운트.
- 테스트 4개 파일 (spec 2.1·plan 07 항목 그대로).

## 바꾼 파일
- frontend/src/lib/overlay-stack.ts (새)
- frontend/src/hooks/useFocusTrap.ts, useScrollLock.ts, useHotkey.ts (새)
- frontend/src/components/ui/Dialog.tsx, Drawer.tsx, ConfirmDialog.tsx, Menu.tsx, Popover.tsx, Toast.tsx, ThemeMenu.tsx (새)
- frontend/src/components/ThemeToggle.tsx
- frontend/src/app/layout.tsx
- frontend/src/tests/ui/OverlayStack.test.tsx, Dialog.test.tsx, Menu.test.tsx, Toast.test.tsx (새)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/ui/OverlayStack.test.tsx src/tests/ui/Dialog.test.tsx src/tests/ui/Menu.test.tsx src/tests/ui/Toast.test.tsx src/tests/ThemeSystem.test.tsx`
  `Test Files  5 passed (5)` / `Tests  45 passed (45)`
- `pnpm exec eslint <위 바꾼 파일 17개>`: 출력 없음, `eslint exit=0`
- `pnpm exec tsc --noEmit`: 출력 없음, `tsc exit=0`
- 참고 `pnpm test` 전체 (06 진행 중 트리): `Test Files  32 passed (32)` / `Tests  332 passed (332)`

## 결정
- `inert` 는 React prop 대신 스택이 DOM 에 직접 단다: 위 대화상자가 닫힐 때 포커스 복귀 전에 아래 대화상자·`#app-shell` 의 `inert` 가 풀려야 해서 (React 재렌더를 기다리면 복귀 대상이 아직 inert).
- `ModalFrame` 에서 `useOverlayLayer` 를 `useFocusTrap` 보다 먼저 선언: 정리 순서상 `inert` 해제 → 포커스 복귀.
- 스택 순서는 열린(effect) 순서다. 부모·자식 대화상자가 같은 커밋에 함께 열리면 자식 effect 가 먼저 돌아 아래에 깔린다 — 겹친 대화상자는 사용자 동작으로 나중에 열어야 한다 (design-system.md 에 적을 것).
- 이미 `defaultPrevented` 인 Escape 는 스택이 무시한다 (안쪽 요소가 Escape 를 직접 처리한 경우).
- `useHotkey` 의 `shift` 는 적었을 때만 확인, `meta`·`ctrl`·`alt` 는 정확히 일치 (`mod` 는 둘 중 하나).
- 메뉴 열린 직후 포커스는 ref 콜백에서 한 번만 (effect 안 setState 금지 규칙, 재렌더 때 포커스 이동 방지).

## 막힌 점
- 없음. 5단계 부품은 바꾸지 않았다.

## 다음
- 관문 G1 (05~08 done 뒤, 메인 세션). `useHotkey` 전용 테스트는 plan 07 목록에 없어 두지 않았고 09 의 `Header`·`HotkeyGating` 테스트가 다룬다.
- 17 단계 design-system.md 에 위 '결정' 의 스택 순서·`inert` 방식·선택 props 를 적는다.
