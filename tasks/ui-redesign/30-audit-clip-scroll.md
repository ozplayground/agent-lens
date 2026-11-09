# Task 30: ui-audit 판정 보강: clip ④, chatAlign 알파, fixture, 사전 측정

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 30 (리뷰 후속)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-06

## 한 일
- 단계 시작 HEAD: `ef1cadf`. 31·32·33·35 와 같은 작업 트리에서 병렬로 했다. `frontend/scripts/**` 와 이 task 파일만 고쳤다.
- fixture (spec 14.8 '(리뷰 후속, R30 ①) fixture 추가' 표 그대로):
  - `defects.html` 에 3종을 더했다. 각각 `data-expect="clip"` 를 달았다.
    - ① 세로로 잘린 스크롤 영역: 중간 감싸개에 `min-height` 가 없다. 표시는 스크롤 영역에 달았다.
    - ② 가로로 잘린 스크롤 영역: 중간 감싸개에 `min-width` 가 없고 `data-scroll-row` 도 없다. 표시는 스크롤 영역에 달았다.
    - ③ 잘린 배지 줄: 266px 줄에 기술 배지 `flex-shrink:0; max-width:128px`. 표시는 배지 줄에 달았다.
  - `clean.html` 에 같은 3종의 고친 형태를 더했다: ① `min-height:0`, ② `min-width:0`, ③ 기술 배지 `flex-shrink:1; min-width:48px; max-width:128px`, 글자 감싸개 `min-width:0`.
  - `clean.html` 맥락 줄의 칠한 `role="group"` 위젯을 알파 0 배경 감싸개 두 겹으로 쌌다.
    - 바깥은 `role="toolbar"`, `background-color: color(srgb 1 1 1 / 0)`. 안쪽은 `role="radiogroup"`, `background-color: oklab(0 0 0 / 0)`. 둘 다 `padding-left:4px` 다.
    - 바깥 감싸개에 `margin-left:-8px` 를 두어, 감싸개는 칠한 위젯보다 8px·4px 왼쪽에서 시작하고 칠한 위젯 왼쪽 끝은 메시지 열·입력 영역과 맞는다.
    - 기존 요소는 지우거나 바꾸지 않았다.
- 스크립트를 고치기 전 `--self-test` 가 종료 1 로 실패하는 것을 확인했다 (아래). fixture 두 파일만 경로 지정 커밋했다: `55ae3f9 test(ui-redesign): 30 실패 fixture — clip ④·chatAlign 알파`.
- `ui-audit.mjs`:
  - **`clip` ④**:
    - 조상을 거슬러 오르다 어떤 축의 스크롤 영역(`overflow-x`/`overflow-y` 가 `auto`·`scroll`)을 지나면, 그 축은 요소 rect 대신 그 스크롤 영역 rect 를 더 바깥 조상의 패딩 상자와 계속 비교한다.
    - 바깥 조상이 그 축에서 스크롤 영역이면 비교하지 않고 기준을 그 바깥 스크롤 영역으로 바꾼다(중첩 스크롤).
    - 1px(`K.clipTolerance`) 넘게 나가면 스크롤 영역 요소에 `스크롤 영역이 부모 상자 밖으로 세로 잘림`/`… 가로 잘림` 을 남긴다. `reportedScroll` `Set` 으로 스크롤 영역마다 한 번만 남긴다.
    - 기준 스크롤 영역이 `data-scroll-row` 면 가로 비교는 ① 의 면제를 따른다. 말줄임·line-clamp·접힌 영역(`intended`) 규칙은 그대로다.
  - **`clip` ① 의 '스크롤바가 보이는 스크롤 영역' 판정** (판정 오탐 수정, '결정' 참고): 자리 차지(`offsetHeight − clientHeight − 테두리 > 0`) 대신 CSS 로 숨겼는지로 본다. `scrollbar-width: none` 이거나 `::-webkit-scrollbar` 의 `display` 가 `none` 이면 숨김이다 (`scrollbarShown`).
  - **`chatAlign` 의 `painted`**: 새 도우미 `colorAlpha()` 로 계산된 `background-color` 의 알파를 읽는다.
    - 읽는 자리: `transparent`, `/` 뒤 값(숫자·%·`none`), 쉼표 표기의 넷째 값, 16진 `#rgba`·`#rrggbbaa` 의 알파 자리.
    - 0 이면 투명이다. 알파 자리가 없는 표기는 1, 읽지 못하면 `null` 이고 칠한 것으로 본다.
    - `borderLeftWidth`·`boxShadow` 판정은 그대로다.
  - 기준값 상수(`K`)는 바꾸지 않았다.
- `clean.html` 수정 (fixture 정정): 19 때 넣은 '대화상자 안 세로 스크롤 영역' 은 바깥 상자 `height:120px`(테두리 포함 → 안쪽 118px) 안에 스크롤 영역 `height:120px` 이 있어 실제로 2px 잘려 있었다. ④ 가 이를 잡아 clean 이 실패했으므로 스크롤 영역 높이를 `100%` 로 고쳤다 ('결정').
- 사전 측정 (결과는 커밋하지 않음):
  - 시작 HEAD `ef1cadf` 를 `git worktree add --detach <scratchpad>/al-pre ef1cadf` 로 꺼내 프로덕션 빌드했다. 31~35 의 미커밋 수정은 들어가지 않는다. `ef1cadf` 의 `frontend/` 앱 코드는 27 이 잰 `3300dc3` 과 같다 (그 사이 `frontend` 변경은 `ui-audit.mjs` 하나).
  - 서버는 standalone `PORT=3101`, backend 는 DB 복사본으로 127.0.0.1:8102 에 띄웠다.
  - 이 단계 스크립트로 측정했다: `--base http://localhost:3101 --commit ef1cadf --screenshots none --out <scratchpad>/pre-audit`.
