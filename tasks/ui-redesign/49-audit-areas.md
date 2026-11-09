# Task 49: ui-audit 보정 9 검사·fixture·사전 측정

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 49 (보정 9)
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-07

## 한 일
- 실패 fixture 커밋 `54ee20b` (fixture 두 파일만). 스크립트를 고치기 전 `--self-test` 종료 1.
  - 실제 fixture 그대로: `SELF-TEST FAIL: 72건`, MISS 39줄. 옛 스크립트는 `data-self-test-dialog` 를 몰라 fixture 의 `role="dialog"`(브리핑 블록)를 '맨 위 대화상자' 로 잡고 모든 검사를 그 안으로 좁혀, 기존 결함까지 MISS 가 된다 (옛 판정이 새 fixture 를 다루지 못하는 실패).
  - 진단용으로 두 fixture 의 `role="dialog"` 만 뺀 사본(scratchpad)을 옛 스크립트로 돌린 결과 (plan 이 예상한 실패 이유):
```
  MISS vRhythm      요약 바 아래 30px
  MISS toolbarLayout 아래 줄 토글 구조의 필터 영역 안 정렬
  MISS toolbarLayout 아래 줄 토글 (소스 줄과 다른 줄)
  MISS terms        탭 Ask AI 질의응답
  MISS terms        버튼 접근 이름 전용 챗에서 분석
  MISS terms        배너 전용 AI 챗으로 이동
SELF-TEST FAIL: 23건
  - defects.html: 모르는 검사 이름 data-expect="feedAreas"
  - defects.html: 모르는 검사 이름 data-expect="feedAreas"
  - defects.html: 모르는 검사 이름 data-expect="feedAreas"
  - defects.html: 모르는 검사 이름 data-expect="feedAreas"
  - defects.html: 모르는 검사 이름 data-expect="chatHeader"
  - defects.html: 모르는 검사 이름 data-expect="pictograph"
  - defects.html: 모르는 검사 이름 data-expect="pictograph"
  - defects.html: 모르는 검사 이름 data-expect="pictograph"
  - defects.html: 모르는 검사 이름 data-expect="briefing"
  - defects.html: 모르는 검사 이름 data-expect="briefing"
  - defects.html: 모르는 검사 이름 data-expect="briefing"
  - defects.html: 모르는 검사 이름 data-expect="cardFooter"
  - defects.html: 모르는 검사 이름 data-expect="cardFooter"
  - clean.html: vRhythm 1440px 오탐 — 요약 바 → 툴바 간격 60px (12~16) section:nth-of-type(15) > div > div[data-feed-toolbar]:nth-of-type(3) "전체하네스 & 벤치마크MCP & 생태계 전체GitHub ★ Must-Read"
  - clean.html: vRhythm 1440px 오탐 — 툴바 → 상태 줄 간격 20px (12~16) section:nth-of-type(15) > div > div:nth-of-type(4) > div[role="status"][data-feed-status] "총 20건"
  - clean.html: toolbarLayout 360px 오탐 — 768 미만: 소스 줄 보이는 폭 284 < 327 section:nth-of-type(1) > div:nth-of-type(4) > div[data-feed-toolbar]:nth-of-type(2) > div[data-toolbar-row]:nth-of-type(2) > div[role="group"][aria-label="소스"][data-scroll-row] "소스"
  - clean.html: toolbarLayout 360px 오탐 — 768 미만: Must-Read 토글이 소스 줄과 같은 줄 (top 284 < 소스 줄 bottom 328) section:nth-of-type(1) > div:nth-of-type(4) > div[data-feed-toolbar]:nth-of-type(2) > div[data-toolbar-row]:nth-of-type(2) > button[aria-label="Must-Read"] "Must-Read"
```
  - plan 예상과 다른 점: clean `vRhythm` 블록은 목록 머리줄 안에 `[data-feed-status]` 를 두어(프로덕션 50단계 구조와 같게) 옛 판정이 '대상 없음' 대신 간격 오탐(요약 바 → 툴바 60px, 툴바 → 상태 줄 20px)을 냈다. 세 영역 clean 의 좁은 소스 줄은 옛 `toolbarLayout`(보이는 폭 ≥ 327, 토글이 소스 줄 아래)에서도 오탐.
