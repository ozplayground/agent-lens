# Task 51: 카드 바닥 줄·이관 버튼·상세 탭 용어

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 51 (보정 9)
Status: done
Session: main
Agent: a665cef8caa94ac11 (implementer D2)
Updated: 2026-11-07

## 한 일
- 배치 증거: spec 14.17 H6 — 47단계 스크린샷 `audit/feed-light-1024x768.png` 에서 카드 바닥 줄이 아이콘만 보인다 (`compactBetweenLgXl`). H3 — `Ask AI 질의응답`·`챗에서 분석`(접근 이름 `전용 챗에서 분석`)·`전용 AI 챗으로 이동` 이 같은 동작을 다르게 부른다. 49 사전 측정의 `cardFooter`·`terms` 결과는 이 단계 시점에 49 task 에 아직 없어 인용하지 못했다.
- 실패 테스트 먼저 (`30d1b19`, 네 테스트 파일만 경로 지정):
  - 표의 줄만 바꿈:
    - `NewsCard.test.tsx:236-241`: 제목 `keeps the handover label visible at every width (R48)`, 이름 `AI 챗에서 분석`, 글자 클래스에 `sr-only` 없음, 버튼 묶음 `ml-auto`, 바닥 줄 `flex-wrap`
    - `HandoverIntegration.test.tsx:69,104` → `'AI 챗에서 분석'`(정확 일치), `:85,122` → `/^AI 챗에서 분석/`
    - `NewsDetailModal.test.tsx:76` → `/^AI 챗에서 분석/`, `:81,97,102,130,166,177,188,212` → `/^AI 질의응답/`, `:98,213` → `'핵심 원리 및 구조'` (`:102` 의 건수 `1` 단언은 그대로)
    - `AskAiPanel.test.tsx:47,67` → `'핵심 원리 및 구조'`
  - 새 단언:
    - `AskAiPanel.test.tsx` — 그룹 `빠른 질문` 의 버튼마다 `svg[aria-hidden="true"]` 1개, 라벨에 그림 문자 없음
    - `NewsCard.test.tsx` — 머리줄 카테고리 `span` 의 `title` 이 `categoryLabel(item.category)`(`하네스 & 벤치마크`)
  - import 줄: `NewsCard.test.tsx` 에 `categoryLabel`, `AskAiPanel.test.tsx` 에 `within`
- 구현 (`ad7d2c7`):
  - `NewsCard.tsx`: 바닥 줄 `flex flex-wrap items-center justify-between gap-x-2 gap-y-1`, 통계 묶음 `min-w-0` 삭제, 버튼 묶음 `ml-auto`, `compactBetweenLgXl` 전달 삭제, 머리줄 카테고리 `span` 에 `title={categoryLabel(item.category)}`(글자는 짧은 라벨 그대로)
  - `HandoverCtaButton.tsx`:
    - `card-compact`: 글자 `AI 챗에서 분석`, `aria-label` 삭제(접근 이름 = 보이는 글자), `title` `AI 챗에서 이 기사를 단일 기사 모드로 분석`
    - `modal-banner`: 제목 `AI 챗에서 분석`, 보조 문구 `이 기사를 단일 기사 모드로 열어 질의응답`
    - `compactBetweenLgXl` prop·JSDoc·클래스(`lg:max-xl:px-2`, `lg:max-xl:sr-only`) 삭제, 주석 새 이름
  - `NewsDetailModal.tsx`: 탭 `AI 질의응답`, 오류 답변 앞 `⚠️ ` 삭제
  - `AskAiPanel.tsx`: `QUICK_PROMPTS` 라벨 이모지 4개 삭제, 버튼 글자 앞에 `<p.icon aria-hidden="true" className="size-4" />`, `query` 그대로
  - 카드 고정 틀(`h-full`, `mt-auto`)은 그대로

