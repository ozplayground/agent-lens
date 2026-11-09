# Task 19: ui-audit 판정 강화·자체 검증·수정 전 기준선

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 19
Status: done
Session: main
Agent: aa16eed435b46be0f (implementer A)
Updated: 2026-11-06

## 한 일
- `frontend/scripts/ui-audit.mjs` (spec 14.8, R29~R31):
  - 기존 R3~R9 측정은 그대로 두고 14.8 검사 10개를 더했다: `clip`, `placeholder`, `occluded`, `rowAlign`, `scrollRow`, `ariaControls`, `keepAll`, `vRhythm`, `chatAlign`, `toast`. 상태마다 `checks.<이름> = { pass, targets, failures[] }` 이고, 실패 하나는 요소 경로·접근 이름·rect·이유를 가진다. 검사·상태마다 실패를 40개까지 남기고 넘으면 `truncated` 로 센다 (`truncated` 가 있으면 `pass: false`).
  - 기준값은 스크립트 상단 상수 `K` (1px 허용, 다섯 점 4px 안쪽, 같은 줄 묶음 2px, 세로 간격 12~16px(서브픽셀 0.5), 챗 정렬 1px, 알림 간격 16px, 스크롤 버튼 768 이상, R14 1440 `카테고리`·`소스`, 줄 정렬 768 이상, 챗 정렬 1024 이상). `report.json` 의 `thresholds` 에도 남긴다.
  - 대상 찾기는 plan '측정 훅 계약' 대로: `scrollRow` = `[data-scroll-row]` ∪ 계산된 `overflow-x` 가 `auto`/`scroll` 인 `role="group"`. `rowAlign` = `[data-feed-card]` 와 그 안 `h3`, 머리줄 판정은 `[data-card-meta]` 가 있을 때. `vRhythm`·`chatAlign`·`toast` 는 필수 대상이 없으면 '대상 없음' 실패. `rowAlign` 도 카드가 없으면 '대상 없음' 실패.
  - 측정 상태: `/`·`/chat` 기본, `DIALOGS` 9개(뉴스 상세는 `AI 요약 & 시사점` 탭을 열린 그대로, `Ask AI 질의응답` 탭은 다시 열어 눌러서 `…-news-detail-ask-ai` 상태로), 추가 3개 `…-radar`(`트렌드` 펼침), `…-source`(`/chat?sourceId={/api/news 첫 기사 id}`), `…-toast`(`/chat?sourceId=999999999`, 알림이 뜨자마자 잼). 모든 상태에서 `clip`·`placeholder`·`occluded`·`scrollRow`·`ariaControls`·`keepAll`, `/` 기본에서 `vRhythm`·`rowAlign`(768 이상), `/chat` 기본 1024 이상에서 `chatAlign`, 경고 알림 상태에서 `toast`. 대화상자가 열린 상태는 맨 위 대화상자 안만 본다.
  - 환경(R31): 페이지를 불러올 때마다 `nextjs-portal` 을 확인하고, 있으면 '개발 서버' 환경 오류로 report 를 남기고 종료 2. `report.json` 에 `environment: { devIndicator, base, chrome, commit, firstNewsId }`, `--commit <sha>`(없으면 `git rev-parse HEAD`).
  - 스크린샷 `--screenshots key`: `{feed,chat}-{light,dark}-{5개 폭}.png` 20장 + `{detail,briefing}-light-{390x844,1440x900}.png` 4장. `--help` 에 `--commit`·`--self-test` 와 새 검사를 적었다.
  - `--self-test`: 앱 없이 Chrome 만으로 fixture 를 `page.setContent` 로 1440×3000 에서 연다. 판정: `defects.html` 의 모든 `data-expect` 요소(또는 자손)에서 그 검사가 실패하고 검사 10개 모두 결함이 하나 이상 표시돼 있음, `clean.html` 은 검사 10개 모두 대상이 1개 이상이고 실패 0 (빈 통과 금지), `dev-indicator.html` 은 개발 서버로 판정. 셋 다 맞아야 종료 0, 아니면 1.
  - `report.failures` 의 14.8 검사 항목은 건수와 앞 3개만 둔다 (전체는 조합의 `checks`). `summary.byCheck` 에 검사별 상태 수·실패 상태 수·실패 요소 수.
