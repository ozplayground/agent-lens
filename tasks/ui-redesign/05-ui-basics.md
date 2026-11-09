# Task 05: 공통 부품 기초

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 5
Status: done
Session: implementer A
Agent: af6e0d326aef729b0
Updated: 2026-11-06

## 한 일
- `lib/cn.ts`: `cn(...values)` — 거짓 값·빈 문자열을 빼고 공백으로 잇는다 (충돌 해소 없음).
- `components/ui/Button.tsx`: `variant`(primary·secondary·ghost·danger), `size`(sm·md·lg), `loading`, `leadingIcon`. 기본 `type="button"`, `loading` 이면 `disabled` + `aria-busy="true"` + 아이콘 자리에 `Spinner`. `buttonClasses(variant, size, className?)` 와 `BUTTON_VARIANT_CLASSES` 를 내보낸다. 높이: 모바일 `h-11`, md 이상 `md:h-9` (sm 은 `md:h-8`, lg 는 `h-12 md:h-10`).
- `components/ui/IconButton.tsx`: `label` 필수 → `aria-label`·`title`, `pressed` 를 주면 `aria-pressed`. 크기 `size-11 md:size-9` (sm `md:size-8`). 기본 variant `ghost`, 눌림 상태는 `bg-accent-soft text-accent-soft-fg`.
- `components/ui/Spinner.tsx`: `LoaderCircle` `animate-spin`, `aria-hidden`, `label` 이 있으면 `sr-only` 글자.
- `components/ui/InlineAlert.tsx`: `tone`(info·success·warning·danger), `title?`, `action?`. `danger` 는 `role="alert"`, 나머지 `role="status"`. 색은 `*-soft` 배경 + 같은 계열 글자 (spec 1.3 의 대비 표 조합).
- `components/ui/Badge.tsx`: `tone`(neutral·accent·success·warning·danger), `icon?`. `h-6 rounded-full text-xs`.
- `components/ui/Kbd.tsx`: `<kbd>`, `hidden sm:inline-flex` (640px 미만 숨김).
- `hooks/useMediaQuery.ts`: `useSyncExternalStore`. 스냅샷은 매번 `window.matchMedia(query).matches` 를 새로 읽는다. `matchMedia` 가 함수가 아니면 false, 서버 스냅샷 false. `change` 구독 (`addEventListener` 없으면 `addListener`).
- `tests/setup.ts`: 기본 `window.matchMedia` 목 추가 (`Object.defineProperty`, writable·configurable). 너비 1280 가정: `(min-width: Npx)` N≤1280 true, `(max-width: Npx)` N≥1280 true, `screen`/`all` true, 그 밖(`prefers-color-scheme`, `prefers-reduced-motion` 등) false. `and`·쉼표 조합 처리. 리스너 함수는 빈 함수. 메인 결정대로 `next/font/google` 목을 지웠다.
- `tests/ui/Primitives.test.tsx` (15 테스트): `cn`, `Button` 기본 type·명시 type·`loading` 시 disabled+aria-busy·`buttonClasses`, `IconButton` aria-label·title·aria-pressed(true/false/없음), `Spinner` sr-only, `InlineAlert` alert/status, `Badge`, `Kbd`, `useMediaQuery` 기본 목(true/false)·테스트가 바꾼 목·`matchMedia` 부재 시 false.

## 바꾼 파일
- frontend/src/lib/cn.ts (새)
- frontend/src/hooks/useMediaQuery.ts (새)
- frontend/src/components/ui/Button.tsx (새)
- frontend/src/components/ui/IconButton.tsx (새)
- frontend/src/components/ui/Spinner.tsx (새)
- frontend/src/components/ui/InlineAlert.tsx (새)
- frontend/src/components/ui/Badge.tsx (새)
- frontend/src/components/ui/Kbd.tsx (새)
- frontend/src/tests/setup.ts
- frontend/src/tests/ui/Primitives.test.tsx (새)

## 검사 결과
`cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` — 세 명령 모두 종료 코드 0.
```
 Test Files  25 passed (25)
      Tests  256 passed (256)
test exit 0

✖ 63 problems (0 errors, 63 warnings)
lint exit 0
tsc exit 0
```
- 테스트 수: 기준 241 + 새 Primitives 15 = 256. 기존 테스트 단언은 바꾸지 않았다.
- 새 파일만 eslint: 출력 없음 (경고도 0).
- `grep -rn "next/font" src` → 없음.

## 결정
- (메인, 2026-11-06) 4단계에서 layout.tsx 의 Geist import 를 지웠다. `tests/setup.ts:22-24` 의 `next/font/google` 목은 이제 쓰이지 않으므로 이 단계에서 setup.ts 를 고칠 때 함께 지운다 (R12 의 next/font grep). → 지웠다.
- 부품은 named export(`export function Button`)와 default export 를 함께 둔다. 묶음 `index.ts` 는 두지 않는다.
- `InlineAlert` tone 이름은 `info|success|warning|danger` (spec 은 `tone` 만 적었다). `info` 는 accent-soft 색이다. 오류가 아닌 결과 표시를 낭독기가 알리도록 `role="status"` 를 붙였다.
- setup.ts 의 목 도우미 함수는 내보내지 않는다 (setup 파일을 다른 테스트가 import 하지 않게).
- `Button` 의 `sm` 도 모바일에서는 44px(`h-11`)이고 md 이상에서만 32px 이다 (spec 1.6 "sm 은 md 이상 밀집 영역에서만", R6).

## 막힌 점
- 없음.

## 다음
- 없음. 06(폼·표시)·07(오버레이)이 이 부품과 `cn`, `useMediaQuery` 를 쓴다. 관문 G1 은 메인 세션.
