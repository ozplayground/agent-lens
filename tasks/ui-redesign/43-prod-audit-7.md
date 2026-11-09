# Task 43: 프로덕션 재측정 7·육안 확인·make check

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 43 (보정 7)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-07

## 한 일
- 관문 G18 뒤 단독으로 했다. 측정한 HEAD 는 `a757344` 다 (38 ui-audit 보정 7 + 39~42 구현 `738425e` 포함).
- 실행 환경은 36 과 같다:
  - HEAD·1ec8a9b 를 `git worktree add --detach <scratchpad>/al-head|al-1ec8a9b` 로 꺼냈다.
  - 둘 다 `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8102 INTERNAL_API_URL=http://127.0.0.1:8102 pnpm build` 를 했고 빌드에 성공했다.
  - standalone 으로 HEAD 는 3101, 1ec8a9b 는 3102 에 띄웠다. backend 는 `backend/agentlens.db` scratchpad 복사본으로 127.0.0.1:8102 에 띄웠다.
- 순서: `--self-test` → HEAD 전체 측정(기본 `--out`, `--screenshots key`) → 1ec8a9b 기준선(`baseline-1ec8a9b/`) → 서버·worktree 정리 → `make build`·`make check`.
- 육안 확인은 메인 세션이 스크린샷 24장을 직접 본다는 지시에 따라 하지 않았다. 스크린샷 파일만 갱신했다 (plan 할 일 6 은 메인 몫).

## 바꾼 파일
- docs/features/ui-redesign/audit/report.json
- docs/features/ui-redesign/audit/*.png — 바이트가 바뀐 22장: `feed-{light,dark}-{360x780,390x844,768x1024,1024x768,1440x900}` 10장, `chat-{light,dark}-{360x780,390x844,768x1024,1024x768,1440x900}` 10장, `briefing-light-1440x900`, `detail-light-1440x900`. 바뀌지 않은 것: `briefing-light-390x844`, `detail-light-390x844`. PNG 는 모두 24장이다.
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json
- tasks/ui-redesign/43-prod-audit-7.md

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
  - 끝 기준 대조: 160조합 모두 `pass: true`. `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: a7573449bc351e484b933ac14aedbb7d93b71d4f, firstNewsId: 4845 }`. PNG 24장.
  - 결함 표: 판정 오탐 0, 앱 결함 0, 목록 밖 결함 0.
- 기록 (plan 할 일 5):
  - `toolbarLayout.source` (라이트·다크 같음):
    - 360: `visibleWidth 344`(≥ 327), `fullyVisibleChips 2`, `toggleTop 284`·`sortTop 284` ≥ `sourceBottom 280`.
    - 390: `visibleWidth 374`(≥ 357), 칩 3, 토글·정렬 top 284 ≥ 280.
  - 768 이상 `toolbarLayout.rows` (F2 참고 자료):
    - 768: 카테고리 rowWidth 476·칩 3, 소스 419.4·칩 3.
    - 1024: 카테고리 752·5, 소스 659.4·5.
    - 1440: 카테고리 912·5, 소스 935.4·7.
  - `cardMetric.summary` (모든 폭 같음): 카드 18장. `rss_kr` 9장 점수 표시 0, `github` 8장 점수 표시 8(스타), `rss` 1장 점수 표시 0. 첫 화면에 `github` 카드가 있다.
  - `chatScope`: 360·390 포함 30상태 실패 0. `modelPicker`: 5폭 × 2테마 실패 0 (트리거 1개, 입력창 아래). `focusLabels`: 포커스 필터 10조합 실패 0. `terms`: 40상태 실패 0.
  - `/` 10조합 `scrollRow.toolbar.mustReadVisible: true`. 360 토글 180~224·top 284·44×44, 390 210~254·44×44 (R6), 768 이상 120.6×32.
  - R5: 390×844 첫 카드 제목 bottom 493 (< 844), 1440×900 첫 줄 통과.
  - `vRhythm`: 10조합 실패 0.
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
  - `environment.commit` 은 `1ec8a9b`, `devIndicator: false`, 조합 160 이다.
  - F1~F4 는 그대로 잡힌다:
    - F1: 1440 `소스` scrollRow 4건, clip 3건.
    - F2: 390 `카테고리` scrollRow 3건.
    - F3: 1440·390 placeholder. F4: 768 rowAlign 6건, 1440 7건.
  - 건수 변화: 실패 항목 328 → 394 (+66), 조합 150 → 160 (포커스 필터 상태 10). 14.8 검사 건수는 그대로다. 늘어난 것은 보정 7 검사다:
    - `toolbarLayout` 10: 모든 폭 '대상 없음' — 1ec8a9b 에는 `[data-feed-toolbar]` 가 없다 (23 에서 생김).
    - `cardMetric` 360 요소: 종류 없는 `점수` 180 + 원천 지표 없는 소스 180. 머리줄 형식이 달라 소스를 `?` 로 찾았다.
    - `terms` 510: `Global` 312·`Scoped` 48 등.
    - `modelPicker` 12: 768 이상 버튼 2개.
    - `focusLabels` 10.
  - `chatScope` 는 기준선에서 실패 0 이다. 1ec8a9b 에도 `검색 스코프 모드` 그룹이 있고(대상 1) 맥락 줄 스크롤 줄 구조가 없어 화면 안 판정만 돌았는데, 두 탭이 화면 안에 있었다. spec 의 회귀 증명은 8d643d2(보정 7 수정 전) 기준이고, 38 사전 측정에서 360 `chatScope` 실패를 확인했다.
- `make build` → 종료 0.
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 105.55s (0:01:45) ===================
  make: *** [check] Error 1
  ```
  make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0
  ```
   Test Files  50 passed (50)
        Tests  622 passed (622)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다. `config.json` 은 바뀌지 않았다.
- 띄운 서버(3101, 3102, backend 8102)를 모두 끄고 worktree 두 개를 지웠다.

## 결정
- 앱·스크립트 파일은 고치지 않았다 (실패 0).
- 육안 확인(plan 할 일 6)은 메인 세션 지시대로 메인이 한다. 이 task 에는 스크린샷 갱신만 기록한다.
- 기준선의 `toolbarLayout` '대상 없음' 10건과 `chatScope` 0건은 1ec8a9b 의 DOM 구조 때문이다 (툴바 측정 훅 없음, 맥락 줄 스크롤 줄 없음). 보정 7 의 회귀 증명은 8d643d2 를 기준으로 한다 (38 사전 측정).

## 막힌 점
- 없음.

## 다음
- 없음 (43 done). 관문 G19 → 44.