- fixture 3개 (`frontend/scripts/ui-audit-fixtures/`):
  - `defects.html`: 화면 밖 버튼, 부모에 잘린 칩, 말줄임 없는 한 줄 넘침, line-clamp 없는 세로 넘침, overflow hidden 상자에 세로로 잘린 링크(clip 5개), 긴 검색 자리표시, 선택창에 가린 칩, 글자 영역을 덮는 입력 위 버튼(occluded 2개), 머리줄 줄바꿈으로 제목이 어긋난 카드 두 개, 표시 없는 넘친 `소스` 줄·넘치는데 `data-overflow="none"`·넘치지 않는데 흐림(scrollRow 3개), 없는 id 를 가리키는 `aria-controls`, `keep-all` 없는 두 줄 한국어 버튼, 간격 30px 요약 바·툴바, 4px 어긋난 챗 머리 영역·메시지 열, 입력 영역에서 40px 떨어지고 열 밖으로 나간 알림.
  - `clean.html`: 같은 구조의 정상판 (+ 입력 안쪽 여백의 보조 버튼, 세로 스크롤 영역 아래쪽 링크).
  - `dev-indicator.html`: `<nextjs-portal>` 이 있는 페이지.
- 수정 전 기준선 (R30 ② 준비): `git worktree add --detach <scratchpad>/al-1ec8a9b 1ec8a9b` → `pnpm install --frozen-lockfile` → `pnpm build` → standalone 서버(`.next/static`·`public` 복사 뒤 `PORT=3102 node .next/standalone/server.js`)로 3102 에 띄우고 이 브랜치 스크립트로 측정. 끝나고 서버·backend 를 끄고 `git worktree remove` 했다.
- 기준선 시험 실행 두 번에서 찾은 판정 오탐 두 가지를 고치고(아래 '결정'), 같은 원리의 정상·결함 사례를 fixture 에 더해 self-test 를 다시 통과시켰다. 기준값 상수는 바꾸지 않았다.

## 바꾼 파일
- frontend/scripts/ui-audit.mjs
- frontend/scripts/ui-audit-fixtures/defects.html (새)
- frontend/scripts/ui-audit-fixtures/clean.html (새)
- frontend/scripts/ui-audit-fixtures/dev-indicator.html (새)
- docs/features/ui-redesign/audit/baseline-1ec8a9b/report.json (새)
- tasks/ui-redesign/19-audit-hardening.md

## 검사 결과
- `cd frontend && pnpm exec eslint scripts/ui-audit.mjs` → 출력 없음, 종료 0
- `node scripts/ui-audit.mjs --help` → `--commit <sha>`, `--self-test` 줄이 나옴, 종료 0
- `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/ui-audit.mjs --self-test` → 종료 0
  ```
  clean.html
    OK   clip         대상 51, 실패 0
    OK   placeholder  대상 2, 실패 0
    OK   occluded     대상 24, 실패 0
    OK   scrollRow    대상 2, 실패 0
    OK   ariaControls 대상 1, 실패 0
    OK   keepAll      대상 3, 실패 0
    OK   rowAlign     대상 2, 실패 0
    OK   vRhythm      대상 3, 실패 0
    OK   chatAlign    대상 4, 실패 0
    OK   toast        대상 1, 실패 0
  dev-indicator.html
    OK   nextjs-portal → 개발 서버 환경 오류 (종료 2 대상)

  SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정
  ```
  (`defects.html` 의 data-expect 18개 모두 `OK`)
