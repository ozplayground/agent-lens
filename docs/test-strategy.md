# 테스트 전략: AgentLens

Updated: 2026-11-09

## 검사 명령
- 전체: `make check` (아래 둘을 차례로 돈다. 하나라도 실패하면 0 이 아닌 값으로 끝난다)
- backend: `cd backend && ../.venv/bin/pytest -v tests/` (`backend/pytest.ini`: `asyncio_mode = auto`, `pythonpath = .`)
- frontend: `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` (vitest run, eslint, 타입 검사)
- backend 용 lint·typecheck 명령은 없다 (미정).
- `make test` 는 `make check` 와 같다 (`check` 를 전제 조건으로 둔 빈 대상).

## 테스트 종류
| 종류 | 대상 | 위치 | 언제 돈다 |
|---|---|---|---|
| 단위 | backend API·서비스·수집기 | `backend/tests/test_*.py` (파일 21개, 테스트 217개 — 아래 Makefile·스크립트 회귀 4개 파일 43개 포함, `conftest.py` 와 흉내 도움 모듈 `llm_fakes.py` 별도) | 매 변경 |
| Makefile·스크립트 회귀 | Makefile 대상 집합·`.PHONY`·`SHELL`, 12개 대상 `make -n` 종료 0·stderr 없음, `test` = `check`, 레시피가 부르는 파일, `\|\| true`·`config.json` 읽기 전용 마운트 없음, `docker compose config -q`, `reset` 의 URL 변수, `docker-logs` 의 종료 130 처리(`test_make_targets.py`). `scripts/collect.py` 모드 선택·완료 판정(스텁 HTTP 서버, `test_collect_script.py`). 빈 DB 첫 수집 백그라운드·종료 때 취소(`test_startup_seed.py`). `sources.json` 저장의 `EBUSY` 대체 경로(`test_sources_write_fallback.py`). make 는 `-n` 으로만 부르고 대상을 실제로 실행하지 않는다 | `backend/tests/test_make_targets.py`, `test_collect_script.py`, `test_startup_seed.py`, `test_sources_write_fallback.py` | 매 변경 (`make check` 에 포함) |
| 단위 | frontend 컴포넌트·훅·공통 부품 (vitest, jsdom, MSW) | `frontend/src/tests/**/*.test.ts(x)` (파일 52개, 테스트 649개, 설정 `frontend/src/tests/setup.ts`). 공통 부품은 `ui/`, 피드 화면 부품은 `feed/`, 대화상자는 `modals/`, 훅은 `hooks/` | 매 변경 |
| 정적 검사 | 디자인 토큰 규칙. `TokenGuard` 는 `frontend/src/**/*.tsx` 에 hex 색 클래스·Tailwind 기본 팔레트 색 유틸리티·옛 애니메이션 클래스가, `globals.css` 에 `!important`·옛 테마 덮어쓰기 선택자가 없는지 본다. `TokenContrast` 는 `globals.css` 의 라이트·다크 토큰으로 WCAG 대비(글자 4.5:1, 경계·포커스 링 3:1)를 계산한다. 아이콘 규칙: `IconGuard` 는 `frontend/src/components/**`·`frontend/src/app/**` 의 `.ts`·`.tsx` 글자에 그림 이모지(`/\p{Emoji_Presentation}\|\p{Extended_Pictographic}\u{FE0F}/gu`, 텍스트 표현 기호 `©`·`↔` 등은 제외)가 없는지 본다 (허용 목록 없음) | `frontend/src/tests/design/TokenGuard.test.ts`, `TokenContrast.test.ts`, `frontend/src/tests/ui/IconGuard.test.ts` (vitest 로 돈다) | 매 변경 (`make check` 에 포함) |
| 화면 측정 | 폭별 화면 규칙: 문서 가로 스크롤, 헤더 높이·한 줄, 첫 화면 카드, 768px 미만 44px 터치 영역, 대화상자 접근성 속성과 Escape, viewport 확대 허용, 폭별 기능 진입점. 그리고 측정 상태마다 판정 21종(아래 표). `/`·`/chat` × 라이트·다크 × 360·390·768·1024·1440px, `/` 의 대화상자·레이더 펼침, `/chat` 의 기사 맥락·없는 기사·포커스 필터 열림 상태 포함 (모두 160조합). 브리핑 데이터가 없으면 일일 브리핑 상태의 판정은 `skipped`(미검증) | `frontend/scripts/ui-audit.mjs` (puppeteer-core), 판정 검증용 `frontend/scripts/ui-audit-fixtures/*.html` | 화면을 바꿨을 때 수동, 프로덕션 빌드 대상 (`make check` 밖) |
| 계약 | zod 스키마 ↔ MSW 핸들러 | `frontend/src/tests/chat/ContractAndMsw.test.ts` | 계약 변경 시 (`make check` 에 포함) |
| 통합·회귀 | 두 앱을 함께 | 없음 | 릴리스 전 (아래 미정) |

