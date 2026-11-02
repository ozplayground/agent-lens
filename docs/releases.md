# 릴리스 이력: AgentLens

새 릴리스를 맨 위에 추가한다. `/prepare-release` 가 초안을 쓰고, 릴리스 관리자가 기능별 release.md 를 승인해 확정한다.

프로덕션 배포는 없다. 릴리스는 버전 bump, 주석 태그 `v<버전>`, 이 문서 기록이다. 원격 태그 push 는 `RELEASE_APPROVAL` 이 있는 세션에서만 실행된다.

<!-- 항목 형식
## <버전> (<날짜>)
- 포함 기능: `<기능 id>` → docs/features/<기능 id>/release.md
- 통합·회귀 검증: <명령> → <결과>
- 태그: `git tag -a v<버전> -m "Release v<버전>: ..."` · push: `git push origin v<버전>` · 되돌리기: `git tag -d v<버전>` (원격은 `git push origin :refs/tags/v<버전>`)
-->

## 버전 문자열 위치
버전을 올릴 때 모두 같은 값으로 바꾼다 (2026-11-02 `git grep -n '0\.3\.1'` 로 확인, lockfile 제외).

| 파일 | 위치 |
|---|---|
| `frontend/package.json` | `"version"` |
| `frontend/src/app/api/health/route.ts` | 응답의 `version` |
| `config.json` | `app.version` |
| `.env.example` | `VERSION` |
| `backend/.env.example` | `VERSION` |
| `docker-compose.yml` | backend `VERSION=${VERSION:-...}` 기본값 |
| `backend/app/config.py` | `Settings.VERSION` 기본값 |
| `backend/tests/test_config_and_live_llm.py` | 허용 버전 목록 |
| `backend/tests/test_dynamic_rag_retrieval.py` | 버전 동기화 assert |
| `backend/tests/test_scoped_chat_grounding.py` | 버전 동기화 assert |

## 이력
하네스 도입 전 릴리스. 태그와 그 커밋 메시지만 남아 있다 (CHANGELOG 없음, 기능별 release.md 없음).

| 버전 | 태그 날짜 | 커밋 | 태그 메시지 |
|---|---|---|---|
| v0.3.1 | 2026-10-19 | `017b076` | True Async LLM ReAct, Post-Stream Cited Sources Only & Output Token Completion Fix |
| v0.3.0 | 2026-10-19 | `20eec54` | ReAct Agentic Chat & Fixed Single-Article Scoped Mode |
| v0.2.2 | 2026-10-19 | `b46b6e7` | Dynamic RAG Question-Tailored Retrieval & Restored Gemini Provider |
| v0.2.1 | 2026-10-19 | `d86c541` | Release v0.2.1 |
| v0.2.0 | 2026-10-19 | `1046945` | Release v0.2.0 |
| v0.1.0 | 2026-09-16 | `18f46fc` | AgentLens Initial Release |
