# Task 38: ui-audit 새 검사 6개·새 측정 상태·fixture·사전 측정

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 38 (보정 7)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-07

## 한 일
- 단계 시작 HEAD `2d52b40`. 39~42 와 같은 작업 트리에서 병렬로 했다. `frontend/scripts/**` 와 이 task 파일만 고쳤다. `frontend/src` 는 건드리지 않았다.
- fixture 를 먼저 커밋했다 (`05ca99f test(ui-redesign): 38 실패 fixture — 보정 7 검사 6종`). spec 14.15 fixture 표 그대로다.
  - 360 영역(`[data-self-test-narrow]`) — 좁은 소스 줄(`toolbarLayout`):
    - defects: `[data-feed-toolbar]` 한 줄에 소스 그룹(칩 6개)·44px 토글·112px 정렬.
    - clean: 줄바꿈(`flex-wrap`), 소스 감싸개 `flex-basis` 100%(+ 화면 끝까지 `bleed`), 토글 `margin-left:auto`.
  - 360 영역 — 넘친 모드 탭(`chatScope`):
    - defects: `[data-chat-context-bar]` 스크롤 줄에 약 353px 두 탭, 둘째 탭이 보이게 끝까지 민 상태.
    - clean: 약 202px 두 탭, `data-overflow="none"`.
  - 1440 영역 — RSS 합성 점수(`cardMetric`):
    - defects: `data-source="rss_kr"` 카드에 `sr-only` `점수` + `180`, `github` 카드에 `댓글`.
    - clean: `rss_kr` 점수 없음, `github` `스타`·`포크`, `hackernews` `포인트`·`댓글`.
  - 1440 영역 — 영어 용어(`terms`):
    - defects: 탭 `단일 기사 (Scoped)`·`전체 코퍼스 (Global)`, 배지 `Global`, 캡슐 `Focus: 전체 소식`.
    - clean: 탭 `단일 기사`·`전체 소식`, 배지 `전체 소식`, 캡슐 `포커스: 전체 소식`. `title` 이 글자와 같은 세션 제목 `Global 소식 정리` 와 `Global`(사용자 글 면제 확인)도 넣었다.
  - 1440 영역 — 두 번 나온 모델 선택(`modelPicker`):
    - defects: 헤더와 입력창 아래에 `Claude 모델 선택: Sonnet 5.5` 버튼 둘.
    - clean: 입력창 아래 하나, 헤더에 `display:none` 인 같은 버튼(숨긴 것은 세지 않음 확인).
  - 1440 영역 — 다른 포커스 라벨(`focusLabels`):
    - defects: `도메인 카테고리` 에 `하네스·평가` 등.
    - clean: 긴 라벨 5개.
  - 두 fixture 에 `.sr-only` 스타일을 더했다. defects fixture 스크립트의 `data-init-scroll` 은 `max` 값도 받게 했다.
  - clean 의 기존 챗 맥락 줄 그룹(`검색 스코프 모드`) 버튼 글자를 `전체 검색`·`단일 기사` 에서 `단일 기사`·`전체 소식` 으로 바꿨다 ('결정' 1).
