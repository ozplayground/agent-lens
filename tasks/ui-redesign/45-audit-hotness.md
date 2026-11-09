# Task 45: ui-audit cardMetric ⑤·fixture·사전 측정

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 45 (보정 8)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-07

## 한 일
- 단계 시작 HEAD `355ff0b`. 46(D2)과 같은 작업 트리에서 병렬로 했다. `frontend/scripts/**` 와 이 task 파일만 고쳤다.
- fixture 를 먼저 커밋했다 (`af6837b test(ui-redesign): 45 실패 fixture — cardMetric ⑤ 합성 소스 인기 점수`).
  - `defects.html`: 블록 하나를 더했다 (`data-expect="cardMetric"`, `data-note="rss_kr 카드에 인기 점수"`). `data-source="rss_kr"` 카드 바닥에 `sr-only` `인기 점수` + `100` 만 있다. 점수·개수는 없어 판정 ①~④ 로는 통과한다.
  - `clean.html`: `cardMetric` 절의 `github` 카드에 `sr-only` `인기 점수` + `100` 을 더했다. `rss_kr` 카드는 그대로(통계 없음)다. 다른 fixture 는 바꾸지 않았다.
- 스크립트 수정 전 `--self-test` 가 종료 1(MISS)로 실패하는 것을 확인했다.
- `ui-audit.mjs` `cardMetric`:
  - 인기 점수 통계를 찾는다: `[data-card-stat="hotness"]`, 없으면 `sr-only` `인기 점수` 의 부모 (기존 통계 찾기와 같은 대체 판정).
  - 판정 ⑤: 카드 소스(`data-source`, 없으면 머리줄 소스 라벨)가 점수 지표 표(`EXPECT7.scoreMetricLabels`)에 없는데 인기 점수 통계가 있으면 실패 '원천 지표가 없는 소스(<소스>)에 인기 점수'.
  - 기록: `checks.cardMetric.summary.bySource.<소스>.hotnessShown` (인기 점수를 그린 카드 수).
  - 판정 ①~④ 와 기준값 상수는 바꾸지 않았다.
- 사전 측정 (결과는 커밋하지 않음):
  - `git worktree add --detach <scratchpad>/al-pre8 d444621` 를 프로덕션 빌드했다(성공). standalone `PORT=3101`, backend 는 DB 복사본으로 127.0.0.1:8102.
  - 이 단계 스크립트로 `--base http://localhost:3101 --commit d444621 --screenshots none --out <scratchpad>/pre-audit-8` 를 돌렸다.
  - 끝나고 서버를 끄고 worktree 를 지웠다.

## 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html, frontend/scripts/ui-audit-fixtures/clean.html (`af6837b`)
- frontend/scripts/ui-audit.mjs
- tasks/ui-redesign/45-audit-hotness.md

## 검사 결과
- 스크립트 수정 전 `cd frontend && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs --self-test` → **종료 1**:
  ```
    OK   cardMetric   rss_kr 카드에 점수 180, github 카드 개수가 댓글 (1440)
    MISS cardMetric   rss_kr 카드에 인기 점수
         cardMetric   실패 1440 3건
    OK   cardMetric   1440px 대상 5, 실패 0      (clean.html)
  SELF-TEST FAIL: 1건
    - defects.html: cardMetric 이(가) 결함을 잡지 못함 — rss_kr 카드에 인기 점수
  ```
  plan 의 예상 그대로다 (판정 ①~④ 로는 통과해 MISS, clean 통과).
- 스크립트 수정 뒤 `--self-test` → **종료 0**:
  ```
    OK   cardMetric   rss_kr 카드에 점수 180, github 카드 개수가 댓글 (1440)
    OK   cardMetric   rss_kr 카드에 인기 점수 (1440)
         cardMetric   실패 1440 4건
    OK   cardMetric   1440px 대상 5, 실패 0      (clean.html)
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 16개 통과, dev-indicator.html 환경 오류 판정
  ```
  나머지 data-expect, clean 1440·360 의 검사, dev-indicator 도 모두 OK 다.
- `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` → 오류 0.

### 사전 측정 (d444621, 보정 8 앱 수정 전)
```
FAIL: 조합 160, 통과 150, 실패 10, 건너뜀 0, 실패 항목 10
  clip         상태 160, 실패 상태 0, 실패 요소 0
  placeholder  상태 160, 실패 상태 0, 실패 요소 0
  occluded     상태 160, 실패 상태 0, 실패 요소 0
  scrollRow    상태 160, 실패 상태 0, 실패 요소 0
  ariaControls 상태 160, 실패 상태 0, 실패 요소 0
  keepAll      상태 160, 실패 상태 0, 실패 요소 0
  vRhythm      상태 10, 실패 상태 0, 실패 요소 0
  toolbarLayout 상태 10, 실패 상태 0, 실패 요소 0
  cardMetric   상태 10, 실패 상태 10, 실패 요소 100
  rowAlign     상태 6, 실패 상태 0, 실패 요소 0
  chatScope    상태 30, 실패 상태 0, 실패 요소 0
  terms        상태 40, 실패 상태 0, 실패 요소 0
  modelPicker  상태 10, 실패 상태 0, 실패 요소 0
  focusLabels  상태 10, 실패 상태 0, 실패 요소 0
  toast        상태 10, 실패 상태 0, 실패 요소 0
  chatAlign    상태 4, 실패 상태 0, 실패 요소 0
```
- `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: d444621, firstNewsId: 4845 }`, 조합 160.

| 판정 | 실패 상태 | 건수 | 대표 요소 |
|---|---|---|---|
| `cardMetric` ⑤ | `/` 10조합 모두 (5폭 × 2테마) | 100 (조합마다 10: `rss_kr` 9 + `rss` 1) | `feed-light-360x780` `[data-feed-card]:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1) > span` `인기 점수100` '원천 지표가 없는 소스(rss_kr)에 인기 점수' (90건). `[data-feed-card]:nth-of-type(11) …` `인기 점수100` '원천 지표가 없는 소스(rss)에 인기 점수' (10건) |

- `summary.bySource` (모든 조합 같음):
  - `rss_kr`: 카드 9, 점수 표시 0, 인기 점수 9.
  - `github`: 카드 8, 점수 표시 8, 인기 점수 8.
  - `rss`: 카드 1, 점수 표시 0, 인기 점수 1.
- spec 14.16 '고치기 전' 열(첫 화면 `국내 테크` 카드마다 ⑤)과 같다. `Global Blogs`(`rss`) 카드 1장도 같은 이유로 잡힌다.
- 다른 새 실패: 0. 판정 ①~④ 는 보정 7(`a757344` 이후)로 이미 통과한다.
- 분류: 판정 오탐 0, 46 이 고칠 결함 = ⑤ 100건(`NewsCard.tsx` 인기 점수 조건), 목록 밖 결함 0 (blocked 아님).
- `config.json`·`sources.json`·`backend/app/config/sources.json` 변경 없음.

## 결정
- ⑤ 는 인기 점수 통계를 `data-card-stat="hotness"` 또는 `sr-only` `인기 점수` 로 찾는다. 고치기 전 코드(속성 없음)도 잴 수 있게 하려는 것으로, 14.15 의 다른 통계 찾기와 같다.
- 지표 소스(`github`·`hackernews`·`reddit`)의 인기 점수는 판정하지 않는다 (R41: 지표 소스의 표시 규칙은 그대로).

## 막힌 점
- 없음.

## 다음
- 없음 (45 done). 47 이 46 구현 뒤 HEAD 를 이 판정으로 잰다.