- 스크립트 `frontend/scripts/ui-audit.mjs` (spec 14.17 'ui-audit' 표):
  - `R9_CHECKS = ['feedAreas', 'chatHeader', 'pictograph', 'briefing', 'cardFooter']` 를 `ALL_CHECKS` 에 넣었다. 기준 상수는 상단 `EXPECT9`(입력 44/36, 칩 44/32, 허용 1px·0.5px, 긴 라벨 4개, 금지 용어 3개, 판정식 `/\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/u` — IconGuard 와 같은 식). `K`·`EXPECT7` 의 기존 값은 그대로다.
  - 상태별 실행: `/` 처음 상태 `feedAreas`·`cardFooter`·`terms`, `/chat` 기본 `chatHeader`·`pictograph`, 챗 포커스 필터 `pictograph` 추가, 뉴스 상세 첫 탭과 `ask-ai` 탭 `pictograph`·`terms`(탭 상태에도 `extraChecks`), 일일 브리핑 `pictograph`·`briefing`.
  - 판정 바꿈: `toolbarLayout`(보정 7 의 '보이는 폭 ≥ innerWidth − 33'·'토글·정렬 top ≥ 소스 줄 bottom' 을 지우고 다섯 조건, 기록에서 `sortTop` 빼고 `toggleRight`·`contentRight` 추가), `vRhythm`(세 간격, 대상 없으면 '대상 없음'), `terms`(보이는 `button`·`a`·`[role="tab"]` 의 접근 이름·글자에 `Ask AI`·`전용 AI 챗`·`전용 챗`).
  - `ENTRY_POINTS` `card-chat` → `/^AI 챗에서 분석/`, `DIALOGS` 뉴스 상세 탭 → `{ id: 'ask-ai', label: '뉴스 상세 AI 질의응답 탭', name: /^AI 질의응답/ }`. 머리 주석·`--help` 문구를 고쳤다.
  - self-test: `feedAreas` 는 1440(`[data-self-test-narrow]` 밖)과 360(그 영역)에서 돈다 (`SELF_TEST_NARROW_ALSO_CHECKS`). fixture 의 `role="dialog"` 는 `data-self-test-dialog` 로 '맨 위 대화상자' 판정에서 뺀다.
- fixture (실패 fixture 커밋 `54ee20b`): spec fixture 표 8행을 `defects.html`·`clean.html` 에 넣었다. `[data-feed-toolbar]` 가 있는 clean 블록 셋(보정 5 숨은 Must-Read, 보정 7 좁은 소스 줄, vRhythm)을 세 영역 구조로 고쳤다. defects 의 `vRhythm` 블록도 세 영역으로 바꿔 '요약 바 → 검색 영역 30px' 이 잡히게 했다(`data-expect-reason`). 새 결함 블록의 덤 실패는 `data-expect-reason` 으로 가렸다.
- 면제 확인: clean 의 `.markdown-viewer` 안 `💡` h3, `a[target="_blank"]` 안 `🚀`, `h2` `AgentLens © 2026 ↔ 피드`, `role="alert"` 안 `이메일 설정 열기`, 고정 머리글 `오늘의 추천 Action Items` 가 통과한다. 면제 세 줄을 뺀 사본 스크립트로 돌리면 clean 이 그 다섯 요소에서 실패하는 것도 확인했다 (면제가 실제로 판정을 바꾼다).
- 사전 측정 (결과는 커밋하지 않음): `git worktree add --detach <scratchpad>/al-pre9 adf8581` → `pnpm install --frozen-lockfile` → `NEXT_PUBLIC_API_URL=http://localhost:8102 INTERNAL_API_URL=http://127.0.0.1:8102 pnpm build`(성공) → standalone `PORT=3101`, backend 는 DB 복사본(`audit-agentlens.db`)으로 127.0.0.1:8102. 이 단계 스크립트로 `--base http://127.0.0.1:3101 --out <scratchpad>/pre-audit-9 --screenshots none --commit adf8581`. 끝난 뒤 서버를 끄고 worktree 를 지웠다.