- 실제 개발 서버 확인: 1ec8a9b worktree 에서 `next dev -p 3103` 을 잠깐 띄우고 `--base http://localhost:3103 --routes feed --themes light --viewports 1440x900 --skip-dialogs --screenshots none` → 종료 2, `environment.devIndicator: true`, 메시지 `개발 서버 환경: 페이지에 nextjs-portal(Next.js 개발 표시기)이 있다. …`. 확인 뒤 서버를 껐다.
- 기준선: `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs --base http://localhost:3102 --commit 1ec8a9b --screenshots none --out "$(git rev-parse --show-toplevel)/docs/features/ui-redesign/audit/baseline-1ec8a9b"` → 종료 1 (정상)
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
  - `environment`: `{ devIndicator: false, base: http://localhost:3102, chrome: Chrome/157.0.8103.38, commit: 1ec8a9b, firstNewsId: 4845 }`. 측정 상태 15종 × 10 (폭 5 × 테마 2) = 150, R3~R9 실패 0, 대화상자 열기 실패 0.
- **F1** (1440 소스 줄) — `feed-light-1440x900` (dark 도 같음):
  - `scrollRow` `소스` (`main#main > div:nth-of-type(2) > div[role="group"][aria-label="소스"]`): `넘치는데 data-overflow 가 없음`, `뒤쪽이 넘쳤는데 다음 스크롤 버튼이 보이지 않음`, `1440px 에서 '소스' 그룹이 넘침 (R14)` — scrollWidth 1006, clientWidth 888.
  - `clip`: `Global Blogs285`(`… > button:nth-of-type(7)`, rect left 873.9~right 1012), `북마크0`(`button:nth-of-type(8)`, left 1020~right 1118) — `부모 상자 밖으로 가로 잘림`, 잘린 상자 `소스` 그룹 left 112~right 1000.
- **F2** (390 카테고리 줄) — `feed-light-390x844` `scrollRow` `카테고리` (`… > div[role="group"][aria-label="카테고리"]:nth-of-type(1)`): `넘치는데 data-overflow 가 없음` — scrollWidth 858, clientWidth 358, actual `end`.
- **F3** (검색 자리표시) — `placeholder` `input#field-_R_8q5fdb_` (`form[role="search"]` 안): `feed-light-1440x900` textWidth 376.2 > available 222, `feed-light-390x844` textWidth 423.7 > available 260. 360(423.7 > 230)·390·1024(376.2 > 158)·1440 에서 실패, 768 은 통과 (입력이 넓다). 4개 폭 × 2테마 × (`/`, 레이더) = 16건. Ask AI 자리표시(`이 기술에 대해 자유롭게 질문해보세요 (예: …`)도 360·390 `news-detail-ask-ai` 에서 4건.
- **F4** (카드 제목 어긋남) — `rowAlign`:
  - `feed-light-768x1024` 6건: `article[data-feed-card]:nth-of-type(1)` `같은 줄 h3 top 차 24px` h3Tops [425, 401], `:nth-of-type(3)` [697.5, 673.5], `:nth-of-type(6)` [946, 970], `:nth-of-type(14)` [2076, 2100] …
  - `feed-light-1440x900` 7건: `:nth-of-type(1)` h3Tops [389, 365, 365], `:nth-of-type(6)` [641.5, 641.5, 665.5], `:nth-of-type(9)` [950, 950, 974], `:nth-of-type(10)` [1282.5, 1282.5, 1258.5] …
  - `feed-*-1024x768` 은 통과: 3열(약 266px)에서 모든 카드의 머리줄이 똑같이 두 줄로 넘쳐 제목 top 이 같다 (h3 top 389/666/974, 직접 확인).
