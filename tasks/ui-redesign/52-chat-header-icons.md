# Task 52: 챗 헤더 순서·모델 아이콘 lucide

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 52 (보정 9)
Status: done
Session: main
Agent: ae45fb4787df1dd15 (implementer F)
Updated: 2026-11-07

## 한 일
- 먼저 실패하는 테스트를 쓰고 세 테스트 파일만 경로를 지정해 커밋했다 (`9531e38`).
  - `ChatModelSelector.test.tsx`: spec 14.17 표의 `:22`·`:181`·`:189`·`:202` 를 표대로 바꿨다.
    - `:22`: 트리거 안 `[data-tier-icon="sonnet"]` 가 `svg` 이고 `aria-hidden="true"` 다. 트리거 글자에는 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` 에 걸리는 글자가 없다.
    - `:181`·`:189`: `[data-tier-icon="haiku"]`·`[data-tier-icon="sonnet"]` 가 있다.
    - `:202`: `showIcon={false}` 면 `[data-tier-icon]` 가 null 이다.
  - `ChatHeader.test.tsx` (추가): `onToggleHistoryDrawer` 를 주면 `피드로 돌아가기` 링크가 `대화 기록 보기` 버튼보다 DOM 앞에 있다. 헤더 안 첫 조작 요소(`a[href], button`)도 그 링크다.
  - `ChatMessageList.test.tsx` (추가)
    - 첫 추천 카드를 누르면 `onSelectPromptSuggestion('FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법')` 이 불린다.
    - 카드마다 앞 아이콘 `svg.text-accent[aria-hidden="true"]` 가 하나 있고, 그것이 카드의 첫 자식이다.
    - 카드 글자에 그림 이모지가 없다.
- 구현 커밋 (`fa71f42`)
  - `ChatHeader.tsx` (H1, R43): `Link`(`피드로 돌아가기`)를 기록 `IconButton` 앞으로 옮겼다. 클래스와 `aria-*` 는 그대로다. `ChatWorkspace.tsx` 는 고치지 않았다.
  - `ChatMessageList.tsx` (H2, R44)
    - `DEFAULT_SUGGESTIONS` 를 `{ icon, text }` 배열로 바꾸고 글자에서 이모지를 뺐다. 아이콘은 `Server`·`GitBranch`·`ChartColumn`·`TrendingUp` 이다.
    - 카드 앞에 `<Icon aria-hidden="true" className="size-4 shrink-0 text-accent" />` 를 그린다.
    - 클릭하면 `onSelectPromptSuggestion(text)` 를 부르고, key 는 `text` 다.
    - `text-left`·`data-chat-column` 은 그대로다.
  - `ModelTierBadge.tsx`
    - `TIER_META.icon` 타입을 `LucideIcon` 으로 바꿨다 (`haiku` `Zap`, `sonnet` `Target`, `opus` `Brain`).
    - 비 Claude 티어는 모듈 표 `OTHER_TIER_ICONS` 를 쓴다 (gemini `Sparkles`, gpt `Bot`, 그 밖 `Target`).
    - 새로 내보낸 `TierIcon({ tier, className })` 가 `<Icon aria-hidden="true" data-tier-icon={tier} className="size-3.5 shrink-0 …" />` 를 그린다.
    - 배지는 `showIcon` 일 때 `TierIcon` 을 쓴다. 이름·비용·지연 표시는 그대로다.
  - `ChatModelSelector.tsx`: 트리거는 `<TierIcon tier=… />`, 목록은 `<TierIcon tier={tier} className="mt-0.5 size-4" />` 를 쓴다.
  - `ModelChangeDivider.tsx` 는 `name` 만 써서 고치지 않았다.

## 바꾼 파일
- `frontend/src/tests/chat/ChatHeader.test.tsx`, `ChatMessageList.test.tsx`, `ChatModelSelector.test.tsx` (`9531e38`)
- `frontend/src/components/chat/ChatHeader.tsx`, `ChatMessageList.tsx`, `ModelTierBadge.tsx`, `ChatModelSelector.tsx` (`fa71f42`)

## 검사 결과
- 고치기 전 (세 테스트 파일): `Tests  5 failed | 27 passed (32)`.
  - 헤더 순서: `expected +0 to be truthy` (기록 버튼이 링크보다 앞이다).
  - 추천 질문: `expected "vi.fn()" to be called with arguments: [ 'FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법' ]` (이모지가 붙은 글자로 불린다).
  - `ChatModelSelector.test.tsx:22`·`:181`·`:189` 의 바뀐 단언: `expected null not to be null` (`[data-tier-icon]` 이 없다).
  - `:202`(`showIcon={false}` → `[data-tier-icon]` null)는 고치기 전에도 통과했다. 표가 바꾸는 줄이고 단언 세기가 같은 '실패 예상 아님' 줄이다.
- 고친 뒤 `pnpm exec vitest run src/tests/chat src/tests/ui/IconGuard.test.ts`: `Test Files  19 passed (19)`, `Tests  221 passed (221)`.
- IconGuard 의 52 몫은 0 이다.
  - 고치기 전 실패 목록에는 `components/chat/ChatMessageList.tsx:22~25` 4글자(💡🔄📊⚡)와 `components/chat/ModelTierBadge.tsx:22,32,42,74` 6글자(⚡🎯🧠✨🤖🎯)가 있었다.
  - 고친 뒤 `rg -c --pcre2 "\p{Emoji_Presentation}|\p{Extended_Pictographic}\x{FE0F}"` 를 두 파일에 돌리면 출력이 없다.
  - `IconGuard.test.ts` 는 `Tests  3 passed (3)` 이다. 다른 단계 몫까지 지금 작업 트리 기준으로 0 이다.
- 끝 기준
  - `rg -n --pcre2 "\p{Extended_Pictographic}" frontend/src/components/chat`: 출력 없음.
  - `grep -n "data-tier-icon" frontend/src/components/chat/ModelTierBadge.tsx`: `66:  return <Icon aria-hidden="true" data-tier-icon={tier} …`
  - `ChatHeader.tsx`: `href="/"` 는 102행, `대화 기록 보기` 는 113행 (102 < 113).
- 바꾼 7파일 eslint: 종료 0, 출력 없음.
  - 처음 구현은 `react-hooks/static-components` 오류("Cannot create components during render")가 나서 고쳤다. 렌더 중 함수가 돌려주는 컴포넌트를 쓰던 것을, 모듈 표를 속성으로 조회하는 방식으로 바꿨다.
- `pnpm exec tsc --noEmit`: 종료 2. 오류 2개는 모두 `src/tests/feed/FeedToolbar.test.tsx(7,9)`·`(303,5)` (`sort` 타입)이고 50단계의 진행 중 변경이다. 이 단계 파일의 오류는 0 이다.
- 전체 `pnpm test`: `Test Files  1 failed | 50 passed (51)`, `Tests  14 failed | 629 passed (643)`. 실패는 모두 `feed/FeedToolbar.test.tsx` 로 50단계 몫이다 (먼저 실패하는 테스트, 구현 진행 중).
- `pnpm lint` (구현 커밋 뒤): `✖ 41 problems (0 errors, 41 warnings)`, 종료 0. 첫 실행 때 오류 1개는 위 `ModelTierBadge.tsx` `static-components` 오류였고, 고친 뒤 0 이 됐다.

## 결정
- 추천 카드의 '`svg[aria-hidden="true"]` 하나' 는 카드 앞 아이콘 하나로 해석했다. 카드에는 원래 오른쪽 `ArrowRight` 장식 `svg` 가 있어서 고치기 전에도 `svg` 가 1개였다 (plan 의 '카드 안 svg 0개' 와 다르다). 그래서 앞 아이콘 `svg.text-accent` 가 정확히 하나이고 카드의 첫 자식인지를 단언한다.
- 티어 아이콘 마크업은 `ModelTierBadge.tsx` 의 `TierIcon` 하나로 모아 배지와 선택기가 함께 쓴다 (plan 의 '같은 마크업을 두 파일이 쓰면 작은 컴포넌트를 내보낸다').

## 막힌 점
- 없음. 다른 단계의 진행 중 변경(50 의 `FeedToolbar.test.tsx`)으로 전체 test·tsc 가 실패 중이다 (위 검사 결과).

## 다음
- 메인 세션: 관문에서 전체 `pnpm test && pnpm lint && pnpm exec tsc --noEmit` 를 다시 돌린다. 55 프로덕션 측정에서 `chatHeader`·`pictograph` 를 확인한다.