## 바꾼 파일
- frontend/scripts/ui-audit.mjs
- frontend/scripts/ui-audit-fixtures/defects.html (`54ee20b`)
- frontend/scripts/ui-audit-fixtures/clean.html (`54ee20b`)

## 검사 결과
- `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` → 출력 없음, 종료 0.
- `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` → 종료 0. 새 결함 블록 (모두 OK):
```
  OK   toolbarLayout 아래 줄 토글 구조의 필터 영역 안 정렬 (360)
  OK   toolbarLayout 아래 줄 토글 (소스 줄과 다른 줄) (360)
  OK   terms        탭 Ask AI 질의응답 (1440)
  OK   terms        버튼 접근 이름 전용 챗에서 분석 (1440)
  OK   terms        배너 전용 AI 챗으로 이동 (1440)
  OK   feedAreas    칩 줄 사이 검색 (보정 7 구조, 360) (360)
  OK   feedAreas    칩 줄 안 검색·정렬 (보정 8 구조) (1440)
  OK   feedAreas    칩 줄과 같은 줄 검색 입력 (③) (1440)
  OK   feedAreas    오른쪽 열 검색 입력 왼쪽 끝 ≠ 콘텐츠 왼쪽 (⑤) (1440)
  OK   chatHeader   기록 버튼이 앞 (1440)
  OK   pictograph   추천 질문 버튼의 💡 (1440)
  OK   pictograph   분야 머리글의 🔌 (1440)
  OK   pictograph   이모지 표현 선택자가 붙은 ⚠️ (1440)
  OK   briefing     대화상자 설정 버튼 2개 (톱니·바닥) (1440)
  OK   briefing     설명과 본문에 같은 헤드라인 (1440)
  OK   briefing     분야 머리글 MCP & 도구·스킬 생태계 (1440)
  OK   cardFooter   이관 버튼 글자 sr-only (1440)
  OK   cardFooter   줄바꿈 없는 바닥 줄에서 카드 밖으로 넘친 버튼 묶음 (1440)
  OK   vRhythm      요약 바 아래 30px (1440)
...
  OK   feedAreas    1440px 대상 2, 실패 0
  OK   chatHeader   1440px 대상 1, 실패 0
  OK   pictograph   1440px 대상 103, 실패 0
  OK   briefing     1440px 대상 1, 실패 0
  OK   cardFooter   1440px 대상 1, 실패 0
  OK   toolbarLayout 360px 대상 1, 실패 0
  OK   feedAreas    360px 대상 1, 실패 0
dev-indicator.html
  OK   nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)

SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 21개 통과, dev-indicator.html 환경 오류 판정
```
  기존 결함(clip·placeholder·occluded·scrollRow·ariaControls·keepAll·rowAlign·chatAlign·toast·cardMetric·chatScope·modelPicker·focusLabels·보정 5 두 폭)도 모두 OK, clean 은 1440·360 모든 검사 대상 있음·실패 0.