- DB 격리: `backend/tests/conftest.py` 가 `DATABASE_URL` 을 `backend/tests/test_agentlens.db` 로 바꾸고 스키마를 만든다. 데이터는 지우지 않아 실행할 때마다 쌓인다. 개발 DB `agentlens.db` 는 쓰지 않는다.
- LLM 격리: `conftest.py` 의 autouse fixture `llm_isolation` 이 모든 테스트에서 LLM 설정 원천을 비운다 (환경 변수 `ANTHROPIC_API_KEY`·`OPENAI_API_KEY`·`GEMINI_API_KEY`·`OLLAMA_BASE_URL`·`OLLAMA_MODEL` 제거, `settings` 의 같은 필드, `llm_processor.openai_key`·`ollama_url` 을 `None`). 그 위에 `settings.ANTHROPIC_API_KEY = "sk-ant-test-fake"` 를 둬 흉내 Claude 를 쓰는 상태가 기본이다. `Settings.model_config["env_file"]` 을 `None` 으로 둬 `settings.reload()` 가 `.env` 를 다시 읽지 않는다. 그래서 `.env` 의 키, 로컬 Ollama 상태, 설치된 모델과 상관없이 결과가 같다.
- LLM 흉내: `backend/tests/llm_fakes.py` 가 `httpx`·`httpx2`(openai SDK 가 쓰는 전송)의 기본 전송 `handle_request`·`handle_async_request` 를 감싼다. `api.anthropic.com`, `api.openai.com`, `generativelanguage.googleapis.com`, 포트 11434 인 모든 호스트, 테스트가 등록한 흉내 Ollama 주소로 가는 요청은 흉내가 답한다 (흉내 Claude 는 늘 등록, OpenAI·Ollama 는 테스트가 등록). 흉내가 등록되지 않은 LLM 호스트 요청은 보내지 않고 `ConnectError` 를 내며 기록하고, fixture 정리 단계에서 그 테스트를 실패시킨다 (가드). 그 밖의 호스트는 실제로 나간다. `ASGITransport` 와 `httpx.AsyncClient.post`·`.stream` 을 직접 patch 한 테스트는 이 계층을 거치지 않는다.
- 프로바이더 조건 조절: fixture `llm_sources` 가 Anthropic 키까지 비운 뒤 테스트가 원천(`settings`·환경 변수·테스트별 `config.json` 사본)과 덮어쓰기를 하나씩 켠다. `fake_llm` 은 흉내 객체(등록, 요청 기록 `requests(provider, path)`, `assert_no_unmocked`, `take_unmocked`)다.
- 설정 파일 격리: 세션 fixture 가 루트 `config.json`(LLM 키 세 개와 `ollama_base_url` 을 비운 것)과 루트 `sources.json` 의 사본을 세션 임시 폴더에 만든다. autouse fixture 가 `app.config.find_config_json`·`app.config._json_data`, `sources_service._file_path`·`_mirror_path` 를 이 사본으로 돌린다. 원본은 읽기만 하고, 테스트 사이 상태는 세션 동안 사본으로 이어진다.
- 테스트 목록과 영역별 커버리지는 `test-cases.md`.
- frontend 는 `frontend/src/mocks/server.ts` 의 MSW 로 backend 를 대신한다. `setup.ts` 는 jsdom 에 없는 `window.matchMedia` 를 폭 1280px 데스크톱으로 가정한 mock 으로 채운다. 폭별 동작을 보는 테스트는 이 mock 을 바꿔 쓴다.
- jsdom 은 레이아웃을 계산하지 않는다. 크기·위치·넘침은 vitest 로 확인하지 않고 `ui-audit.mjs` 로 잰다.
- `ui-audit.mjs` 실행: 프로덕션 빌드 앱을 띄운 뒤(`make docker-up` 또는 `cd frontend && pnpm build && pnpm start`, 기본 주소 `http://localhost:3001`, 바꾸려면 `--base`) `cd frontend && node scripts/ui-audit.mjs`. 개발 서버(`next dev`)는 대상이 아니다: 페이지에 개발 표시기(`nextjs-portal`)가 있으면 환경 오류로 종료 2 다. 로컬 Chrome 이 필요하다 (`CHROME_PATH`, 없으면 흔한 설치 경로를 찾는다). 결과는 `--out` 폴더의 `report.json`(측정 상태마다 `checks.<판정>` = 통과 여부·대상 수·실패 목록, `environment.commit`·`devIndicator`)과 PNG(`--screenshots key` 기본: `/`·`/chat` × 5개 폭 × 라이트·다크 20장 + 뉴스 상세·일일 브리핑 × 390x844·1440x900 라이트 4장)다. 종료 코드는 0 통과, 1 실패 하나 이상, 2 사용법·환경 오류다. 수집된 기사·브리핑이 없으면 첫 화면 카드·뉴스 상세 등 해당 항목은 `skipped` 로 남고 실패로 치지 않지만, `rowAlign`·`vRhythm`·`chatAlign`·`toast`·`feedAreas`·`chatHeader`·`briefing`·`cardFooter` 는 측정 상태에 대상이 없으면 `대상 없음` 실패다 (`frontend/scripts/ui-audit.mjs:1-222`).
- `ui-audit.mjs --self-test`: 앱 없이 판정 자체를 검증한다. `scripts/ui-audit-fixtures/` 의 `defects.html`(`data-expect` 요소마다 그 판정이 실패해야 함), `clean.html`(모든 판정이 대상이 있고 통과해야 함), `dev-indicator.html`(개발 서버 환경 오류로 판정해야 함)이 모두 맞으면 종료 0, 하나라도 틀리면 1. fixture 는 1440 폭으로 한 번 열고, 768px 미만 판정을 보려고 `[data-self-test-narrow]`·`[data-self-test-both]` 영역만 360 폭으로 한 번 더 연다 (`clip`·`scrollRow`·`occluded`. `toolbarLayout`·`chatScope` 는 360 폭의 `[data-self-test-narrow]` 영역에서만, `feedAreas` 는 1440 에서 그 영역 밖과 360 에서 그 영역 안 둘 다 돈다). `defects.html` 에는 21종 판정마다 `data-expect` 가 하나 이상 있어야 한다. `data-expect` 는 어느 폭에서든 잡히면 맞지만 `[data-self-test-both]` 안의 것은 두 폭 모두에서 잡혀야 맞고, `data-expect-reason` 이 있으면 실패 이유에 그 글자가 있어야 맞다. `clean.html` 은 두 폭 모두 실패 0. fixture 에는 잘린 스크롤 영역(세로·가로), 잘린 배지 줄, 알파 0 배경 감싸개, 선택 칩이 줄 밖·흐림에 겹친 줄, 왼쪽 표시 없는 줄, 줄을 덮는 표시, 소스 줄 안에 숨은 `Must-Read` 토글(두 폭), 스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼(360 `clip`), 소스 줄·토글·정렬이 한 줄인 좁은 필터 영역과 토글·정렬이 아래 줄로 내려간 필터 영역(360), 칩 줄 안·칩 줄 사이 검색과 칩 줄 안 정렬(1440·360), 요약 바 아래 간격 30px, 원천 지표가 없는 카드의 점수·인기 점수, 이관 버튼 글자가 숨거나 카드 밖으로 넘친 바닥 줄, 360 에서 넘친 모드 탭, 영어 범위 용어·옛 이관 용어, 기록 버튼이 앞인 챗 헤더, 그림 이모지 라벨, 설정 두 곳·헤드라인 두 번·다른 분야 이름의 브리핑, 두 번 나온 모델 선택, 피드와 다른 포커스 필터 라벨 같은 고정 결함과 그 고친 형태가 짝으로 있다 (목록은 `design-system.md` 9.4절). 판정 코드를 고쳤으면 먼저 돌린다.
- `ui-audit.mjs` 판정 (측정 상태마다 `clip`·`placeholder`·`occluded`·`scrollRow`·`ariaControls`·`keepAll` 을 돌리고, 나머지는 해당 상태에서만):

