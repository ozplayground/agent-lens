# Task 36: 측정 재실행: self-test, 1ec8a9b 기준선, HEAD 프로덕션, make check

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 36 (리뷰 후속)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-06

## 한 일
- 관문 G8·G9 통과 뒤 단독으로 했다. 측정한 HEAD 는 `14e0250` 이다 (30~35 구현과 30 판정 수정 포함).
- 실행 환경은 19·27 과 같다.
  - HEAD 와 1ec8a9b 를 각각 `git worktree add --detach <scratchpad>/al-head|al-1ec8a9b` 로 꺼냈다.
  - 둘 다 `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8102 INTERNAL_API_URL=http://127.0.0.1:8102 pnpm build` 를 했고 빌드에 성공했다.
  - standalone 으로 HEAD 는 3101, 1ec8a9b 는 3102 에 띄웠다. backend 는 `backend/agentlens.db` 의 scratchpad 복사본으로 127.0.0.1:8102 에 띄웠다.
- 순서: `--self-test` → HEAD 전체 측정(기본 `--out`, `--screenshots key`) → 1ec8a9b 기준선(`baseline-1ec8a9b/`) → 폭별 툴바·배지 데이터 확인 → PNG 육안 확인 → 서버·worktree 정리 → `make check`.
- HEAD 측정 결과로 `audit/report.json` 과 PNG 24장을, 기준선 결과로 `audit/baseline-1ec8a9b/report.json` 을 덮었다. 이름 규칙 밖의 PNG 는 없다.

## 바꾼 파일
- docs/features/ui-redesign/audit/report.json
- docs/features/ui-redesign/audit/{feed,chat}-{light,dark}-{360x780,390x844,768x1024,1024x768,1440x900}.png, {detail,briefing}-light-{390x844,1440x900}.png (24장. 바뀐 14장은 툴바 새 배치와 헤더 '다음 수집' 시각 차이)
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json
- tasks/ui-redesign/36-prod-audit-3.md

## 검사 결과
### 1. self-test
- `cd frontend && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs --self-test` → 종료 0, `SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정`

### 2. HEAD 프로덕션 (`--base http://localhost:3101 --commit "$(git rev-parse HEAD)"`) → 종료 0
```
PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
  clip         상태 150, 실패 상태 0, 실패 요소 0
  placeholder  상태 150, 실패 상태 0, 실패 요소 0
  occluded     상태 150, 실패 상태 0, 실패 요소 0
  scrollRow    상태 150, 실패 상태 0, 실패 요소 0
  ariaControls 상태 150, 실패 상태 0, 실패 요소 0
  keepAll      상태 150, 실패 상태 0, 실패 요소 0
  vRhythm      상태 10, 실패 상태 0, 실패 요소 0
  rowAlign     상태 6, 실패 상태 0, 실패 요소 0
  toast        상태 10, 실패 상태 0, 실패 요소 0
  chatAlign    상태 4, 실패 상태 0, 실패 요소 0
report: /Users/wonyoung/workspace/ozplayground/agentlens/docs/features/ui-redesign/audit/report.json
```
- 끝 기준 대조 (report.json 을 스크립트로 확인):
  - 150조합 모두 `pass: true` 다. 판정 ④ 포함, `clip` ④ 실패 0.
  - 조합마다 R3 과 그 상태의 14.8 검사 이름이 있다. 빠진 조합 0.
  - `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: 14e02501882a10a126ef65af6b4fad3b4d89264d, firstNewsId: 4845 }`
  - `ls docs/features/ui-redesign/audit/*.png | wc -l` → 24.
- 34 가 넘긴 확인 대상:

| 대상 | 측정값 | 결과 |
|---|---|---|
| 1024 줄 A 카테고리 넘침·여유 | 줄 폭 752, 칩 내용 748, 여유 5px, `data-overflow="none"` (1280·1440 은 여유 55px) | `scrollRow`·`clip` 통과. 여유가 5px 뿐이라 건수 자릿수가 늘면 넘칠 수 있다. 그때는 `ScrollRow` 의 스크롤 버튼 규칙이 적용된다 (R14 는 1440 만 요구) |
| 1024 소스 줄 | 줄 796, 내용 1006, `end` + 다음 버튼 | `scrollRow` 통과 |
| 768 미만 세로 쌓기 R3·clip | 360: R3 scrollWidth 360 = innerWidth 360, 390: 390 = 390. 툴바 줄 1(카테고리+검색, 세로로 쌓여 높이 96) → 줄 2(소스+정렬) | R3·`clip` 실패 0 |
| vRhythm | `/` 5개 폭 × 2테마 | 실패 0 |
| R5 | 390×844 첫 카드 제목 top 393 (< 844), 1440×900 첫 줄 카드 통과 | 통과 |
| `md:w-48` 검색 자리표시 | 768·1024 검색 입력 clientWidth 142, 자리표시 `키워드 검색` | `placeholder` 실패 0 |

### 3. 1ec8a9b 기준선 (`--base http://localhost:3102 --commit 1ec8a9b --screenshots none --out …/baseline-1ec8a9b`) → 종료 1 (정상)
```
FAIL: 조합 150, 통과 20, 실패 130, 건너뜀 0, 실패 항목 328
  clip         상태 150, 실패 상태 42, 실패 요소 276
  placeholder  상태 150, 실패 상태 22, 실패 요소 22
  occluded     상태 150, 실패 상태 0, 실패 요소 0
  scrollRow    상태 150, 실패 상태 30, 실패 요소 74
  ariaControls 상태 150, 실패 상태 78, 실패 요소 108
  keepAll      상태 150, 실패 상태 128, 실패 요소 1070
  vRhythm      상태 10, 실패 상태 10, 실패 요소 10
  rowAlign     상태 6, 실패 상태 4, 실패 요소 26
  toast        상태 10, 실패 상태 10, 실패 요소 10
  chatAlign    상태 4, 실패 상태 4, 실패 요소 4
```
- `environment.commit` 은 `1ec8a9b`, `devIndicator: false` 다.
- F1~F4 는 모두 그대로 잡힌다:
  - F1: 1440 `소스` `scrollRow` 3건(data-overflow 없음, 다음 버튼 없음, R14)과 `clip` 3건.
  - F2: 390 `카테고리` `scrollRow` 'data-overflow 없음'.
  - F3: 1440·390 검색 `placeholder`.
  - F4: 768 `rowAlign` 6건, 1440 7건.
