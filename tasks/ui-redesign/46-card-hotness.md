# Task 46: NewsCard 합성 소스 인기 점수 숨김

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 46 (보정 8)
Status: done
Session: main
Agent: a665cef8caa94ac11 (implementer D2)
Updated: 2026-11-07

## 한 일
- 배치 증거: spec 14.16 근거 — 보정 7 뒤 `audit/feed-light-1440x900.png` 에서 `국내 테크` 카드 5장이 점수 없이 `🔥 100` 만 같은 값으로 보인다. 인기 점수는 `raw_score` 에서 계산된다(`categorizer.py:139-147`). 45 사전 측정의 `cardMetric` ⑤ 결과는 이 단계 시점에 45 task 에 아직 없어 인용하지 못했다.
- 실패 테스트 먼저 (`355ff0b`, `NewsCard.test.tsx` 만):
  - plan 보정 8 표의 두 곳: `:328-329` 주석 '인기 점수도 합성 값이라 숨긴다 (R41)' + `expect(stat(container, 'hotness')).toBeNull()` + `expect(screen.queryByText('인기 점수')).toBeNull()` (`:321-327` 그대로). `:405` 소스 `rss_kr` → `github` (`:406-410` 그대로).
  - 새 `it.each` 2개: `rss_kr`·`rss`·`arxiv`·`huggingface`·`mystery` 에 `hotness_score: 84.6` → `[data-card-stat="hotness"]`·`인기 점수`·`85` 없음. `github`·`hackernews`·`reddit` → 인기 통계 있음, `sr-only` `인기 점수`, `85`.
- 구현 (`cfa9a5b`, `NewsCard.tsx`): `scoreKind` 선언을 앞으로 옮기고 `const showHot = scoreKind !== null && item.hotness_score > 25;` (TDZ 회피). 인기 통계 마크업·점수·개수 통계·카드 틀 그대로. `labels.ts`·`NewsDetailModal.tsx` 는 건드리지 않았다.

## 바꾼 파일
- `frontend/src/components/NewsCard.tsx`
- `frontend/src/tests/NewsCard.test.tsx` (표의 두 곳 + 추가)

## 검사 결과
- 실패 테스트 (구현 전, `pnpm exec vitest run src/tests/NewsCard.test.tsx`): `Tests 10 failed | 31 passed (41)`. 예상대로
  - `hides the synthetic raw_score for {rss_kr,rss,arxiv,huggingface,mystery}` 5개, `hides the hotness stat for … (R41)` 5개: `AssertionError: expected <span …(2)>…(3)</span> to be null` (소스와 상관없이 인기 통계를 그림)
  - `:405` github 변경과 지표 소스 3개는 통과 (예상대로 실패 아님)
- 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx src/tests/ui/FormControls.test.tsx src/tests/feed src/tests/modals/NewsDetailModal.test.tsx src/tests/design` → `Test Files 10 passed (10)`, `Tests 205 passed (205)`
- `grep -n "const showHot" frontend/src/components/NewsCard.tsx` → `92:  const showHot = scoreKind !== null && item.hotness_score > 25;`
- `grep -rn "hotness_score" frontend/src/components` → `NewsCard.tsx` 뿐 (92, 208)
- `pnpm exec eslint src/components/NewsCard.tsx src/tests/NewsCard.test.tsx` → 오류 0
- `pnpm test` → `Test Files 50 passed (50)`, `Tests 630 passed (630)` (기준 622 + 8)
- `pnpm lint` → `✖ 41 problems (0 errors, 41 warnings)` (기존 경고)
- `pnpm exec tsc --noEmit` → 종료 0
- 증명 ⑦: `git diff -U0 d444621 -- frontend/src/tests | grep -E '^-[^-]'` → 표의 세 줄(`:328` 주석, `:329`, `:405`)뿐
- R32: `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` → 0줄

## 결정
- 새 단언의 합성 소스 목록은 기존 `hides the synthetic raw_score` 와 같은 5개(`mystery` 포함 — 모르는 소스도 `scoreMetric` 이 `null`).
- `frontend/AGENTS.md`·`CLAUDE.md`(미추적, `next dev` 가 만듦)는 내 범위가 아니라 건드리지 않았다.

## 막힌 점
없음.

## 다음
G20 (메인 세션, 45 done 뒤).
