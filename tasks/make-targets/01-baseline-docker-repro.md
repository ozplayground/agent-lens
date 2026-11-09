# Task 01: 기준선과 Docker 재현, 고치기 전

Feature: make-targets · Plan: docs/features/make-targets/plan.md 작업 순서 1
Status: done
Session: main (implementer A)
Agent: adfde990234fc7e63
Updated: 2026-11-08

## 한 일
- (a) 기준선 측정: 포트·컨테이너·이미지·볼륨·sha256·git status.
- (b) 지금 레시피 그대로 `make docker-build` 를 돌리고 이미지가 남는지 확인했다.
- (c) 단일 파일 bind mount 위 `os.replace` 의 EBUSY 를 고치기 전 이미지로 재현했다.
- (d) 고치기 전 이미지로 앱 경로를 재현했다 (scratchpad 의 DB 사본·config·sources 사본만 마운트, LLM 키 없음). 재현용 컨테이너 `agentlens-repro` 는 지웠다. 이미지 `agentlens-backend`, `agentlens-frontend` 는 남겼다.
- 임시 파일: `/private/tmp/claude-501/-Users-wonyoung-workspace-ozplayground-agentlens/d9f16211-c83a-42a0-ad74-fe86247a152d/scratchpad/` 아래 `docker-build.log`, `m/`, `repro/`.
## 바꾼 파일
- 없음 (이 task 기록만).
## 검사 결과
### (a) 기준선 (HEAD `85d8821`, 브랜치 `refactoring`, docker context `desktop-linux`)
- `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 8000·3000·3001·13000·18000: 모두 출력 없음, 종료 코드 1 (LISTEN 없음).
- `docker ps -a --filter name=agentlens`: 헤더만 (컨테이너 없음), 종료 0.
- `docker image ls`: `agentlens-*` 이미지 없음 (다른 프로젝트 이미지 `pipe-on-*`, `pgvector`, `caddy` 등만).
- `docker volume ls`: `agentlens-data` 있음 (그 밖은 `pipe-on-*`).
- `shasum -a 256` (단계 6·verify 비교 기준):
```
aef3302618b8b5cd826a8f70bdd7f4ecd162b4310f382a9e07233447aac4607f  agentlens.db
77e180b6dced3ba4c852c24a67d8161c8fc015b21d756ced46acc6a0c2e8f1ae  backend/agentlens.db
f603da9667342b2a4503cabca428a186937aeac8072612510e5effd05979a8b2  config.json
3771f308020739f0e7bac067c675d788708eb821a06a70b770e3dccbff3e52f9  sources.json
3771f308020739f0e7bac067c675d788708eb821a06a70b770e3dccbff3e52f9  backend/app/config/sources.json
2333ed2306983521609b4212891be26184546366197a78fe1d4977acf715f7ef  .env
```
- `git status --porcelain` (기준선):
```
?? frontend/AGENTS.md
?? frontend/CLAUDE.md
?? reports/
?? tasks/make-targets/
```
(plan 기준선 대비 `?? tasks/make-targets/` 가 더 있는데, 이 기능의 task 기록이다.)

### (b) `make docker-build` 뒤 이미지
- `make docker-build` → 종료 0. 로그 끝: `Image agentlens-backend Built`, `Image agentlens-frontend Built` (전체 136줄, scratchpad `docker-build.log`).
- `docker image inspect agentlens-backend agentlens-frontend --format '{{.Id}} {{.Created}}'` → 종료 0:
```
sha256:cae089fdd3ccaff8a13562e09e981bb7f62f7519bd762d68efdb86796347c9cc 2026-11-08T13:49:51.977616298Z
sha256:d0eb40bd8a938908d1851675b5e547eb540ee2e93c6bafb361b76e26763b0844 2026-11-08T13:49:54.181004633Z
```
- 두 이미지가 남는다. intent 의 '이미지 없음' 은 그 사이 다른 정리 때문으로 본다 (기록만, blocked 아님).

### (c) bind mount 위 rename
- plan 의 `docker run --rm -v "$SCRATCH/m/s.json:/x/s.json" agentlens-backend python -c "...os.replace('/x/s.tmp','/x/s.json')..."` → 종료 1, 마지막 줄:
  `OSError: [Errno 16] Device or resource busy: '/x/s.tmp' -> '/x/s.json'`
- 호스트 `s.json` 내용은 `{}` 그대로.

### (d) 앱 경로 (컨테이너 `agentlens-repro`, 포트 18001)
- `sqlite3 backend/agentlens.db ".backup …/repro/data/repro.db"` 종료 0, `docker run -d …` 종료 0. `/health` 는 첫 시도에 `{"status":"healthy","version":"0.3.1","running":false}` (기사 있는 사본이라 첫 수집 없음).
- 설정 저장: `GET /api/briefing/settings` 종료 0 → 같은 내용으로 `POST` → **500**. 로그:
  `[Config] Error saving config.json: [Errno 30] Read-only file system: '/app/config.json'`
  (원인은 EBUSY 가 아니라 `:ro` 마운트의 EROFS. `save_json_config` 는 `open(p, "w")` 제자리 쓰기라 rename 을 하지 않는다 — `backend/app/config.py:161-173`. 그래서 `:ro` 만 빼면 config 쪽은 bind mount 에서도 저장된다.)
- 소스 저장:
  - 토글 전 sha256 `3771f308…52f9`
  - `PATCH /api/sources/rss/geeknews/toggle` → `{"status":"success","message":"소스 상태가 변경되었습니다 (rss / geeknews)"} 200`
  - 토글 뒤 sha256 `3771f308…52f9` (같음, 파일 안 바뀜)
  - `docker logs agentlens-repro 2>&1 | grep -n 'Failed to write sources'` → `11:Failed to write sources to /app/sources.json: [Errno 16] Device or resource busy: '/app/sources.tmp' -> '/app/sources.json'`
  - `docker exec agentlens-repro ls -la /app/sources.tmp` → `-rw-r--r-- 1 root root 9348 Nov  8 14:42 /app/sources.tmp` (남음)
  - plan '찾은 사실' 대로 저장 실패에도 응답은 200 이다.
- 정리: `docker rm -f agentlens-repro` 종료 0, `docker ps -a --filter name=agentlens` 비어 있음, 18001 LISTEN 없음.

### 끝 확인
- `git status --porcelain` → 위 기준선과 같음 (`?? frontend/AGENTS.md`, `?? frontend/CLAUDE.md`, `?? reports/`, `?? tasks/make-targets/`).
- `shasum -a 256` 6개 파일 → 기준선과 모두 같음 (실데이터 DB·config·sources·.env 변경 없음).
## 결정
- **판정: EBUSY 가 (c)·(d) 둘 다에서 재현됐다 → 단계 5 의 소스 저장 변경((b) `test_sources_write_fallback.py`, (d) `sources_service.save_sources` 대체 경로)을 진행한다.**
- (b) 이미지가 남으므로 blocked 아님. plan 고침 필요 없음.
- 참고 (범위 변경 아님): 설정 저장 500 은 `:ro` 의 EROFS 때문이고, `save_json_config` 가 제자리 쓰기라 단계 2 의 `config.json:ro` 제거만으로 풀릴 것으로 본다. 단계 6 에서 확인한다.
## 막힌 점
- 없음.
## 다음
- 단계 2~5 를 시작할 수 있다 (단계 5 는 소스 저장 변경 포함). 단계 6·verify 는 위 (a) sha256 값을 비교 기준으로 쓴다.
- 이 task 기록은 메인 세션이 커밋한다.