- 사전 측정 `adf8581` (종료 1, 고치기 전이라 실패가 맞다):
```
FAIL: 조합 160, 통과 110, 실패 50, 건너뜀 0, 실패 항목 114
  clip·placeholder·occluded·scrollRow·ariaControls·keepAll  상태 150, 실패 0
  vRhythm      상태 10, 실패 상태 10, 실패 요소 10
  toolbarLayout 상태 10, 실패 상태 4, 실패 요소 16
  cardMetric   상태 10, 실패 상태 0, 실패 요소 0
  feedAreas    상태 10, 실패 상태 10, 실패 요소 92
  cardFooter   상태 10, 실패 상태 10, 실패 요소 180
  terms        상태 60, 실패 상태 20, 실패 요소 200
  pictograph   상태 40, 실패 상태 20, 실패 요소 90
  briefing     상태 10, 실패 상태 10, 실패 요소 52
  rowAlign 6·chatScope 30·modelPicker 10·focusLabels 10·toast 10·chatAlign 4  실패 0
  chatHeader   상태 10, 실패 상태 10, 실패 요소 20
```
  (상태별 검사 150 = 160 조합 − 열지 못한 `ask-ai` 탭 10.) 브리핑이 있어 `briefing`·브리핑 `pictograph` 는 skipped 가 아니다.

  | 검사 | spec 14.17 '고치기 전 (예상)' | 사전 측정 (실패 상태 / 요소) | 대표 요소·이유 | 담당 |
  |---|---|---|---|---|
  | `feedAreas` | 모든 폭 ①, 768 이상 ③⑤, 768 미만 ② | 10/92. 모든 폭 ①(`[data-feed-search]`·`[data-feed-list-header]` 0개, 검색·select 가 툴바 안, 정렬이 머리줄 밖)·②(검색 bottom > 첫 칩 줄 top)·⑤(토글 오른쪽 끝 ≠ 콘텐츠: 1440 1184 ≠ 1328, 360 224 ≠ 344). 768 이상 ③(검색 입력이 카테고리 그룹과 세로 36px 겹침)·⑤(검색 왼쪽 1040 ≠ 112) | 1440 `search` x1040 y144 w288 h36, 정렬 x1200 y188. 360 '② 검색 bottom 224 > 첫 칩 줄 top 128' | 50 E |
  | `toolbarLayout` | 360·390: 토글이 소스 줄 아래 줄, 툴바 안 정렬·검색 | 4/16 (360·390 × 2테마): 토글이 다른 줄(가운데 306, 소스 줄 228~280), 토글 오른쪽 끝 224 ≠ 344(390: 254 ≠ 374), 툴바 안 검색 입력, 툴바 안 select. 보이는 폭 344 ≥ 275·칩 2개는 통과 | 360 `source` `{visibleWidth:344, fullyVisibleChips:2, toggleTop:284, toggleRight:224, contentRight:344}` | 50 E |
  | `vRhythm` | '대상 없음: `[data-feed-search]`, `[data-feed-list-header]`' | 10/10 같은 문장 | — | 50 E |
  | `chatHeader` | 모든 폭 (기록 버튼이 먼저) | 10/20: 첫 조작 요소 '대화 기록 보기', 링크 왼쪽 끝 56 > 8(768: 60 > 16) | — | 52 F |
  | `pictograph` | `/chat` 기본 추천 카드 4·모델 칩 `🎯`, 일일 브리핑 분야 머리글 | 20/90: `/chat` 10 상태 × 5(💡🔄📊⚡ 추천 질문, `🎯Sonnet …추천`), 일일 브리핑 10 × 4(🎯🔌🤖💡 머리글). 챗 포커스 필터·상세 첫 탭은 0 | `💡 FastMCP로 파이썬 기반 경량 MCP 서버 구축하는 방법`, `🔌MCP & 도구·스킬 생태계` | 52 F, 53 H |
  | `terms` | `/` 카드마다 `전용 챗에서 분석`, 상세 탭 `Ask AI 질의응답`·배너 `전용 AI 챗으로 이동` | 20/200: `/` 10 상태 × 카드 18개 '전용 챗', 상세 첫 탭 10 × 2 ('Ask AI' 탭, '전용 AI 챗' 배너). `/chat` 상태는 0 | — | 51 D2 |
  | `briefing` | ① 768 이상 2개 ② 헤드라인 두 번 ③ `MCP & 도구·스킬 생태계` 등 | 10/52: ① 768·1024·1440 × 2테마에서 '연동 설정'·'연동 설정 관리' 2개(768 미만은 1개라 통과), ② 모든 폭 헤드라인 `moltis-org/moltis: A secure persistent p...`, ③ 모든 폭 3개(`MCP & 도구·스킬 생태계`, `에이전트 아키텍처 & 런타임`, `최신 AI 소식 & 프론티어 모델`. `하네스 & 벤치마크` 는 통과) | `categoryHeadings` 4개 기록 | 53 H |
  | `cardFooter` | 모든 폭(보이는 글자 `챗에서 분석`), 1024 는 `sr-only` | 10/180 (카드 18개 × 10): 8 상태 보이는 글자 '챗에서 분석', 1024 × 2테마 보이는 글자 '' (sr-only). 버튼 묶음 넘침·통계 겹침은 0 | — | 51 D2 |
  | R9 `card-chat` | 진입점 실패 | `/` 10 조합 모두 `missing: card-chat` | — | 51 D2 |
  | 뉴스 상세 `ask-ai` 탭 | 측정 못 함 (결정 2) | 10 조합 `open: 탭 없음: /^AI 질의응답/` — 실패·통과가 아니라 **측정 못 함**. 그 탭의 `pictograph`(빠른 질문 4개)·`terms` 는 fixture·51 단위 테스트·54 IconGuard 로 증명 | — | 51 D2 |

  - 예상과 다른 점: `feedAreas` ② 와 토글 ⑤ 가 768 이상에서도 나온다. ② 는 `[data-feed-search]` 가 없을 때 검색 입력 위치로 순서를 보기 때문이고(1440 검색이 첫 칩 줄과 같은 줄), 토글 ⑤ 는 보정 8 구조에서 토글 뒤에 정렬이 있어 토글 오른쪽 끝이 콘텐츠 끝이 아니기 때문이다. 둘 다 G1 과 같은 결함이라 판정 오탐이 아니다. `toolbarLayout` 의 토글 ⑤ 도 같은 이유다.
  - 판정 오탐: 없음 (`terms` 를 `/` 전체로 넓혀도 '전용 챗' 말고는 걸리지 않았고, `pictograph` 는 포커스 필터·상세 첫 탭에서 0).
  - 목록 밖 파일 결함: 없음. 모든 실패가 50(피드 세 영역)·51(카드·이관·상세)·52(챗 헤더·이모지)·53(브리핑) 담당 파일의 결함이다.
