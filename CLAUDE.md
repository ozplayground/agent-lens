# AgentLens

AI 에이전트·하네스·MCP 기술 소식을 모아 요약하고, AI 챗 질의응답·일일 브리핑·외부 채널 공유·MCP 서버를 제공한다. `backend/`(FastAPI, Python 3.11)와 `frontend/`(Next.js 16, pnpm) 두 앱이고, 인터페이스는 REST `/api/*`(SSE 포함)다.

## 명령
- 검사: `make check` (실패 시 0 이 아닌 값으로 끝난다. 작업 완료 보고에 출력을 붙인다). backend pytest + frontend vitest·eslint·`tsc --noEmit`
- `make test` 는 `make check` 와 같다.
- 환경 준비: `make setup` (다시 돌려도 된다. `.venv` 가 Python 3.11 이면 건너뛴다) · 프론트 빌드: `make build` · 정리: `make clean` (설치물·빌드 산출물·캐시만 지우고 DB·설정은 남긴다)
- 로컬 실행: `make dev` (backend :8000 `--reload` + frontend :3000 을 함께 띄운다. Ctrl-C 로 둘 다 내린다. 포트가 쓰이고 있으면 띄우지 않고 실패한다)
- Docker 실행: `make docker-up` (healthy 까지 기다린다) / `make docker-down` / `make docker-logs` (따라가기, Ctrl-C 로 끝낸다) · 이미지: `make docker-build`
- 수집: `make collect` (backend 가 떠 있으면 그 backend 에 수집시키고, 없으면 `backend/agentlens.db` 에 직접 수집한다. 외부 소스·LLM 을 실제로 호출한다)
- `make check` 의 pytest 는 LLM 호출을 흉내 내고 `config.json`·`sources.json` 은 임시 사본에 쓴다. 스크래퍼·Notion·SMTP 호출은 실제로 나간다 (`docs/test-strategy.md`). 돌린 뒤 `git status` 로 추적 파일이 바뀌지 않았는지 확인한다.

## SDLC
작업은 기능 단위로 스테이지를 따른다. 각 스테이지는 산출물을 커밋하고, 다음 스테이지는 그것을 읽고 시작한다.

| 스테이지 | 기능별 산출물 (`docs/features/<기능-id>/`) | 승인 | 스킬 |
|---|---|---|---|
| (선택) Research | research.md | — | `/research-product`, `/research-tech` |
| Plan | intent.md | 제품 오너 (본인) | `/write-intent` |
| Design | spec.md | 제품 오너 (본인) | `/write-spec` |
| Build | plan.md → 코드 | 엔지니어 (본인) | `/write-plan`, `/implement-plan` |
| Test | verify.md | 코드 오너 (본인) | `/verify-change` |
| Deploy | release.md (PR 리뷰는 REVIEW.md) | 코드 오너, 태그 push 는 릴리스 관리자 (모두 본인) | `/review-change`, `/prepare-release` |
| Maintain | 새 intent.md | 서비스 오너 (본인) | `/triage-signal` |