| 판정 | 실패 조건 | 대상 |
|---|---|---|
| `clip` | 조작 요소·글자 요소가 부모 clip 상자 밖이나 화면 밖으로 1px 넘게 나감, 말줄임 없는 글자 넘침, 스크롤 영역 상자 자체가 같은 축의 바깥 clip 상자에 1px 넘게 잘림(`스크롤 영역이 부모 상자 밖으로 세로/가로 잘림`, 스크롤 영역에 한 번만 남김). 가로 잘림 가운데 `data-scroll-row` 줄 안의 것과, 768px 이상에서 스크롤바를 CSS 로 숨기지 않은 가로 스크롤 영역 안의 것은 `scrollRow` 몫이다 (768px 미만은 오버레이 스크롤바라 두 번째 면제가 없다) | 모든 상태 |
| `placeholder` | 빈 입력의 자리표시 글자 폭이 입력 내용 폭보다 1px 넘게 김 | 모든 상태 |
| `occluded` | 조작 요소의 가운데와 네 모서리 안쪽(4px) 다섯 점 중 하나가 다른 요소에 가려짐 | 모든 상태 |
| `scrollRow` | 넘친 스크롤 줄에 `data-overflow`·넘친 쪽 흐림이 없음, 768px 이상에서 넘친 쪽 스크롤 버튼이 없음, 1440px 에서 피드 `카테고리`·`소스` 그룹이 넘침, 줄의 `scroll-padding` 좌우가 24px 가 아님, 처음 상태의 선택 칩(`data-selected-selector`)이 넘친 쪽 흐림 24px 를 뺀 보이는 범위 밖, 768px 미만에서 넘친 쪽에 표시(`data-overflow-hint="start\|end"`)가 없거나 넘치지 않은 쪽에 있거나 표시가 줄과 겹침. 처음 상태의 피드 필터 영역(`[data-feed-toolbar]`)마다 `toolbar` 에 `{ viewport, mustReadVisible, mustReadRect }` 를 남기고, `Must-Read` 토글(`[data-must-read-toggle]`)이 하나가 아니거나 `소스` 그룹 안이거나 화면·툴바 상자 밖이거나 가운데 점이 가려졌거나 768px 미만에서 44×44 보다 작으면 `mustReadVisible: false` 로 실패 | 모든 상태 |
| `ariaControls` | `aria-controls` 가 문서에 없는 id 를 가리킴 | 모든 상태 |
| `keepAll` | 두 줄 이상 한국어 글자의 `word-break` 가 `keep-all` 이 아님 (`.markdown-viewer` 밖) | 모든 상태 |
| `rowAlign` | 같은 줄 뉴스 카드의 제목 top·카드 높이 차가 1px 넘음, 카드 머리줄 줄바꿈 | `/`, 768px 이상 |
| `vRhythm` | 요약 바 → 검색 영역, 검색 영역 → 필터 영역 첫 칩 줄, 필터 영역 마지막 칩 줄 → 목록 머리줄 세 간격 중 하나라도 12~16px 밖. 영역이 없으면 '대상 없음' 실패 | `/` |
| `chatAlign` | 챗 사이드바 머리 영역과 맥락 줄의 아래 경계가 다름, 맥락 줄·메시지 열·입력 영역 왼쪽 끝이 1px 넘게 다름 (맥락 줄 첫 조작 요소가 칠해진 위젯 상자 안이면 그 상자의 왼쪽 끝. 배경색은 `transparent`·`rgba(…, 0)`·`color(… / 0)`·`oklab(… / 0)`·`#rrggbb00` 등 표기와 상관없이 알파가 0 이면 칠하지 않은 것으로 본다) | `/chat`, 1024px 이상 |
| `toast` | 챗 경고 알림이 입력 영역 바로 위(16px 이내)가 아니거나, 768px 이상에서 메시지 열 좌우 밖 | `/chat?sourceId=999999999` |
| `toolbarLayout` | 768px 미만에서 피드 `소스` 줄의 보이는 폭이 `innerWidth − 85`(페이지 여백 16, 간격 8, 토글 44, 넘침 표시 16, 허용 1) 보다 좁음, 흐림 밖에 다 보이는 소스 칩이 2개 미만, `Must-Read` 토글이 없거나 소스 줄과 다른 줄이거나 오른쪽 끝이 콘텐츠 오른쪽 끝과 1px 넘게 다름, 필터 영역 안에 선택 상자·검색 입력이 있음. 768px 이상은 판정 없이 줄마다 폭·다 보이는 칩 수만 기록 | `/` 처음 상태 |
| `cardMetric` | 카드 통계에 종류 없는 `점수` 라벨, `github`·`hackernews`·`reddit` 밖 소스에 점수 통계, 소스와 지표 라벨이 다름(`github` 스타, `hackernews` 포인트, `reddit` 추천), `github` 개수가 `포크` 가 아님, `github`·`hackernews`·`reddit` 밖 소스에 인기 점수 통계. 소스별 카드 수·점수 표시 수·인기 점수 표시 수를 `summary` 에 기록. 보이면 안 되는 점수만 실패로 낸다: 지표가 있는 소스의 점수가 사라지는 경우는 이 검사가 잡지 않고 `NewsCard.test.tsx`·`FormControls.test.tsx`(지표 표) 단위 테스트가 잡는다 | `/` 처음 상태 |
| `chatScope` | 그룹 `검색 스코프 모드` 의 두 탭이 화면 밖이거나 맥락 줄 보이는 범위(흐림 24px 제외) 밖, 기사 칩이 없는데 맥락 줄이 넘침(`data-overflow` 가 `none` 이 아님) | `/chat` 기본·기사 칩·경고 알림 |
| `terms` | 보이는 글자가 `Scoped`·`Global` 이거나 `(Scoped)`·`(Global)` 포함, `Focus:` 로 시작, `코퍼스` 포함, global 탭 접근 이름이 `전체 소식` 이 아님, 보이는 버튼·링크·탭의 접근 이름이나 글자에 금지 용어(`Ask AI` 와 옛 이관 용어, 스크립트 상수 `EXPECT9.bannedTerms`)가 있음 (사용자 글 제외). 고정 목록만 보므로 새로 생기는 다른 영어 라벨은 잡지 않는다. 금지 용어는 `button`·`a`·`[role="tab"]` 의 접근 이름과 글자만 보고, 제목·본문 글자와 `title` 속성은 보지 않는다 (`frontend/scripts/ui-audit.mjs:1465-1472`) | `/chat` 모든 상태, `/` 처음 상태, 뉴스 상세 두 탭 |
| `modelPicker` | 보이는 `Claude 모델 선택` 버튼이 정확히 1개가 아니거나 질문 입력창 위에 있음 | `/chat` 기본 |
| `focusLabels` | 포커스 필터 창 그룹 `도메인 카테고리` 의 칩 글자가 `전체 소식`, `하네스 & 벤치마크`, `MCP & 생태계`, `에이전트 아키텍처`, `최신 AI 동향` 순서와 다름 | `/chat` 포커스 필터 열림 |
| `feedAreas` | 피드 검색 영역(`[data-feed-search]`)·목록 머리줄(`[data-feed-list-header]`)이 하나가 아님, 검색 입력·정렬이 제 영역 밖이거나 필터 영역 안에 검색 입력·선택 상자가 있음, 검색 → 필터 칩 줄 → 목록 머리줄 순서가 아니거나 검색 입력이 칩 줄과 겹침, 검색 입력·정렬 높이가 44(768px 미만)/36 이 아니거나 `Must-Read` 토글 높이가 같은 줄 소스 칩과 다름, 검색 입력 양 끝·목록 머리줄 왼쪽 끝·정렬과 토글 오른쪽 끝(768px 이상은 카테고리 줄 왼쪽 끝도)이 콘텐츠 상자 끝과 1px 넘게 다름, 목록 머리줄이 정렬보다 1px 넘게 높음(두 줄). 5개 폭의 rect 를 `layout` 에 기록 | `/` 처음 상태 |
| `chatHeader` | 챗 헤더의 보이는 첫 조작 요소가 `피드로 돌아가기` 링크가 아니거나, 그 링크가 다른 조작 요소보다 1px 넘게 오른쪽 | `/chat` 기본 |
| `pictograph` | 보이는 버튼·링크·탭·메뉴 항목·라디오·라벨·`h1`~`h3` 글자에 그림 이모지(`IconGuard` 와 같은 식). 마크다운 본문, 새 탭 외부 기사 링크, 사용자 글은 뺀다. 대상 선택자는 `button, a, [role="tab"], [role="menuitem"], [role="radio"], label, h1, h2, h3` 이라, 이 요소들 밖에 있는 `p`·`span`·`div` 글자(예: 본문 문단, 배지, 알림 문구)는 보지 않는다 (`ui-audit.mjs:1625`). 피드 `/` 기본 상태의 검사 목록에는 없어 그 상태에서는 돌지 않는다 (`:2146-2157`. 도는 상태는 `:1848-1849`, `:1862`, `:1901`, `:2157`) | `/chat` 기본·포커스 필터 열림, 뉴스 상세 두 탭, 일일 브리핑 |
| `briefing` | 일일 브리핑 대화상자에서 알림 밖 설정 버튼이 1개가 아님, 대화상자 설명(헤드라인)과 같은 글자가 다른 곳에 또 보임, `카테고리별 요약` 분야 머리글이 긴 라벨 4개 밖 | 일일 브리핑 |
| `cardFooter` | 카드 바닥 이관 버튼의 보이는 글자에 `AI 챗에서 분석` 이 없음(`sr-only` 는 안 보이는 것으로 봄), 버튼 묶음이 카드 안쪽 상자 밖으로 1px 넘게 나감, 통계 묶음과 버튼 묶음이 겹침 | `/` 처음 상태 |
- `pictograph` 와 `terms` 금지 용어 검사는 위 범위(조작 요소·라벨·제목 글자, 피드 `/` 기본 상태 제외)만 본다. 그 밖의 UI 글자는 정적 검사 `IconGuard`(`frontend/src/tests/ui/IconGuard.test.ts`)가 소스 수준에서 보완한다: `frontend/src/components/**`·`frontend/src/app/**` 의 `.ts`·`.tsx` 파일 글자 전체에서 그림 이모지를 찾는다 (`IconGuard.test.ts:15`). `frontend/src/lib/**`·`hooks/**`·`context/**` 는 대상이 아니다. 금지 용어는 `IconGuard` 가 보지 않는다 (그림 이모지만 본다).
- E2E 테스트는 없다. `ui-audit.mjs` 는 화면 규칙만 재고 기능 흐름을 검증하지 않는다.