- 확인 측정 (계획 밖, 판정 변경 영향 확인): 같은 스크립트로 1ec8a9b 기준선을 scratchpad 에 다시 쟀다. 커밋된 `baseline-1ec8a9b/report.json` 은 덮지 않았다.
- 띄운 서버(3101, 3102, backend 8102)를 모두 끄고 worktree 두 개를 지웠다.

## 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html (실패 fixture 커밋 `55ae3f9`)
- frontend/scripts/ui-audit-fixtures/clean.html (실패 fixture 커밋 `55ae3f9`, 그 뒤 19 fixture 의 2px 정정)
- frontend/scripts/ui-audit.mjs
- tasks/ui-redesign/30-audit-clip-scroll.md

## 검사 결과
- **스크립트 수정 전** (fixture 만 더한 상태) `cd frontend && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs --self-test` → **종료 1**. 문제 줄:
  ```
    MISS clip         세로로 잘린 스크롤 영역
    MISS clip         가로로 잘린 스크롤 영역
    OK   clip         잘린 배지 줄
  clean.html
    FAIL clip         대상 70, 실패 5
    FAIL chatAlign    대상 4, 실패 2
  SELF-TEST FAIL: 9건
    - defects.html: clip 이(가) 결함을 잡지 못함 — 세로로 잘린 스크롤 영역
    - defects.html: clip 이(가) 결함을 잡지 못함 — 가로로 잘린 스크롤 영역
    - clean.html: clip 오탐 — 부모 상자 밖으로 가로 잘림 section:nth-of-type(11) > div > div > div > button:nth-of-type(4) "배경 설명"
    - clean.html: clip 오탐 — … button:nth-of-type(5) "관련 도구" / (6) "다음 단계" / (7) "참고 자료" / (8) "원문 보기"
    - clean.html: chatAlign 오탐 — 메시지 열 왼쪽 끝이 8px 어긋남 … div[data-chat-column] "메시지 열"
    - clean.html: chatAlign 오탐 — 입력 영역 왼쪽 끝이 8px 어긋남 … div[data-composer]
  ```
  - (a) 예상대로다: defects ①② 미검출. 스크롤 영역을 지나면 그 축 비교를 멈추기 때문이다.
  - (b) 예상대로다: clean `chatAlign` 8px. 감싸개의 `color(srgb … / 0)`·`oklab(… / 0)` 를 칠한 것으로 봐 바깥 toolbar 의 왼쪽 끝을 썼다.
  - 실패 예상 아님, 확인됨: defects ③ 배지 줄은 지금의 ① 로 이미 `clip` 실패다 (`OK`).
  - 예상 밖, 판정 오탐: clean ② 의 칩 5개가 ① '부모 상자 밖으로 가로 잘림' 으로 걸렸다 ('결정' 1).
- **스크립트 수정 뒤** `--self-test` → **종료 0**:
  ```
  defects.html
    OK   R3           가로 넘침 scrollWidth 1500 > innerWidth 1440
    OK   clip         화면 밖 버튼
    OK   clip         부모에 잘린 칩
    OK   clip         말줄임 없는 한 줄 넘침
    OK   clip         line-clamp 없는 세로 넘침
    OK   clip         overflow hidden 상자에 세로로 잘린 링크
    OK   clip         세로로 잘린 스크롤 영역
    OK   clip         가로로 잘린 스크롤 영역
    OK   clip         잘린 배지 줄
         clip         실패 11건
    OK   chatAlign    머리 영역 104px (맥락 줄 아래 경계 100px)
    OK   chatAlign    메시지 열이 맥락 줄 세그먼트 토글 상자보다 4px 안쪽
  clean.html
    OK   R3           scrollWidth 1440, innerWidth 1440
    OK   clip         대상 70, 실패 0
    OK   chatAlign    대상 4, 실패 0
    (나머지 검사 모두 OK, 대상 1 이상)
  dev-indicator.html
    OK   nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정
  ```
- `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` → 종료 0
- `colorAlpha` 확인 (scratchpad 스크립트). Chrome 계산값 → 알파:
  - `transparent`→`rgba(0, 0, 0, 0)`→0
  - `rgb(0 0 0 / 0%)`→`rgba(0, 0, 0, 0)`→0
  - `color(srgb 1 1 1 / 0)`→0, `oklab(0 0 0 / 0)`→0, `oklch(0.5 0.1 120 / 0)`→0
  - `hsl(120 50% 50% / 0)`→`rgba(64, 191, 64, 0)`→0
  - `#11223300`·`#1230`→`rgba(17, 34, 51, 0)`→0
  - `rgb(1 2 3)`→1, `#eef`→1, `oklch(0.97 0 0)`→1
  - `rgba(0,0,0,0.5)`→0.5, `color(srgb 1 1 1 / 0.2)`→0.2
- **사전 측정** (`ef1cadf`, 이 단계 스크립트) → 종료 0:
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
  R3 150조합 실패 0. `environment.devIndicator: false`.

  | 분류 | 건수 | 내용 |
  |---|---|---|
  | (i) 판정 오탐 | 0 | 사전 측정에서는 없음 (self-test 의 clean ② 오탐은 위에서 고침) |
  | (ii) 31~35 소유 결함 | 0 | 1024 배지 줄 `clip`(33)은 프로덕션 데이터에서 재현되지 않는다. 측정 데이터의 1024 카드에 Must-Read + 긴 기술 배지 3개 조합이 없다. spec 14.8 대로 fixture(`defects.html` ③, 이 단계)와 33 단위 테스트로 증명한다 |
  | (iii) 목록 밖 파일 결함 | 0 | — |

  - `clip` ④ 실패(`스크롤 영역이 부모 상자 밖으로 …`)는 사전 측정 0건이다.