- 현재 상태: `/sdlc-status`
- 문서 경로는 모두 저장소 루트 기준이다. 하위 폴더에서 시작한 세션도 루트의 `docs/`, `tasks/` 에 쓴다.
- Research 는 선택 스테이지다. 사용자가 지시하거나, 열린 질문이 외부 사실(시장, 경쟁 제품, 기술 성능)로만 답할 수 있을 때 실행한다. 출처 없는 주장과 측정하지 않은 숫자는 쓰지 않는다. 측정 코드는 `bench/<주제>/` 에 둔다 (런타임: python3 `.venv`, node pnpm). 더 깊은 조사는 `/deep-research <질문>` (사용자가 실행)
- 산출물의 `Status:` 를 승인 상태로 바꾸는 것은 승인자만 한다: `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve <파일>`
- 자동 승인: `.claude/hooks/sdlc-config.local.json` 에 `{"auto_approve": true}` (git 에 올리지 않음) 나 환경 변수 `SDLC_AUTO_APPROVE=1` 이 있으면 켜진다 (`SDLC_AUTO_APPROVE=0` 이 우선해서 끈다). 켜져 있으면 세션 시작 메시지에 표시되고, 스킬이 '승인 명령을 알린다' 고 한 자리에서 Claude 가 산출물을 템플릿·이전 산출물과 대조해 자체 검토한 뒤 `python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve --auto <파일>` 로 승인하고 다음 스테이지로 넘어간다. 승인자는 `자동 승인 (Claude)` 로 남는다. Status 를 직접 고치는 것은 자동 승인이 켜져 있어도 막힌다. 원격 태그 push 와 수집 데이터 삭제 게이트는 자동 승인과 상관없이 그대로다.
- 승인된 plan.md 의 '변경 파일' 에 없는 `backend/app/**`, `frontend/src/**` 경로는 편집이 막힌다 (`frontend/src/tests/**`, `backend/app/config/sources.json` 포함). 범위를 바꾸려면 plan.md 를 고치고 재승인받는다.
- 테스트를 고쳐 통과시키지 않는다. 코드를 고친다.
- Deploy 는 프로덕션 배포가 없다: release.md 승인, 버전 bump, 버전 태그, releases.md 기록만 한다. 원격 태그 push(`git push --tags`, `git push … v<숫자>`)와 수집 데이터 삭제(`make reset`, `curl … reset-and-collect`)는 Claude 가 스스로 판단해 실행하면 hook 이 막는다. 사용자가 이번 메시지(작업 중 보낸 메시지 포함)에서 지시하면 원본·사본 가리지 않고 통과한다. 지시로 보는 낱말은 `.claude/hooks/sdlc-config.json` 의 `user_override_keywords` 다 (태그: '태그'·'tag', 삭제: 'reset'·'초기화'·'데이터 삭제' 등). `RELEASE_APPROVAL` 세션도 통과한다. `make -n` 은 실행하지 않으므로 막지 않는다.
- 계약(`backend/app/schemas/` ↔ `frontend/src/types/` ↔ `frontend/src/mocks/`)은 손으로 맞춘다. 고칠 때 `.claude/rules/contracts.md` 를 따른다.

## 문서 지도
통합 문서(`docs/*.md`)는 지금 제품·시스템의 모습만 적는다. 기능별 산출물은 그 작업이 바꾸는 것을 적는다. 문서를 만들고 고치는 규칙은 이 표와 각 스킬에 있고, 통합 문서 안에는 적지 않는다.