- 스크립트 수정 전 `--self-test` 가 종료 1 로 실패하는 것을 확인했다 (아래).
- `ui-audit.mjs`:
  - 새 검사 6개를 spec 14.15 표의 대상·판정·기록 그대로 넣었다. 실패는 모두 요소 경로·이유와 함께 남는다.
  - `toolbarLayout`: `/` 처음 상태. 768 미만에서 소스 줄을 판정하고 `checks.toolbarLayout.source = { viewport, visibleWidth, fullyVisibleChips, toggleTop, sortTop, sourceBottom }` 를 남긴다.
    - 판정: 소스 줄을 `[0, innerWidth]` 로 자른 폭 < `innerWidth − 32 − 1` 이면 실패.
    - 판정: 흐림 24px 를 뺀 범위에 다 드는 소스 칩(`[data-source-chip]`, 없으면 그룹 안 `button`)이 2개 미만이면 실패.
    - 판정: 토글·정렬 top < 소스 줄 bottom − 1 이면 실패.
    - 768 이상은 판정하지 않고 줄마다 `{ label, viewport, rowWidth, fullyVisibleChips }` 를 `checks.toolbarLayout.rows` 에 남긴다.
  - `cardMetric`: `/` 의 보이는 카드 전부.
    - 소스는 `data-source`, 없으면 머리줄 둘째 조각을 `SOURCE_LABELS` 로 거꾸로 찾는다.
    - 통계는 `data-card-stat`, 없으면 `sr-only` 글자가 통계 라벨인 요소다.
    - 실패 ①~④ (종류 없는 `점수`, 원천 지표 없는 소스의 점수, 지표 라벨 불일치, github 개수 ≠ `포크`).
    - `checks.cardMetric.summary = { cards, bySource }` 를 남긴다.
  - `chatScope`: `/chat` 기본·기사 칩·경고 알림.
    - 실패: 두 탭이 화면 밖이거나, 맥락 줄 스크롤 줄 보이는 범위(흐림 24px 제외) 밖.
    - 실패: 기본·경고 알림 상태에서 그 줄 `data-overflow` 가 `none` 이 아님. 상태는 새 인자 `chatState` 로 넘긴다.
  - `terms`: `/chat` 모든 측정 상태(포커스 필터 열림 포함).
    - 실패: 자기 텍스트 노드를 이어 붙인 글자가 `Scoped`·`Global` 이거나 `(Scoped)`·`(Global)` 포함, `Focus:` 로 시작, `코퍼스` 포함.
    - 실패: `검색 스코프 모드` 둘째 버튼 접근 이름이 `전체 소식` 이 아님.
    - 면제: `title` 이 글자와 같은 요소(와 그 안), `.markdown-viewer`, 입력창, 메시지 목록(`[role="log"]`, `[data-chat-messages]`).
  - `modelPicker`: `/chat` 기본. 실패: 보이는 `Claude 모델 선택…` 버튼이 정확히 1개가 아니거나, 그 버튼 top < 질문 입력창 bottom − 1.
    - 입력창은 접근 이름(`aria-label`, 없으면 `<label>`)이 `질문 입력` 으로 시작하는 textarea 중 버튼보다 DOM 앞의 마지막 것이다.
  - `focusLabels`: 새 상태. `도메인 카테고리` 칩 글자 목록이 기대 목록과 다르면 실패.
  - 기대값은 스크립트 상단 상수 `EXPECT7` 에 둔다 (`lib/labels.ts` 와 같은 값). `SOURCE_LABELS`, 점수 지표 라벨, 통계 라벨, 포커스 라벨 5개, `전체 소식`, 페이지 여백 16, 최소 칩 2 가 들어 있다. 기존 기준값 상수 `K` 는 바꾸지 않았다.
  - 새 측정 상태 '챗 포커스 필터 열림'(`CHAT_FOCUS_DIALOG`, 5폭 × 2테마):
    - `/chat` 기본 측정 뒤 `지식 검색 포커스 필터 설정 열기` 로 시작하는 버튼으로 대화상자를 연다.
    - `measureDialog` 로 R3·R6(768 미만)·R7(속성·Escape)과 14.8 상태별 검사 6개를 잰다. 여기에 `focusLabels`·`terms` 를 더 돈다 (대화상자 정의의 `extraChecks`).
    - 조합 150 → 160 이다. 스크린샷 규칙은 그대로다.
  - 기존 상태 연결:
    - `/` 처음 상태: `toolbarLayout`·`cardMetric`.
    - `/chat` 기본: `chatScope`·`terms`·`modelPicker` (`chatState: 'base'`).
    - 기사 칩: `chatScope`·`terms` (`'source'`).
    - 경고 알림: `chatScope`·`terms` (`'toast'`).
  - `vRhythm`·`chatAlign`·`toast` 의 `pick()` 이 범위(`inScope`)를 따르게 했다 ('결정' 2).
  - self-test 장치:
    - 360 폭 패스를 두 번 돈다: (a) 360 영역 + 두 폭 영역에서 `clip`·`scrollRow`·`occluded`, (b) 360 영역만 `toolbarLayout`·`chatScope`.
    - 1440 패스는 `toolbarLayout`·`chatScope` 를 뺀 나머지를 돈다.
    - 뷰포트 높이는 3000 → 6000 이다 ('결정' 3).
  - `--help` 에 새 검사·측정 상태와 self-test 360 설명을 적었다.