- 건수 변화: 이전 커밋본(`78ee467` 이전 판정)과 검사별 건수가 같다(`summary.byCheck` 동일). 바뀐 것은 R3 이 150조합 모두에 생긴 것 하나다 (27 재측정 2 의 판정, 실패 0).
- 판정 ④ 와 알파 판정이 기준선 건수를 늘리지 않은 이유:
  - ④: 1ec8a9b 화면에는 스크롤 영역이 바깥 `overflow` 상자에 잘리는 배치가 없다. ④ 실패 0건.
  - 알파: 기준선의 `chatAlign` 4건은 모두 측정 훅 속성이 없는 '대상 없음' 이다. 왼쪽 끝 비교까지 가지 않는다.
  - 30 의 '스크롤바 표시 CSS 판정': 기준선의 칩 줄은 `[scrollbar-width:none]` 이라 그대로 `clip` 실패다.

### 4. 실패 분류
| 분류 | 건수 | 내용 |
|---|---|---|
| 판정 오탐 | 0 | — |
| 30~35 소유 결함 | 0 | — |
| 목록 밖 파일 결함 | 0 | — (blocked 아님) |

### 5. 배지 줄 결함의 프로덕션 재현
- 피드 첫 페이지 응답(`GET /api/news?page=1`, 20건)을 확인했다.
  - `is_high_signal` 이 true 인 카드의 `tech_stack` 은 최대 1개다 (`['Python']`, `['Model Context Protocol']`).
  - Must-Read + 기술 3개 카드가 없다. 1024 스크린샷의 배지 줄도 `Must-Read` 하나뿐이다.
- 결론: **프로덕션 재현 불가.** fixture(30 `defects.html`·`clean.html` 의 배지 줄)와 단위 테스트(33)로 증명한다.

### 6. 육안 확인
| 확인 대상 | 본 것 | 경로 |
|---|---|---|
| 360·390 툴바 | 카테고리 줄 → 검색 → 소스 줄 + 정렬 (14.2 새 표, 768 미만) | `docs/features/ui-redesign/audit/feed-light-360x780.png`, `feed-light-390x844.png` |
| 360·390 넘침 표시 | 카테고리 줄 끝(360 `M`, 390 `MCP &`)과 소스 줄 끝에 `›` 가 하나씩 있다. 칩을 덮지 않는다 (3배 확대로 확인) | `<scratchpad>/zoom-360.png`, `zoom-390.png` |
| 768·1024 툴바 | 줄 1 카테고리 + 검색, 줄 2 소스 + 정렬 (768~1279). 넘친 줄에 스크롤 버튼 `›` | `feed-light-768x1024.png`, `feed-light-1024x768.png`, `feed-dark-1024x768.png` |
| 1440 툴바 | 줄 1 카테고리(아이콘) + 검색, 줄 2 소스 + 정렬. 두 줄 모두 넘치지 않음 | `feed-light-1440x900.png` |
| R5 첫 화면 | 390×844 에 첫 카드 제목이 보인다 | `feed-light-390x844.png` |
| 1024 카드 배지 줄 | `Must-Read` 하나만 있고 글자 중간에서 잘리지 않는다 (기술 3개 카드는 데이터에 없음, 위 5) | `feed-light-1024x768.png` |
| 그 밖 | 챗 1440 열 맞춤, 기사 상세 390, 다크 테마에서 잘림·겹침·어긋남을 찾지 못했다 | `chat-light-1440x900.png`, `detail-light-390x844.png`, `chat-dark-360x780.png` |
- `<scratchpad>` = `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad` (세션 임시, 커밋하지 않음).
- 참고 (결함 아님): 챗 360 맥락 줄은 선택된 `전체 코퍼스 (Global)` 가 보이게 스크롤돼 왼쪽 `단일 기사 (Scoped)` 가 흐림만으로 표시된다. 768 미만 넘침 표시는 오른쪽(`end`·`both`)에만 두는 규칙(`ScrollRow.tsx:76`)대로다.

### 7. make check
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 108.38s (0:01:48) ===================
  make: *** [check] Error 1
  ```
- make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0.
  ```
   Test Files  50 passed (50)
        Tests  576 passed (576)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make build` → 종료 0 (라우트 `/`, `/_not-found`, `/api/health`, `/chat`).
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다 (`config.json` 은 바뀌지 않음).
- 띄운 서버(3101, 3102, backend 8102)를 모두 끄고 worktree 두 개를 지웠다.

## 결정
- 이 단계에서 스크립트·앱 파일은 고치지 않았다 (판정 오탐·앱 결함 0).
- 1024 카테고리 줄의 여유 5px 는 지금 데이터에서 통과다. 결함으로 분류하지 않고 기록만 한다.
- 이전 단계와의 관계: 19(기준선)·27(프로덕션 측정)의 연장이다. 19·27 task 파일은 고치지 않았다 (리뷰 후속 공통 규칙).

## 막힌 점
- 없음.

## 다음
- (첫 측정 때 적은 것) 없음 (36 done). 관문 G10 → 37. → 아래 '재측정 2' 에서 선택 칩 판정(30 후속)이 더해져 다시 열렸다.

## 재측정 2 (선택 칩 판정 f0edcd0 + 31 후속 32241d8 뒤, HEAD `562327b`)
### 한 일
- 메인 세션의 지시로 다시 쟀다. 30 후속(`f0edcd0`)이 `scrollRow` 에 선택 칩 가시성 판정을 더했고, 31 후속(`32241d8`)이 `ScrollRow` 에 줄 폭·칩 크기가 바뀐 뒤에도 선택 칩을 보이게 하는 처리와 스냅 끄기를 넣었다.
- 실행 환경은 앞과 같다: HEAD·1ec8a9b worktree 프로덕션 빌드(둘 다 성공), standalone 3101·3102, backend DB 복사본 8102. `--self-test` 는 종료 0 이었다.
- HEAD 전체 측정(기본 `--out`, `--screenshots key`)으로 작업 트리의 `audit/report.json`·PNG 24장을 덮었다. 실패가 남아 **커밋하지 않았다**.
- 1ec8a9b 기준선을 다시 재 `baseline-1ec8a9b/report.json` 을 갱신했다 (커밋함).
- 원인을 확인했다 (아래 '결함 원인'). 360·390 피드 상태 전체를 scratchpad 에 `--screenshots all` 로 찍고, 스크롤 줄을 3배로 확대해 처음 상태를 봤다.
- 서버(3101, 3102, 8102)를 끄고 worktree 두 개를 지웠다. 측정이 모두 통과하지 않아 `make check` 는 돌리지 않았다.

### 검사 결과
- HEAD (`--base http://localhost:3101 --commit "$(git rev-parse HEAD)"`) → **종료 1**
  ```
  FAIL feed-light-360x780 [scrollRow]
  FAIL feed-light-360x780-radar [scrollRow]
  FAIL feed-light-390x844 [scrollRow]
  FAIL feed-light-390x844-radar [scrollRow]
  FAIL feed-dark-360x780 [scrollRow]
  FAIL feed-dark-360x780-radar [scrollRow]
  FAIL feed-dark-390x844 [scrollRow]
  FAIL feed-dark-390x844-radar [scrollRow]

  FAIL: 조합 150, 통과 142, 실패 8, 건너뜀 0, 실패 항목 8
    scrollRow    상태 150, 실패 상태 8, 실패 요소 8   (그 밖의 검사는 모두 실패 0)
  ```
  - 앞 확인 측정(`3069568`)의 8건이 **그대로 남았다**. 다른 새 실패는 없다.

