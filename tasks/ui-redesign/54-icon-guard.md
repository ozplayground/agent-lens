# Task 54: IconGuard 정적 검사·이모지 제거 확인

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 54 (보정 9)
Status: done
Session: main
Agent: a4298b1aa5033196d (implementer G)
Updated: 2026-11-07

## 한 일
- 새 정적 검사 `frontend/src/tests/ui/IconGuard.test.ts` 를 썼다 (`TokenGuard.test.ts` 와 같은 방식: `// @vitest-environment node`, `node:fs` 로 `src/components/**`·`src/app/**` 의 `.ts`·`.tsx` 를 모음).
  - 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu` (전역 플래그로 센다). 허용 목록 없음.
  - 실패 메시지는 `파일:줄 글자(U+XXXX)` 목록이다 (U+FE0F 가 붙으면 두 코드 포인트를 함께 적는다).
  - 대상 파일이 0개면 실패한다: `components` 와 `app` 아래에 각각 파일이 하나 이상 있고 전체 50개를 넘어야 한다.
  - 판정식 자체를 확인하는 단언: `💡🔄📊⚡🎯🧠🔒` 7개, `🛠️⚖️⚠️` 3개는 걸리고 `© ® ↔ ➔ ✓` 는 0개다.
- 고치기 전 작업 트리(51~53 이 이모지를 지우기 전)에서 실행해 실패를 확인했다. 목록이 plan 의 예상(다섯 파일 16글자)과 정확히 같다. 이 파일만 경로를 지정해 커밋했다: `ca1ae9f`.
- 앱 코드는 고치지 않았다. 통과는 51·52·53 이 만들고 관문 G22 에서 확인한다.

## 바꾼 파일
- `frontend/src/tests/ui/IconGuard.test.ts` (새 파일)

## 검사 결과
- `cd frontend && pnpm exec vitest run src/tests/ui/IconGuard.test.ts` (고치기 전, 예상한 실패):
  ```
   FAIL  src/tests/ui/IconGuard.test.ts > IconGuard (R44) > has no pictographic emoji in UI source text
  AssertionError: expected [ …(16) ] to deeply equal []
  + [
  +   "components/DailyBriefingModal.tsx:358 💡(U+1F4A1)",
  +   "components/NewsDetailModal.tsx:200 ⚠️(U+26A0 U+FE0F)",
  +   "components/chat/ChatMessageList.tsx:22 💡(U+1F4A1)",
  +   "components/chat/ChatMessageList.tsx:23 🔄(U+1F504)",
  +   "components/chat/ChatMessageList.tsx:24 📊(U+1F4CA)",
  +   "components/chat/ChatMessageList.tsx:25 ⚡(U+26A1)",
  +   "components/chat/ModelTierBadge.tsx:22 ⚡(U+26A1)",
  +   "components/chat/ModelTierBadge.tsx:32 🎯(U+1F3AF)",
  +   "components/chat/ModelTierBadge.tsx:42 🧠(U+1F9E0)",
  +   "components/chat/ModelTierBadge.tsx:74 ✨(U+2728)",
  +   "components/chat/ModelTierBadge.tsx:74 🤖(U+1F916)",
  +   "components/chat/ModelTierBadge.tsx:74 🎯(U+1F3AF)",
  +   "components/news-detail/AskAiPanel.tsx:51 💡(U+1F4A1)",
  +   "components/news-detail/AskAiPanel.tsx:56 🛠️(U+1F6E0 U+FE0F)",
  +   "components/news-detail/AskAiPanel.tsx:61 ⚖️(U+2696 U+FE0F)",
  +   "components/news-detail/AskAiPanel.tsx:66 🔒(U+1F512)",
  + ]
   Test Files  1 failed (1)
        Tests  1 failed | 2 passed (3)
  ```
- `pnpm exec eslint src/tests/ui/IconGuard.test.ts` → 출력 없음, exit 0
- `pnpm exec tsc --noEmit` 출력에서 `IconGuard` 를 grep → 0줄

## 결정
- 판정식 단언(이모지는 걸리고 텍스트 표현 기호는 걸리지 않음)을 따로 두었다. 이렇게 하면 판정식이 넓어지거나 좁아져도 바로 드러나고, 허용 목록 없이 `©`·`↔`·`➔`·`✓` 를 통과시키는 근거가 테스트에 남는다. E45 의 '테스트 실행으로 확인' 도 이 단언이 맡는다.
- 대상 파일 수는 `TokenGuard` 와 같은 하한(50 초과)을 쓰고, 두 디렉터리가 각각 비지 않았는지도 확인한다.

## 막힌 점
- 없음. 이 테스트는 51·52·53 이 끝날 때까지 실패하는 것이 정상이다 (G22 에서 통과 확인).

## 다음
- 관문 G22: 51·52·53 구현 뒤 `pnpm exec vitest run src/tests/ui/IconGuard.test.ts` 가 통과하는지 확인한다.