| 문서 | 만드는 것 | 고치는 것 | 읽는 것 |
|---|---|---|---|
| `docs/features/<id>/intent.md` | `/write-intent`, `/triage-signal` | 같은 스킬 | `/write-spec`, `/write-plan`, `/research-product` |
| `docs/features/<id>/research.md` | `/research-product`, `/research-tech` | 같은 스킬 | `/write-spec` |
| `docs/features/<id>/spec.md` | `/write-spec` | 같은 스킬 | `/write-plan`, `/review-change` |
| `docs/features/<id>/plan.md` | `/write-plan` | 범위가 바뀌면 고치고 재승인 | `/implement-plan`, `/verify-change`, `/review-change` |
| `tasks/<id>/NN-<slug>.md` | `/implement-plan` | 같은 스킬 | `/sdlc-status` |
| `docs/features/<id>/verify.md` | `/verify-change` | 같은 스킬 | `/prepare-release` |
| `docs/features/<id>/release.md` | `/prepare-release` | 같은 스킬 | — |
| `docs/product.md` | 하네스 생성 | `/write-spec` (범위, 사용자, 원칙, 기능 목록), `/research-product` (근거) | `/write-intent`, `/research-product` |
| `docs/tech-spec.md` | 하네스 생성 | `/implement-plan` (구현 반영, 기술 선택과 근거, 변경 이력), `/research-tech` (기술 선택과 근거) | `/write-spec`, `/write-plan`, `/research-tech`, `/prepare-release` |
| `docs/test-strategy.md` | 하네스 생성 | `/implement-plan` (검사 명령이나 테스트 종류가 바뀔 때) | `/write-plan`, `/verify-change`, `/prepare-release` |
| `docs/releases.md` | 하네스 생성 | `/prepare-release` (버전 문자열 위치, 이력) | `/prepare-release` |
| `docs/research/product.md` | `/research-product` (제품 전체 조사) | 같은 스킬 (번호를 이어 추가) | `/research-product` |
| `docs/research/tech.md` | `/research-tech` (시스템 전체 조사) | 같은 스킬 (번호를 이어 추가) | `/write-spec`, `/research-tech` |
| `docs/functional-spec/*.md` | 코드 역분석 (2026-11-06) | `/implement-plan` (기능 동작이 바뀐 영역 문서, 새 영역이면 파일과 색인 행 추가) | `/write-intent`, `/write-spec`, `/write-plan`, `/verify-change` |
| `docs/ui-spec.md` | 코드 역분석 | `/implement-plan` (화면·모달·상태·localStorage 가 바뀔 때) | `/write-spec`, `/write-plan` |
| `docs/api.md` | 코드 역분석 | `/implement-plan` (엔드포인트·스키마·SSE 가 바뀔 때) | `/write-spec`, `/write-plan`, `/review-change` |
| `docs/data-model.md` | 코드 역분석 | `/implement-plan` (테이블·열·설정 파일 구조가 바뀔 때) | `/write-spec`, `/write-plan` |
| `docs/operations.md` | 코드 역분석 | `/implement-plan` (실행·설정·스케줄·외부 의존이 바뀔 때) | `/write-plan`, `/prepare-release`, `/triage-signal` |
| `docs/test-cases.md` | 코드 역분석 | `/implement-plan` (테스트를 추가·삭제할 때) | `/write-plan`, `/verify-change` |
| `docs/known-issues.md` | 코드 역분석 | `/implement-plan` (고친 문제 행 삭제), `/triage-signal` (새 문제 행 추가) | `/write-intent`, `/triage-signal` |

## 진행 기록과 이어서 하기
- plan 의 작업 순서 단계마다 `tasks/<기능-id>/NN-<slug>.md` 에 상태(todo, doing, done, blocked), 한 일, 바꾼 파일, 결정, 막힌 점, 다음을 남긴다. `/implement-plan` 이 만들고 고친다. `tasks/` 는 로컬 전용이다 (`.gitignore`, git 에 올리지 않는다).
- 서브에이전트에 단계를 맡기면 받은 agent ID 를 task 파일 `Agent:` 에 적는다. 서브에이전트가 멈추면 새로 띄우지 않고 그 ID 로 SendMessage 를 보내 이어서 시킨다.
- Claude Code 를 다시 시작했으면 `claude --resume <세션 이름>` 으로 같은 세션을 연 뒤 이어서 시킨다.

## 세션
| 세션 | 시작 명령 | 담당 범위 |
|---|---|---|
| main | `claude -n main` (저장소 루트) | 저장소 전체 (`**`) |

- 단일 세션이다. 반복 역할은 서브에이전트로 부른다: researcher, benchmarker, spec-writer, planner, implementer, verifier, reviewer, triager.
- 역할 게이트 (hook 이 강제): `docs/features/*/spec.md` 는 spec-writer, `docs/features/*/plan.md` 는 planner, `backend/app/**`·`frontend/src/**` 는 implementer, `bench/**` 는 benchmarker 서브에이전트만 쓴다. 메인 세션이 Write/Edit 나 Bash(리다이렉트, `sed -i`, `cp`/`mv`/`rm`, 스크립트로 파일 쓰기, 패치 적용)로 고치려 하면 막힌다. 메인 세션은 intent·verify·release 산출물, 통합·상세 문서, tasks 기록, 서브에이전트 조율을 맡는다. 매핑은 `.claude/hooks/sdlc-config.json` 의 `role_owners`. 사람이 끄려면 세션을 `SDLC_ROLE_GATE=0` 으로 띄운다.
- 같은 파일을 동시에 고치는 세션을 만들지 않는다.