| 검사 | 상태 | 대상 요소 | 측정값 | 담당 파일 | 담당 단계 |
|---|---|---|---|---|---|
| `scrollRow` (선택 칩이 줄의 보이는 상자 밖으로 잘림) | `feed-{light,dark}-{360x780,390x844}`, `…-radar` (8건) | `div[role="group"][aria-label="소스"][data-scroll-row]` 의 `[data-source-chip][aria-pressed="true"]` `전체 4734` | 칩 left 153.6·right 240.7, 보이는 상자 0~204(360)·0~234(390), `scrollLeft` 0 | `frontend/src/components/ui/ScrollRow.tsx` `revealInRow` | 31 B |

- 분류: 판정 오탐 0, 앱 결함 1종 8건(리뷰 후속 목록 안, 31 B 소유), 목록 밖 결함 0.

### 결함 원인 (측정으로 확인, 고치지 않음)
- 시간에 따라 잴 때(`domcontentloaded` 뒤 0.3·1·2·4초, 줄인 움직임 켬·끔, DPR 1·2·3) 소스 줄 `scrollLeft` 가 늘 0 이다. 측정 시점 문제가 아니다.
- 같은 페이지에서 `revealInRow` 의 순서를 그대로 재현했다: `row.style.scrollSnapType = 'none'` → `row.scrollLeft = 61` → `row.style.scrollSnapType = ''`(이전 값).
  - 결과: `afterSet 61`, **되돌린 직후 동기적으로 0**, 두 rAF 뒤 0, 300ms 뒤 0. 스냅을 끈 채로 두면 61 이 유지된다.
  - 칩의 `scroll-snap-align` 은 `start`, 줄의 `scroll-snap-type` 은 `x`(proximity)다.
- 즉 Chrome 157 은 `scroll-snap-type` 을 되돌리는 순간 가장 가까운 스냅 위치로 다시 맞춘다. 목표 61px 은 `전체` 칩의 스냅 위치(약 138px)보다 0 에 가까워 0 으로 돌아간다. `ScrollRow.tsx` 주석의 'Chrome 은 되돌린 뒤에도 위치를 유지한다' 는 이 환경에서 맞지 않는다.
- jsdom 단위 테스트는 스크롤 스냅을 계산하지 않아 이 되돌림을 잡지 못한다.
- 참고: 창 크기가 바뀌면(ResizeObserver → `revealAgain`) 칩이 보이는 위치로 스크롤되는 경우가 있다. puppeteer 의 `clip` 스크린샷(`captureBeyondViewport` 기본값)이 크기를 바꿔 처음 확대본에서는 `전체 4734` 가 보였다. `captureBeyondViewport: false` 로 다시 찍어 처음 상태를 확인했다.

### 1ec8a9b 기준선 (갱신, 종료 1 이 정상)
```
FAIL: 조합 150, 통과 20, 실패 130, 건너뜀 0, 실패 항목 328
  clip         상태 150, 실패 상태 42, 실패 요소 276
  placeholder  상태 150, 실패 상태 22, 실패 요소 22
  occluded     상태 150, 실패 상태 0, 실패 요소 0
  scrollRow    상태 150, 실패 상태 30, 실패 요소 78
  ariaControls 상태 150, 실패 상태 78, 실패 요소 108
  keepAll      상태 150, 실패 상태 128, 실패 요소 1070
  vRhythm      상태 10, 실패 상태 10, 실패 요소 10
  rowAlign     상태 6, 실패 상태 4, 실패 요소 26
  toast        상태 10, 실패 상태 10, 실패 요소 10
  chatAlign    상태 4, 실패 상태 4, 실패 요소 4
```
- `environment.commit` 은 `1ec8a9b`, `devIndicator: false` 다.
- F1~F4 는 그대로 잡힌다: F1 1440 `소스` scrollRow 3건·clip 3건, F2 390 `카테고리` scrollRow, F3 1440·390 placeholder, F4 768 rowAlign 6건·1440 7건.
- 건수 변화: `scrollRow` 실패 요소가 74 → 78 (+4) 이다. 새 선택 칩 판정이 1ec8a9b 의 360 소스 줄 선택 칩 `전체4734`(right 240.7 > 보이는 상자 right 224)를 잡았다. 조합은 `feed-{light,dark}-360x780` 과 각 `-radar` 다. 실패 상태 수(30)는 같다 (그 조합들은 이미 다른 이유로 `scrollRow` 실패였다). 1ec8a9b 의 390 은 상자가 254 까지라 통과한다.

### 육안 확인 (처음 상태, 3배 확대 `captureBeyondViewport: false`)
| 줄 | 본 것 | 경로 |
|---|---|---|
| 360 피드 소스 줄 | `Must-Read` 다음 `전체 4` 에서 잘리고 `›` 가 붙는다. 선택 칩이 다 보이지 않는다 (결함) | `<scratchpad>/zoom3/feed-toolbar-360.png`, `docs/features/ui-redesign/audit/feed-light-360x780.png`(작업 트리) |
| 390 피드 소스 줄 | `전체 4734` 의 끝 `34` 가 흐림 안에 들어가 흐려진다. 칩 오른쪽 끝이 상자 밖이다 (결함) | `<scratchpad>/zoom3/feed-toolbar-390.png` |
| 360·390 카테고리 줄 | 선택 칩 `전체 소식 4734` 가 맨 앞에 다 보인다. 끝에 `›` | 같은 파일 |
| 360 챗 맥락 줄 | 선택된 `전체 코퍼스 (Global)` 가 다 보인다. 왼쪽 `단일 기사 (Scoped)` 는 흐림 안에 일부 들어간다 (줄이 몇 px 밀린 처음 상태, 어색할 정도는 아님) | `<scratchpad>/zoom3/chat-context-360.png` |
| 390 챗 맥락 줄 | 두 옵션이 모두 다 보이고 밀리지 않았다 | `<scratchpad>/zoom3/chat-context-390.png` |
| 360 연동 설정 탭 줄 | 선택 탭 `Notion 연동` 이 맨 앞에 다 보인다. 끝에 `›` | `<scratchpad>/shots-36b/feed-light-360x780-share-notify.png` |
| 360 Ask AI 빠른 질문 줄 | 선택 칩 없음. 칩 두 개와 세 번째 일부 뒤에 `›` | `<scratchpad>/shots-36b/feed-light-360x780-news-detail-ask-ai.png` |
- `<scratchpad>` = `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad` (세션 임시, 커밋하지 않음).