- 확인 측정: 이 단계 스크립트로 잰 1ec8a9b 기준선(scratchpad)은 커밋된 기준선과 같다.
  - 조합 150, 실패 항목 328, 검사별 건수 동일, ④ 실패 0.
  - F1: 1440 `소스` scrollRow 3건, clip 3건. F2: 390 `카테고리` scrollRow, clip 6건. F3: 1440·390 placeholder. F4: 768 rowAlign 6건, 1440 7건.
- `config.json`·`sources.json`·`backend/app/config/sources.json` 변경 없음.

## 결정
1. **'스크롤바가 보이는' 판정을 CSS 기준으로 바꿨다 (판정 오탐).**
   - 원인: puppeteer 는 headless 실행에 기본 인자 `--hide-scrollbars` 를 넣는다 (`puppeteer-core/lib/puppeteer/node/ChromeLauncher.js:204`). 그래서 측정 환경에서는 어떤 스크롤바도 자리를 차지하지 않는다. 19 의 자리 차지 판정은 늘 거짓이었고, ① 의 '스크롤바가 보이는 스크롤 영역' 면제는 한 번도 적용되지 않았다.
   - 그 결과 spec 이 정상으로 정한 clean ②(`min-width:0` 만 더한 `overflow-x:auto` 줄)가 실패했다.
   - 이제 CSS 로 숨기지 않았으면(`scrollbar-width` ≠ `none`, `::-webkit-scrollbar` ≠ `display:none`) 스크롤바가 보이는 영역으로 본다.
   - 이 바꿈이 느슨하게 만든 범위: `data-scroll-row` 없는 가로 스크롤 영역 중 스크롤바를 숨기지 않은 것의 ① 가로 잘림이다. 3300dc3·ef1cadf 의 앞 측정에서도 `clip` 실패가 0 이었으므로 앱 측정에서 새로 놓친 결함은 없다. 기준선의 F1·F2(스크롤바를 숨긴 줄)는 그대로 잡힌다 (확인 측정).
   - 19 '결정' 의 '768 미만 오버레이 스크롤바라 `data-scroll-row` 를 달아야 clip 을 피한다' 는 이 바꿈으로 더는 맞지 않는다. 지금 규칙: 스크롤바를 CSS 로 숨긴 줄은 `data-scroll-row` 가 있어야 한다.
   - 기준값 상수는 바꾸지 않았다.
2. `colorAlpha` 는 `page.evaluate` 로 브라우저에서 도는 `inPageChecks` 안 맨 위에 두었다. plan 은 '스크립트 상단' 이라 했지만 in-page 함수는 바깥 변수를 참조할 수 없다. `new Function` 주입은 앱의 CSP 에 걸릴 수 있어 쓰지 않았다.
3. `clean.html` 의 19 fixture(스크롤 영역 120px > 안쪽 118px) 높이를 `100%` 로 고쳤다. 실제로 2px 잘린 상태라 ④ 가 맞게 잡은 것이고, clean 은 정상판이어야 한다. plan 의 '기존 fixture 요소는 바꾸지 않는다' 의 예외로 기록한다 (덮는 결함 범위는 그대로).
4. ④ 에서 기준 스크롤 영역보다 바깥 조상이 그 축의 스크롤 영역이면 비교하지 않고 기준을 그 영역으로 바꾼다 (spec '중첩 스크롤은 바깥이 스크롤로 닿게 하므로 뺀다').
5. 이전 단계와의 관계: 19(판정 강화)와 27(19 연장 기록)의 판정 로직을 이어서 고쳤다. 19·27 task 파일은 고치지 않았다 (리뷰 후속 공통 규칙).

## 막힌 점
- 없음.

## 다음
- 없음 (30 done). 36 이 31~35 결과와 함께 이 판정으로 다시 잰다. 36 에서 찾은 판정 오탐 수정은 30 의 연장으로 이 파일에 적는다.

## 후속: `scrollRow` 선택 칩 가시성 (메인 세션 지시, 36 뒤)
### 한 일
- 메인 세션이 36 의 `feed-light-360x780.png` 에서 결함을 찾았다. 소스 줄의 선택 칩 `전체 4734` 가 `전체 4` 까지만 보인다 (R15 '선택된 칩 전체가 보이게' 위반). `scrollRow` 가 선택 칩의 가시성을 보지 않아 150/150 통과로 놓쳤다 (판정 미탐).
- fixture 를 먼저 커밋했다 (`3069568 test(ui-redesign): 30 후속 실패 fixture — scrollRow 선택 칩 가시성`):
  - `defects.html`: `role="group" aria-label="출처" data-scroll-row data-overflow="end"` 줄(흐림·`출처 다음 항목 보기` 버튼 있음)을 더했다. `★ Must-Read`(`aria-pressed="true"`, `data-source-chip` 없음)는 보이고, 선택된 소스 칩 `GitHub 2443`(`data-source-chip`, `aria-pressed="true"`)만 줄 밖이다. 다른 `scrollRow` 조건으로는 실패하지 않게 맞췄다. `data-expect="scrollRow"`.
  - `clean.html`: 같은 구조에서 선택 칩이 `전체 4734`(보임)인 줄.
  - 라벨을 `소스` 대신 `출처` 로 둔 이유: self-test 는 1440 폭이라 `소스` 면 R14 규칙이 함께 걸린다.
