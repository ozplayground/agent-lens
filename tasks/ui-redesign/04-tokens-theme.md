# Task 04: 토큰·테마 기반

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 4
Status: done
Session: implementer D
Agent: a8cccceeeb8d0557d
Updated: 2026-11-06

## 한 일
- `globals.css`: `@custom-variant dark (&:where(.dark, .dark *))`, `:root`(라이트)·`.dark`(다크)에 spec 1.3 표의 `--al-*` 색 토큰 23개 전부와 그림자 변수 2개, `@theme inline` 에 `--color-*` 23개 + `--shadow-card`·`--shadow-overlay`, `@theme` 에 `--font-sans`·`--font-mono`(1.4)·`--ease-standard`·`--animate-*` 4개와 keyframes 4개, `@layer base`(body·`:focus-visible`·`::placeholder`·스크롤바). 옛 `:root`/`html.dark` 의 `--background`·`--foreground` 와 옛 `body` 규칙은 지웠다. 옛 `html:not(.dark)`·`html.dark` 덮어쓰기 블록 이하는 그대로 둔다 (15 에서 제거).
- `layout.tsx`: Geist·Geist Mono import·변수 클래스 제거, viewport 를 spec 8 그대로(`maximumScale`·`userScalable` 제거, `colorScheme`·`themeColor` 추가), `<head>` 인라인 테마 스크립트(spec 8 코드), `<html lang="ko" suppressHydrationWarning>`, `<body className="min-h-dvh bg-canvas text-fg overflow-x-hidden">`, `<div id="app-shell" className="flex min-h-dvh flex-col">`. `<ToastRegion />` 는 07 담당이라 넣지 않았다.
- `lib/theme-store.ts`(새): `createThemeStore(storageKey, defaultTheme)` 인스턴스(모듈 상태 없음). `getSnapshot` 은 매번 `localStorage` 와 `window.matchMedia(q).matches` 를 새로 읽어 `<mode>|<system>` 문자열을 돌려준다. `getServerSnapshot` = `${defaultTheme}|light`. 구독은 matchMedia `change`(없으면 `addListener`)·`storage`·같은 탭 window 이벤트 `agentlens:theme-change`. `applyThemeToDocument` 는 클래스 하나·`data-theme`·`style.colorScheme`.
- `context/ThemeContext.tsx`: `useSyncExternalStore` + `useLayoutEffect` 로 다시 씀. 내보내는 이름(`ThemeMode`, `Theme`, `ThemeContextType`, `ThemeProviderProps`, `ThemeProvider`, `useTheme`)과 props 유지. 순환 light→dark→system→light, 키 `agentlens_theme`.
- `tests/chat/MobileViewport.test.tsx:15,18-19`: plan 지정대로 이름 "allows user zoom", `maximumScale` → `toBeUndefined()`, `userScalable` → `not.toBe(false)`. 다른 단언 그대로.

## 바꾼 파일
- frontend/src/app/globals.css
- frontend/src/app/layout.tsx
- frontend/src/lib/theme-store.ts (새 파일)
- frontend/src/context/ThemeContext.tsx
- frontend/src/tests/chat/MobileViewport.test.tsx

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/ThemeSystem.test.tsx src/tests/chat/MobileViewport.test.tsx src/tests/CommandPalette.test.tsx`
  ```
   Test Files  3 passed (3)
        Tests  19 passed (19)
  ```
- `pnpm exec eslint src/app/layout.tsx src/lib/theme-store.ts src/context/ThemeContext.tsx src/tests/chat/MobileViewport.test.tsx` → 출력 없음, 종료 코드 0 (globals.css 는 eslint 대상이 아님: "File ignored" 경고만)
- `pnpm exec tsc --noEmit` → 출력 없음 (오류 0, 작업 트리 전체 기준)
- `grep -nE 'maximumScale|userScalable' src/app/layout.tsx` → 출력 없음
- Tailwind 컴파일 확인(scratchpad 에서 `@tailwindcss/postcss` 로 globals.css 컴파일): `.bg-canvas{background-color:var(--al-canvas)}`, `.shadow-card{--tw-shadow:var(--al-shadow-card)}`, `.bg-accent/10` color-mix, `motion-safe:animate-dialog-in`, `.dark` 변수 블록, base `body` 규칙 생성 확인.

## 결정
- 다크 `shadow-card` 값은 spec 의 `none` 대신 `0 0 #0000`(보이지 않는 그림자). Tailwind 4 가 `box-shadow: var(--tw-inset-shadow), …, var(--tw-shadow)` 목록에 넣으므로 `none` 이면 선언 전체가 무효가 된다 (컴파일 결과로 확인). 보이는 결과는 spec 과 같다. 17 단계 design-system.md 에 적을 것.
- 그림자 값도 테마를 따라야 해서 `--al-shadow-card`·`--al-shadow-overlay` 를 `:root`/`.dark` 에 두고 `@theme inline` 에서 연결했다.
- 같은 탭 알림은 모듈 리스너 집합 대신 window `CustomEvent`(`agentlens:theme-change`)로 해 모듈 상태를 두지 않았다 (제약 c). localStorage 키는 새로 만들지 않았다.
- localStorage 가 예외를 던지는 환경을 위해 저장소 인스턴스 안에 대체값을 둔다 (모듈 단위가 아님).
- `attribute` prop: `'class'` 면 클래스, 그 밖의 값이면 그 속성에 값을 단다. `data-theme`·`colorScheme` 은 항상 단다.

## 막힌 점
- 없음. 참고: `frontend/src/tests/setup.ts:22-24` 가 아직 `vi.mock('next/font/google', …)` 를 둔다. 이 단계 범위 밖(setup.ts 는 05 담당)이라 고치지 않았다. R12 의 `grep -rn 'next/font' frontend/src` 가 이 줄을 잡으므로 05 에서 지워야 한다 (plan 의 05 설명에 없으니 메인 세션이 판단).

## 다음
- 관문 G0: 메인 세션이 전체 `pnpm test && pnpm lint && pnpm exec tsc --noEmit` 와 `make build` 를 돈다 (Geist 제거로 빌드가 Google 글꼴을 받지 않는지 확인).
- 05: `setup.ts` 의 `next/font/google` 목 제거 검토.