## 바꾼 파일
- `frontend/src/components/NewsCard.tsx`
- `frontend/src/components/chat/HandoverCtaButton.tsx`
- `frontend/src/components/NewsDetailModal.tsx`
- `frontend/src/components/news-detail/AskAiPanel.tsx`
- `frontend/src/tests/NewsCard.test.tsx`
- `frontend/src/tests/chat/HandoverIntegration.test.tsx`
- `frontend/src/tests/modals/NewsDetailModal.test.tsx`
- `frontend/src/tests/AskAiPanel.test.tsx`

## 검사 결과
- 실패 테스트 (구현 전, 네 파일): `Tests 16 failed | 49 passed (65)`. 예상한 이유대로
  - AskAiPanel 2개: `Unable to find an element with the text: 핵심 원리 및 구조`
  - 빠른 질문 새 단언: `expected to have a length of 1 but got +0`
  - HandoverIntegration 4개·NewsCard R48: `Unable to find an accessible element with the role "button" and name "AI 챗에서 분석"` 또는 `/^AI 챗에서 분석/`
  - NewsCard R47: `toHaveAttribute("title", "하네스 & 벤치마크")` 실패
  - NewsDetailModal 7개: `Unable to find … role "tab" and name /^AI 질의응답/` 또는 `/^AI 챗에서 분석/`
- 끝 기준 vitest (`NewsCard`, `chat/HandoverIntegration`, `modals/NewsDetailModal`, `AskAiPanel`, `HotkeyGating`, `ui/Primitives`, `design`) → `Test Files 8 passed (8)`, `Tests 150 passed (150)`
- `rg -n "compactBetweenLgXl|전용 (AI )?챗|Ask AI 질의응답|lg:max-xl" frontend/src/components` → 출력 없음
- `rg -n --pcre2 "\p{Extended_Pictographic}" frontend/src/components/news-detail/AskAiPanel.tsx frontend/src/components/NewsDetailModal.tsx` → 출력 없음
- IconGuard 51 몫: node 로 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu` 를 센 결과 `NewsDetailModal.tsx 0`, `AskAiPanel.tsx 0`(전 1·4). `pnpm exec vitest run src/tests/ui/IconGuard.test.ts` → 3 passed (작업 트리 기준, 다른 단계 변경 포함)
- 바꾼 8개 파일 eslint → 오류 0
- `pnpm exec tsc --noEmit` → 오류는 `src/tests/feed/FeedToolbar.test.tsx(7,9)`·`(303,5)` 2건뿐 (50 진행 중, `sort` prop). 내 파일 오류 0
- `pnpm test` → `Test Files 2 failed | 50 passed (52)`, `Tests 18 failed | 630 passed (648)`. 실패는 `feed/FeedToolbar.test.tsx` 14, `feed/FeedStatusBar.test.tsx` 4 — 50 의 실패 테스트(구현 전). 51 파일 실패 없음
- `pnpm lint` → `✖ 41 problems (0 errors, 41 warnings)`
- 증명 ⑦ (내 네 파일): `git diff -U0 adf8581 -- <네 테스트 파일> | grep -E '^-[^-]'` → 표의 줄과 import 줄(`AskAiPanel.test.tsx:3`)뿐

## 결정
- 이관 버튼 글자는 `<span>` 하나로 남겼다. 클래스는 없다 (R48 단언이 그 글자 요소에 `sr-only` 가 없음을 본다).
- `AskAiPanel.tsx:91` 의 코드 주석 `Ask AI 탭 패널` 은 화면 글자가 아니라 그대로 두었다 (plan 의 rg 검사 대상 문자열 아님).
- 빠른 질문 아이콘은 `QUICK_PROMPTS` 에 이미 있는 `icon`(Cpu·Layers·Sparkles·ShieldCheck)을 그대로 쓴다.

## 막힌 점
없음. 전체 `pnpm test`·`tsc` 의 실패는 50(피드 툴바·상태 줄) 진행 중 상태라 G22 에서 다시 본다.

## 다음
G22 (메인 세션).
