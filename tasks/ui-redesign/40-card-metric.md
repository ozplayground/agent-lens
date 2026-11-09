# Task 40: NewsCard 원천 지표만 표시

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 40 (보정 7)
Status: done
Session: main
Agent: a665cef8caa94ac11 (implementer D2, D 는 사용자가 멈춰 새로 띄움)
Updated: 2026-11-07

## 한 일
- 배치 증거: spec 14.15 F3 행 — 첫 화면 카드가 모두 `★180 · 🔥100`. `rss.py:75` 가 `raw_score` 를 KR 180·그 밖 150 고정, `arxiv.py:48` 120 고정, `huggingface.py:33` `numComments + 40`. `github.py:45` 의 `comments_count` 는 포크 수인데 카드가 `MessageSquare`·`댓글` 로 그림. DB 조회(2026-11-07): `rss_kr` 459건 모두 180, `rss` 285건 모두 150. 38 사전 측정의 `cardMetric` 결과는 이 단계 시점에 38 task 에 아직 없어 인용하지 못했다.
- 실패 테스트 먼저 (`9058214`): `NewsCard.test.tsx` 에 새 `describe('footer stats show only native source metrics (R36)')` 를 추가만 했다 (기존 단언·fixture 그대로). 테스트 15개(`it.each` 5 포함):
  - rss_kr·rss·arxiv·huggingface·mystery 에 `raw_score` 120 → `[data-card-stat="score"]` 없음, `점수`·`스타`·`포인트`·`추천`·`120` 글자 없음, 인기 통계는 남음
  - github → `data-metric="stars"`, `title` `GitHub 스타`, `sr-only` `스타`, 아이콘 `lucide-star`
  - hackernews → `points`·`HackerNews 포인트`·`포인트`·`lucide-arrow-big-up`(별 아님); reddit → `upvotes`·`Reddit 추천`·`추천`·`lucide-arrow-big-up`
  - github `raw_score` 0 → 점수 통계 없음 (회귀 가드)
  - github `comments_count` 15 → `data-metric="forks"`·`GitHub 포크`·`포크`·`lucide-git-fork`, `댓글` 없음; hackernews → `comments`·`댓글`·`lucide-message-square`, `포크` 없음
  - `comments_count` 0 → 개수 통계 없음 (회귀 가드)
  - 인기 통계 `data-card-stat="hotness"`, `data-metric` 없음, `sr-only` `인기 점수`
  - 어떤 소스에서도 종류 없는 `점수` 라벨 없음
  - 카드 `[data-feed-card]` 에 `data-source`
- 구현 (`07e5cb8`, `NewsCard.tsx`): `scoreMetric`·`countMetric`·`SCORE_METRIC_LABELS`·`COUNT_METRIC_LABELS`·`sourceLabel` 을 `labels.ts` 에서 쓴다. 점수는 `scoreKind && item.raw_score > 0` 일 때만 (`stars` → `Star`, 그 밖 → `ArrowBigUp`), 개수는 `comments_count > 0` 일 때 (`forks` → `GitFork`, `comments` → `MessageSquare`). 각 통계 `span` 에 `data-card-stat`·`data-metric`(인기는 생략)·`title`. 카드에 `data-source={item.source}`. 배지 줄·머리줄·제목·본문·`preferSummary`·인기 규칙은 그대로. `NewsDetailModal.tsx` 는 건드리지 않았다.

## 바꾼 파일
- `frontend/src/components/NewsCard.tsx`
- `frontend/src/tests/NewsCard.test.tsx` (추가만)

## 검사 결과
- 실패 테스트 (`pnpm exec vitest run src/tests/NewsCard.test.tsx`, 구현 전): `Tests 13 failed | 20 passed (33)`. 예상한 이유대로
  - 합성 점수 소스 5개·`점수` 라벨 테스트: `expected <span class="sr-only"></span> to be null` (소스와 상관없이 `Star` + `점수` 를 그림)
  - github/hackernews/reddit 점수·개수·인기: `expected null not to be null` (`data-card-stat` 없음)
  - `data-source`: `toHaveAttribute("data-source", "rss_kr")` 실패
  - 통과한 2개는 `raw_score` 0·`comments_count` 0 회귀 가드 (지금 규칙과 같음)
- 끝 기준: `pnpm exec vitest run src/tests/NewsCard.test.tsx src/tests/ui/Primitives.test.tsx src/tests/feed src/tests/modals/NewsDetailModal.test.tsx src/tests/design`
  - 첫 실행 때 `src/tests/feed/FeedToolbar.test.tsx` 2개 실패 — 41 의 실패 테스트 커밋 `214fabe` 직후, 41 구현 전 상태였다. NewsCard 와 무관 (그 파일은 NewsCard 를 렌더하지 않음)
  - FeedToolbar 를 뺀 실행: `Test Files 5 passed (5)`, `Tests 121 passed (121)` + `src/tests/feed`(FeedToolbar 제외) `Tests 19 passed (19)`
- `grep -n "raw_score" frontend/src/components/NewsCard.tsx` → `179: {scoreKind && item.raw_score > 0 ? (`, `188: ...item.raw_score.toLocaleString()...` (점수 표시가 `scoreMetric` 조건 안)
- `grep -n "scoreMetric\|countMetric"`·`grep -n "data-source="` 출력 있음 (R36 정적 확인)
- `pnpm exec eslint src/components/NewsCard.tsx src/tests/NewsCard.test.tsx` → 오류 0
- `pnpm exec tsc --noEmit` → 종료 0
- `pnpm test` (41 구현 `705a151` 뒤, 42 진행 중): `Test Files 5 failed | 45 passed (50)`, `Tests 11 failed | 611 passed (622)`. 실패 5 파일은 모두 `src/tests/chat/*`(ChatHeader 2, ChatSidebar 2, ChatWorkspace 3, FocusBottomSheet 3, FocusCapsule 1) — 42 의 실패 테스트(구현 전)다. NewsCard·labels 관련 실패 없음
- `pnpm lint` → `✖ 41 problems (0 errors, 41 warnings)`, 종료 0
- 보정 7 증명 ⑦ (내 파일): `git diff -U0 8d643d2 -- frontend/src/tests/NewsCard.test.tsx frontend/src/tests/ui/FormControls.test.tsx | grep -E '^-[^-]'` → import 줄 1개뿐
- R32: `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` → 0줄

## 결정
- `title`: 점수는 `${sourceLabel(source)} ${SCORE_METRIC_LABELS[metric]}`, 개수는 `forks` 면 `${sourceLabel(source)} 포크`, `comments` 면 `댓글` (spec 의 값 그대로, 카드에 새 라벨 표를 두지 않음).
- 아이콘 단언은 lucide 가 붙이는 `lucide-<이름>` 클래스로 한다 (lucide-react 1.41.0).

## 막힌 점
없음. 전체 `pnpm test` 의 chat 실패 11개는 42 진행 중 상태라 G18 에서 다시 본다.

## 다음
G18 (메인 세션).