- 그 밖의 기준선 실패 (20~26 이 인용):
  - `keepAll` 128 상태·1070 요소 (기준선에 `keep-all` 없음. 피드 카드 본문 `Insight…`, 챗 추천 질문 카드 `button > span`, 브리핑·소스 대화상자 본문 등).
  - `ariaControls` 108: 뉴스 상세 탭(`news-detail-panel-ask_ai`/`news-detail-panel-summary`) 20, 일일 브리핑 `이메일 발송`(`daily-briefing-email-form`) 10·`마크다운 전문`(`daily-briefing-panel-markdown`) 10, 연동 설정 탭 `이메일 (SMTP)`·`웹훅 (Slack/Discord)`(`briefing-settings-panel-email`/`-webhook`, 브리핑 위 겹침·공유 & 알림) 40, 소스 `등록된 수집원`(`sources-modal-panel-sources`) 10, 챗 `대화 기록 보기`(`chat-history-drawer`, 360·390·768 × 기본·source·toast) 18.
  - `scrollRow` 74: 피드 `카테고리`·`소스` (data-overflow 없음, 768 이상 다음 버튼 없음, 1440 카테고리 넘치지 않는데 흐림, 1440 소스 R14), Ask AI `빠른 질문` (넘치는데 data-overflow 없음 4, 넘치지 않는데 흐림 6).
  - `clip` 276: 피드 `카테고리`·`소스` 칩 가로 잘림 (기본·레이더), 챗 `source` 맥락 줄의 기사 칩·`기사 컨텍스트 해제` 가로 잘림 20, Ask AI `빠른 질문` 칩 4, 연동 설정 `연동 종류` 탭 `웹훅 (Slack/Discord)` 360 가로 잘림 4.
  - `placeholder` 22: 피드 검색 16 (F3) + Ask AI 4 + 커맨드 팔레트 `명령어 검색 또는 바로가기... (ESC로 닫기)` 360 2 (textWidth 269.8 > 260).
  - `vRhythm` 10, `chatAlign` 4, `toast` 10: 모두 '대상 없음' (기준선에 측정 훅 속성이 없음). `toast` 상태에서 알림 자체는 떴다 (`[data-toast-region]` 안 알림은 찾았고 `[data-composer]`·`[data-chat-column]` 이 없음).
  - `occluded` 0.
- `git status` 로 루트 `config.json`·`sources.json` 변경 없음 확인. 띄운 서버(3102, 3103, backend 8102) 모두 끔, `git worktree list` 에 저장소 하나만 남음.