### 결정
- 판정을 고치지 않았다 (오탐이 아니다). 기준값 상수도 그대로다.
- HEAD 측정 결과(`audit/report.json`, PNG 24장)는 실패가 남은 중간 결과라 커밋하지 않고 작업 트리에 두었다. 기준선은 판정 변경을 반영한 유효한 결과라 커밋한다.
- `make check` 는 '측정이 모두 통과한 뒤' 조건을 못 채워 돌리지 않았다.

### 막힌 점
- (재측정 2 당시) 31 B 소유 결함(위 표)이 남아 있었다. `revealInRow` 가 스냅 종류를 되돌리는 순간 Chrome 이 스크롤 위치를 다시 맞췄다. → 31 후속 2(`ae1f53d`)로 고쳐졌다. 아래 '재측정 3'.

## 재측정 3 (31 후속 2 `ae1f53d` 뒤, HEAD `af0c259`)
### 한 일
- 31 후속 2 가 선택 칩을 보이게 하는 목표 위치를 스크롤 스냅 위치에서 고르게 했다. 그 뒤 재측정 2 와 같은 절차로 다시 쟀다.
- HEAD worktree 를 프로덕션 빌드했고(성공) standalone 3101 로 띄웠다. backend 는 DB 복사본으로 8102 에 띄웠다. `--self-test` 는 종료 0 이었다.
- 전체 측정(기본 `--out`, `--screenshots key`)으로 작업 트리의 중간 결과(`audit/report.json`, PNG 24장)를 이번 결과로 덮었다.
- 1ec8a9b 기준선은 다시 재지 않았다. `0ca3226` 이후 `frontend/scripts` 변경이 없어(`git diff --stat 0ca3226 HEAD -- frontend/scripts` 출력 없음) 판정이 같고, 1ec8a9b 앱 코드도 그대로다.
- 육안 확인: 3배 확대(`captureBeyondViewport: false`, 처음 상태)와 360·390 피드 상태 전체(`--screenshots all`, scratchpad)를 봤다. 소스 줄 `scrollLeft` 도 시간별로 쟀다.
- 서버(3101, 8102)를 끄고 worktree 를 지운 뒤 `make check` 를 한 번 돌렸다.

### 검사 결과
- `--base http://localhost:3101 --commit "$(git rev-parse HEAD)"` → **종료 0**
  ```
  PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
    clip         상태 150, 실패 상태 0, 실패 요소 0
    placeholder  상태 150, 실패 상태 0, 실패 요소 0
    occluded     상태 150, 실패 상태 0, 실패 요소 0
    scrollRow    상태 150, 실패 상태 0, 실패 요소 0
    ariaControls 상태 150, 실패 상태 0, 실패 요소 0
    keepAll      상태 150, 실패 상태 0, 실패 요소 0
    vRhythm      상태 10, 실패 상태 0, 실패 요소 0
    rowAlign     상태 6, 실패 상태 0, 실패 요소 0
    toast        상태 10, 실패 상태 0, 실패 요소 0
    chatAlign    상태 4, 실패 상태 0, 실패 요소 0
  ```
  - 재측정 2 의 8건(`feed-{light,dark}-{360x780,390x844}` 과 `-radar` 의 소스 줄 선택 칩)이 **0** 이 됐다. 다른 실패도 없다.
  - 끝 기준 대조: 150조합 모두 `pass: true`, 조합마다 R3 과 그 상태의 14.8 검사가 있다 (빠진 조합 0). `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: af0c2597d85d28d4474355b79ad1b5cd316ced17, firstNewsId: 4845 }`. PNG 24장.
- 결함 표: 판정 오탐 0, 앱 결함 0, 목록 밖 결함 0.
- 소스 줄 처음 상태 (`domcontentloaded` 뒤 0.5·1.5·4초): 360·390 모두 `scrollLeft 138` 로 유지된다. 선택 칩 `전체 4734` 는 [15.6, 102.7] 이고 보이는 상자 [0, 204]·[0, 234] 안이다.
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 115.36s (0:01:55) ===================
  make: *** [check] Error 1
  ```
  make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0
  ```
   Test Files  50 passed (50)
        Tests  582 passed (582)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다 (`config.json` 은 바뀌지 않음).