- 사전 측정 (결과는 커밋하지 않음):
  - `git worktree add --detach <scratchpad>/al-pre7 8d643d2` 를 프로덕션 빌드했다(성공). standalone `PORT=3101`, backend 는 DB 복사본으로 127.0.0.1:8102.
  - 측정 명령: `--base http://localhost:3101 --commit 8d643d2 --screenshots none --out <scratchpad>/pre-audit-7`.
  - 첫 실행 뒤 이름 충돌 오탐 하나를 고치고('결정' 4) 다시 쟀다. 아래는 두 번째 실행 값이다.
  - 끝나고 서버를 끄고 worktree 를 지웠다.

## 바꾼 파일
- frontend/scripts/ui-audit-fixtures/defects.html, frontend/scripts/ui-audit-fixtures/clean.html (`05ca99f`)
- frontend/scripts/ui-audit.mjs
- tasks/ui-redesign/38-audit-r35-r40.md

## 검사 결과
- 스크립트 수정 전 `cd frontend && CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs --self-test` → **종료 1**:
  ```
  SELF-TEST FAIL: 13건
    - defects.html: 모르는 검사 이름 data-expect="toolbarLayout"
    - defects.html: 모르는 검사 이름 data-expect="chatScope"
    - defects.html: 모르는 검사 이름 data-expect="cardMetric"
    - defects.html: 모르는 검사 이름 data-expect="terms"
    - defects.html: 모르는 검사 이름 data-expect="modelPicker"
    - defects.html: 모르는 검사 이름 data-expect="focusLabels"
    - clean.html: scrollRow 1440px 오탐 — Must-Read 토글이 첫 화면에 다 보이지 않음 (가운데 점이 토글이 아님) section:nth-of-type(21) > div[data-feed-toolbar] …
    - clean.html: vRhythm 1440px 오탐 — 요약 바 → 툴바 간격 -2024px (12~16) … div[data-feed-toolbar]:nth-of-type(4) …
    - clean.html: vRhythm 1440px 오탐 — 툴바 → 상태 줄 간격 2056px …
    - clean.html: chatAlign 1440px 오탐 — 사이드바 머리 영역 아래 경계 2501 ≠ 맥락 줄 아래 경계 298 …
    - clean.html: chatAlign 1440px 오탐 — 메시지 열 왼쪽 끝이 378px 어긋남 …
    - clean.html: chatAlign 1440px 오탐 — 입력 영역 왼쪽 끝이 378px 어긋남 …
    - clean.html: scrollRow 360px 오탐 — Must-Read 토글이 첫 화면에 다 보이지 않음 (가운데 점이 토글이 아님) …
  ```
  - 모르는 검사 이름 6개는 plan 이 예상한 실패다.
  - clean 오탐 7개는 새 fixture 를 더하면서 생긴 기존 판정 장치의 한계다 ('결정' 2·3). 스크립트 수정에서 고쳤다.