## 결정
- **실행 환경**: 개발 backend(8000)가 떠 있지 않았다. 저장소 backend 를 `backend/agentlens.db` 의 scratchpad 복사본(`DATABASE_URL` 환경 변수, 기사 4734건)으로 127.0.0.1:8102 에 띄웠다 (backend 코드·설정·원본 DB 는 손대지 않음). 그래서 1ec8a9b 빌드는 `INTERNAL_API_URL=http://127.0.0.1:8102 NEXT_PUBLIC_API_URL=http://localhost:8102` 로 했다 (rewrites 는 빌드 때 `routes-manifest.json` 에 박힌다, 대상 `http://127.0.0.1:8102/api/:path*` 확인). 27 이 같은 방법을 쓰면 현재 코드도 같은 backend 데이터를 쓸 수 있다.
- **판정 오탐 1 (clip 세로)**: 첫 기준선에서 대화상자·챗 사이드바의 세로 스크롤 영역 아래쪽 내용이 바깥 `overflow:hidden` 상자(대화상자 패널, 챗 `main`) 기준으로 '세로 잘림' 이 되었다 (일일 브리핑·소스 대화상자 각 200건 등). 스크롤 영역을 지나면 그 축의 위치는 스크롤이 정하므로, 조상을 올라가다 스크롤 영역(`overflow` auto/scroll)을 지나면 더 바깥 조상의 같은 축은 보지 않게 했다. 스크롤바를 숨긴 가로 스크롤(F1·F2)은 그 스크롤 영역 자체에서 판정되므로 그대로 잡힌다. 정상 사례(`clean.html` 세로 스크롤 영역 아래 링크)와 결함 사례(`defects.html` overflow hidden 상자에 세로로 잘린 링크)를 fixture 에 더했다.
- **판정 오탐 2 (clip ②)**: 말줄임(`text-overflow: ellipsis`)·`line-clamp` 조상 안의 글자(요약 바 헤드라인 등)는 ① 에서 '의도한 잘림' 으로 빠지는데 ② 화면 밖에서 다시 걸렸다. 의도한 잘림이면 ②·③ 도 보지 않는다 (그 조상의 ③ 이 본다).
- **occluded 의 예외 두 가지**: (a) 맞은 요소가 대상의 조상이면 가림이 아니다 (둥근 모서리 안쪽 4px 점이 모양 밖으로 빠진 경우). 형제·다른 레이어만 가림이다. (b) 입력(`input`·`textarea`) rect 안의 안쪽 여백(padding)에만 놓인 보조 버튼(`토큰 보기` 등)은 글자 영역을 가리지 않으므로 뺀다. 기준선 시험 실행에서 연동 설정 Notion 토큰 입력이 이 이유로 걸렸다. 글자 영역을 덮는 버튼은 계속 실패한다 (`defects.html` 의 '글자 영역을 덮는 입력 위 버튼'). (c) `[data-toast-region]` 안 요소에 가린 것은 빼고 위치는 `toast` 검사가 본다.
- **rowAlign 머리줄 줄바꿈**: spec 의 '자식 rect top 이 두 값 이상' 을 그대로 쓰면 `items-center` 줄에서 높이가 다른 자식(44px 북마크와 16px 글자)이 한 줄이어도 실패한다. R4 처럼 자식들의 세로 구간이 한 점에서 겹치지 않으면(`max(top) >= min(bottom)`) 줄바꿈으로 본다.
- **뉴스 상세 탭 상태**: `DIALOGS` 는 9개 그대로 두고 뉴스 상세 항목에 `tabs` 를 달아 `…-news-detail-ask-ai` 상태를 따로 남긴다. R7 Escape 측정이 끝난 뒤 다시 열어 탭을 누른다 (R26 이후 Ask AI 입력에 포커스가 있으면 첫 Escape 가 닫지 않으므로 R7 과 섞지 않는다).
- **clip ①의 가로 예외**: 조상이 `data-scroll-row` 이거나 스크롤바가 실제로 자리를 차지하는 가로 스크롤 영역(`scrollbar-width` 가 `none` 이 아니고 `offsetHeight − clientHeight − 테두리 > 0`)만이다. 768 미만 모바일 에뮬레이션은 오버레이 스크롤바라 자리를 차지하지 않으므로, 모바일의 가로 스크롤 영역은 `data-scroll-row` 를 달아야 clip 을 피한다 (측정 훅 계약과 같음).
- **기준선 report 크기**: 약 1.8MB (실패 목록 상한 40/검사·상태). 그대로 커밋한다.
- 기준선이 찾은 실패 중 `커맨드 팔레트` 자리표시(360)와 연동 설정 `연동 종류` 탭 가로 잘림(360)은 spec 14.1 표에 없는 결함이다. 담당 파일이 '변경 파일' 2차에 없으면 27 에서 정리가 필요하다 (아래 '막힌 점').

## 막힌 점
- 없음 (19 범위). 참고: 기준선에서 spec 14.1 표 밖 실패 두 건이 나왔다 — 커맨드 팔레트 자리표시 `명령어 검색 또는 바로가기... (ESC로 닫기)` (360, textWidth 269.8 > available 260), 연동 설정 `연동 종류` 탭 `웹훅 (Slack/Discord)` 360 가로 잘림. 2차 구현 뒤에도 남으면 27 의 전체 측정에서 실패한다. 담당 파일(`CommandPalette`, `BriefingSettingsModal`)이 '변경 파일' 2차에 있는지 메인 세션이 확인해야 한다.