## 외부 호출과 파일 부작용
`make check` 의 backend 테스트는 LLM 을 실제로 부르지 않고 git 이 추적하는 설정 파일을 고치지 않는다 (위 'LLM 격리'·'설정 파일 격리').
- LLM 호출(Anthropic, OpenAI, Ollama, Gemini)은 흉내가 답하거나 가드가 막는다. 실제 Claude 응답 확인은 `make check` 에 없다.
- `llm_processor.is_test_environment()` 는 pytest 중 True 지만, 막는 호출은 챗 ReAct 플래너 하나뿐이다. 답변 생성·스트리밍·수집 평가는 하네스의 흉내 Claude 를 쓴다.
- 남은 외부 호출 (네트워크 상태에 따라 결과가 바뀔 수 있다): scoped 챗 4개(스크래퍼가 github.com·example.com GET), `test_probe_and_discover_feed_github`·`test_source_researcher_inspect_url`·`test_deep_research_run_and_audit`(github.com 등), `test_notion_export_page_mock`(api.notion.com), `test_email_api_endpoints`(`config.json` 의 SMTP 호스트 연결 시도).
- 설정 파일을 쓰는 테스트(`test_briefing_settings_get_and_post` 의 `config.json`, `test_sources_toggle_and_crud`·`test_deep_research_run_and_audit` 의 `sources.json`)는 세션 사본에 쓴다. `make check` 뒤 `git status` 에 `config.json`·`sources.json`·`backend/app/config/sources.json` 변경이 없다.