- 스크립트 수정 뒤 `--self-test` → **종료 0**:
  ```
  defects.html
    OK   toolbarLayout 좁은 소스 줄 (보정 6 구조: 소스 줄·토글·정렬이 한 줄) (360)
         toolbarLayout 실패 360 4건
    OK   cardMetric   rss_kr 카드에 점수 180, github 카드 개수가 댓글 (1440)
         cardMetric   실패 1440 3건
    OK   chatScope    넘친 모드 탭 (약 353px, 둘째 탭이 보이게 민 상태) (360)
         chatScope    실패 360 2건
    OK   terms        탭 (Scoped)·(Global), 배지 Global, 캡슐 Focus: (1440)
         terms        실패 1440 6건
    OK   modelPicker  Claude 모델 선택 버튼 2개 (1440)
         modelPicker  실패 1440 2건
    OK   focusLabels  하네스·평가 등 따로 둔 라벨 (1440)
         focusLabels  실패 1440 1건
    (기존 data-expect 모두 OK)
  clean.html
    OK   cardMetric   1440px 대상 5, 실패 0
    OK   terms        1440px 대상 106, 실패 0
    OK   modelPicker  1440px 대상 1, 실패 0
    OK   focusLabels  1440px 대상 1, 실패 0
    OK   toolbarLayout 360px 대상 1, 실패 0
    OK   chatScope    360px 대상 1, 실패 0
    (기존 검사 1440·360 모두 OK)
  dev-indicator.html
    OK   nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)
  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 16개 통과, dev-indicator.html 환경 오류 판정
  ```
- defects 새 결함의 실패 이유 (scratchpad 스크립트로 같은 판정 실행):
  - `toolbarLayout` (360):
    - '소스 줄 보이는 폭 140 < 327'
    - '흐림 밖에 다 보이는 소스 칩 1개 < 2'
    - 'Must-Read 토글이 소스 줄과 같은 줄 (top 216 < 소스 줄 bottom 254)'
    - '정렬 선택창이 소스 줄과 같은 줄'
  - `chatScope` (360): `단일 기사 (Scoped)` '스코프 탭이 화면 밖', '기사 칩이 없는데 맥락 줄 data-overflow="start"'.
  - `cardMetric`: `점수180` '종류 없는 점수 라벨 (rss_kr)', '원천 지표가 없는 소스(rss_kr)에 점수 통계', `댓글15` 'github 개수 통계가 포크 가 아님'.
  - `terms`:
    - '영어 괄호 라벨' 2개
    - `Global` '영어 라벨'
    - `Focus: 전체 소식` '영어 앞말'
    - global 탭 접근 이름 2개 (새 fixture 와 기존 defects 맥락 줄)
  - `modelPicker`: '보이는 Claude 모델 선택 버튼이 2개' ×2.
  - `focusLabels`: '칩 라벨 [… 하네스·평가 …] ≠ [… 하네스 & 벤치마크 …]'.
- `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` → 오류 0, 경고 0. `node scripts/ui-audit.mjs --help` 에 새 검사·상태 설명이 나온다.

### 사전 측정 (8d643d2, 보정 7 앱 수정 전)
```
FAIL: 조합 160, 통과 110, 실패 50, 건너뜀 0, 실패 항목 68
  clip         상태 160, 실패 상태 0, 실패 요소 0
  placeholder  상태 160, 실패 상태 0, 실패 요소 0
  occluded     상태 160, 실패 상태 0, 실패 요소 0
  scrollRow    상태 160, 실패 상태 0, 실패 요소 0
  ariaControls 상태 160, 실패 상태 0, 실패 요소 0
  keepAll      상태 160, 실패 상태 0, 실패 요소 0
  vRhythm      상태 10, 실패 상태 0, 실패 요소 0
  toolbarLayout 상태 10, 실패 상태 4, 실패 요소 16
  cardMetric   상태 10, 실패 상태 10, 실패 요소 440
  rowAlign     상태 6, 실패 상태 0, 실패 요소 0
  chatScope    상태 30, 실패 상태 8, 실패 요소 12
  terms        상태 40, 실패 상태 30, 실패 요소 510
  modelPicker  상태 10, 실패 상태 6, 실패 요소 12
  focusLabels  상태 10, 실패 상태 10, 실패 요소 10
  toast        상태 10, 실패 상태 0, 실패 요소 0
  chatAlign    상태 4, 실패 상태 0, 실패 요소 0
```
- `environment`: `{ devIndicator: false, base: http://localhost:3101, chrome: Chrome/157.0.8103.38, commit: 8d643d2, firstNewsId: 4845 }`. 조합 160 (`…-focus-filter` 10개 포함). R3~R9 실패 0, 대화상자 열기 실패 0.