## 다음
- 없음 (19 done). 27 에서 판정 오탐을 고치면 이 파일에 이어 적고, `--self-test` 와 이 기준선 실행을 다시 해 F1~F4 가 여전히 잡히는지 확인한다.

## 27 연장 기록 (판정 오탐 수정)
- 2026-11-06, 27단계 HEAD `41f6b4c` 측정에서 `chatAlign` 이 1024·1440 × 2테마 4건 실패했다: `맥락 줄 첫 조작 요소 왼쪽 끝이 2px 어긋남` (`[data-chat-context-bar] … div[role="group"][aria-label="검색 스코프 모드"] > button:nth-of-type(1)` left 482, 메시지 열·입력 영역 left 480).
- 원인: 첫 조작 요소는 `SegmentedControl` 의 투명한 첫 버튼이고, 눈에 보이는 왼쪽 끝은 칠해진 그룹 상자(`bg-surface-muted p-0.5`, left 480 = 열 왼쪽)다. 판정이 안쪽 버튼을 재서 생긴 오탐이다.
- 수정 (`ui-audit.mjs` `chatAlign`): 첫 조작 요소가 칠해진 상자(배경색이 투명이 아님, 왼쪽 테두리 > 0, 그림자)를 가진 복합 위젯(`role` group·radiogroup·tablist·toolbar, 맥락 줄 안) 안에 있으면 그 상자의 왼쪽 끝을 잰다. 허용치 1px(`K.chatAlignTolerance`)는 그대로.
- fixture: `clean.html` 맥락 줄을 세그먼트 토글(상자 padding 2px, 상자가 열과 맞음)로 바꿨다 → 통과 (예전 판정이면 2px 실패). `defects.html` 은 상자가 36px·안쪽 버튼이 40px·열과 입력 영역이 40px 인 세그먼트 토글로 바꿨다 → 메시지 열·입력 영역이 상자보다 4px 안쪽으로 실패 (예전 판정이면 버튼 40 = 열 40 이라 놓친다). 머리 영역 104px 결함은 그대로.
- `--self-test` 종료 0 (`chatAlign` defects 실패 3건, clean 대상 4 실패 0).
- 검출 로직이 바뀌어 1ec8a9b 기준선을 같은 방법(worktree, 프로덕션 standalone 3102, backend 복사본 8102)으로 다시 측정해 `baseline-1ec8a9b/report.json` 을 덮어썼다. 결과는 이전과 같다 (조합 150, 실패 항목 328, 검사별 건수 동일). F1(1440 `소스` scrollRow 3건·clip 3건), F2(390 `카테고리` scrollRow), F3(1440·390 placeholder), F4(768 rowAlign 6건, 1440 7건) 모두 그대로 잡힌다.

## 27 연장 기록 2 (R3 을 모든 측정 상태로)
- verifier 편차 C 를 처리했다. 2차에 새로 생긴 상태(`…-news-detail-ask-ai`, `…-radar`, `…-source`, `…-toast`, 40조합)에는 R3 이 없었다.
- `inPageOverflow()` 를 더하고, 탭 상태와 추가 상태의 `checks` 에 `R3` 을 넣었다. 기준(`scrollWidth <= innerWidth`)은 기본 상태(`inPageMeasureBase`)·대화상자(`inPageMeasureTopDialog`)와 같다. 이제 150조합 모두 R3 을 잰다.
- `--self-test` 에 R3 판정을 더했다: `defects.html` 은 실패해야 하고(화면 밖 버튼, scrollWidth 1500 > 1440), `clean.html` 은 통과해야 한다. fixture 는 바꾸지 않았다. self-test 종료 0.
- 14.8 검출 로직은 바뀌지 않아 1ec8a9b 기준선은 다시 재지 않았다. 기준선 report 의 R3 은 110조합 그대로다.