### 육안 확인 (처음 상태)
| 줄 | 본 것 | 경로 |
|---|---|---|
| 360 피드 소스 줄 | 선택 칩 `전체 4734` 가 맨 앞에 다 보인다. 그 뒤 `국내 테크 45…` 가 흐림에 들어가고 `›` 가 붙는다 | `<scratchpad>/zoom4/feed-toolbar-360.png`, `docs/features/ui-redesign/audit/feed-light-360x780.png` |
| 390 피드 소스 줄 | `전체 4734`·`국내 테크 459` 가 다 보이고 `›` 가 붙는다 | `<scratchpad>/zoom4/feed-toolbar-390.png`, `feed-light-390x844.png` |
| 360·390 카테고리 줄 | 선택 칩 `전체 소식 4734` 가 맨 앞에 다 보인다. 끝에 `›` | 같은 확대 파일 |
| 360 챗 맥락 줄 | 선택된 `전체 코퍼스 (Global)` 가 다 보인다. 왼쪽 `단일 기사 (Scoped)` 는 흐림에 일부 들어간다 (재측정 2 와 같음) | `<scratchpad>/zoom4/chat-context-360.png` |
| 390 챗 맥락 줄 | 두 옵션 모두 다 보이고 밀리지 않았다 | `<scratchpad>/zoom4/chat-context-390.png` |
| 360 연동 설정 탭 줄 | 선택 탭 `Notion 연동` 이 다 보이고 끝에 `›` | `<scratchpad>/shots-36c/feed-light-360x780-share-notify.png` |
| 360 Ask AI 빠른 질문 줄 | 선택 칩 없음, `›` 가 칩을 덮지 않음 | `<scratchpad>/shots-36c/feed-light-360x780-news-detail-ask-ai.png` |
- **어색한 처음 상태 (측정은 통과, 판단은 메인 세션)**: 360·390 소스 줄은 처음부터 `scrollLeft 138` 로 밀려 있다. 그래서 맨 앞 `★ Must-Read` 칩과 구분선이 왼쪽 밖으로 숨는다 (화면에는 구분선 끝 1~2px 만 남는다).
  - 768 미만 넘침 표시는 오른쪽에만 있어(`ScrollRow.tsx` 의 `data-overflow-hint` 는 `end`·`both` 만), 왼쪽에 Must-Read 가 있다는 단서가 없다.
  - R15 의 '선택 칩 전체가 보이게' 는 지키지만, 첫 화면에서 Must-Read 토글이 보이지 않는다.
  - 관련 파일: `ScrollRow.tsx`(31 B, 선택 칩 보이기 목표·왼쪽 표시)와 `FeedToolbar.tsx`(34 E, Must-Read 위치).
- `<scratchpad>` = `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad` (세션 임시, 커밋하지 않음).