| 검사 | 실패 상태 | 대표 실패 (상태, 요소, 이유) | spec '고치기 전' 예상과 |
|---|---|---|---|
| `toolbarLayout` | `feed-{light,dark}-{360x780,390x844}` (4, 요소 16) | `feed-light-360x780` 소스 그룹: '보이는 폭 156 < 327', '다 보이는 소스 칩 1개 < 2', `Must-Read`·정렬 'top 232 < 소스 줄 bottom 280'. 390 은 보이는 폭 186 | 같음 (360·390, 보이는 폭 약 172 예상 → 156/186, 칩 1개, 같은 줄) |
| `cardMetric` | `/` 10조합 모두 (요소 440) | `점수180` '종류 없는 점수 라벨 (rss_kr)'·'원천 지표 없는 소스(rss_kr)에 점수' 80+80, `점수19,848` '종류 없는 점수 라벨 (github)' 80·'github 점수 라벨이 스타 가 아님' 70, `댓글2646` 'github 개수 통계가 포크 가 아님' 70, `점수150` (rss) 10+10. 카드 18장 중 rss_kr 9·github 8·rss 1 | 같음. 첫 화면에 github 카드가 있어 ①③④ 가 프로덕션에서 재현됨 |
| `chatScope` | `chat-*-360x780`·`-source`·`-toast` (6), `chat-*-390x844-source` (2) (요소 12) | 360 기본: `단일 기사 (Scoped)` '스코프 탭이 화면 밖', 줄 `data-overflow="start"`. 390 기사 칩: `전체 코퍼스 (Global)` '맥락 줄 보이는 범위(흐림 24px 제외) 밖' | 360 예상과 같음. 390 기사 칩 상태가 더 잡힘 (긴 탭 + 기사 칩이라 둘째 탭이 오른쪽 흐림 속) |
| `terms` | 기본·기사 칩·경고 알림 × 5폭 × 2테마 (30, 요소 510). 포커스 필터 열림은 통과 | `Global` 312·`Scoped` 48 (1024 이상 사이드바 세션 배지), 탭 `단일 기사 (Scoped)`·`전체 코퍼스 (Global)` 각 30, 빈 화면 안내 `…수집된 코퍼스 기반의…` 30, global 탭 접근 이름 30, `Focus: 전체 소식` 20, `Focus: [AI타임스]…` 10 (기사 칩 상태) | 같음. 포커스 필터 대화상자 안에는 영어 용어가 없어 그 상태는 통과 |
| `modelPicker` | `chat-*-{768x1024,1024x768,1440x900}` (6, 요소 12) | `Claude 모델 선택: Sonnet 5.5` '보이는 버튼이 2개' | 같음 (768 이상 2개, 360·390 은 1개라 통과) |
| `focusLabels` | `chat-*-*-focus-filter` 10조합 모두 | `도메인 카테고리` '칩 라벨 ["전체 소식","하네스·평가","MCP·도구","에이전트 기술","AI 뉴스"] ≠ ["전체 소식","하네스 & 벤치마크","MCP & 생태계","에이전트 아키텍처","최신 AI 동향"]' | 같음 |

