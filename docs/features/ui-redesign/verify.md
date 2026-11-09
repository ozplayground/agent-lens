# Verify: 디자인시스템과 반응형 UI/UX 재설계

Plan: ./plan.md
Status: approved
Approved-by: 자동 승인 (Claude) (2026-11-07)
Commit: b952bef (구현·문서), 7268027 (plan 범위 보정), 1c6ee06 (리뷰 후속 18단계 재검증), 78ee467 (2·3차 구현·문서·측정, '2·3차 검증' 절), 47c6ab3 (2·3차 리뷰 후속, '리뷰 후속 검증' 절), 9275529 (재리뷰 Nit·R34, '재리뷰 후속 검증' 절), 193c67d (최종 확인 Nit, '최종 확인 후속 검증' 절), efc27c3 (보정 7, '보정 7 검증' 절), d448e17 (보정 8·9, '보정 8·9 검증' 절)

## 검사 명령
- `make check` → 종료 코드 2 (backend 단계에서 멈춰 frontend 단계는 실행되지 않음)
```
                                        token_yielded = True
                                        yield (part, sanitize_model_identifier(f"Ollama {ol_m}"))
                            if token_yielded:
                                return
            except Exception as e:
                if token_yielded:
                    raise LLMStreamFailedException(f"Ollama mid-stream failed: {e}")
                logger.warning(f"Ollama stream failed: {e}")
    
        if token_yielded:
            raise LLMStreamFailedException("LLM 스트리밍 도중 외부 프로바이더 오류가 발생했습니다.")
>       raise LLMUpstreamException("외부 LLM 업스트림 통신 실패 / API 장애")
E       app.services.llm_processor.LLMUpstreamException: 외부 LLM 업스트림 통신 실패 / API 장애

app/services/llm_processor.py:460: LLMUpstreamException
=========================== short test summary info ============================
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 107.47s (0:01:47) ===================
make: *** [check] Error 1
```
- 위 backend 실패 2개는 이번 기능 범위 밖이다. 같은 두 테스트를 main 의 임시 worktree 에서 돌려도 `2 failed, 3 passed, 11 deselected` 로 똑같이 실패했다 (외부 LLM 실제 호출). 이번 기능은 `backend/` 를 바꾸지 않았다 (`git diff --name-only main..HEAD -- backend` 0줄). plan '증명' 은 frontend 단계를 아래 명령의 종료 0 으로 증명한다.
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 코드 0
```
 Test Files  42 passed (42)
      Tests  450 passed (450)
✖ 41 problems (0 errors, 41 warnings)
```
- backend 테스트가 고친 `sources.json`, `backend/app/config/sources.json` 은 `git checkout --` 으로 되돌렸다.
- 폭별 화면 측정 `cd frontend && CHROME_PATH=… node scripts/ui-audit.mjs` → `{'combos': 110, 'passed': 110, 'failed': 0, 'skipped': 0, 'pass': True}` (`audit/report.json`). verifier 가 scratchpad 로 다시 돌려 `110/110 통과, 건너뜀 0`.

## 증명 항목 (verifier 판정)
verifier 서브에이전트가 HEAD b952bef 에서 아무것도 고치지 않고 판정한 내용을 그대로 옮긴다. R13 행은 판정 뒤 plan 이 보정(7268027)되어 단언이 아닌 변경 세 곳이 plan 에 기록되었다.

| 증명 항목 | 결과 | 근거 (명령, 출력) |
|---|---|---|
| frontend 검사 (R10) | 통과 | 다시 돌렸다. `pnpm test` → `450 passed (450)`, `pnpm lint` → `0 errors, 41 warnings`, tsc 종료 0. 셋 다 종료 0 |
| `make check` 종료 0 | 실패 | 메인 출력 인용. 종료 2, backend 2개 실패(`test_anthropic_provider` 의 live LLM 테스트 둘). main 에서도 같은 둘이 실패하므로 이번 변경 때문은 아니다. frontend 단계는 실행되지 않았다 |
| R0 | 통과 | `globals.css` 에 `:root`(9행), `.dark`(38행), `@theme inline`(69행). `ui/` 에 부품 26개, `tests/ui` 에 테스트 8개. `design-system.md` 1~9절, nonce·ToastRegion 기재 |
| R1 | 통과 | TokenGuard 통과. `!important` 0개. hex grep 은 `--include` 를 앞으로 옮겨 돌리니 출력 없음 (plan 명령 오류는 7268027 에서 고침) |
| R2 | 통과 | `@custom-variant dark` 2행, layout.tsx 인라인 스크립트 23행. ThemeSystem·TokenContrast 통과. PNG 8장 |
| R3·R4·R5·R6·R8·R9 | 통과 | ui-audit 를 `--out` 으로 scratchpad 에 다시 돌림. `110/110 통과, 건너뜀 0`, 항목별 pass=false 0. R5: 390px 첫 제목 bottom 461/844, 1440px 첫 줄 maxBottom 536.5/900. R8 grep 출력 없음 |
| R7 | 통과 | 바뀐 Escape 테스트 파일 없음. audit 의 R7 90조합 통과 |
| R11 / 추가 3 | 통과 | localStorage 키 다섯 개뿐. 북마크(`JSON.stringify` 배열)·테마(`light/dark/system`) 저장 형식은 main 과 같다 |
| R12 / 추가 2 | 통과 | backend·package.json·lock diff 0줄, `next/font` 0건. types/mocks diff 는 `activeSource` 타입, `as any` → 타입 가드, import 하나. ContractAndMsw 통과 |
| R13 | 실패 (경미) → plan 보정 | 기존 테스트 변경 중 plan 표 밖 세 곳: ① `ChatSidebar.test.tsx:225` 테스트 이름 ② `ContractAndMsw.test.ts:50,56` import 추가 ③ `setup.ts` 의 `next/font/google` 목 삭제. 셋 다 단언 아님. 판정 뒤 plan 7268027 이 세 곳을 이유와 함께 기록 |
| 추가 1 (단언 변경 범위) | 통과 | 바뀐 `expect(` 줄은 모두 허용 범위: ChatSidebar 240-241, ChatMessageItem 188·266, CitationBadge 100, ChatWorkspace 261, MobileViewport 18-19, ContractAndMsw 534·776·777 |
| 추가 4 (겹친 대화상자) | 통과 | 실제 앱(3001)에서 puppeteer 로 1440·390 확인. 브리핑 위 '공유 & 알림 설정' 조작 요소 8개 모두 위 대화상자에 맞고 아래는 inert. Escape 1회 → 브리핑만 남음, 2회 → 0개 |

verifier 종합: 조건부 통과 (실패 둘: `make check` backend 범위 밖 실패, R13 plan 표 밖 테스트 변경).

## 화면 비교 (UI 작업)
spec 설계 3·4·6 의 와이어프레임과 `audit/` 스크린샷을 비교했다.
1. 1440×900 피드(라이트): 헤더 한 줄 56px, 요약 바 1줄, 툴바 2줄, 첫 카드 y≈300, 첫 화면에 카드 2줄 — spec 4.2 예상(y≈290)과 맞다. 바꾸기 전은 헤더 두 줄, 첫 카드 y≈625.
2. 390×844 피드(다크): 헤더 56px(브랜드·AI 챗·팔레트·더보기), 요약 바, 검색·카테고리·소스·정렬, 첫 카드 제목 화면 안 — spec 4.2 와 맞다. 바꾸기 전은 첫 화면에 기사 0개.
3. 1440×900 챗(다크): 사이드바·헤더·맥락 줄·메시지 열·입력 영역이 spec 6 표와 맞고 토큰 색이 일관된다.

## plan 범위 밖 변경
- 없음 (verifier 가 찾은 `docs/functional-spec/README.md`, `docs/product.md`, 테스트 파일 세 곳의 단언 아닌 변경은 plan 7268027 에서 범위에 넣었다).

## 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다. backend `test_anthropic_provider.py::test_anti_gemini_isolation_*` 2개가 외부 LLM 호출로 실패한다 (main 에서도 같음, `docs/known-issues.md` '테스트·운영').
- 폭별 측정은 next dev 서버 기준이다. 프로덕션 빌드(`make build` 는 성공)나 Docker 이미지로 화면을 측정하지는 않았다.
- `docs/known-issues.md` 'UI·접근성' 에 새로 적은 문제(챗 토스트 위치, Ask AI 입력 중 Escape 로 대화 소실, 수집 중 화면 이동 시 진행 표시 소실 등)는 이번에 고치지 않았다.
- 디자인 방향(색·정보 구조)은 자동 승인으로 정해졌다. 사람이 스크린샷(`audit/*.png`)을 보고 사후 검토할 수 있다.