### 바꾼 파일 (재측정 3)
- docs/features/ui-redesign/audit/report.json, docs/features/ui-redesign/audit/*.png (24장)
- tasks/ui-redesign/36-prod-audit-3.md

### 다음
- 없음 (36 done). 관문 G10 → 37. 위 'Must-Read 가 처음 상태에서 숨음' 을 결함으로 볼지는 메인 세션이 정한다.

## 재측정 4 (보정 3, HEAD `79fe9cb`)
### 한 일
- 관문 G11 뒤 단독으로 했다. 30 후속 2(`a329fc7`)로 `frontend/scripts` 가 바뀌어 1ec8a9b 기준선과 HEAD 프로덕션을 둘 다 다시 쟀다.
  - 31 후속 3: 768 미만 양쪽 표시, `scroll-px-6`, `data-selected-selector`.
  - 34 후속: 소스 줄 `scroll-px-6`.
- 실행 환경은 앞과 같다: HEAD·1ec8a9b worktree 프로덕션 빌드(둘 다 성공), standalone 3101·3102, backend DB 복사본 8102. `--self-test`(1440·360)는 종료 0 이었다.
- HEAD 전체 측정(기본 `--out`, `--screenshots key`)으로 `audit/report.json`·PNG 24장을, 기준선으로 `baseline-1ec8a9b/report.json` 을 덮었다.
- 육안 확인: 360·390 소스 줄을 처음 상태, 손으로 맨 앞까지 민 상태, 맨 끝까지 민 상태에서 3배로 확대했다(`captureBeyondViewport: false`). 각 상태의 줄 상자·표시 위치도 쟀다. 360·390 피드 상태 전체도 scratchpad 에 찍었다(`--screenshots all`).
- 서버(3101, 3102, 8102)를 끄고 worktree 두 개를 지운 뒤 `make build`·`make check` 를 한 번씩 돌렸다.

### 검사 결과
- HEAD (`--base http://localhost:3101 --commit "$(git rev-parse HEAD)"`) → **종료 0**
  ```
  PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
    clip         상태 150, 실패 상태 0, 실패 요소 0
    placeholder  상태 150, 실패 상태 0, 실패 요소 0
    occluded     상태 150, 실패 상태 0, 실패 요소 0
    scrollRow    상태 150, 실패 상태 0, 실패 요소 0
    ariaControls 상태 150, 실패 상태 0, 실패 요소 0
    keepAll      상태 150, 실패 상태 0, 실패 요소 0
    vRhythm      상태 10, 실패 상태 0, 실패 요소 0
    rowAlign     상태 6, 실패 상태 0, 실패 요소 0
    toast        상태 10, 실패 상태 0, 실패 요소 0
    chatAlign    상태 4, 실패 상태 0, 실패 요소 0
  ```
  - 끝 기준 대조: 150조합 모두 `pass: true`, 조합마다 R3 과 그 상태의 14.8 검사가 있다 (빠진 조합 0). `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: 79fe9cbef51fea46616ae9ccda9892a766d8d071, firstNewsId: 4845 }`. PNG 24장.
  - 결함 표: 판정 오탐 0, 앱 결함 0, 목록 밖 결함 0.
- 360·390 `/` 처음 상태 소스 줄 증거 (`checks.scrollRow.sourceRow`):

| 조합 | scrollLeft | mustReadHidden | startHint |
|---|---|---|---|
| `feed-light-360x780` | 114 | true | true |
| `feed-dark-360x780` | 114 | true | true |
| `feed-light-390x844` | 114 | true | true |
| `feed-dark-390x844` | 114 | true | true |
  - 같은 값이 각 `-radar` 상태에도 있다. `mustReadHidden` 이 true 인 곳은 모두 `startHint` 가 true 다.
- 1ec8a9b 기준선 (`--base http://localhost:3102 --commit 1ec8a9b --screenshots none --out …/baseline-1ec8a9b`) → 종료 1 (정상)
  ```
  FAIL: 조합 150, 통과 20, 실패 130, 건너뜀 0, 실패 항목 328
    clip         상태 150, 실패 상태 42, 실패 요소 276
    placeholder  상태 150, 실패 상태 22, 실패 요소 22
    occluded     상태 150, 실패 상태 0, 실패 요소 0
    scrollRow    상태 150, 실패 상태 30, 실패 요소 152
    ariaControls 상태 150, 실패 상태 78, 실패 요소 108
    keepAll      상태 150, 실패 상태 128, 실패 요소 1070
    vRhythm      상태 10, 실패 상태 10, 실패 요소 10
    rowAlign     상태 6, 실패 상태 4, 실패 요소 26
    toast        상태 10, 실패 상태 10, 실패 요소 10
    chatAlign    상태 4, 실패 상태 4, 실패 요소 4
  ```
  - `environment.commit` 은 `1ec8a9b`, `devIndicator: false` 다.
  - F1~F4 는 그대로 잡힌다:
    - F1: 1440 `소스` scrollRow (data-overflow 없음, 다음 버튼 없음, R14, + scroll-padding), clip 3건.
    - F2: 390 `카테고리` scrollRow (data-overflow 없음, + scroll-padding, + 768 미만 오른쪽 표시 없음).
    - F3: 1440·390 placeholder. F4: 768 rowAlign 6건, 1440 7건.
  - 건수 변화: `scrollRow` 실패 요소 78 → 152 (+74) 이다. 실패 상태 수(30)와 다른 검사는 그대로다. 이유별로는 이렇다:

| 이유 | 이번 | 이전 |
|---|---|---|
| `scroll-padding 이 24px 가 아님` (1ec8a9b 는 `auto`) | 50 | 0 |
| `768 미만: 오른쪽이 넘쳤는데 줄 오른쪽에 넘침 표시가 보이지 않음` | 20 | 0 |
| `선택 칩이 흐림 24px 를 뺀 보이는 범위 밖` (360 과 390 소스 줄. 390 은 오른쪽 흐림 24px 를 빼서 새로 잡힘) | 8 | — |
| `선택 칩이 줄의 보이는 상자 밖으로 잘림` (후속 1 판정, 위 판정으로 바뀜) | — | 4 |
| 나머지 (data-overflow 없음 40, 넘치지 않는데 흐림 10, 다음 버튼 없음 20, R14 4) | 74 | 74 |
  - spec 대로다: 기준선에는 `data-selected-selector`·24px 스냅 여백·768 미만 표시가 없으므로 늘어나는 것이 정상이다. 기준선 소스 줄은 `scrollLeft 0` 이라 `mustReadHidden: false`·`startHint: false` 다.

### 육안 확인
| 확인 대상 | 본 것 | 경로 |
|---|---|---|
| 360 소스 줄 처음 상태 | 왼쪽 `‹` 가 보이고(`Must-Read` 숨음, 칩 끝만 흐림 속에), 선택 칩 `전체 4734` 가 왼쪽 흐림 밖에 다 보인다. 오른쪽 `›`. 두 표시 모두 칩을 덮지 않는다 | `<scratchpad>/zoom5/feed-360-initial.png` |
| 390 소스 줄 처음 상태 | 360 과 같다 (`전체 4734`·`국내 테크 459` 보임) | `<scratchpad>/zoom5/feed-390-initial.png` |
| 맨 앞까지 민 상태 | `Must-Read` 가 보이고 왼쪽 표시가 없다. 오른쪽 `›` | `<scratchpad>/zoom5/feed-360-start.png`, `feed-390-start.png` |
| 맨 끝까지 민 상태 | 왼쪽 `‹`, `Global Blogs 285`·`북마크 0` 이 보인다. 오른쪽 자리는 보이지 않는 slot 이다 | `<scratchpad>/zoom5/feed-360-end.png`, `feed-390-end.png` |
| 표시가 나타나고 사라질 때 칩 위치 | 세 상태에서 첫 칩의 콘텐츠 좌표(`rect.left + scrollLeft`)가 모두 16 이다. 왼쪽 표시가 나타나면 줄 상자 왼쪽이 0 → 16 으로 바뀌지만, 줄 패딩이 같은 만큼 빠져 칩은 움직이지 않는다. 오른쪽은 표시·slot 이 늘 [208,224](360)·[238,254](390) 자리라 줄 오른쪽 끝이 그대로다 | 측정값 (scratchpad 스크립트 출력) |
| 360·390 카테고리 줄 | 선택 칩 `전체 소식 4734` 가 맨 앞에 다 보이고, 오른쪽 `›` 만 있다 (`end`) | 위 확대 파일 위쪽 |
| 360 챗 맥락 줄 | 선택된 `전체 코퍼스 (Global)` 가 다 보이고, 왼쪽에 `‹` 표시가 나온다. `단일 기사 (Scoped)` 의 첫 글자가 흐림 속이다. 표시가 글자를 덮지 않는다 | `<scratchpad>/zoom5/chat-360.png` |
| 390 챗 맥락 줄 | 넘치지 않아 표시가 없고, 두 옵션 모두 다 보인다 | `<scratchpad>/zoom5/chat-390.png` |
| 360 연동 설정 탭 줄 | 선택 탭 `Notion 연동` 이 다 보이고 오른쪽 `›`. 탭 줄 왼쪽에 보이지 않는 slot 16px 가 있어 첫 탭이 본문 글자보다 16px 안쪽에서 시작한다 | `<scratchpad>/shots-36d/feed-light-360x780-share-notify.png` |
| 360 Ask AI 빠른 질문 줄 | 선택 칩 없음. 오른쪽 `›` 가 칩을 덮지 않는다 | `<scratchpad>/shots-36d/feed-light-360x780-news-detail-ask-ai.png` |
- 참고 (결함 아님): 연동 설정 탭 줄이 넘치는 동안 왼쪽 16px slot 이 잡혀 있어 탭이 들여 쓰여 보인다. spec 14.3 보정 3 규칙 4('bleed 가 없는 쪽에는 표시 자리를 늘 잡아 둔다')대로다.
- `<scratchpad>` = `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad` (세션 임시, 커밋하지 않음).

### make build·make check
- `make build` → 종료 0.
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 117.14s (0:01:57) ===================
  make: *** [check] Error 1
  ```
  make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0
  ```
   Test Files  50 passed (50)
        Tests  589 passed (589)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다. `config.json` 은 바뀌지 않았다.

### 바꾼 파일 (재측정 4)
- docs/features/ui-redesign/audit/report.json, docs/features/ui-redesign/audit/*.png (24장)
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json
- tasks/ui-redesign/36-prod-audit-3.md

### 다음
- 없음 (36 done). 관문 G12 → 37 후속.

## 재측정 5 (보정 5, HEAD `8b2634c`)
### 한 일
- 관문 G13 뒤 단독으로 했다. 반영된 변경은 셋이다: 34 후속 3(`f0315fd`, Must-Read 고정 토글), 31 후속 4(`df1f953`, 입력 신호 기반 사용자 스크롤), 30 후속 3·4(`345112d` clip ① 768 이상 면제, `664f5f7` `mustReadVisible`).
- 실행 환경은 앞과 같다: HEAD·1ec8a9b worktree 프로덕션 빌드(둘 다 성공), standalone 3101·3102, backend DB 복사본 8102. `--self-test`(1440·360)는 종료 0 이었다.
- HEAD 전체 측정(기본 `--out`, `--screenshots key`)으로 `audit/report.json`·PNG 24장을, 기준선으로 `baseline-1ec8a9b/report.json` 을 덮었다.
- 육안 확인: 360·390·768·1024·1440 툴바를 처음 상태로 확대했다(768 미만 3배, 1024 이상 2배, `captureBeyondViewport: false`). 소스 줄·토글·정렬·표시·버튼의 위치도 쟀다.
- 서버(3101, 3102, 8102)를 끄고 worktree 두 개를 지운 뒤 `make build`·`make check` 를 한 번씩 돌렸다.

### 검사 결과
- HEAD (`--base http://localhost:3101 --commit "$(git rev-parse HEAD)"`) → **종료 0**
  ```
  PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
    clip         상태 150, 실패 상태 0, 실패 요소 0
    placeholder  상태 150, 실패 상태 0, 실패 요소 0
    occluded     상태 150, 실패 상태 0, 실패 요소 0
    scrollRow    상태 150, 실패 상태 0, 실패 요소 0
    ariaControls 상태 150, 실패 상태 0, 실패 요소 0
    keepAll      상태 150, 실패 상태 0, 실패 요소 0
    vRhythm      상태 10, 실패 상태 0, 실패 요소 0
    rowAlign     상태 6, 실패 상태 0, 실패 요소 0
    toast        상태 10, 실패 상태 0, 실패 요소 0
    chatAlign    상태 4, 실패 상태 0, 실패 요소 0
  ```
  - 끝 기준 대조: 150조합 모두 `pass: true`, 조합마다 R3 과 그 상태의 14.8 검사가 있다 (빠진 조합 0).
  - `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: 8b2634ccab4116de02675ab715c751fab4b0e749, firstNewsId: 4845 }`.
  - `grep -c "mustReadHidden" docs/features/ui-redesign/audit/report.json` → 0. PNG 24장.
  - 30 후속 3 의 clip ① 변경(768 미만 스크롤바 면제 없음)으로 생긴 새 `clip` 실패는 **0** 이다 (HEAD `clip` 실패 0).
  - 결함 표: 판정 오탐 0, 앱 결함 0, 목록 밖 결함 0.
- `/` 처음 상태 10조합의 `checks.scrollRow.toolbar` (R34·R6):

| 조합 | mustReadVisible | mustReadRect (left, right, width×height) |
|---|---|---|
| `feed-light-360x780` | true | 180, 224, 44×44 |
| `feed-dark-360x780` | true | 180, 224, 44×44 |
| `feed-light-390x844` | true | 210, 254, 44×44 |
| `feed-dark-390x844` | true | 210, 254, 44×44 |
| `feed-light-768x1024` | true | 495.4, 616, 120.6×32 |
| `feed-dark-768x1024` | true | 495.4, 616, 120.6×32 |
| `feed-light-1024x768` | true | 743.4, 864, 120.6×32 |
| `feed-dark-1024x768` | true | 743.4, 864, 120.6×32 |
| `feed-light-1440x900` | true | 1063.4, 1184, 120.6×32 |
| `feed-dark-1440x900` | true | 1063.4, 1184, 120.6×32 |
  - 360·390 토글은 44×44 다 (R6).
- 1ec8a9b 기준선 (`--base http://localhost:3102 --commit 1ec8a9b --screenshots none --out …/baseline-1ec8a9b`) → 종료 1 (정상)
  ```
  FAIL: 조합 150, 통과 20, 실패 130, 건너뜀 0, 실패 항목 328
    clip         상태 150, 실패 상태 42, 실패 요소 276
    placeholder  상태 150, 실패 상태 22, 실패 요소 22
    occluded     상태 150, 실패 상태 0, 실패 요소 0
    scrollRow    상태 150, 실패 상태 30, 실패 요소 152
    ariaControls 상태 150, 실패 상태 78, 실패 요소 108
    keepAll      상태 150, 실패 상태 128, 실패 요소 1070
    vRhythm      상태 10, 실패 상태 10, 실패 요소 10
    rowAlign     상태 6, 실패 상태 4, 실패 요소 26
    toast        상태 10, 실패 상태 10, 실패 요소 10
    chatAlign    상태 4, 실패 상태 4, 실패 요소 4
  ```
  - `environment.commit` 은 `1ec8a9b`, `devIndicator: false` 다.
  - F1~F4 는 그대로 잡힌다:
    - F1: 1440 `소스` scrollRow 4건(data-overflow 없음, 다음 버튼 없음, R14, scroll-padding), clip 3건.
    - F2: 390 `카테고리` scrollRow 3건.
    - F3: 1440·390 placeholder. F4: 768 rowAlign 6건, 1440 7건.
  - **건수 변화 없음**: 재측정 4 의 기준선과 검사별 건수·이유별 건수가 모두 같다.
    - `clip` ① 면제 변경(768 미만): 새 `clip` 항목 0 (재측정 4 기준선과 `(조합, 경로, 이유)` 를 대조한 결과). 1ec8a9b 의 피드 카테고리·소스 줄은 `[scrollbar-width:none]` 이라 원래 면제 대상이 아니었다 (19 탐색 때 클래스 확인). 다른 가로 스크롤 영역은 면제가 빠져도 768 미만에서 새 잘림이 잡히지 않았다 (줄별 원인은 따로 확인하지 않음).
    - `mustReadVisible`: 1ec8a9b 에는 `[data-feed-toolbar]` 자체가 없다 (23 에서 생김). 그래서 툴바 증거가 남지 않고(`checks.scrollRow.toolbar` 없음) `mustReadVisible` 실패도 나지 않는다. plan 은 '기준선에는 `data-must-read-toggle` 이 없어 `mustReadVisible` 실패가 정상' 이라 했지만, 판정은 '`[data-feed-toolbar]` 가 있는 페이지에서 돈다'(spec 14.8)라 기준선에서는 대상이 아니다.

### 육안 확인 (처음 상태)
| 폭 | 본 것 (측정값) | 경로 |
|---|---|---|
| 360 | 소스 줄 [0,156]: 첫 칩 `전체 4734`, `scrollLeft 0`, `end`. 그 뒤 `›` 표시 [156,172]. 이어서 Must-Read 토글 [180,224] 44×44 (별 아이콘만, 이름 `Must-Read` 는 `sr-only`), 정렬 [232,344]. 겹침·잘림 없음 | `<scratchpad>/zoom6/toolbar-360.png` |
| 390 | 소스 줄 [0,186] `scrollLeft 0`, `›` [186,202], 토글 [210,254] 44×44 별만, 정렬 [262,374]. 겹침·잘림 없음 | `<scratchpad>/zoom6/toolbar-390.png` |
| 768 | 줄 A 카테고리 + 검색, 줄 B 소스 줄 [24,443] `scrollLeft 0` `end`, 다음 버튼 `소스 다음 항목 보기` [447,479], 토글 [495,616] 별 + `Must-Read`, 정렬 [632,744] | `<scratchpad>/zoom6/toolbar-768.png` |
| 1024 | 소스 줄 [32,691] `end`, 다음 버튼 [695,727], 토글 [743,864] 별 + 글자, 정렬 [880,992] | `<scratchpad>/zoom6/toolbar-1024.png` |
| 1440 | 소스 줄 [112,1047] 넘침 없음(`none`, `북마크 0` 까지 다 보임), 토글 [1063,1184], 정렬 [1200,1328] | `<scratchpad>/zoom6/toolbar-1440.png` |
- 다섯 폭 모두에서 확인했다:
  - Must-Read 토글이 소스 줄과 정렬 사이에 다 보인다 (768 미만은 별 아이콘만).
  - 소스 줄 첫 칩이 `전체` 이고 처음 상태 `scrollLeft` 가 0 이다 (spec 14.2 폭 계산의 기대와 같음).
  - 768 미만의 오른쪽 `›` 표시는 소스 줄과 토글 사이에 있고, 칩·토글을 덮지 않는다.
- 커밋된 PNG: `docs/features/ui-redesign/audit/feed-{light,dark}-{360x780,390x844,768x1024,1024x768,1440x900}.png`.
- `<scratchpad>` = `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/e4ba261d-47ca-4019-a36d-d0008601305d/scratchpad` (세션 임시, 커밋하지 않음).

### make build·make check
- `make build` → 종료 0.
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 109.26s (0:01:49) ===================
  make: *** [check] Error 1
  ```
  make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0
  ```
   Test Files  50 passed (50)
        Tests  597 passed (597)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다. `config.json` 은 바뀌지 않았다.

### 바꾼 파일 (재측정 5)
- docs/features/ui-redesign/audit/report.json, docs/features/ui-redesign/audit/*.png (24장)
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json
- tasks/ui-redesign/36-prod-audit-3.md

### 다음
- 없음 (36 done). 관문 G14 → 37 후속 2.

## 재측정 6 (보정 6, HEAD `27f3eed`)
### 한 일
- 관문 G15 뒤 단독으로 했다. 31 후속 5(`766a899`)로 가로 의도 휠만 입력 신호가 됐다. `frontend/scripts` 는 재측정 5(`3cedad0`) 뒤 바뀌지 않았으므로(`git diff --stat 3cedad0 HEAD -- frontend/scripts` 출력 없음) 1ec8a9b 기준선은 다시 재지 않았다.
- HEAD worktree 를 프로덕션 빌드했고(성공) standalone 3101 로 띄웠다. backend 는 DB 복사본으로 8102 에 띄웠다. `--self-test` 는 종료 0 이었다.
- 전체 측정 1회(기본 `--out`, `--screenshots key`)로 `audit/report.json`·PNG 24장을 덮었다. 그 뒤 서버를 끄고 worktree 를 지웠고 `make build`·`make check` 를 한 번씩 돌렸다.
- 측정 뒤 HEAD 에 `886b409`(37 후속 3, 문서만)가 들어왔다. `frontend`·`backend` 변경이 없어(`git diff --stat 27f3eed HEAD -- frontend backend` 출력 없음) 측정 대상 코드는 같다.

### 검사 결과
- `--base http://localhost:3101 --commit "$(git rev-parse HEAD)"`(그때 HEAD `27f3eed`) → **종료 0**
  ```
  PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
    clip         상태 150, 실패 상태 0, 실패 요소 0
    placeholder  상태 150, 실패 상태 0, 실패 요소 0
    occluded     상태 150, 실패 상태 0, 실패 요소 0
    scrollRow    상태 150, 실패 상태 0, 실패 요소 0
    ariaControls 상태 150, 실패 상태 0, 실패 요소 0
    keepAll      상태 150, 실패 상태 0, 실패 요소 0
    vRhythm      상태 10, 실패 상태 0, 실패 요소 0
    rowAlign     상태 6, 실패 상태 0, 실패 요소 0
    toast        상태 10, 실패 상태 0, 실패 요소 0
    chatAlign    상태 4, 실패 상태 0, 실패 요소 0
  ```
  - 끝 기준 대조: 150조합 모두 `pass: true`, 조합마다 R3 과 그 상태의 14.8 검사가 있다 (빠진 조합 0).
  - `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: 27f3eedc52e9b42bb5a4ab9e6393a7be6f5c1445, firstNewsId: 4845 }`.
  - `grep -c mustReadHidden docs/features/ui-redesign/audit/report.json` → 0. PNG 24장.
  - 결함 표: 판정 오탐 0, 앱 결함 0, 목록 밖 결함 0.
- `/` 처음 상태 10조합 `checks.scrollRow.toolbar.mustReadVisible` 은 모두 true 다. 토글 rect 는 재측정 5 와 같다:
  - 360: 180~224, 44×44
  - 390: 210~254, 44×44
  - 768: 495.4~616, 120.6×32
  - 1024: 743.4~864, 120.6×32
  - 1440: 1063.4~1184, 120.6×32
  - 라이트·다크 같음.
- `make build` → 종료 0.
- `make check` → 종료 2. backend 는 예외로 둔 `test_anti_gemini_isolation_*` 2개만 실패했다 (그 밖의 실패 없음):
  ```
  =========================== short test summary info ============================
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
  FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
  ================== 2 failed, 158 passed in 113.59s (0:01:53) ===================
  make: *** [check] Error 1
  ```
  make 가 backend 에서 멈춰 frontend 단계를 따로 돌렸다: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0
  ```
   Test Files  50 passed (50)
        Tests  599 passed (599)
  ✖ 41 problems (0 errors, 41 warnings)
  ```
  (tsc 출력 없음)
- `make check` 가 바꾼 `sources.json`·`backend/app/config/sources.json` 을 `git checkout --` 로 되돌렸다. `config.json` 은 바뀌지 않았다.

### 바꾼 파일 (재측정 6)
- docs/features/ui-redesign/audit/report.json, docs/features/ui-redesign/audit/*.png (24장. 커밋에서 바뀐 PNG 8장은 헤더 '다음 수집 …' 시각 차이다. 배치는 재측정 5 와 같다)
- tasks/ui-redesign/36-prod-audit-3.md

### 다음
- 없음 (36 done).