- 새 측정 상태(포커스 필터 열림)의 14.8 검사(`clip`, `placeholder`, `occluded`, `scrollRow`, `ariaControls`, `keepAll`)·R3·R6·R7 은 10조합 모두 통과다.
- 실패 분류 (우려 31):
  - 판정 오탐: 0 (첫 실행의 `focusLabels` 기대값 오탐은 고침, '결정' 4).
  - 보정 7 담당이 고칠 결함:
    - `toolbarLayout` → 41 E (`FeedToolbar.tsx`).
    - `cardMetric` → 39 D·40 D (`labels.ts`·`NewsCard.tsx`).
    - `chatScope`·`terms` → 42 F (`ChatContextBar`·`SessionItemCard`·`FocusCapsule`·`ChatMessageList`·`ChatWorkspace`).
    - `modelPicker` → 42 F (`ChatHeader`·`ChatWorkspace`).
    - `focusLabels` → 42 F (`FocusBottomSheet`).
  - 목록 밖 파일 결함: **0** (blocked 아님).
- `config.json`·`sources.json`·`backend/app/config/sources.json` 변경 없음.

## 결정
1. **clean 의 기존 챗 맥락 줄 그룹 글자를 고쳤다.** 이 그룹은 이름이 앱과 같은 `검색 스코프 모드` 인데 버튼 글자가 `전체 검색`·`단일 기사` 였다. 새 `terms` 판정의 '둘째(global) 버튼 접근 이름 = 전체 소식' 에 걸렸다. 판정 오탐이 아니라 fixture 가 R38 이전 라벨을 쓴 것이라 `단일 기사`·`전체 소식` 으로 바꿨다 (`chatAlign` 판정은 글자를 보지 않아 영향 없음). plan 의 '기존 fixture 요소는 바꾸지 않는다' 의 예외로 기록한다.
2. **`vRhythm`·`chatAlign`·`toast` 의 `pick()` 이 범위(`inScope`)를 따르게 했다.** 이 셋은 문서 첫 `[data-feed-toolbar]`·`[data-chat-context-bar]` 를 집었다. fixture 의 360 영역(페이지 맨 앞)에 새 툴바·맥락 줄을 두자 1440 판정이 그것을 집어 clean 이 실패했다. 앱 측정은 범위 인자가 없고 대화상자가 없는 상태에서 돌아 결과가 같다.
3. **self-test 뷰포트 높이를 3000 → 6000 으로 늘렸다** (판정 기준값이 아니라 self-test 장치). fixture 가 길어져 보정 5 두 폭 영역의 토글이 360 폭에서 y 3986(가운데 점 4008)이 되어 화면 밖이 됐고, `mustReadVisible` 의 가운데 점 확인이 실패했다.
4. **기대값 상수 이름을 `EXPECT7` 로 했다.** 처음 이름 `R7` 이 `measureDialog` 안의 지역 변수 `R7`(R7 대화상자 속성)에 가려져, 포커스 필터 상태에 기대값 대신 대화상자 속성 객체가 넘어갔다. 그래서 첫 사전 측정의 `focusLabels` 이유가 '≠ undefined' 였다. 이름을 바꾸고 다시 쟀다.
5. `toolbarLayout` 의 '페이지 좌우 여백 32' 는 spec 의 `innerWidth − 32 − 1` 그대로 `EXPECT7.pagePadding = 16` × 2 로 둔다. fixture 의 본문 여백은 24px 라, clean 의 소스 줄은 음수 여백으로 화면 끝까지 늘였다 (앱의 `bleed` 와 같은 모습).
6. `toolbarLayout`·`chatScope` 는 self-test 에서 360 영역만 본다. 보정 5 의 두 폭 영역 툴바(한 줄 배치)는 보정 7 이전 구조라 `toolbarLayout` 대상에서 뺐다 (그 fixture 는 `mustReadVisible` 증명용).
7. `terms` 의 사용자 글 면제에서 메시지 목록 선택자(`[role="log"]`, `[data-chat-messages]`)는 앱에 있는지 확인하지 않았다. 측정 상태에 대화가 없어 지금 결과에 영향은 없다. 세션 제목은 `title` 이 글자와 같아 면제된다.

## 막힌 점
- 없음.

## 다음
- 없음 (38 done). G18 에 합류. 43 이 같은 스크립트로 보정 7 구현 뒤 HEAD 를 잰다.
