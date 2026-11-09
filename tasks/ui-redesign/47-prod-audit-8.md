# Task 47: 프로덕션 재측정 8·스크린샷

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 47 (보정 8)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-07

## 한 일
- 관문 G20 뒤 단독으로 했다. 측정한 HEAD 는 `bcec1f5` 다 (45 `cardMetric` ⑤ + 46 `cfa9a5b` 합성 소스 카드의 인기 점수 숨김 포함).
- 실행 환경은 36·43 과 같다:
  - HEAD·1ec8a9b 를 각각 worktree 로 꺼내 `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8102 INTERNAL_API_URL=http://127.0.0.1:8102 pnpm build` 를 했다 (둘 다 성공).
  - standalone 으로 HEAD 는 3101, 1ec8a9b 는 3102 에 띄웠다. backend 는 DB 복사본으로 127.0.0.1:8102.
- 순서: `--self-test` → HEAD 전체 측정(기본 `--out`, `--screenshots key`) → 1ec8a9b 기준선 → PNG 육안 확인 → 서버·worktree 정리 → `make build`·`make check`.

## 바꾼 파일
- docs/features/ui-redesign/audit/report.json
- docs/features/ui-redesign/audit/*.png — 바이트가 바뀐 14장:
  - `feed-{light,dark}-{360x780,390x844,768x1024,1024x768,1440x900}` 10장 (카드 인기 점수 숨김과 헤더 시각)
  - `chat-dark-1024x768`, `chat-dark-1440x900`, `briefing-light-1440x900`, `detail-light-1440x900` (헤더 '다음 수집' 시각)
  - PNG 는 모두 24장이다.
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json (검사별 건수는 이전과 같음, 시각·환경 값만 갱신)
- tasks/ui-redesign/47-prod-audit-8.md

## 검사 결과
- `cd frontend && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs --self-test` → 종료 0, `SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 16개 통과, dev-indicator.html 환경 오류 판정`
- HEAD (`--base http://localhost:3101 --commit "$(git rev-parse HEAD)"`) → **종료 0**
  ```
  PASS: 조합 160, 통과 160, 실패 0, 건너뜀 0, 실패 항목 0
    clip         상태 160, 실패 상태 0, 실패 요소 0
    placeholder  상태 160, 실패 상태 0, 실패 요소 0
    occluded     상태 160, 실패 상태 0, 실패 요소 0
    scrollRow    상태 160, 실패 상태 0, 실패 요소 0
    ariaControls 상태 160, 실패 상태 0, 실패 요소 0
    keepAll      상태 160, 실패 상태 0, 실패 요소 0
    vRhythm      상태 10, 실패 상태 0, 실패 요소 0
    toolbarLayout 상태 10, 실패 상태 0, 실패 요소 0
    cardMetric   상태 10, 실패 상태 0, 실패 요소 0
    rowAlign     상태 6, 실패 상태 0, 실패 요소 0
    chatScope    상태 30, 실패 상태 0, 실패 요소 0
    terms        상태 40, 실패 상태 0, 실패 요소 0
    modelPicker  상태 10, 실패 상태 0, 실패 요소 0
    focusLabels  상태 10, 실패 상태 0, 실패 요소 0
    toast        상태 10, 실패 상태 0, 실패 요소 0
    chatAlign    상태 4, 실패 상태 0, 실패 요소 0
  ```
  - 끝 기준 대조: 160조합 모두 `pass: true`. `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: bcec1f571bb1d2c29a79a77140eb8d49377e3638, firstNewsId: 4845 }`. PNG 24장.
  - 결함 표: 판정 오탐 0, 앱 결함 0, 목록 밖 결함 0.
- `cardMetric.summary.bySource` (`/` 10조합 모두 같음):

  | 소스 | cards | scoreShown | hotnessShown |
  |---|---|---|---|
  | `rss_kr` | 9 | 0 | 0 |
  | `github` | 8 | 8 | 8 |
  | `rss` | 1 | 0 | 0 |

  - `/` 10조합 `cardMetric` 실패 0 (⑤ 포함).
  - `rowAlign`: 768·1024·1440 × 2테마 6조합 실패 0 (카드 고정 틀 그대로).
  - 45 사전 측정(d444621)의 ⑤ 100건이 0 이 됐다.
- 1ec8a9b 기준선 (`--base http://localhost:3102 --commit 1ec8a9b --screenshots none --out …/baseline-1ec8a9b`) → 종료 1 (정상)
  ```
  FAIL: 조합 160, 통과 20, 실패 140, 건너뜀 0, 실패 항목 394
    clip         상태 160, 실패 상태 42, 실패 요소 276
    placeholder  상태 160, 실패 상태 22, 실패 요소 22
    occluded     상태 160, 실패 상태 0, 실패 요소 0
    scrollRow    상태 160, 실패 상태 30, 실패 요소 152
    ariaControls 상태 160, 실패 상태 78, 실패 요소 108
    keepAll      상태 160, 실패 상태 128, 실패 요소 1070
    vRhythm      상태 10, 실패 상태 10, 실패 요소 10
    toolbarLayout 상태 10, 실패 상태 10, 실패 요소 10
    cardMetric   상태 10, 실패 상태 10, 실패 요소 360
    rowAlign     상태 6, 실패 상태 4, 실패 요소 26
    chatScope    상태 30, 실패 상태 0, 실패 요소 0
    terms        상태 40, 실패 상태 30, 실패 요소 510
    modelPicker  상태 10, 실패 상태 6, 실패 요소 12
    focusLabels  상태 10, 실패 상태 10, 실패 요소 10
    toast        상태 10, 실패 상태 10, 실패 요소 10
    chatAlign    상태 4, 실패 상태 4, 실패 요소 4
  ```
  - `environment.commit` 은 `1ec8a9b`, `devIndicator: false` 다.
  - F1~F4 는 그대로 잡힌다:
    - F1: 1440 `소스` scrollRow 4건, clip 3건.
    - F2: 390 `카테고리` scrollRow 3건.
    - F3: 1440·390 placeholder. F4: 768 rowAlign 6건, 1440 7건.
  - 건수 변화: **없음** (43 기준선과 검사별 건수가 같다, 실패 항목 394).
    - `cardMetric` ⑤ 는 1ec8a9b 에서 잡히지 않는다. 1ec8a9b 카드는 인기 점수를 `Hot 100` 배지로 그리고 `sr-only` `인기 점수` 통계가 없어 ⑤ 대상이 아니다.
    - 기준선 `cardMetric` 360건은 이전과 같은 ①·② (`점수` 라벨, 소스 `?`)다.
- 육안 확인 (plan 할 일 ⑥):
  - `feed-light-1440x900.png`: 첫 줄 국내 테크 카드 3장과 둘째 줄 국내 테크 카드 2장은 바닥 줄에 통계가 없다 (`🔥`·`★` 없음, `챗에서 분석`·`원문` 만). GitHub 카드(`teng-lin/notebooklm-py`)는 `★ 19,848 · 포크 2646 · 🔥 100` 그대로다. 같은 줄 카드의 바닥 줄 위치와 카드 높이가 맞는다.
  - `feed-light-390x844.png`: 첫 카드(국내 테크) 바닥에 통계 없이 `챗에서 분석`·`원문` 만 있다.
  - 경로: `docs/features/ui-redesign/audit/feed-light-1440x900.png`, `feed-light-390x844.png`.
- `make build` → 종료 0.
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 107.19s (0:01:47) ===================
  make: *** [check] Error 1
  ```
  make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0
  ```
   Test Files  50 passed (50)
        Tests  630 passed (630)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다. 되돌린 뒤 `git status` 에 세 파일 변경이 없다 (`config.json` 은 처음부터 바뀌지 않음).
- 띄운 서버(3101, 3102, backend 8102)를 모두 끄고 worktree 두 개를 지웠다.

## 결정
- 앱·스크립트 파일은 고치지 않았다 (실패 0).

## 막힌 점
- 없음.

## 다음
- 없음 (47 done). 관문 G21 → 48.