## 재검증 (리뷰 후속 18단계 뒤, HEAD 1c6ee06)
reviewer 리뷰(Important 1, Nit 5)를 반영해 spec(47be028)·plan(cc49c54)을 보정·재승인하고 18단계를 구현(106e242)했다. Important 1 의 커밋 순서 문제는 main 으로 합칠 때 squash 로 한 커밋에 묶는 것을 권한다. verifier 가 아무것도 고치지 않고 다시 판정한 내용을 그대로 옮긴다.

| 항목 | 결과 | 근거 |
|---|---|---|
| 18 버전 배지 | 통과 | `vi.stubEnv` 로 값 있음·없음 두 경우를 확인하는 테스트 통과. `src` 에서 `package.json` grep 결과 없음(종료 1). `next.config.ts` 2행 import, 12행 `NEXT_PUBLIC_APP_VERSION`. `make build` 종료 0. `.next/static` 에서 `devDependencies`·`puppeteer-core` grep 결과 없음. 실제 앱(3001) 헤더에 `v0.3.1` |
| 18 줄어든 움직임 | 통과 | `ChatMessageList.tsx:43`, `ChatPromptInput.tsx:77` 가 `reduceMotion ? 'auto' : 'smooth'`. MobileViewport 테스트 통과 |
| 18 수집 중 초기화 차단·회차 구분 | 통과 | Header.test 두 테스트 통과: 수집 중 팔레트 초기화 명령 `aria-disabled`, 눌러도 확인 창 안 열림, 이전 회차 늦은 응답 무시 (`useCollector.ts:98,101`) |
| 18 확인 창 포커스 | 통과 | `tests/ui/ConfirmDialog.test.tsx`: busy 중 컨테이너, 실패로 풀리면 오류 문구, 성공 시 확인 버튼, body 로 빠지면 대화상자로 복귀 |
| R1·R10 | 통과 | `pnpm test` 43 파일 `458 passed`(TokenGuard 포함), lint `0 errors, 41 warnings`, tsc 종료 0 |
| R7 | 통과 | puppeteer 로 1440·390 재확인. 겹친 위 대화상자 클릭·입력 동작, 아래는 inert, Escape 한 번에 위만 닫힘 |
| R12 | 통과 | backend·`package.json`·lock diff 없음. types/mocks diff 는 앞선 판정과 같은 3개 파일 |
| ui-audit | 통과 | 110 조합 중 110 통과, 건너뜀 0 |
| 테스트 단언 범위 | 통과 | 38ac8ab 이후 테스트 변경은 `Header.test.tsx`(이 기능에서 새로 만든 파일, 버전 배지 단언만 18a 지정대로)와 새 `ConfirmDialog.test.tsx` 뿐 |

verifier 종합: 통과. 앞선 판정의 `make check` backend 범위 밖 실패 2개는 그대로다 ('남은 위험' 참고). R13 은 plan 7268027 에서 범위에 넣었다.

## 2·3차 검증 (spec R14~R32, plan 19~29단계와 3차 보정, HEAD 78ee467)
1차 보고 뒤 남은 것(화면 결함, spec 6 챗 알림 위치 미준수, known-issues 'UI·접근성' 8행, 결함을 못 잡은 측정, plan 사후 보정)을 spec 14절(0ef0908)·plan 2차(d5e48eb)·3차 보정(11be12e)으로 다시 열어 고쳤다. 범위 `1ec8a9b..HEAD`.

