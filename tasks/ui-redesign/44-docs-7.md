# Task 44: 통합·상세 문서 반영 (보정 7)

Feature: ui-redesign · Plan: docs/features/ui-redesign/plan.md 작업 순서 44 (보정 7)
Status: done
Session: main
Agent: 문서 작성 서브에이전트
Updated: 2026-11-07

## 한 일
spec 14.15 '문서' 와 plan '변경 파일' 보정 7 문서 목록을 하나씩 대조해 반영했다 (코드 기준 HEAD `6da60f4`). frontend/src·backend 는 건드리지 않았다.

- `docs/known-issues.md`
  - 'UI·접근성': 포커스 필터 창 카테고리 라벨 행을 지웠다. 남은 행이 없어 표 대신 "지금 알려진 문제가 없다." 로 두었다.
  - '데이터·동작 오류': '첫 화면 카드의 별점…(의심: …)' 행을 확인된 원인으로 고쳤다. 원인은 수집기의 합성 `raw_score`(`rss.py:75` 국내 180·그 밖 150, `arxiv.py:48` 120, `huggingface.py:33` `numComments + 40`, `github.py:61-69` 폴백 `stars_hint` 기본 5000)와 `calculate_hotness` 포화(`categorizer.py:147`, 4734건 중 1034건이 100, `rss_kr` 459건 중 373건). 영향은 인기 점수 `🔥100` 이 여러 카드에 같게 보이는 것과 `추천순`·`인기순` 정렬이 합성 값에 좌우되는 것. 카드는 합성 점수를 숨기지만 폴백 `stars_hint` 는 스타로 보인다는 점도 적었다. 점수 부분의 '의심' 은 지우고 상대 시간만 '(의심)' 으로 남겼다. 코드 줄은 직접 열어 확인했다.