- 정리: 3101·8102 서버를 껐고(`lsof` 로 포트 비었음 확인) worktree `al-pre9` 를 지웠다. `git status --short -- config.json sources.json backend/app/config/sources.json` 출력 없음 (바뀌지 않음).

## 결정
- `feedAreas` 는 `[data-feed-toolbar]` 의 부모(콘텐츠 상자)마다 본다. 프로덕션은 `main` 하나이고, self-test 는 블록마다 따로 판정된다. ① 의 '정확히 1개' 는 그 부모 안에서 센다.
- `feedAreas` ② 는 `[data-feed-search]` 가 없으면 검색 입력의 위치로 본다 (spec 표의 '768 미만 ②(검색이 칩 두 줄 사이)' 를 잡으려면 영역이 없는 고치기 전 구조에서도 판정해야 한다).
- `briefing` ③ 의 고정 머리글에 `오늘의 추천 Action Items` 를 더했다. spec 은 `오늘의 핵심 요약` 만 뺐지만 Action Items 칸 머리글도 `h3` 라 그대로면 고친 뒤에도 실패한다 (분야 머리글이 아님). 머리글 글자는 `aria-hidden` 자손(아이콘)을 뺀 글자로 비교한다. 이모지는 `pictograph` 가 따로 본다.
- `briefing` ③ 은 '카테고리별 요약' 탭이 선택되어 있을 때 그 탭 패널만 본다. 탭이 없는 대화상자(fixture)는 대화상자 전체.
- `chatHeader` 는 앱에서는 첫 `header`(`/chat` 은 하나), self-test 에서는 범위 안 `header` 모두를 본다.
- `cardFooter` 는 접근 이름이 `/챗에서 분석/` 인 버튼이 있는 카드만 대상이다 (다른 fixture 카드 제외). 대상이 0이면 '대상 없음' 실패.
- `daily-briefing+settings` 를 여는 버튼 이름을 `/연동 설정 관리/` → `/^연동 설정( 관리)?$/` 로 바꿨다. 53 이 바닥 버튼 글자를 `연동 설정` 으로 줄이면 55 에서 이 상태를 열지 못하기 때문이다. 고치기 전 커밋에서는 위 톱니(`연동 설정`)를 눌러 같은 겹침 상태를 연다 (사전 측정에서 10 조합 모두 PASS).
- `terms`·`pictograph` 의 면제는 기존 `terms` 면제(마크다운·입력·`[role="log"]`·챗 메시지·`title` 이 글자와 같은 요소)와 spec 의 `pictograph` 면제(`.markdown-viewer`, `a[target="_blank"]`, 사용자 글)를 쓴다.

## 막힌 점
- 없음.

## 다음
- 없음 (55 에서 HEAD 측정 때 판정 오탐이 나오면 49 의 연장으로 고친다).