- 스크립트 수정 전 `--self-test` 가 종료 1 로 실패하는 것을 확인했다.
- `ui-audit.mjs` `scrollRow` 에 검사를 더했다. 실패 이유는 `선택 칩이 줄의 보이는 상자 밖으로 잘림` 이다.
  - 조건: 줄의 선택 칩 rect 가 줄의 패딩 상자(보이는 상자) 안에 다 들어와야 한다. 허용치는 `K.scrollTolerance` 1px 이고 상수는 그대로다. 측정 시점은 처음 그린 상태다.
  - 선택자를 고르는 순서 (`selectedSelectorOf`):
    1. 줄의 `data-selected-selector` 속성이 있으면 그것 (지금 앱에는 없음).
    2. 줄 안에 `[data-source-chip]` 이 있으면 `[data-source-chip][aria-pressed="true"]` (소스 줄, Must-Read 제외).
    3. `[role="tab"]` 이 있으면 `[role="tab"][aria-selected="true"]`.
    4. 그 밖은 `[aria-pressed="true"]`.
  - `ScrollRow.tsx` 의 `selectedSelector` 기본값과 `FeedToolbar`·`Tabs` 가 넘기는 값과 같은 규칙이다. `ScrollRow.tsx` 는 31(B)이 고치고 있어 건드리지 않았다.
- 확인 측정 (커밋하지 않음): 31 후속이 커밋되기 전의 HEAD `3069568` 을 worktree 로 프로덕션 빌드했다. standalone 3101, backend DB 복사본 8102 로 띄우고 `--screenshots none --out <scratchpad>/check-30b` 로 쟀다. 서버를 끄고 worktree 를 지웠다.

### 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html, frontend/scripts/ui-audit-fixtures/clean.html (`3069568`)
- frontend/scripts/ui-audit.mjs
- tasks/ui-redesign/30-audit-clip-scroll.md

### 검사 결과
- 수정 전 `--self-test` → **종료 1**:
  ```
    MISS scrollRow    선택 칩(GitHub)이 줄 밖
         scrollRow    실패 6건
    OK   scrollRow    대상 3, 실패 0      (clean.html)
  SELF-TEST FAIL: 1건
    - defects.html: scrollRow 이(가) 결함을 잡지 못함 — 선택 칩(GitHub)이 줄 밖
  ```
- 수정 뒤 `--self-test` → **종료 0**:
  ```
    OK   scrollRow    표시 없는 넘친 소스 줄 (1440 R14 포함)
    OK   scrollRow    넘치는데 data-overflow=none
    OK   scrollRow    넘치지 않는데 흐림
    OK   scrollRow    선택 칩(GitHub)이 줄 밖
         scrollRow    실패 7건
    OK   scrollRow    대상 3, 실패 0      (clean.html)
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정
  ```