- `docs/ui-spec.md`: `sourceId` 파라미터 설명(범위 이름·알림 문구), 피드 데스크톱 카드 바닥 와이어프레임, 모바일 툴바 와이어프레임(4줄: 소스 줄 한 줄 전체, 아래 줄 오른쪽 토글·정렬), 영역 4 필터 툴바(768 미만 4줄), 영역 6 카드 바닥 통계(지표별 아이콘·라벨, 합성 점수 숨김, `data-source`·`data-card-stat`·`data-metric`), 챗 와이어프레임 3종(헤더 모델 칩 삭제, 탭 `단일 기사 | 전체 소식`, 배지, 캡슐 `포커스:`, "모델 칩은 입력창 아래 한 곳" 주석), 챗 영역 표(사이드바 세션 카드 배지·접근 이름, 헤더 모델 칩 삭제, 맥락 줄 탭 라벨, 포커스 캡슐 앞말, 입력창 모델 칩, 포커스 필터 카테고리 라벨, 알림 영역 예시 문구), 팝오버 표 모델 선택 트리거(입력창만), 컴포넌트 트리 `ChatModelSelector (header-chip)` 삭제.
- `docs/functional-spec/01-news-feed.md`: 기능 표 NEWS-08, NEWS-02 배치 표 768 미만 행과 4줄 설명, NEWS-03(소스 줄 양쪽 화면 끝까지), NEWS-04·NEWS-06(768 미만 위치), NEWS-08 규칙 7(원천 지표·개수·인기·지표 표·DOM 속성), 관련 코드 줄, 상수 표(줄 번호 갱신, 카드 원천 지표·개수 지표 행 추가), 알려진 불일치에 '합성 점수에 좌우되는 정렬' 추가.
- `docs/functional-spec/02-ai-chat.md`: 개요 화면 구성(헤더 모델 선택기 삭제, 범위 용어), 기능 표 CHAT-13·15·17, CHAT-01 세션 카드 배지·접근 이름, CHAT-15 진입점(입력창 한 곳)·드롭다운 방향·관련 코드, CHAT-16 캡슐 `포커스:`·카테고리 입력 라벨·기본값 `ALL_CATEGORY_LABEL`·필터 창 칩 라벨(긴 라벨 5개 순서), CHAT-17 탭 라벨·용어 통일·360 비넘침, 없는 기사 알림 문구, 반응형 헤더 표의 모델 칩 행 삭제, 상수 표(헤더 폭 기준 줄 번호, 검색 범위 라벨 행 추가), 알려진 불일치 31 용어, 36(포커스 필터 라벨) 삭제. `Updated` 를 2026-11-07 로.
- `docs/design-system.md`: 1 원칙의 `Scoped` 표기, 5.2 `labels.ts` 행 2개 추가(`ALL_CATEGORY_LABEL`·`SCOPE_LABELS`·`scopeLabel`, 지표 표 `scoreMetric`·`countMetric` 등), 라벨 규칙(포커스 필터 창 예외 삭제), 9.1 측정 상태('챗 포커스 필터 열림', 160조합), 9.3 판정 표에 6행(`toolbarLayout`·`cardMetric`·`chatScope`·`terms`·`modelPicker`·`focusLabels`)과 상태별 대상, 측정 훅 속성(`data-source`, `data-card-stat`·`data-metric` 추가, 기존 속성의 사용 검사 갱신), 9.4 자체 검증(1440x6000·360x6000, 16개 검사, 360 전용 두 검사, fixture 6쌍), 10.2 포커스 시트 라벨 행 삭제.
- `docs/test-cases.md`: 개수(50 파일 622, `vitest list` 555), 파일별 개수와 행 — ChatHeader(모델 선택 두 행 → 모델 선택 없음·스코프 접근 이름), ChatPromptInput 9(옮긴 두 단언), ChatSessionWorkflow(정확 일치), ChatSidebar 11, ChatWorkspace(동기화 행 → 단일 모델 선택, 알림·시트 라벨), FocusBottomSheet 9, FocusCapsule(`포커스:`), FeedToolbar 25(bleed 행, 768 이상 그대로 행, 양쪽 표시 행), NewsCard 33(새 12행), FormControls 32(새 3행), 영역별 커버리지 4행.
- `docs/test-strategy.md`: frontend 테스트 수 622, 화면 측정 행(판정 16종, 포커스 필터 열림, 160조합), 실행 설명 코드 줄, 자체 검증(360 전용 두 검사, fixture 목록), 판정 표 6행.
- `docs/tech-spec.md`: 변경 이력에 2026-11-07 `ui-redesign (툴바·카드 지표·챗 용어)` 한 줄. `Updated` 를 2026-11-07 로.

## 바꾼 파일
- docs/known-issues.md
- docs/ui-spec.md
- docs/functional-spec/01-news-feed.md
- docs/functional-spec/02-ai-chat.md
- docs/design-system.md
- docs/test-cases.md
- docs/test-strategy.md
- docs/tech-spec.md
- tasks/ui-redesign/44-docs-7.md

## 검사 결과
- frontend 테스트 수: `cd frontend && pnpm test` → `Tests  622 passed (622)`, 파일 50 (2026-11-07 20:21). 파일별 개수는 `pnpm exec vitest run --reporter=json` 로 확인. `pnpm exec vitest list` 555줄.
- 금지 표현 (통합 문서의 새 줄): `git diff -U0 -- docs/ | grep '^+' | grep -v '^+++' | rg -n "우려|보정|docs/features|tasks/|/write-|/implement-plan|승인"` → 출력 없음 (rg 종료 1).
- plan 끝 기준 grep `grep -nE "하네스·평가|MCP·도구|전체 코퍼스|\(Scoped\)|\(Global\)|Focus:|전체 뉴스 모드|header-chip" docs/ui-spec.md docs/functional-spec/02-ai-chat.md docs/known-issues.md docs/design-system.md` 결과 3줄:
  - `02-ai-chat.md:279` — `ChatModelSelector` 에 `header-chip`·`header-compact` 변형이 부품에 남는다는 서술 (기대한 줄).
  - `design-system.md:488` — `terms` 판정의 실패 조건 설명 (검사가 찾는 글자 자체).
  - `design-system.md:546` — `terms` fixture 의 결함 형태 설명.
  - 뒤의 두 줄은 spec 14.15 가 문서에 적으라고 한 새 검사·fixture 설명이라 남겼다. 화면 동작 서술에는 예전 용어가 없다.