## 통과 기준
- `make check` 종료 코드 0
- 버그 수정은 먼저 실패하던 테스트가 통과한다
- 계약을 바꿨으면 `ContractAndMsw.test.ts` 가 바뀐 계약으로 통과한다

## 고위험 영역의 추가 검사
- 지정한 고위험 영역이 없다.

## 릴리스 전 통합·회귀 검증
- `make check` 가 통과한다.
- 버전 문자열이 모두 새 버전인지 확인한다: `git grep -n '<새 버전>'` 로 `docs/releases.md` 의 '버전 문자열 위치' 를 대조한다.
- 두 앱을 함께 띄우는 통합 검사는 정하지 않았다. 하려면 `make docker-up` 을 쓴다: 두 컨테이너가 healthy 가 될 때까지 기다리고(기본 180초, `DOCKER_WAIT_TIMEOUT`) 아니면 실패로 끝난다. 이어서 `curl -f http://127.0.0.1:8000/health` 와 `curl -f http://127.0.0.1:3001/api/health` 로 확인하고 `make docker-down` 으로 내린다. Docker 에서 설정·소스를 저장하면 루트 `config.json`·`sources.json` 이 바뀌므로 끝나면 `git status` 를 본다. 로컬 개발 서버로는 `make dev` (준비되면 주소를 내고 Ctrl-C 로 둘 다 내린다).