### 검사 명령
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0 (verifier 재실행)
```
 Test Files  50 passed (50)
      Tests  555 passed (555)
✖ 41 problems (0 errors, 41 warnings)
```
- `make build` → 종료 0 (라우트 `/`, `/_not-found`, `/api/health`, `/chat`)
- `make check` → 종료 2 (27단계, task 27 인용). backend 의 알려진 2개만 실패하고 make 가 거기서 멈춰 frontend 단계는 위 명령으로 따로 돌렸다. backend 테스트가 고친 `sources.json`·`backend/app/config/sources.json` 은 `git checkout --` 로 되돌렸다.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 109.57s (0:01:49) ===================
make: *** [check] Error 1
```
- `CHROME_PATH=… node scripts/ui-audit.mjs --self-test` → 종료 0: `SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정` (R3 판정 포함, 78ee467)
- 수정 전 기준선 (1ec8a9b 프로덕션 빌드, `audit/baseline-1ec8a9b/report.json`, verifier 재실행으로 같은 값) → 종료 1
```
FAIL: 조합 150, 통과 20, 실패 130, 건너뜀 0, 실패 항목 328
```
  F1(1440 `소스` scrollRow·clip), F2(390 `카테고리` scrollRow), F3(검색 placeholder 360·390·1024·1440), F4(rowAlign 768 6건·1440 7건)가 모두 실패로 잡혔다. `chatAlign`·`toast`·`vRhythm` 의 기준선 실패는 측정 대상 속성이 없어서 난 '대상 없음' 실패다 — 결함 자체를 잰 증거는 아니고, 그 결함(챗 열 어긋남, 알림 위치)의 수정 전 증거는 spec 14.1 관측과 코드(`Toast.tsx` 가 처음 마운트된 영역만 그림)다.
- HEAD 전체 측정 (프로덕션 빌드, `audit/report.json`, environment `devIndicator: false`, commit 3300dc3, frontend 는 HEAD 와 같음) → 종료 0
```
PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
```
  검사 10종(clip, placeholder, occluded, scrollRow, ariaControls, keepAll 각 150상태, vRhythm 10, rowAlign 6, toast 10, chatAlign 4) 실패 0. R3(가로 넘침)은 150조합 모두에서 재고 실패 0 (`scrollWidth − innerWidth` 최댓값 0). PNG 24장 (`audit/*.png`).
- 27단계 1회차(41f6b4c)는 실패 10건(연동 설정 `웹훅` 탭 360·390 clip 8, 커맨드 팔레트 360 placeholder 2)과 육안 결함 4건(390 소스 줄 넘침 표시 안 보임, 레이더 라벨 영문·잘림, 딥 리서처 스케줄 값 잘림, 팔레트)이 나와 3차 보정으로 고쳤다. 판정 오탐 1건(`chatAlign` 이 세그먼트 컨트롤 안쪽 버튼을 잼)은 판정을 고치고 fixture 로 검증했다.

### 화면 비교 (UI 작업)
메인 세션이 HEAD 스크린샷을 직접 열어 확인했다.
1. `feed-light-1440x900`: 카테고리·소스 칩과 `북마크` 가 모두 보이고 정렬 선택창 옆 빈 열이 없다. 카드 높이·제목 위치가 같고 라벨이 한국어(`에이전트 · 국내 테크 · 15일 전`, `시사점`).
2. `feed-light-390x844`: 검색 자리표시 `키워드 검색` 이 다 보이고, 카테고리·소스 줄 끝에 `›` 넘침 표시가 하나씩 있다.
3. `feed-dark-768x1024`, `chat-light-1440x900`: 잘림·겹침·어긋남 없음. 챗 맥락 줄·입력 영역 왼쪽 끝이 맞는다.
- 모든 카드의 별점 180·인기 100·`15일 전` 이 같다. 데이터 쪽 문제(원인 미확인)로 `known-issues.md` 에 적었다.

### 증명 항목 (verifier 판정)
verifier 서브에이전트가 HEAD 510b6c7 에서 아무것도 고치지 않고 판정했다 (프로덕션 측정·기준선을 다시 돌림). 표는 판정을 줄인 것이다.

| 증명 항목 | 결과 | 근거 |
|---|---|---|
| R30 ① self-test | 통과 | 종료 0 |
| R30 ② 1ec8a9b 기준선 F1~F4 | 통과 | 다시 돌려 같은 328건, F1~F4 모두 잡힘 |
| HEAD 측정 전체 통과·PNG 24장 (R29·R31) | 통과 | 150/150 종료 0, `devIndicator:false`, 이름 집합 일치 |
| R14·R15·R16·R17 | 통과 | `FeedToolbar`·`ChipGroup`·`NewsCard` 'fixed frame' 테스트, scrollRow·clip·placeholder·rowAlign 실패 0 (기준선은 F1~F4 실패) |
| R18 | 통과 | `FeedInsights.test.ts` 7건, `page.tsx:239` `preferSummary` |
| R19 | 통과 (예외 1) | 라벨 테스트, `ActiveSourceChip.test.tsx:19` 'MCP'. 정적 명령 1 이 `FocusBottomSheet.tsx:33-34` 를 출력 (spec 우려 18 예외, 파일 불변) |
| R20·R21·R22 | 통과 | InsightsBar 3건, `globals.css:132 keep-all`, `useNewsFeed.test.tsx` (a)~(e), vRhythm·keepAll·chatAlign 실패 0 |
| R23·R24·R25 | 통과 | `Toast.test.tsx` placement 3건, ariaControls 150상태 0 (기준선 108건), `OverlayStack.test.tsx` 같은 렌더 부모·자식 |
| R26·R27·R28 | 통과 | `NewsDetailModal` Escape·IME, `useCollector.test.ts`, `Header` 수집 상태 복원, `AskAiPanel` 복사 실패 |
| R32 | 통과 | `git diff --name-only 1ec8a9b..HEAD -- backend frontend/src/types frontend/src/mocks frontend/src/lib/api.ts frontend/package.json frontend/pnpm-lock.yaml` 0줄 |
| 3차 (29·20/21/22/23 후속·27 재측정) | 통과 | 팔레트·딥 리서처 테스트, ChipGroup (a)~(d), Tabs 추가 2건, `radarCategoryLabel`, FeedToolbar 개별 표시 삭제, 1회차 실패 10건 → 0 |
| 테스트 변경 규칙 | 통과 | 지운 기존 줄은 우려 10 의 6줄, 3차 표의 `FeedToolbar.test.tsx:154-175` 교체, import 이름 추가뿐. `fa3959a`(같은 차수에 새로 쓴 실패 테스트의 표시 클래스 수정)는 단언을 약하게 하지 않음 — 원래 단언은 성립할 수 없었고 고친 테스트도 빈 구현에서 실패 |
| 실패 테스트 먼저 | 통과 | 2차 7쌍, 2차 후속 4쌍, 3차 4쌍 모두 test 커밋이 구현보다 먼저. 21 3차는 리팩터(회귀 테스트만) |
| plan '변경 파일' 밖 | 없음 | frontend 61경로 모두 목록 안·담당 단계 일치. 문서는 목록 안 파일에서 코드와 어긋난 서술을 맞춘 것 |

verifier 종합: 조건부 통과 (실패 없음, 아래 편차 기록 필요).

### 편차 (verifier 가 찾은 것과 처리)
- A. R19 정적 명령 1 이 `FocusBottomSheet.tsx:33-34` 2줄을 낸다. spec 우려 18 로 뺀 화면이고 이번에 고치지 않았다 (`known-issues.md` 'UI·접근성').
- B. 20·22·23·24 task 에 수정 전 기준선 인용이 없었다 (19 를 23~26 시작 뒤에 커밋한 탓). 메인 세션이 기준선 report 에서 인용해 채웠다 (3300dc3).
- C. R3 이 2차에 새로 생긴 40조합에서 재지지 않았다. ui-audit 이 150조합 모두에서 R3 을 재게 고치고 다시 재 실패 0 을 확인했다 (78ee467).
- D. plan 은 관문마다 메인 세션이 웨이브를 한 번에 커밋하라고 했지만 단계마다 구현을 커밋했다. `8fb3e3a`(구현 커밋)가 테스트 버튼에 `role="tab"` 을 더했으나 단언은 약해지지 않았다 (빈 구현에서 그대로 실패 확인).
- E. plan 3차 '위험' 의 spec 해석(좌우로 늘인 줄에 넘침 표시가 보이면 오른쪽 16px 를 표시가 쓴다)은 자동 승인으로 받아들였다. 사람이 확인하지 않았다.
- plan 순서와 다르게 한 곳: 23~26 을 관문 G3 의 19 self-test 전에 시작했고, 28 문서를 메인 세션 대신 문서 작성 서브에이전트 3개가 쓰고 메인이 검토했다. verifier 는 결과에 영향이 없다고 판정했다.

### plan 범위 밖 변경
- 없음 (verifier 확인 3).

### 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다. backend `test_anthropic_provider.py::test_anti_gemini_isolation_*` 2개가 외부 LLM 호출로 실패한다 (main 에서도 같음, `docs/known-issues.md` '테스트·운영').
- 화면 측정은 `make check` 밖의 수동 검사다 (Chrome 과 실행 중인 프로덕션 앱이 필요).
- 고치지 않고 `known-issues.md` 에 남긴 것: 포커스 시트 카테고리 라벨(편차 A), backend 고정 시사점 반복(카드만 요약으로 완화, 상세·챗·브리핑은 그대로), 모든 카드의 별점·인기 점수·시간이 같게 보임(원인 미확인).
- 디자인 방향과 spec 해석(편차 E)은 자동 승인으로 정해졌다. 사람이 스크린샷(`audit/*.png`)을 보고 검토해야 한다.

## 리뷰 후속 검증 (2·3차 리뷰 Important 3·Nit 5, spec 보정 1~4, plan 30~37, HEAD 47c6ab3)
reviewer 2·3차 리뷰(Important 3, Nit 5)를 spec 리뷰 후속 보정 1~4(e877b6b, c9959c3, 2034bcc, 5c948cf)와 plan 30~37단계(ef1cadf, 9ac4ae1, 47c6ab3)로 고쳤다. 범위 `b7fc73c..HEAD`.

### 검사 명령
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0 (verifier 재실행, HEAD 77d2895)
```
 Test Files  50 passed (50)
      Tests  589 passed (589)
✖ 41 problems (0 errors, 41 warnings)
```
- `make build` → 종료 0
- `make check` → 종료 2 (task 36 '재측정 4' 인용). backend 의 알려진 2개만 실패하고 make 가 멈춰 frontend 단계는 위 명령으로 따로 돌렸다. 바뀐 `sources.json`·`backend/app/config/sources.json` 은 되돌렸다.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 117.14s (0:01:57) ===================
make: *** [check] Error 1
```
- `--self-test` (1440·360 두 폭) → 종료 0: `SELF-TEST PASS: defects.html 결함 모두 검출, clean.html 검사 10개 통과, dev-indicator.html 환경 오류 판정`. 새 fixture: 세로·가로로 잘린 스크롤 영역, 잘린 배지 줄, 알파 0 감싸개, 선택 칩이 줄 밖, 왼쪽 표시 없는 both 줄, 줄을 덮는 표시, 흐림에 겹친 선택 칩. 판정 수정 전에는 모두 MISS(종료 1)였다.
- HEAD 프로덕션 측정 (`audit/report.json`, 측정 커밋 79fe9cb, verifier 가 77d2895 로 다시 재 같은 결과) → 종료 0
```
PASS: 조합 150, 통과 150, 실패 0, 건너뜀 0, 실패 항목 0
```
  360·390 소스 줄 처음 상태: `scrollLeft 114`, `mustReadHidden: true`, `startHint: true` (Must-Read 가 가려진 곳은 모두 왼쪽 `‹` 표시가 있음).
- 1ec8a9b 기준선 (바뀐 판정으로 다시 잼, verifier 재실행으로 `byCheck` 완전히 같음) → 종료 1, 조합 150 중 130 실패, 실패 항목 328. F1~F4 그대로 잡힘. `scrollRow` 실패 요소 78 → 152 (scroll-padding 24 아님 +50, 768 미만 표시 없음 +20, 흐림 밖 선택 칩 판정으로 바뀜).
- 측정 중 육안 확인에서 판정이 놓친 결함 2건을 찾아 고쳤다: 360·390 소스 줄 선택 칩 잘림(→ 선택 칩 판정 추가, 스냅 위치에서 목표 선택), 첫 화면 Must-Read 가 단서 없이 숨음(→ 768 미만 양쪽 표시, 흐림 = 스냅 여백 24px). 31 후속 1 은 jsdom 만으로 확인해 실제 Chrome 에서 동작하지 않았고(스냅 되돌림), 후속 2 부터 실제 프로덕션 빌드 Chrome 확인을 붙였다.

### Chrome 키보드 확인 (verifier, HEAD 77d2895 프로덕션, puppeteer `keyboard.press`)
| 항목 | 결과 | 출력 인용 |
|---|---|---|
| 1 다음 버튼이 사라질 때 포커스 | 통과 | `Enter 2회 뒤 다음 버튼 없음. activeElement= {"tag":"BUTTON","name":"소스 이전 항목 보기"} body? false` (1024 소스, 768 카테고리·소스도 같음) |
| 2 767 로 줄이면 선택 칩으로 | 통과 | `activeElement= {"name":"전체4734","pressed":"true","group":"소스"} body? false` |
| 3 소스 칩 기준 (Must-Read 무관) | 통과 | Must-Read 켬·끔 모두 `scrollLeft 변화 0` (1024·390·360) |
| 4 검색 노드·포커스·값 유지 | 통과 | 1440→1024→360→1440 매번 `"sameNode":true,"isSearch":true,"value":"agent"`. 소스 줄 `scrollLeft` 0→0→114→0 은 R15 선택 칩 다시 보이기 (spec 보정 4 로 R33 문구 정정) |
| 5 Tab 순서 = 화면 순서 | 통과 | 360·1024·1440 모두 `카테고리 → 검색 → 소스 → 정렬` |
| 6 하이드레이션 전후 배치 | 통과 | JS 끈 SSR·로드 직후·1초 뒤 rect 모두 `같음` |
| 6b 360·390 `‹`·칩 튐 | 통과 | `startHint visible, startHintOverlapRow 0, selLeftMinusMask 0`, 처음·왼쪽 끝·오른쪽 끝 내용 원점 `같음(튀지 않음)` |

### 증명 항목 (verifier 판정, 아무것도 고치지 않음)
| 항목 | 결과 | 근거 |
|---|---|---|
| 리뷰 후속 ①~⑦, 보정 3 ①~⑥ | 통과 | 위 검사, Chrome 표 |
| Important 1 스크롤 버튼 포커스 | 해결 | ChipGroup ①②④ (수정 전 실패), Chrome 1·2 |
| Important 2 clip ④ | 해결 | fixture ①② 검출, HEAD 150/150, 기준선 유지 |
| Important 3 배지 줄 | 해결 | `Badge shrink`, NewsCard 단위 테스트 4개(수정 전 실패), fixture ③. 프로덕션 데이터에 해당 카드가 없어 재현은 fixture·단위 테스트로만 |
| Nit 1 툴바 한 트리 | 해결 | FeedToolbar ②③④, R33 `rg` 0줄, Chrome 4·5·6 |
| Nit 2 오래된 상태 응답 | 해결 | useCollector ①② (수정 전 실패). 브라우저 확인 없음 |
| Nit 3 알림 재알림 | 해결 | Toast 테스트(왕복 포함, 수정 전 실패) |
| Nit 4 소스 줄 Must-Read | 해결 | FeedToolbar ①, Chrome 3 |
| Nit 5 chatAlign 알파 | 해결 | `colorAlpha`, clean.html 알파 0 감싸개 통과 |
| 기존 단언 변경 | 통과 | `git diff -U0 b7fc73c -- frontend/src/tests` 의 지운 줄은 plan 표 5곳(ChipGroup.test :287·:328·:368·:388·:396, FeedToolbar.test :142)과 import 2줄뿐. 31 후속 2 의 스냅 끄기 단언 그대로 |
| 실패 테스트 먼저 | 통과 | 30~35 와 모든 후속에서 test 커밋이 구현보다 먼저 |
| 판정 완화(스크롤바 표시 판정) | 결함 숨김 없음 | 옛 판정으로 되돌린 사본: defects MISS 0, HEAD clip 0→0, 1ec8a9b clip 276→276 |
| R32 | 통과 | 0줄 |
| 통합 문서 SDLC 정보 | 없음 | tech-spec 변경 이력 행은 plan 지정 형식 |

verifier 종합: 조건부 통과 (실패 없음, 편차 2건).

### 편차와 처리
- A. `docs/known-issues.md` 1행(좁은 폭 소스 줄 Must-Read 첫 화면 미노출)을 plan 이 목록 밖으로 둔 상태에서 메인 세션이 먼저 더했다(a9ea174). 문서 지도상 새 행은 triage 몫이다. plan 을 사후 보정해 범위에 넣고 그 순서를 Revision 에 기록했다(47c6ab3).
- B. spec R33 '칩 줄 `scrollLeft` 유지' 문구가 실제(360 에서 R15 선택 칩 다시 보이기로 0→114)와 달랐다. spec 보정 4(5c948cf)로 유지 대상을 노드·포커스·입력 값으로 한정하고 14.3 에 다시 보이기 규칙을 적었다. 코드 변경 없음.
- 참고: 측정 담당 단계(30·36)와 수정 담당 단계가 여러 번 오가며(31 후속 1~3, 30 후속 1·2, spec 보정 2~4) 측정을 4회 다시 했다. 34 후속 2(4b0c2a9, 주석만)는 마지막 측정 뒤에 들어갔고 verifier 재측정(77d2895)에 포함됐다.

### 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다 (backend live LLM 테스트 2개, main 에서도 같음).
- 360·390 첫 화면에서 피드 소스 줄의 `Must-Read` 칩은 왼쪽 밖에 있고 `‹` 표시로 단서만 준다 (spec 우려 23, `known-issues.md`). 바로 보이게 하려면 배치 결정이 필요하다.
- 배지 줄 잘림(Important 3)과 오래된 상태 응답(Nit 2)은 프로덕션·브라우저에서 재현하지 못하고 fixture·단위 테스트로만 증명했다.
- 1ec8a9b 에는 `ScrollRow` 가 없어 Chrome 키보드 확인을 수정 전 빌드와 대조하지 못했다.
- 툴바 배치 변경(spec 우려 20)과 모든 spec 해석은 자동 승인으로 정해졌다. 사람이 스크린샷(`audit/*.png`)을 보고 검토해야 한다.

## 재리뷰 후속 검증 (재리뷰 Nit 1~3, 사용자 결정 R34, spec 보정 4·5, HEAD 9275529)
reviewer 재리뷰(Important 0, Nit 5)를 받아 Nit 1(clip ① 스크롤바 면제를 768 이상으로), Nit 2(사용자 스크롤 = 입력 신호 뒤 scroll), Nit 3(첫 화면 Must-Read 미노출 — 사용자가 2026-11-07 '정렬 옆 고정 토글' 을 골라 R34 로)을 고쳤다. spec 보정 4·5(5c948cf, e274563), plan 사후 보정(47c6ab3)·보정 5(8579b59). 범위 `0dc60a5..HEAD`.

### 검사 명령
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0 (verifier 재실행)
```
 Test Files  50 passed (50)
      Tests  597 passed (597)
✖ 41 problems (0 errors, 41 warnings)
```
- `make build` → 종료 0
- `make check` → 종료 2 (task 36 '재측정 5' 인용). backend 의 알려진 2개만 실패, frontend 단계는 위 명령으로 따로 돌림, 바뀐 `sources.json` 2개 되돌림.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 109.26s (0:01:49) ===================
make: *** [check] Error 1
```
- `--self-test` (1440·360) → 종료 0. 새로 잡는 결함: 스크롤바를 숨기지 않은 가로 스크롤 영역에 잘린 버튼(360), 소스 줄 첫 칩 Must-Read 가 scrollLeft 138 로 숨음(1440·360).
- HEAD 프로덕션 측정 (`audit/report.json`, 측정 커밋 8b2634c, verifier 가 9275529 로 다시 재 같은 값) → `PASS: 조합 150, 통과 150, 실패 0`. `/` 처음 상태 10조합 모두 `toolbar.mustReadVisible: true` (360 `[180,232,44,44]`, 390 `[210,…,44,44]`, 768·1024·1440 `121×32`).
- 1ec8a9b 기준선 → 종료 1, 실패 항목 328, F1~F4 그대로. 1ec8a9b 에는 피드 툴바가 없어 `mustReadVisible` 판정은 기준선에서 돌지 않는다(fixture 로만 검증).

### 화면 비교
- 메인 세션이 `feed-light-360x780.png` 를 직접 확인: 소스 줄 `전체 4734 | 국내 테… ›`, 그 오른쪽 별 Must-Read 토글, `인기순` 정렬. 겹침·잘림 없음. 소스 줄은 처음에 밀리지 않는다(scrollLeft 0).

### Chrome 실제 입력 확인 (verifier, 9275529 프로덕션, puppeteer touchscreen·mouse.wheel·keyboard·mouse.click)
| 항목 | 결과 | 출력 인용 |
|---|---|---|
| 1 터치·휠로 민 위치 유지 | 통과 | 360 터치 소스 `0 → 186`, `360→390 186`, `390→360 186`. 1024 휠 소스 `0 → 186`, 1084 에서 브라우저가 149 로 자르고 `→1024 186`. 선택 칩 위치(0)로 끌어오지 않음. (1440 은 줄이 넘치지 않아 0 으로 잘림 — 이 경우는 유지가 성립할 수 없음) |
| 2 입력 없는 scroll 뒤 다시 보임 | 통과 | 1440→360→390→1024→360 매번 `selVisible:true`. JS 로 `scrollLeft=0` 뒤 390 → `sl:698, selVisible:true` |
| 3 5개 폭 첫 화면 Must-Read | 통과 | 360 `{"count":1,"inSourceGroup":false,"rect":[180,232,44,44],"inViewport":true,"hitSelf":true}`, 다섯 폭 모두 실제 클릭으로 `aria-pressed false→true→false` |
| 4 Tab 순서 | 통과 | 5개 폭 모두 `카테고리 → 검색 → 소스 → Must-Read → 정렬` |
| 5 지난 1·2·4 | 통과 | `activeElement= "소스 이전 항목 보기" body? false`, 767 → `"전체4734","pressed":"true","group":"소스"`, 검색 `"sameNode":true,"value":"agent"` |

### 증명 항목 (verifier 판정, 아무것도 고치지 않음)
| 항목 | 결과 | 근거 |
|---|---|---|
| 보정 5 ①~⑦, 요구사항 R34·R15·R33·R29·R30·R32 | 통과 | 위 검사·Chrome 표 |
| 기존 단언 변경 | 통과 | `git diff -U0 e274563 -- frontend/src/tests` 의 지운 줄은 FeedToolbar.test `:50`·`:54-55`·`:57`·`:59` 와 import 1줄뿐. `ChipGroup.test.tsx:619` 는 `fireEvent.wheel(group)` 추가만. 바뀐 단언은 같은 세기 이상 |
| 실패 테스트 먼저 | 통과 | 2d3f760→f0315fd, 0a9ea61→df1f953, 510cfde→664f5f7, 3a393df→345112d |
| 편차 A(known-issues 사후 보정)·B(R33 문구) 처리 | 맞음 | 47c6ab3 Revision 기록, 보정 5 에서 행 삭제(현재 0행). 5c948cf 로 R33 한정, plan 문구 맞춤 |
| R32 | 통과 | 0줄 |
| 통합 문서 SDLC 정보 | 없음 | `(R34)` 는 테스트 이름 인용 |

verifier 종합: 통과 (실패 없음).

### 편차 (판정은 바꾸지 않음)
- C. 30 후속 3(3a393df→345112d, 재리뷰 Nit 1)이 plan 에 오르기 전에 구현됐다. 파일은 30 담당 목록 안이고, plan 보정 5(8579b59)가 사후로 넣었다. 편차 A 와 같은 '편집 뒤 plan' 순서다.
- D. 30 후속 4 의 fixture 커밋(510cfde) 시점에는 self-test 가 실패하지 않았다(종료 0). self-test 장치(`[data-self-test-both]`, `data-expect-reason`)를 고친 뒤에 실패가 드러났고, 그 장치 변경은 구현 커밋 664f5f7 에 함께 들어갔다. task 30 '후속 4' 에 기록. 장치 변경은 판정을 엄격하게 하는 쪽이다.
- 재리뷰 Nit 4(known-issues 편집과 plan 범위 보정이 다른 커밋)·Nit 5(d95c057 구현 커밋 시점에 `FeedToolbar.test.tsx:142` 1건 실패, 9f30e2a 에서 단언 변경)는 커밋 이력을 다시 쓰지 않으면 고칠 수 없어 기록만 한다.

### 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다 (backend live LLM 테스트 2개, main 에서도 같음).
- 사용자 스크롤 판정의 시간 값(150ms·1,000ms)과 `scrollend` 지원은 근거 없는 가정이다 (spec 우려 26). Chrome 터치·휠 확인은 통과했다.
- 배지 줄 잘림, 오래된 상태 응답, `mustReadVisible` 의 수정 전 대조는 fixture·단위 테스트로만 증명했다.
- `known-issues.md` 에 남은 것: 포커스 시트 카테고리 라벨, backend 고정 시사점 반복, 모든 카드 점수가 같게 보임.
- R34 배치는 사용자가 골랐고, 그 밖의 디자인 방향과 spec 해석은 자동 승인이다. 사람이 스크린샷(`audit/*.png`)을 보고 검토해야 한다.

## 최종 확인 후속 검증 (reviewer 최종 확인 Nit 1·2, spec 보정 6, HEAD 193c67d)
reviewer 최종 확인(Important 0, Nit 3)의 Nit 1(spec 14.8 clip ① 문구, 코드 변경 없음)·Nit 2(세로 휠도 입력 신호로 셈 → 가로 의도 휠만)를 spec 보정 6(db97826)·plan 보정 6(3ddda27)으로 고쳤다. Nit 3 은 위 편차 C. 범위 `646826e..HEAD`.

### 검사 명령
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0 (verifier 재실행)
```
 Test Files  50 passed (50)
      Tests  599 passed (599)
✖ 41 problems (0 errors, 41 warnings)
```
- `make build` → 종료 0. `--self-test` → 종료 0.
- `make check` → 종료 2 (task 36 '재측정 6' 인용). backend 의 알려진 2개만 실패, frontend 단계는 위 명령으로 따로 돌림, 바뀐 `sources.json` 2개 되돌림.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 113.59s (0:01:53) ===================
make: *** [check] Error 1
```
- HEAD 프로덕션 측정 (`audit/report.json`, 측정 커밋 27f3eed, verifier 가 193c67d 로 다시 재 같은 결과) → `PASS: 조합 150, 통과 150, 실패 0`, `/` 10조합 `mustReadVisible: true`. `frontend/scripts` 가 바뀌지 않아 1ec8a9b 기준선은 다시 재지 않았다.

### Chrome 실제 입력 확인 (verifier, 193c67d 프로덕션)
| 항목 | 결과 | 출력 인용 |
|---|---|---|
| 1024 가로 휠로 민 위치 유지 | 통과 | `mouse.wheel({deltaX:120})` → `sl:71`, 폭 984·1064·1024 모두 `sl:71` |
| 1024 sticky 툴바 위 세로 휠 직후 폭 변화 | 통과 | 세로 휠 `{"dx":0,"dy":400,"trusted":true}` → 1100 에서 브라우저가 자름 `sl:133` → 960 `sl:257, clear:true` (수정 전 코드는 `clearOfFades:false` 로 잘린 채 남음, 31 후속 5 비교) |
| 보정 5 터치·무입력 | 통과 | 360 터치 소스 0 → 186 유지, 무입력 폭 변화마다 `selVisible:true` |
| Shift+세로 휠 실제 입력 | **미검증** | macOS headless Chrome 에서 실제 Shift+세로 휠은 `{"dy":150,"shift":true}` 로 오지만 페이지만 세로로 내려가고 줄은 가로로 밀리지 않아 '민 위치 유지' 를 관찰할 수 없다. 대체 증거: CDP `deltaX 150 + Shift` 실제 입력은 위치 유지(186), 실제 Chrome·프로덕션 번들에서 합성 `WheelEvent` 판정 `{deltaY:100, shiftKey:true}` 유지 / `{deltaY:100}` 다시 보이기 / `{deltaX:40, deltaY:10}` 유지로 세 경우가 구별됨 |

### 증명 항목 (verifier 판정, 아무것도 고치지 않음)
| 항목 | 결과 | 근거 |
|---|---|---|
| 보정 6 ①~⑦ | 통과 (⑥ 중 1건 미검증) | 위 검사·Chrome 표 |
| 기존 단언 | 통과 | `git diff -U0 db97826 -- frontend/src/tests` 의 지운 줄은 `:619`·`:950` 의 `fireEvent.wheel(group);` 두 줄뿐, 둘 다 `{ deltaX: 40 }` 로. 단언 값 그대로 |
| 실패 테스트 먼저 | 통과 | 36991b5(⑤ 실패) → 766a899 |
| clip ① 문구 (Nit 1) | 통과 | 코드 변경 0줄, `ui-audit.mjs:797` 과 spec 일치 |
| R32 | 통과 | 0줄 |
| 통합 문서 SDLC 정보 | 없음 | |

verifier 종합: 통과 (실패 없음, 미검증 1건).
reviewer 확인 (같은 범위): Important 0, Nit 0. `isHorizontalWheel` 은 같은 이벤트의 크기 비교라 `deltaMode` 와 무관, 대각선(deltaX≈deltaY)은 세로로 보는 절충, 리스너 정리 정상, 바뀐 테스트 2줄은 단언을 약하게 하지 않음.

### 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다 (backend live LLM 테스트 2개, main 에서도 같음).
- Shift+세로 휠 실제 입력의 '민 위치 유지' 는 미검증이다 (Windows·Linux Chrome 이나 실제 macOS 마우스로 확인 필요). 또 이 환경처럼 Shift+세로 휠이 페이지만 내리는 경우에도 앱은 입력 신호로 보므로, 그 1초 안에 브라우저가 줄을 자르면 선택 칩 다시 보이기가 멈출 수 있다 (spec 대로, 실제 발생은 확인 안 함).
- 사용자 스크롤 판정의 시간 값(150ms·1,000ms)은 근거 없는 가정이다.
- 배지 줄 잘림, 오래된 상태 응답, `mustReadVisible` 의 수정 전 대조는 fixture·단위 테스트로만 증명했다.
- `known-issues.md` 에 남은 것: 포커스 시트 카테고리 라벨, backend 고정 시사점 반복, 모든 카드 점수가 같게 보임.
- R34 배치는 사용자가 골랐고, 그 밖의 디자인 방향과 spec 해석은 자동 승인이다.

## 보정 7 검증 (프로덕션 스크린샷 결함 7건, spec 14.15 R35~R40, HEAD efc27c3)
메인 세션이 프로덕션 스크린샷 24장을 직접 보고 확정한 결함 7건(피드 F1~F3, 챗 C1~C4)을 spec 보정 7(8d643d2, 정정 17b6bc9)·plan 보정 7(2d52b40, 정정 ee9a45d·eb5bb38)로 고쳤다. F2 는 줄 구성을 바꾸지 않기로 판단했다(spec 우려 29). 범위 `0b2a2cc..HEAD`.

### 검사 명령
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0 (메인 G18 실행, verifier 재실행 같은 결과)
```
 Test Files  50 passed (50)
      Tests  622 passed (622)
✖ 41 problems (0 errors, 41 warnings)
```
- `make build` → 종료 0. `node scripts/ui-audit.mjs --self-test` → 종료 0 (`SELF-TEST PASS: … clean.html 검사 16개 통과`).
- `make check` → 종료 2 (task 43 인용). backend 2개만 실패, frontend 단계는 위 명령으로 따로 돌림, 바뀐 `sources.json` 2개 되돌림.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 105.55s (0:01:45) ===================
make: *** [check] Error 1
```
  원인 (메인 세션이 두 테스트를 직접 실행해 확인): `has_live_provider` 가 빈 `OLLAMA_BASE_URL` 을 git 추적 `config.json` 의 `ollama_base_url` 로 대신 쓴다(`backend/app/services/llm_processor.py:267`). 이 컴퓨터는 로컬 Ollama 가 떠 있어(`/api/tags` 200) 검사를 통과하고, 설정 모델 `llama3.2:latest` 가 설치돼 있지 않아(설치 모델 `gpt-oss:20b`) `LLMProviderUnavailableException` 대신 `LLMUpstreamException` 이 난다. 외부 LLM 장애가 아니라 테스트 환경 격리 문제이고 이 기능 변경과 무관하다. 이전 절들의 '외부 LLM 업스트림 실패' 서술은 이 원인으로 바로잡는다 (known-issues a22eac5).
- HEAD 프로덕션 측정 (`audit/report.json`, 측정 커밋 a757344, verifier 가 a22eac5 로 다시 재 같은 결과) → `PASS: 조합 160, 통과 160, 실패 0`. 새 검사 상태 수 toolbarLayout 10·cardMetric 10·chatScope 30·terms 40·modelPicker 10·focusLabels 10 모두 실패 0. 360 소스 줄 `{visibleWidth:344, fullyVisibleChips:2, toggleTop:284, sourceBottom:280}`, 390 `{374, 3, 284, 280}`. 1440 카드 `rss_kr 9장 점수 0, github 8장 스타 8, rss 1장 점수 0`. `/` 10조합 `mustReadVisible: true`.
- 회귀 증명 (spec 승인 커밋 8d643d2 프로덕션 빌드, 현재 ui-audit, task 38 과 verifier 재현 같은 결과) → `FAIL: 조합 160, 통과 110, 실패 50`. 실패는 새 검사 6개에만: toolbarLayout 4조합(360·390), cardMetric 10, chatScope 8(360·390), terms 30, modelPicker 6(768 이상), focusLabels 10. 대표: `점수180`(rss_kr), `단일 기사 (Scoped)` 탭 left −6, 보이는 모델 선택 버튼 2개.
- 1ec8a9b 기준선 (`audit/baseline-1ec8a9b/report.json`) → `FAIL: 조합 160, 통과 20, 실패 140, 실패 항목 394` (이전 328 + 보정 7 검사분). F1~F4 계속 실패로 잡힘.

### 화면 비교 (메인 세션 직접)
고치기 전 24장을 모두 열어 결함 7건을 확정했고, 고친 뒤 바뀐 22장을 모두 다시 열어 확인했다(바뀌지 않은 `briefing-light-390x844`·`detail-light-390x844` 는 고치기 전에 확인).
- F1: 360·390 소스 줄이 전체 폭, 칩 2~3개 보임, 별 토글과 정렬이 다음 줄 오른쪽.
- F3: 국내 테크 카드에 `★180` 없음, GitHub 카드 `스타 19,848 · 포크 2646`.
- C1~C4: 360 탭 `단일 기사 | 전체 소식` 잘림 없음, 대화 목록 배지 한국어, 캡슐 `포커스: 전체 소식`, 768·1024·1440 헤더에 모델 선택 없음(입력창 아래 한 곳).
- 남은 것: RSS 카드의 `🔥100` 이 여러 카드에 같게 보인다 (backend hotness 포화, 아래 남은 위험).

### Chrome 실제 입력 확인 (verifier, 화면 있는 Chrome)
| 항목 | 결과 | 출력 인용 |
|---|---|---|
| Shift+세로 휠 실제 입력 | **미검증** | puppeteer-core `headless:false`(innerWidth 500)에서 puppeteer Shift+`wheel deltaY 150`·CDP `mouseWheel modifiers=8` 모두 페이지가 받은 이벤트는 `{"dx":0,"dy":150,"shift":true,"trusted":true}`, 줄 `sl:0` (CDP 입력은 OS 를 거치지 않아 macOS 의 Shift→가로 변환이 없다). OS 수준 `CGEvent` scroll + `.maskShift` 는 Chrome 에 도착한 wheel 0건, `AXIsProcessTrusted = false`·`CGPreflightPostEventAccess = false` (이 터미널에 손쉬운 사용 이벤트 게시 권한 없음, 권한은 사용자 설정이라 바꾸지 않음) |

### 증명 항목 (verifier 판정, 아무것도 고치지 않음)
| 항목 | 결과 | 근거 |
|---|---|---|
| ① 세 명령·make build·self-test | 통과 | 위 검사 명령 |
| ② 실패 테스트 먼저 | 통과 | fde09ca→cd2f1f3, 9058214→07e5cb8, 214fabe→705a151, 8b451d5→738425e, 05ca99f→a757344, task 의 실패 출력 |
| ③ self-test fixture 6종 | 통과 | 6개 검사 결함 검출, clean 실패 0 |
| ④ HEAD 프로덕션 | 통과 | 160/160 |
| ⑤ 회귀 증명 | 통과 | 8d643d2 실패 50 (새 검사에만) |
| ⑥ 1ec8a9b 기준선 | 통과 | 394, F1~F4 계속 잡힘 |
| ⑦ 기존 단언 | 통과 | 8d643d2 이후 테스트 파일의 지운 줄은 모두 단언 표의 행이거나 import 2줄, 대체 단언은 같은 세기 이상 |
| ⑧ 사람 검토 | **미완료 (사람 몫)** | 메인 세션과 verifier 가 스크린샷을 봤지만 plan 은 사람 확인을 요구한다 |
| R35~R40, R29·R30, R32 | 통과 | 정적 확인 모두 출력 없음, R32 계약 경로 diff 0줄, 바꾸지 않을 6파일 diff 0줄 |

verifier 종합: 조건부 통과 (실패 없음, ⑧ 사람 검토 미완료, Shift+세로 휠 실제 입력 미검증 1건).
reviewer (같은 범위): Important 0, Nit 5. 카드 지표를 backend 수집기와 소스별로 대조해 맞음, ChatHeader prop 삭제 뒤 남은 참조·접근성 회귀 없음, `types/chat.ts` 의 `ChatHeaderProps` 어긋남은 계약이 아닌 UI props 기록이라 문제 아님. Nit 처리: 5(task 39·40·42 미커밋) → 2b40aba 커밋. 1(GitHub 폴백 합성 포크 수 `github.py:70`) → known-issues 반영(013ee84). 2(`cardMetric` 은 보이면 안 되는 점수만, `terms` 는 고정 목록) → 반대 방향은 단위 테스트가 잡아 측정 코드는 바꾸지 않고 test-strategy 에 한계 명시(013ee84). 4(쓰이지 않는 헤더 모델 선택 변형·낡은 prop 호환 테스트) → known-issues '테스트·운영' 행(013ee84, 줄 번호 정정 efc27c3). 3(`전체 소식` 이 검색 범위 탭과 카테고리 캡슐 두 뜻으로 함께 보임) → spec R38 결정이라 고치지 않고 아래 사람 확인 항목으로 남긴다.

### 편차 (판정은 바꾸지 않음)
- E. task 39·40·42 기록이 범위 끝(a22eac5)까지 커밋되지 않았다. 리뷰 Nit 5 로 2b40aba 에 커밋했다.
- F. `ChatSessionWorkflow.test.tsx:58` 단언 변경은 실패 테스트 커밋이 아니라 구현 커밋 738425e 에 들어갔다. 42 가 표 밖 단언으로 blocked 를 보고한 뒤 spec·plan 정정(17b6bc9·ee9a45d)으로 승인한 줄이다.
- G. 44 문서 반영 뒤 plan 목록 밖이던 `07-ui-common.md` 의 낡은 두 줄을 plan 정정(eb5bb38) 뒤 메인 세션이 고쳤다(a22eac5). 리뷰 Nit 문서 반영(013ee84·efc27c3)은 plan 목록 안 문서다.

### 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다 (backend 테스트 2개, 원인은 위 검사 명령의 테스트 환경 격리 문제, backend 범위).
- Shift+세로 휠 실제 입력의 '민 위치 유지' 는 미검증이다 (손쉬운 사용 권한을 준 환경, Windows·Linux Chrome 이나 실제 마우스로 확인 필요).
- 사람 확인 필요: 스크린샷 검토(⑧), 챗 입력 영역에서 스코프 탭 `전체 소식` 과 캡슐 `포커스: 전체 소식`(카테고리 전체)이 같은 말로 두 뜻을 갖는 것이 혼동되는지 (리뷰 Nit 3).
- RSS 카드의 인기 점수 `🔥100` 이 여러 카드에 같게 보이고, `추천순`·`인기순` 정렬이 합성 값에 좌우된다 (backend hotness 포화·합성 점수, known-issues, 별도 intent 필요).
- 사용자 스크롤 판정의 시간 값(150ms·1,000ms)은 근거 없는 가정이다.
- 배지 줄 잘림, 오래된 상태 응답은 fixture·단위 테스트로만 증명했다 (지금 데이터로는 화면에서 재현할 경우가 없음).
- `known-issues.md` 에 남은 화면 관련 문제: backend 고정 시사점 반복, 카드 점수·인기 포화. 포커스 시트 라벨 행은 해결되어 지웠다.
- R34 배치는 사용자가 골랐고, 그 밖의 디자인 방향과 spec 해석은 자동 승인이다.

## 보정 8·9 검증 (합성 소스 인기 점수 R41, 피드 세 영역 R42, 화면 구성 결함 R43~R48, HEAD d448e17)
보정 8: 보정 7 뒤 RSS 카드에 남은 `🔥100`(합성 인기 점수)을 원천 지표가 있는 소스(github·hackernews·reddit)에서만 보이게 했다 (spec 14.16 d444621, plan d249726, 45~47단계).
보정 9: 사용자 보고("전체소식 부분 검색창이랑 정렬 콤보박스 이상하게 나옴", "정렬은 목록 영역에 있어야 하는데 … 검색도 영역이 따로 분리되어야함")로 피드를 검색 영역·필터 영역·목록 머리줄 세 영역으로 나눴다. 메인 세션이 47단계 스크린샷을 화면 구성 기준으로 다시 보고 찾은 결함 6건(챗 헤더 순서, 이모지 아이콘 혼용, 상세 탭 용어, 브리핑 설정·헤드라인 중복, 분야 이름 불일치, 1024 카드 이관 글자 사라짐)을 함께 고쳤다 (spec 14.17 adf8581, 정정 13506f9·5f6417e, plan 306ef37, 정정 d448e17, 49~55단계, 48 문서). 범위 `cb9272b..HEAD`.

### 검사 명령
- `cd frontend && pnpm test && pnpm lint && pnpm exec tsc --noEmit` → 종료 0 (메인 G23 실행, verifier·reviewer 재실행 같은 결과)
```
 Test Files  52 passed (52)
      Tests  649 passed (649)
✖ 41 problems (0 errors, 41 warnings)
```
- `make build` → 종료 0. `node scripts/ui-audit.mjs --self-test` → 종료 0 (`SELF-TEST PASS: … clean.html 검사 21개 통과`). `pnpm exec eslint scripts/ui-audit.mjs` → 종료 0.
- `make check` → 종료 2 (task 55 재측정 인용). 실패는 보정 7 절과 같은 backend 2개뿐(테스트 환경 격리 문제), frontend 단계는 위 명령으로 따로 돌림, 바뀐 `sources.json` 2개 되돌림.
```
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_generate_live_answer
FAILED tests/test_anthropic_provider.py::test_anti_gemini_isolation_in_stream_tokens
================== 2 failed, 158 passed in 105.00s (0:01:45) ===================
make: *** [check] Error 1
```
- HEAD 프로덕션 측정 (`audit/report.json`, 측정 커밋 d47c98e, HEAD 4f7935f. verifier 가 feac5f3 로 다시 재 같은 결과) → `PASS: 조합 160, 통과 160, 실패 0`. 새 검사 feedAreas 10·chatHeader 10·pictograph 50·briefing 10·cardFooter 10·terms 70 모두 실패 0. 뉴스 상세 `AI 질의응답` 탭 10조합 모두 열림·실패 0. 1440 카드 `rss_kr {cards 9, hotnessShown 0}`, `github {8, 8}`, `rss {1, 0}`. 360 소스 줄 `{visibleWidth 276, fullyVisibleChips 2, toggleRight 344 = contentRight 344}`, 390 `{306, 2, 374 = 374}`. 5폭 모두 검색·머리줄·정렬·토글 끝이 콘텐츠 끝과 차이 0, vRhythm 768 미만 12·12·12, 이상 16·16·16.
- 회귀 증명
  - 보정 8: d444621 프로덕션 + 현재 스크립트 → cardMetric `failedStates 10, failures 100`, 이유는 모두 '원천 지표가 없는 소스(rss_kr·rss)에 인기 점수'.
  - 보정 9: adf8581 프로덕션 + 현재 스크립트 → `FAIL: 조합 160, 통과 110, 실패 50, 실패 항목 114`. 실패는 새·바뀐 검사에만(feedAreas 10, toolbarLayout 360·390, vRhythm 대상 없음 10, chatHeader 10, pictograph 20, terms 20, briefing 10, cardFooter 10, R9 `card-chat` missing). 판정 오탐 0, 목록 밖 결함 0. 상세 `AI 질의응답` 탭은 고치기 전 이름이 달라 열리지 않아 '측정 못 함'(plan 결정 2): fixture, 51 실패 테스트, IconGuard 의 `AskAiPanel.tsx` 4글자로 대신 증명.
  - vitest: adf8581 에 HEAD 테스트 11파일을 덮어쓰면 `Tests 46 failed | 92 passed (138)`, HEAD 에서 모두 통과.
- 1ec8a9b 기준선 (`audit/baseline-1ec8a9b/report.json`) → `FAIL: 조합 160, 통과 20, 실패 140, 실패 항목 456`. F1~F4 계속 잡힘. 보정 7 기준선의 F3 상세 Ask AI 자리표시 2조합은 탭 이름 판정이 바뀌어 이번 기준선에서 측정되지 않는다(검색 자리표시는 그대로 잡힘).

### 화면 비교 (메인 세션 직접)
- 보정 8 뒤(d732326) feed 1440·1024·768·390·360, chat 1440·390, detail 1440·390, briefing 1440·390 을 화면 구성 기준(영역 배치·위계·정렬·용어)으로 다시 열어 결함 6건을 찾았다. 사용자 보고 1건과 함께 보정 9 로 넘겼다.
- 보정 9 뒤(c586909) feed 1440·768·390, chat 1440·360, briefing 1440, detail 390 을 다시 열었다. 피드는 모든 폭에서 검색 → 필터(분야 줄, 소스 줄 + 오른쪽 끝 Must-Read) → 목록 머리줄(`총 N건 … 페이지 [정렬]`) 순서이고, 카드 바닥 `AI 챗에서 분석` 글자가 1024 에서도 보인다. 챗 헤더 `← 피드` 가 맨 앞이고 추천 카드·모델 칩은 lucide 아이콘이다. 브리핑 헤드라인 한 번·설정 버튼 하나·분야 긴 라벨, 상세 `AI 질의응답` 탭·`AI 챗에서 분석` 배너.
- 이때 찾은 결함 1건(360 필터 상태에서 상태 글자가 세 줄이 되면 정렬이 머리줄 세로 가운데로 내려감, 정렬 top − 머리줄 top 14)을 50 연장(5de1774 → a7b2d95)으로 고쳤다. 재측정(d47c98e) 360·390·1440 기본·필터 6상태 모두 0, 360 필터 화면을 직접 확인.

### Chrome 확인 (verifier, HEAD 프로덕션, 실제 `/` 키)
| 항목 | 결과 | 출력 인용 |
|---|---|---|
| 1024×768 `/` 단축키 스크롤 | 통과 | `{"active":"INPUT 키워드 검색","inputTop":80,"inputBottom":116,"innerHeight":768,"scrollY":64}` |
| 390×844 `/` 단축키 스크롤 | 통과 | `{"active":"INPUT 키워드 검색","inputTop":80,"inputBottom":124,"scrollY":48}` |
| 1024 sticky 띠 | 통과 | `{"headerBottom":56,"toolbarTop":56,"toolbarHeight":88,"bandBottom":144}` (spec 계산 144) |
| 360 필터 상태 머리줄 | 통과 | `{"scrollWidth":360,"innerWidth":360,"headerHeight":72,"sortMinusHeader":0}` |

### 증명 항목 (verifier 판정, 아무것도 고치지 않음)
| 항목 | 결과 | 근거 |
|---|---|---|
| 보정 8 ① 세 명령·make build·self-test | 통과 | 위 검사 명령 |
| 보정 8 ② 실패 테스트 먼저 | 통과 | 355ff0b→cfa9a5b (46), af6837b→bcec1f5 (45), task 실패 출력 |
| 보정 8 ③ self-test | 통과 | `OK cardMetric rss_kr 카드에 인기 점수 (1440)`, clean 실패 0 |
| 보정 8 ④ HEAD 프로덕션 | 통과 | 160/160, `bySource` 위 값 |
| 보정 8 ⑤ 회귀 증명 | 통과 | d444621 cardMetric 100 |
| 보정 8 ⑦ 기존 단언 | 통과 | `d444621..adf8581` 테스트 삭제 줄 3개 모두 표의 행 |
| 보정 9 ① | 통과 | 52파일 649 (IconGuard·FeedStatusBar 포함) |
| 보정 9 ② 실패 테스트 먼저 | 통과 | ca1ae9f(54), 30d1b19→ad7d2c7(51), 9531e38→fa71f42(52), 04101ab→d3a8696(53), ab2d673→4bb0648(50), 54ee20b→707e1a0(49), 5de1774→a7b2d95(50 연장) |
| 보정 9 ③ self-test fixture 8종 | 통과 | 새 결함 블록 19개 검출, 면제 블록(마크다운 💡, 외부 링크 🚀, `© ↔`, 실패 알림 '설정 열기') 통과 |
| 보정 9 ④ HEAD 프로덕션 | 통과 | 160/160, 상세 `AI 질의응답` 탭 열림 |
| 보정 9 ⑤ 회귀 (ui-audit·vitest) | 통과 | adf8581 실패 114, vitest 46 실패 → HEAD 통과 |
| 보정 8·9 ⑥ 기준선 | 통과 (메모) | 456, F1~F4 계속 잡힘, F3 상세 자리표시 2조합 미측정 |
| 보정 9 ⑦ 기존 단언 | 통과 | adf8581 이후 테스트 삭제 줄은 모두 spec 14.17 표의 행이거나 import 1줄 |
| 보정 9 ⑧ Chrome | 통과 | 위 Chrome 확인 |
| 보정 9 ⑨ 사람 검토 | **미완료 (사람 몫)** | 메인 세션과 verifier 가 스크린샷을 봤지만 plan 은 사람 확인을 요구한다 |
| R32·정적 확인 | 통과 | 계약 경로 diff 0줄, R42~R47 정적 확인 출력 없음, components·app 그림 이모지 0 |

verifier 종합: 조건부 통과 (실패 없음, ⑨ 사람 검토 미완료).
reviewer (`cb9272b..feac5f3`): Important 0, Nit 3. 피드 세 영역의 포커스 유지·live 영역 순서, R41 기준, 이관 버튼 접근 이름, `TIER_META` 사용처, 브리핑 분야 라벨 찾기, 새 ui-audit 검사의 fixture 짝을 확인해 문제없음. Nit 처리:
- 3(`pictograph`·`terms` 가 보는 요소 범위가 좁음) → 지금 놓치는 결함 없음, test-strategy 에 범위 한계와 IconGuard 의 소스 수준 보완 명시(7c29797).
- 1(`DailyBriefingModal` 이 `FeedToolbar` 모듈에서 `FEED_CATEGORIES` 를 가져옴) → 지금 결함이 아니고 공용 모듈로 옮기려면 plan 범위 밖 새 파일이 필요해 바꾸지 않는다.
- 2(IconGuard 범위가 `components`·`app` 뿐) → spec R44 의 범위 정의와 같고 `lib`·`hooks`·`context` 도 지금 0건이라 바꾸지 않는다.

### 편차
- H. 50 연장이 `FeedStatusBar.test.tsx` 의 머리줄 단언 `items-center` 를 `items-start` 로 바꿨다. 이 단언은 50 이 같은 보정에서 더한 것(ab2d673)이라 adf8581 기준 기존 단언이 아니다. spec 14.17 의 클래스 명세와 문장('정렬은 첫 줄 오른쪽')이 어긋나 있던 것을 문장 쪽으로 정하고, spec(5f6417e)·plan(d448e17)을 정정해 재승인했다.
- I. 48 후속 줄 참조 정정(aba5a6d)이 plan 문서 목록 밖 `03-collection.md`·`05-sources-and-research.md`·`06-mcp-server.md` 를 고쳤다(낡은 줄 참조, Updated, 03 의 지금 화면에 없는 문구 인용 삭제). plan 정정(d448e17)으로 목록에 넣었다.
- J. 49 가 spec 과 다르게 정한 것 두 가지: briefing ③ 고정 머리글에 `오늘의 추천 Action Items` 를 더함(그대로 두면 고친 뒤에도 실패), 브리핑 설정 상태를 여는 버튼 이름을 `/^연동 설정( 관리)?$/` 로 넓힘(53 이 글자를 줄여서). 둘 다 판정 의도를 유지한다.

### 남은 위험
- `make check` 전체가 종료 0 이 되지 않는다 (backend 테스트 2개, 테스트 환경 격리 문제, backend 범위).
- Shift+세로 휠 실제 입력의 '민 위치 유지' 는 미검증이다 (보정 7 절과 같음).
- 사람 확인 필요: 스크린샷 검토(⑨), 챗의 `전체 소식` 두 뜻 혼동 여부 (보정 7 절과 같음).
- 브리핑 헤드라인·분야 요약이 글자 수로 잘려 단어 중간에서 끊기고(`persistent p...`), backend 분야 이름·이모지가 마크다운 전문·Notion·이메일에 남고, 챗 단계 라벨에 이모지가 있다. 모두 backend 문자열이라 이 기능 범위 밖이다 (known-issues 3행, 별도 작업 필요).
- 지표 소스(GitHub 등) 카드에서도 인기 점수가 포화하면 `🔥100` 으로 같게 보인다 (backend hotness, known-issues).
- 360 필터 상태에서 상태 글자가 세 줄이면 첫 줄 글자 중심이 정렬 중심보다 12.5px 위다 (정렬은 첫 줄 위쪽에 맞춤, 측정값).