- `grep -n "의심" docs/known-issues.md`: 카드 점수 행(`:34`)에는 상대 시간 부분의 '(의심)' 만 있고 점수 부분에는 없다.
- `Updated:` 8개 문서 모두 2026-11-07.

## 결정
- known-issues 'UI·접근성' 은 행이 모두 없어져 절 제목은 두고 "지금 알려진 문제가 없다." 한 줄로 했다.
- tech-spec 변경 이력 행 이름은 금지 표현을 피하려고 `ui-redesign (툴바·카드 지표·챗 용어)` 로 했다.
- test-strategy 의 frontend 테스트 수(597)도 낡아 622 로 고쳤다 (같은 파일, plan 목록 안).
- 코드 변경으로 줄이 밀린 기존 코드 줄 참조(NewsCard·FeedToolbar·ChatHeader·labels.ts)는 고친 절 안에서 지금 줄로 맞췄다.

## 막힌 점
- plan 목록 밖 문서에 예전 서술이 남아 있다. plan 이 '목록 밖 문서는 plan 을 고쳐 재승인받은 뒤' 라고 해서 고치지 않았다:
  - `docs/functional-spec/07-ui-common.md:262` — 챗 헤더 폭별 표의 768~1023 열에 `모델 칩` (지금은 헤더에 없음).
  - `docs/functional-spec/07-ui-common.md:323` — 알림 문구 `요청하신 기사를 찾을 수 없어 전체 뉴스 모드로 시작합니다.` (지금은 `전체 소식 모드`).

## 다음
- 메인 세션 검토. 위 07-ui-common.md 두 줄은 plan 범위를 넓혀 고칠지 메인 세션이 정한다.

## 후속 (문서 목록 정정, plan eb5bb38)
- 한 일: 메인 세션이 07-ui-common.md 의 낡은 두 줄(챗 헤더 768~1023 '모델 칩', 알림 '전체 뉴스 모드')을 지금 코드대로 고쳤다. known-issues '테스트·운영' 의 backend 테스트 2개 행을 확인된 원인(config.json ollama_base_url 대체, 로컬 Ollama 탐침, 미설치 모델)으로 고쳤다.
- 바꾼 파일: docs/functional-spec/07-ui-common.md, docs/known-issues.md
- 검사 결과: `grep -nE "모델 칩|전체 뉴스 모드" docs/functional-spec/07-ui-common.md` → 출력 없음. 새 줄 금지 표현 rg → 출력 없음.

## 후속 2 (리뷰 Nit 1·2·4, 2026-11-07)
- 한 일: 메인 세션이 reviewer Nit 을 문서에 반영했다. known-issues 카드 점수 행에 GitHub 폴백 합성 포크 수(`github.py:70`) 추가(Nit 1), '테스트·운영' 에 쓰이지 않는 헤더 모델 선택 변형·낡은 prop 호환 테스트 행 추가(Nit 4), test-strategy 의 `cardMetric`(보이면 안 되는 점수만 실패, 반대 방향은 단위 테스트)·`terms`(고정 목록) 한계 명시(Nit 2).
- 바꾼 파일: docs/known-issues.md, docs/test-strategy.md
- 검사 결과: 새 줄 금지 표현 rg → 출력 없음. 인용 줄(ContractAndMsw.test.ts:1017, ChatModelSelector.tsx:13-14,93) 직접 확인.