- `pnpm exec eslint scripts/ui-audit.mjs` → 종료 0
- 확인 측정 (HEAD `3069568`) → 종료 1:
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
    scrollRow    상태 150, 실패 상태 8, 실패 요소 8   (그 밖의 검사 모두 실패 0)
  ```
  - 8건 모두 같은 결함이다: `div[role="group"][aria-label="소스"][data-scroll-row]` 의 선택 칩 `전체4734` 가 rect left 153.6·right 240.7 인데, 보이는 상자는 360 에서 0~204, 390 에서 0~234 이다. `scrollLeft` 는 0 으로, 처음 그릴 때 선택 칩이 보이게 스크롤되지 않았다.
  - 768 이상은 통과다 (줄이 넓어 `전체` 가 보인다).

| 검사 | 상태 | 대상 요소 | 측정값 | 담당 파일 | 담당 단계 |
|---|---|---|---|---|---|
| `scrollRow` (선택 칩이 줄의 보이는 상자 밖으로 잘림) | `feed-{light,dark}-{360x780,390x844}`, `…-radar` (8건) | `div[role="group"][aria-label="소스"][data-scroll-row]` 의 `[data-source-chip][aria-pressed="true"]` `전체 4734` | 칩 right 240.7 > 상자 right 204(360)·234(390), `scrollLeft` 0 | `frontend/src/components/ui/ScrollRow.tsx` (선택 자식 보이기 effect) | 31 B (진행 중인 31 후속) |

### 결정
- 선택자는 DOM 에서 알 수 없다 (`ScrollRow` 가 `selectedSelector` 를 속성으로 내보내지 않는다). 그래서 앱 규칙을 스크립트에 옮겼다. `data-selected-selector` 속성이 생기면 그것을 먼저 쓴다.
- 줄의 '보이는 상자' 는 패딩 상자(`clientLeft`·`clientWidth`)다. 흐림(mask) 아래에 있는 부분은 상자 안이면 보이는 것으로 본다.
- 기준값 상수는 바꾸지 않았다.

## 후속 2: `scrollRow` 보정 3 (spec 14.8 보정 3, plan '보정 3' 의 '30 A 후속 2')
### 한 일
- fixture 를 먼저 커밋했다 (`521ce9e test(ui-redesign): 30 후속 2 실패 fixture — scrollRow 보정 3`).
  - `defects.html` 맨 앞에 `[data-self-test-narrow]` 영역(폭 312px)을 두고 spec 14.8 fixture 표 보정 3 의 3행을 넣었다:
    - ① 왼쪽 표시 없는 줄: `data-overflow="both"`, `scrollLeft` 를 가운데에 두고 오른쪽 표시만 있다 (3차 구조). `data-expect="scrollRow"`.
    - ② 줄을 덮는 표시: 표시를 `absolute` 로 줄 오른쪽 끝 위에 겹쳤다 (`pointer-events` 도 막지 않음). 칩 폭은 74px 라 셋째 칩이 줄 안에 다 보이고 표시가 그 위를 덮는다. `data-expect="scrollRow occluded"`.
    - ③ 흐림에 겹친 선택 칩: `scroll-padding-left:16px`, 흐림 24px, `data-selected-selector`. 선택 칩이 '칩 왼쪽 − 16' 에 선다. `data-expect="scrollRow"`.
  - 줄마다 이전·다음 버튼을 두어, 1440 폭의 768 이상 버튼 규칙으로는 실패하지 않게 했다. 처음 `scrollLeft` 는 fixture 의 인라인 스크립트(`data-init-scroll`)가 둔다.
  - `clean.html` 에 같은 3행의 고친 형태를 넣었다: ① 양쪽 표시, ② 표시는 줄 뒤 형제, ③ `scroll-padding: 0 24px` 에 '칩 왼쪽 − 24'.
  - `clean.html` 의 기존 스크롤 줄 3개(`빠른 질문`, `카테고리`, `출처`)에는 `scroll-padding: 0 24px` 만 더했다 (plan 이 허용).
  - 줄 이름은 R14 와 엉키지 않게 `소스` 를 피했다.
- 스크립트 수정 전 `--self-test` 가 종료 1 로 실패하는 것을 확인했다.
- `ui-audit.mjs`:
  - 상수 `K.maskWidth = 24` 를 더했다 (흐림 폭 = 스냅 여백 = 선택 칩 보이기 여백, `ScrollRow` 와 같은 값). 기존 허용치 상수는 그대로다.
  - `scrollRow` 에 보정 3 판정을 더했다:
    - ① 줄의 계산된 `scroll-padding-left/right` 가 24px 가 아니면 실패.
    - ② 선택 칩은 줄 보이는 상자에서 넘친 쪽 흐림 24px 를 뺀 범위 안에 있어야 한다 (1px 허용). 후속 1 의 '패딩 상자 안' 판정을 대신한다. 선택자는 줄의 `data-selected-selector`, 없으면 후속 1 의 대체 순서다.
    - ③ 768 미만에서 넘친 쪽마다 같은 감싸개(`row.parentElement`) 안에 그쪽 표시가 보여야 한다. `[data-overflow-hint="start"]` 는 줄 왼쪽 끝보다 왼쪽, `"end"` 는 오른쪽 끝보다 오른쪽이다.
    - ④ 768 미만에서 넘치지 않은 쪽에 표시가 있으면 실패. `data-overflow-slot` 은 표시로 치지 않는다.
    - ⑤ 표시 rect 가 줄 rect 와 1px 넘게 겹치면 실패.
  - 360·390 소스 줄 증거: 768 미만에서 이름이 `소스` 인 줄이면 `checks.scrollRow.sourceRow = { viewport, scrollLeft, mustReadHidden, startHint }` 를 남긴다.
    - `mustReadHidden` 은 `Must-Read` 버튼 왼쪽 끝이 줄 보이는 상자 왼쪽보다 1px 넘게 밖이면 참이다.
    - `startHint` 는 그 줄의 `[data-overflow-hint="start"]` 가 보이면 참이다.
    - `mustReadHidden && !startHint` 면 실패다.
  - `--self-test` 는 fixture 를 1440 폭으로 한 번, `[data-self-test-narrow]` 영역만 360 폭으로 한 번 더 연다.
    - 1440 은 그 영역을 빼고 10개 검사와 R3 을 잰다.
    - 360 은 그 영역 안만 `scrollRow`·`occluded` 를 잰다.
    - `data-expect` 는 어느 폭에서든 잡히면 맞다. `clean.html` 은 두 폭 모두 실패 0, 대상 1 이상이어야 한다.
    - 이를 위해 `inPageChecks` 에 self-test 전용 인자 `scope`·`exclude` 를 더했다.
  - `--help` 에 360 self-test 설명을 더했다.
- 프로덕션 측정은 36 재측정 4 의 몫이라 이번에는 하지 않았다.

### 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html, frontend/scripts/ui-audit-fixtures/clean.html (`521ce9e`)
- frontend/scripts/ui-audit.mjs
- tasks/ui-redesign/30-audit-clip-scroll.md

### 검사 결과
- 수정 전 `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` → **종료 1**:
  ```
    OK   occluded     줄 오른쪽 끝을 덮는 표시
    MISS scrollRow    왼쪽 표시 없는 both 줄 (3차 구조)
    MISS scrollRow    줄 오른쪽 끝을 덮는 표시
    MISS scrollRow    스냅 여백 16px 로 흐림에 겹친 선택 칩
    OK   occluded     대상 43, 실패 0      (clean.html)
    OK   scrollRow    대상 6, 실패 0       (clean.html)
  SELF-TEST FAIL: 3건
    - defects.html: scrollRow 이(가) 결함을 잡지 못함 — 왼쪽 표시 없는 both 줄 (3차 구조)
    - defects.html: scrollRow 이(가) 결함을 잡지 못함 — 줄 오른쪽 끝을 덮는 표시
    - defects.html: scrollRow 이(가) 결함을 잡지 못함 — 스냅 여백 16px 로 흐림에 겹친 선택 칩
  ```
  plan 의 예상대로다: ①②③ 의 `scrollRow` 미검출, ② 의 `occluded` 는 검출(실패 예상 아님), `clean.html` 통과.
- 수정 뒤 `--self-test` → **종료 0**:
  ```
  defects.html
    OK   occluded     줄 오른쪽 끝을 덮는 표시 (360)
         occluded     실패 1440 2건, 360 1건
    OK   scrollRow    왼쪽 표시 없는 both 줄 (3차 구조) (360)
    OK   scrollRow    줄 오른쪽 끝을 덮는 표시 (360)
    OK   scrollRow    스냅 여백 16px 로 흐림에 겹친 선택 칩 (360)
    OK   scrollRow    표시 없는 넘친 소스 줄 (1440 R14 포함) (1440)
    OK   scrollRow    넘치는데 data-overflow=none (1440)
    OK   scrollRow    넘치지 않는데 흐림 (1440)
    OK   scrollRow    선택 칩(GitHub)이 줄 밖 (1440)
         scrollRow    실패 1440 11건, 360 5건
    (나머지 data-expect 모두 OK)
  clean.html
    OK   R3           scrollWidth 1440, innerWidth 1440
    OK   clip         1440px 대상 78, 실패 0
    OK   placeholder  1440px 대상 2, 실패 0
    OK   occluded     1440px 대상 32, 실패 0
    OK   scrollRow    1440px 대상 3, 실패 0
    OK   ariaControls 1440px 대상 1, 실패 0
    OK   keepAll      1440px 대상 3, 실패 0
    OK   rowAlign     1440px 대상 2, 실패 0
    OK   vRhythm      1440px 대상 3, 실패 0
    OK   chatAlign    1440px 대상 4, 실패 0
    OK   toast        1440px 대상 1, 실패 0
    OK   scrollRow    360px 대상 3, 실패 0
    OK   occluded     360px 대상 11, 실패 0
  dev-indicator.html
    OK   nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정
  ```
- 360 영역 실패 이유 (scratchpad 스크립트로 같은 판정을 돌려 확인):
  - ① `768 미만: 왼쪽이 넘쳤는데 줄 왼쪽에 넘침 표시가 보이지 않음`
  - ② `768 미만: 오른쪽이 넘쳤는데 줄 오른쪽에 넘침 표시가 보이지 않음` (덮는 표시는 줄 오른쪽 끝보다 오른쪽이 아님) + `768 미만: 넘침 표시(end)가 줄과 24px 겹침` + `occluded` `비슷한 기사` `다른 요소에 가려짐`
  - ③ `scroll-padding 이 24px 가 아님 (left 16px, right 24px)` + `선택 칩이 흐림 24px 를 뺀 보이는 범위 밖`
  - clean 360 영역: 실패 0.
- `pnpm exec eslint scripts/ui-audit.mjs` → 종료 0. `node scripts/ui-audit.mjs --help` 에 360 self-test 설명 2줄.

### 결정
- 360 폭 self-test 는 `[data-self-test-narrow]` 영역만 잰다. fixture 의 다른 부분(1100px 챗 배치, 1440 기준 결함 등)은 360 에서 화면 밖이 되어 clean 을 깨므로 넣지 않는다. 1440 폭은 그 영역을 뺀다. 그 영역의 줄은 768 이상 규칙(버튼)을 만족하게 만들어, 보정 3 판정이 없던 스크립트에서는 `scrollRow` 실패가 나지 않게 했다 (먼저 실패 확인의 이유가 plan 의 예상과 같도록).
- `--self-test` 의 `scope`·`exclude` 는 self-test 전용이다. 앱 측정 경로는 넘기지 않으므로 앱 측정 결과는 바뀌지 않는다.
- 소스 줄 증거의 `Must-Read` 는 줄 안 버튼 중 글자에 `Must-Read` 가 있는 것으로 찾는다. 앱 규칙(`Must-Read` 는 선택 칩이 아님)과 별개로 증거만 남긴다.
- 기준값 상수는 바꾸지 않았다. 새 상수 `maskWidth` 는 spec 의 흐림 폭 값이다.
- `ScrollRow.tsx`(31 B 진행 중)는 건드리지 않았다.

## 후속 3: clip ① 스크롤바 면제를 768 이상으로 한정 (reviewer 재리뷰 Nit 1)
### 한 일
- 지적 내용: clip ① 의 '스크롤바가 보이는 스크롤 영역' 면제(`ui-audit.mjs` `scrollbarShown`, 판정 줄 `hExempt`)는 CSS 로 숨기지 않은 스크롤바를 모두 '보인다' 로 본다. 그런데 360·390(모바일)과 macOS 기본 설정은 오버레이 스크롤바라 스크롤하기 전에는 보이지 않는다. 그래서 `data-scroll-row` 없는 `overflow-x:auto` 영역이 360 에서 조작 요소를 숨겨도 clip 에서 빠졌다.
- fixture 를 먼저 커밋했다 (`3a393df test(ui-redesign): 30 후속 3 실패 fixture — 360 스크롤바를 숨기지 않은 가로 스크롤 영역 clip`).
  - `defects.html` 의 360 영역(`[data-self-test-narrow]`)에 넣었다: `width:200px; overflow-x:auto` 영역(스크롤바 숨기지 않음, `data-scroll-row`·`role="group"` 없음)에 90px 버튼 3개를 두어 셋째 버튼이 가로로 잘린다. `data-expect="clip"`.
- 수정 전 확인을 두 번 했다.
  - fixture 만 더한 상태: MISS. 이때 360 패스는 `scrollRow`·`occluded` 만 돌았다.
  - 360 패스 검사 목록에 `clip` 을 더한 상태(`SELF_TEST_NARROW_CHECKS = ['clip', 'scrollRow', 'occluded']`): 여전히 MISS. 360 에서 clip 을 돌려도 면제 때문에 빠진다는 것을 확인했다.
- 수정: `hExempt = data-scroll-row || (ax && vw >= k.scrollButtonMinWidth && scrollbarShown(a, cs))`. 스크롤바 면제를 768 이상(스크롤 버튼 기준 폭)에서만 준다. `data-scroll-row` 면제는 그대로다. 기준값 상수는 바꾸지 않았다.
- 프로덕션 측정(HEAD·1ec8a9b)은 하지 않았다 (메인 세션이 따로 시킨다).

### 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html (`3a393df`)
- frontend/scripts/ui-audit.mjs (면제 조건, 360 self-test 검사 목록에 `clip`)
- tasks/ui-redesign/30-audit-clip-scroll.md

### 검사 결과
- fixture 만 더한 상태 `--self-test` → 종료 1:
  ```
    MISS clip         스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼 (360)
         clip         실패 1440 11건
  SELF-TEST FAIL: 1건
    - defects.html: clip 이(가) 결함을 잡지 못함 — 스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼 (360)
  ```
- 360 패스에 `clip` 을 더한 상태(면제 수정 전) → 종료 1:
  ```
    MISS clip         스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼 (360)
         clip         실패 1440 11건, 360 1건
    OK   clip         360px 대상 30, 실패 0      (clean.html)
  SELF-TEST FAIL: 1건
  ```
- 면제 수정 뒤 → **종료 0**, eslint 종료 0:
  ```
    OK   clip         스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼 (360) (360)
         clip         실패 1440 11건, 360 2건
    OK   clip         1440px 대상 78, 실패 0      (clean.html)
    OK   clip         360px 대상 30, 실패 0       (clean.html)
    OK   scrollRow    360px 대상 3, 실패 0
    OK   occluded     360px 대상 11, 실패 0
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정
  ```
  나머지 `data-expect` 와 clean 1440 의 10개 검사도 모두 OK 다.

### clean.html 의 기존 가로 스크롤 영역 (오탐 여부)
- self-test 에서는 오탐이 나지 않는다. clean 의 '가로 스크롤 영역 min-width:0' fixture(30 리뷰 후속 clip ④ 의 고친 형태)는 360 영역 밖에 있어 1440 폭에서만 잰다. 1440 은 면제가 그대로라 통과다.
- 같은 판정으로 그 영역만 360 에서 재 보면(scratchpad 스크립트) 칩 5개(`배경 설명`·`관련 도구`·`다음 단계`·`참고 자료`·`원문 보기`)가 `부모 상자 밖으로 가로 잘림` 으로 잡힌다.
  - 이유: 그 영역은 300px `overflow-x:auto` 에 `data-scroll-row` 가 없고, 스크롤바를 숨기지 않았다. 768 미만에서는 오버레이 스크롤바라 스크롤 단서가 없다. 새 규칙대로면 모바일에서는 결함이 맞다 (그 fixture 는 1440 기준의 '정상 스크롤 영역' 이다).
  - 기준을 느슨하게 하지 않았고 fixture 도 바꾸지 않았다.

### 결정
- 360 self-test 검사 목록에 `clip` 을 더했다. 360 영역의 clean 줄(모두 `data-scroll-row`)은 가로 면제를 받아 실패 0 이다. defects 360 영역의 다른 clip 실패(덮는 표시 줄의 74px 칩 글자 넘침)는 결함 페이지라 상관없다.
- 앱 영향 예상(측정은 하지 않음): 768 미만에서 `data-scroll-row` 없이 스크롤바를 숨기지 않은 가로 스크롤 영역이 조작 요소를 가리면 새로 `clip` 실패가 난다. 36 재측정 4 의 HEAD 에는 768 미만 clip 실패가 0 이었고 그때 이 면제가 적용됐는지는 따로 재지 않았다. 다음 측정에서 확인된다.

## 후속 4: 툴바 Must-Read 증거 `mustReadVisible` (보정 5, plan '보정 5' 의 '30 A 후속 4')
### 한 일
- fixture 를 먼저 커밋했다 (`510cfde test(ui-redesign): 30 후속 4 실패 fixture — 숨은 Must-Read (보정 5)`).
  - `defects.html` 새 영역 `[data-self-test-both]`(폭 312px)에 '숨은 Must-Read' 를 넣었다.
    - `[data-feed-toolbar]` 안 소스 줄(`role="group" aria-label="소스"`)의 첫 칩이 `data-must-read-toggle` 버튼(154px)이다. 줄을 `scrollLeft` 138 로 밀었다 (3차·보정 3 구조).
    - 툴바에 `data-expect="scrollRow"`, `data-expect-reason="Must-Read 토글"` 를 달았다.
    - 넘친 쪽 표시(양쪽)·이전/다음 버튼·`scroll-padding: 0 24px`·선택 칩(`전체`, 흐림 밖 24px 에서 시작)을 맞춰 Must-Read 판정 말고는 `scrollRow` 가 실패하지 않게 했다. 1440 에서는 R14('소스' 넘침)가 함께 걸린다.
    - 왼쪽 표시가 있어 옛 `mustReadHidden && !startHint` 판정도 통과한다.
  - `clean.html` 같은 영역의 고친 형태: Must-Read 토글(44×44, `aria-label="Must-Read"`)이 소스 줄 밖, 줄과 정렬 선택창 사이 형제다. 소스 줄은 넘치지 않는 폭(칩 2개)이라 1440 R14 와 엉키지 않는다.
  - fixture 스크립트의 `data-init-scroll` 이 숫자 값도 받게 했다.
- 수정 전 확인:
  - fixture 만 더한 상태: self-test 가 **종료 0** 이었다. plan 이 예상한 종료 1 이 아니었다. 이유는 둘이다.
    - (a) 1440 폭에서 R14('소스' 넘침) 실패가 툴바의 자손(소스 줄)에 남아 `scrollRow` 표시를 채웠다.
    - (b) 그 영역을 360 폭에서 보는 장치가 없었다.
  - self-test 장치만 고쳤다:
    - `[data-self-test-both]` 를 360 패스 범위에 더하고, 이 영역의 표시는 모든 폭에서 잡혀야 맞게 했다.
    - `data-expect-reason` 이 있으면 그 검사 실패 이유에 그 글자가 있어야 맞게 했다 (`fail` 이 `data-audit-reasons` 를 남김).
    - 그 결과 **종료 1, 이 표시만 MISS** 다. 판정이 없어 두 폭 모두 `Must-Read 토글` 실패가 나지 않는 것을 확인했다 (아래).
- 판정 수정 (`ui-audit.mjs`):
  - 보정 3 의 소스 줄 증거(`sourceRow`, `{ mustReadHidden, startHint }`)와 그 판정을 지웠다. 768 미만 표시 판정의 지역 변수 이름 `startHints`·`endHints` 는 `leftHints`·`rightHints` 로 바꿨다 (끝 기준 grep).
  - 새 툴바 증거를 넣었다. 처음 상태(`initialState`: `/` 기본 상태와 self-test)에서 소스 그룹이 있는 `[data-feed-toolbar]` 마다 `checks.scrollRow.toolbar = { viewport, mustReadVisible, mustReadRect }` 를 남긴다.
  - `mustReadVisible` 은 아래 조건을 모두 만족할 때만 참이다. 거짓이면 실패 `Must-Read 토글이 첫 화면에 다 보이지 않음 (이유…)` 를 툴바에 남긴다.
    - `[data-must-read-toggle]` 가 정확히 하나다.
    - 소스 그룹 안이 아니다.
    - 보인다.
    - rect 가 화면(`0 ≤ left`, `right ≤ innerWidth`)과 툴바 상자 안에 1px 허용으로 다 든다.
    - 가운데 점의 `elementFromPoint` 가 토글이나 그 자손이다.
    - 768 미만이면 터치 영역이 44×44 이상이다 (R6: `TOUCH_MIN` 44, `TOUCH_TOLERANCE` 0.5 를 `K.touchMin`·`K.touchTolerance` 로 in-page 에 넘김, 값 그대로).
  - 레이더 펼침·대화상자 상태는 사용자 조작 뒤라 보지 않는다.
- 기준값 상수는 바꾸지 않았다. 프로덕션 측정은 하지 않았다 (36 재측정 5).

### 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html, frontend/scripts/ui-audit-fixtures/clean.html (`510cfde`)
- frontend/scripts/ui-audit.mjs
- tasks/ui-redesign/30-audit-clip-scroll.md

### 검사 결과
- fixture 만 더한 상태 `--self-test` → 종료 0 (예상과 다름, 위 이유):
  ```
    OK   scrollRow    소스 줄 첫 칩 Must-Read 가 scrollLeft 138 로 숨음 (1440)
         scrollRow    실패 1440 12건, 360 5건
  SELF-TEST PASS: …
  ```
- self-test 장치만 고친 상태(판정 수정 전) → **종료 1**:
  ```
    MISS scrollRow    소스 줄 첫 칩 Must-Read 가 scrollLeft 138 로 숨음
         scrollRow    실패 1440 12건, 360 5건
    OK   scrollRow    1440px 대상 4, 실패 0      (clean.html)
    OK   scrollRow    360px 대상 4, 실패 0       (clean.html)
  SELF-TEST FAIL: 1건
    - defects.html: scrollRow 이(가) 결함을 잡지 못함 — 소스 줄 첫 칩 Must-Read 가 scrollLeft 138 로 숨음
  ```
- 판정 수정 뒤 → **종료 0**:
  ```
    OK   clip         스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼 (360) (360)
    OK   scrollRow    소스 줄 첫 칩 Must-Read 가 scrollLeft 138 로 숨음 (1440·360)
         scrollRow    실패 1440 13건, 360 6건
    OK   clip         1440px 대상 83, 실패 0      (clean.html)
    OK   occluded     1440px 대상 36, 실패 0
    OK   scrollRow    1440px 대상 5, 실패 0
    OK   clip         360px 대상 35, 실패 0
    OK   scrollRow    360px 대상 5, 실패 0
    OK   occluded     360px 대상 15, 실패 0
  dev-indicator.html
    OK   nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정
  ```
  (나머지 data-expect 와 clean 1440 의 10개 검사 모두 OK)
- fixture 툴바 증거 (scratchpad 스크립트로 같은 판정 실행):
  - defects 1440: `mustReadVisible: false`, `mustReadRect {left -58, right 96, 154×32}`. 이유 '소스 그룹 안, 화면 밖, 툴바 상자 밖, 가운데 점이 토글이 아님' (+ R14).
  - defects 360: 위 이유에 '터치 영역 154×32 < 44' 가 더해진다.
  - clean 1440·360: `mustReadVisible: true`, `mustReadRect {left 218, right 262, 44×44}`, 실패 0.
- `grep -nE "mustReadHidden|startHint" frontend/scripts/ui-audit.mjs` → 출력 없음 (종료 1).
- `pnpm exec eslint scripts/ui-audit.mjs` → 종료 0. `node scripts/ui-audit.mjs --help` → 종료 0.

### 결정
- 툴바 판정은 소스 그룹(`[role="group"][aria-label="소스"]`)이 있는 `[data-feed-toolbar]` 만 본다. clean·defects 의 `vRhythm` fixture 는 소스 그룹 없는 `[data-feed-toolbar]` 껍데기라 판정 대상이 아니다. 앱의 툴바는 늘 소스 그룹이 있어 토글이 빠져도 잡힌다.
- 처음 상태에서만 본다 (`initialState` 인자). 레이더 펼침 상태는 패널이 툴바를 아래로 밀어 가운데 점이 화면 밖이 될 수 있다. 그 상태는 사용자 조작 뒤라 spec '처음 상태' 밖이다.
- `data-expect-reason`·`[data-self-test-both]` 는 self-test 장치다. 앱 측정 경로는 쓰지 않는다. 1440 R14 처럼 다른 이유의 실패가 새 결함 표시를 덮어 수정 전 실패를 가리던 문제를 막는다.
