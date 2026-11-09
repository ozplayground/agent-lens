# Task 39: labels.ts 지표 표·ALL_CATEGORY_LABEL·SCOPE_LABELS

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 39 (보정 7)
Status: done
Session: main
Agent: a665cef8caa94ac11 (implementer D2, D 는 사용자가 멈춰 새로 띄움)
Updated: 2026-11-07

## 한 일
- 실패 테스트 먼저 (`fde09ca`): `labels.ts` 에 빈 구현(`scoreMetric` → `null`, `countMetric` → `'comments'`, 라벨 상수 빈 문자열)을 두고 `FormControls.test.tsx` `describe('labels')` 에 테스트 3개를 더했다.
  - `maps sources to their native score metric and hides synthetic scores (R36)`: github 스타, hackernews 포인트, reddit 추천, rss_kr·rss·huggingface·arxiv·mystery·constructor·toString 은 `null`, `SCORE_METRIC_LABELS` 값.
  - `labels the GitHub count as forks and every other count as comments (R36)`: github `forks`, 그 밖 `comments`, `COUNT_METRIC_LABELS` 값.
  - `names the search scopes in Korean with the shared all-category label (R38)`: `ALL_CATEGORY_LABEL === '전체 소식'`, `scopeLabel('scoped') === '단일 기사'`, `scopeLabel('global') === ALL_CATEGORY_LABEL`, `SCOPE_LABELS` 값.
- 구현 (`cd2f1f3`): `ALL_CATEGORY_LABEL`, `SCOPE_LABELS`·`scopeLabel(mode)`, `ScoreMetric`·`SOURCE_SCORE_METRICS`·`SCORE_METRIC_LABELS`·`scoreMetric(source)`(`hasOwnProperty` 로 프로토타입 키 `null`), `CountMetric`·`COUNT_METRIC_LABELS`·`countMetric(source)`. 파일 머리 주석에 항목 추가. 기존 표·함수는 그대로.

## 바꾼 파일
- `frontend/src/lib/labels.ts`
- `frontend/src/tests/ui/FormControls.test.tsx` (import 줄 확장, `labels` 블록에 테스트 추가만. 기존 단언 변경 없음)

## 검사 결과
- 실패 테스트 (빈 구현, `pnpm exec vitest run src/tests/ui/FormControls.test.tsx`): 3 failed | 29 passed. 예상한 이유대로
  - `expected null to be 'stars'`
  - `expected 'comments' to be 'forks'`
  - `expected '' to be '전체 소식'`
- 구현 뒤 끝 기준: `pnpm exec vitest run src/tests/ui/FormControls.test.tsx src/tests/NewsCard.test.tsx src/tests/feed src/tests/chat` → `Test Files 24 passed (24)`, `Tests 305 passed (305)`
- `pnpm exec eslint src/lib/labels.ts src/tests/ui/FormControls.test.tsx` → 출력 없음 (오류 0)
- `pnpm exec tsc --noEmit` → 종료 0
- `pnpm test` → `Tests 602 passed (602)` (50 파일, 기준 599 + 3), 종료 0
- `pnpm lint` → `✖ 41 problems (0 errors, 41 warnings)` (경고는 기존 파일)

## 결정
- `ScopeMode` 는 `@/types/chat` 에서 `import type` 만 한다 (타입 파일 불변, plan 허용).
- `countMetric` 은 표 없이 `source === 'github'` 비교로 둔다 (plan: github 만 `'forks'`). 프로토타입 키도 `'comments'` 가 된다.
- task 파일은 커밋하지 않았다 (메인 세션 웨이브 커밋 몫). 코드 커밋은 경로 지정.

## 막힌 점
없음.

## 다음
G17 (메인 세션). 이어서 40단계.
