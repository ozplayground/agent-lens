# AgentLens

AI 에이전트·하네스·MCP 기술 소식을 모아 요약하고, AI 챗 질의응답·일일 브리핑·외부 채널 공유·MCP 서버를 제공한다. `backend/`(FastAPI, Python 3.11)와 `frontend/`(Next.js 16, pnpm) 두 앱이고, 인터페이스는 REST `/api/*`(SSE 포함)다.

## 명령
- 검사: `make check` (실패 시 0 이 아닌 값으로 끝난다. 작업 완료 보고에 출력을 붙인다). backend pytest + frontend vitest·eslint·`tsc --noEmit`
- 환경 준비: `make setup` · 프론트 빌드: `make build` · 로컬 실행: `make docker-up` / `make docker-down` / `make docker-logs`
- `make test`, `make dev` 는 지워진 `scripts/` 를 가리켜 지금 동작하지 않는다. 검사는 `make check` 를 쓴다.
- `make check` 는 `.env` 의 LLM 키로 외부 호출을 할 수 있다 (라이브 테스트 격리는 미정, `docs/test-strategy.md`).

## SDLC
작업은 기능 단위로 스테이지를 따른다. 각 스테이지는 산출물을 커밋하고, 다음 스테이지는 그것을 읽고 시작한다.

| 스테이지 | 기능별 산출물 (`docs/features/<기능-id>/`) | 통합 문서 (`docs/`) | 승인 | 스킬 |
|---|---|---|---|---|
| (선택) Research | research.md | research/product.md, research/tech.md | — | `/research-product`, `/research-tech` |
| Plan | intent.md | product.md | 제품 오너 (본인) | `/write-intent` |
| Design | spec.md | tech-spec.md | 제품 오너 (본인) | `/write-spec` |
| Build | plan.md → 코드 | (tech-spec.md 반영) | 엔지니어 (본인) | `/write-plan`, `/implement-plan` |
| Test | verify.md | test-strategy.md | 코드 오너 (본인) | `/verify-change` |
| Deploy | release.md (PR 리뷰는 REVIEW.md) | releases.md | 코드 오너, 태그 push 는 릴리스 관리자 (모두 본인) | `/review-change`, `/prepare-release` |
| Maintain | 새 intent.md | — | 서비스 오너 (본인) | `/triage-signal` |

- 현재 상태: `/sdlc-status`
- 문서 경로는 모두 저장소 루트 기준이다. 하위 폴더에서 시작한 세션도 루트의 `docs/`, `tasks/` 에 쓴다.
- 통합 문서는 지금 제품·시스템의 모습이고, 기능별 산출물은 그 작업이 바꾸는 것이다. product.md 는 intent 승인 뒤 `/write-spec` 이, tech-spec.md 는 구현 마지막 단계에서 `/implement-plan` 이 고친다.
- Research 는 선택 스테이지다. 사용자가 지시하거나, 열린 질문이 외부 사실(시장, 경쟁 제품, 기술 성능)로만 답할 수 있을 때 실행한다. 출처 없는 주장과 측정하지 않은 숫자는 쓰지 않는다. 측정 코드는 `bench/<주제>/` 에 둔다 (런타임: python3 `.venv`, node pnpm). 더 깊은 조사는 `/deep-research <질문>` (사용자가 실행)
- 산출물의 `Status:` 를 승인 상태로 바꾸는 것은 승인자만 한다: `! python3 "$(git rev-parse --show-toplevel)/.claude/hooks/sdlc_hook.py" approve <파일>`
- 승인된 plan.md 의 '변경 파일' 에 없는 `backend/app/**`, `frontend/src/**` 경로는 편집이 막힌다 (`frontend/src/tests/**`, `backend/app/config/sources.json` 포함). 범위를 바꾸려면 plan.md 를 고치고 재승인받는다.
- 테스트를 고쳐 통과시키지 않는다. 코드를 고친다.
- Deploy 는 프로덕션 배포가 없다: release.md 승인, 버전 bump, 버전 태그, releases.md 기록만 한다. 원격 태그 push(`git push --tags`, `git push … v<숫자>`)와 파괴적 명령(`make reset`, `make reset-and-collect`, `curl … reset-and-collect`)은 `RELEASE_APPROVAL` 이 있는 세션에서만 실행된다.
- 계약(`backend/app/schemas/` ↔ `frontend/src/types/` ↔ `frontend/src/mocks/`)은 손으로 맞춘다. 고칠 때 `.claude/rules/contracts.md` 를 따른다.

## 진행 기록과 이어서 하기
- plan 의 작업 순서 단계마다 `tasks/<기능-id>/NN-<slug>.md` 에 상태(todo, doing, done, blocked), 한 일, 바꾼 파일, 결정, 막힌 점, 다음을 남긴다. `/implement-plan` 이 만들고 고친다.
- 서브에이전트에 단계를 맡기면 받은 agent ID 를 task 파일 `Agent:` 에 적는다. 서브에이전트가 멈추면 새로 띄우지 않고 그 ID 로 SendMessage 를 보내 이어서 시킨다.
- Claude Code 를 다시 시작했으면 `claude --resume <세션 이름>` 으로 같은 세션을 연 뒤 이어서 시킨다.

## 세션
| 세션 | 시작 명령 | 담당 범위 |
|---|---|---|
| main | `claude -n main` (저장소 루트) | 저장소 전체 (`**`) |

- 단일 세션이다. 반복 역할은 서브에이전트로 부른다: researcher, benchmarker, spec-writer, planner, implementer, verifier, reviewer, triager.
- 같은 파일을 동시에 고치는 세션을 만들지 않는다.
