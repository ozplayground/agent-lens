# 릴리스 이력: AgentLens

프로덕션 배포는 없다. 릴리스는 버전 올리기와 주석 태그 `v<버전>` 이다.

## 버전 문자열 위치
버전을 올릴 때 모두 같은 값으로 바꾼다 (2026-11-09 `git grep -n '0\.3\.1'` 로 확인, lockfile 제외).

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
최신 릴리스가 맨 위다. v0.1.0~v0.3.1 은 CHANGELOG 가 없고, 요약은 태그 메시지다.

| 버전 | 날짜 | 커밋 | 포함 기능 | 요약 |
|---|---|---|---|---|
| v0.4.1 | 2026-11-10 | 태그 `v0.4.1` | harness, docs, code-review-fixes | 하네스를 v0.3.1 풀스택 팀 기반 Claude Code 하네스로 교체, 모든 문서를 하네스 산출물로 재작성, 리뷰 필수 결함 수정(챗 턴 이중 저장, 티어 전달, 끊긴 스트림 처리, 검색 페이지, 저장소 경로 404, 스트림 검증 400 등) |
| v0.4.0 | 2026-11-09 | `94fdf8e` | ui-redesign, backend-llm-test-isolation, make-targets | 디자인시스템·반응형 UI 재설계, 환경과 무관한 make check(LLM 테스트 격리), make 대상 12개 정상화 |
| v0.3.1 | 2026-10-19 | `017b076` | — | True Async LLM ReAct, Post-Stream Cited Sources Only & Output Token Completion Fix |
| v0.3.0 | 2026-10-19 | `20eec54` | — | ReAct Agentic Chat & Fixed Single-Article Scoped Mode |
| v0.2.2 | 2026-10-19 | `b46b6e7` | — | Dynamic RAG Question-Tailored Retrieval & Restored Gemini Provider |
| v0.2.1 | 2026-10-19 | `d86c541` | — | Release v0.2.1 |
| v0.2.0 | 2026-10-19 | `1046945` | — | Release v0.2.0 |
| v0.1.0 | 2026-09-16 | `18f46fc` | — | AgentLens Initial Release |
