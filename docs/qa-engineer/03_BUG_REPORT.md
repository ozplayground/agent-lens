# AgentLens QA 결함 보고 및 조치 이력서 (Bug Report & Fix Log)

- **작성일자**: 2026-09-16
- **담당자**: 리드 QA 엔지니어 (`qa-engineer`)
- **문서 버전**: v2.0
- **상태**: RESOLVED (모든 결함 조치 완료 및 회귀 검증 통과)

---

## 1. 결함 목록 요약 (Defects Summary)

| 결함 ID | 결함 구분 | 심각도 | 상태 | 결함 요약 |
| :--- | :--- | :---: | :---: | :--- |
| `BUG-001` | 프론트엔드 이벤트 전파 | **HIGH** | **RESOLVED** | `NewsCard` 북마크 버튼 클릭 시 `stopPropagation` 누락으로 상세 모달 동시 오픈 위험 |
| `BUG-002` | 브라우저 호환성 | **MEDIUM** | **RESOLVED** | `AskAiPanel` 내 `chatEndRef.current?.scrollIntoView` 비표준 환경 TypeError 발생 위험 |
| `BUG-003` | 타입 정합성 | **HIGH** | **RESOLVED** | `lib/api.ts`의 `addRssSource` 반환 DTO에 `message` 속성 누락으로 TS2339 빌드 에러 |
| `BUG-004` | 백엔드 DB 연결 | **CRITICAL** | **RESOLVED** | `app/database.py`에서 `event.listen` 데코레이터 오용으로 conftest 로딩 실패 |
| `BUG-005` | 아키텍처 결함 | **HIGH** | **RESOLVED** | `page.tsx`, `NewsDetailModal`, `SourcesModal` 과대 단일 컴포넌트 스파게티 구조 |

---

## 2. 결함별 상세 내역 및 조치 결과

### [BUG-001] `NewsCard` 북마크 클릭 이벤트 전파 누락
- **현상**: `NewsCard`의 북마크 버튼이 자체적으로 이벤트 버블링을 차단하지 않아, 카드 클릭 이벤트(`handleOpenDetail`)가 함께 트리거될 수 있음.
- **원인**: `onToggleBookmark(item, e)` 호출 시 컴포넌트 레벨에서 `e.stopPropagation()`을 선제 호출하지 않고 부모에게 위임함.
- **조치 내용**: [NewsCard.tsx](file:///Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/components/NewsCard.tsx) 내부 onClick 핸들러에서 `e.stopPropagation()`을 직접 호출하도록 방어 코드 추가.
- **검증**: [NewsCard.test.tsx](file:///Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/NewsCard.test.tsx) 단위 테스트 및 라이브 브라우저 인터랙션 통과.

### [BUG-002] `AskAiPanel` scrollIntoView 옵셔널 체이닝 누락
- **현상**: jsdom 및 구형 브라우저 환경에서 `scrollIntoView`가 미정의되어 있을 경우 컴포넌트 마운트/업데이트 시 크래시 발생.
- **조치 내용**: [AskAiPanel.tsx](file:///Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/components/news-detail/AskAiPanel.tsx)에서 `chatEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });` 옵셔널 체이닝 호출 적용 및 `setup.ts` mock 등록.
- **검증**: [AskAiPanel.test.tsx](file:///Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/tests/AskAiPanel.test.tsx) 3개 테스트 전수 통과.

### [BUG-003] `addRssSource` API 클라이언트 반환 타입 불일치
- **현상**: 백엔드 `/api/sources/rss` 엔드포인트는 `{"status": "success", "message": "...", "source": {...}}`를 반환하나, 프론트엔드 타입 시그니처에 `message?: string`이 누락되어 TS 빌드 에러 발생.
- **조치 내용**: [api.ts](file:///Users/wonyoung/workspace/ozplayground/agentlens/frontend/src/lib/api.ts)의 `addRssSource` 반환 인터페이스를 `Promise<{ status: string; message?: string; source: SourceItem }>`로 갱신.
- **검증**: `pnpm build` (Next.js Turbopack) 타입 검사 완료.

### [BUG-004] `app/database.py` SQLAlchemy 이벤트 리스너 오용
- **현상**: `@event.listen`을 데코레이터로 사용하여 `TypeError: listen() missing 1 required positional argument` 발생.
- **조치 내용**: `@event.listens_for(engine.sync_engine, "connect")`로 교체하고, `PRAGMA journal_mode=WAL;`, `PRAGMA synchronous=NORMAL;`, `PRAGMA cache_size=-64000;`, `PRAGMA busy_timeout=30000;`를 자동 주입하도록 최적화.
- **검증**: pytest 49개 테스트 전수 통과.

### [BUG-005] 거대 단일 컴포넌트 모듈화 분할
- **조치 내용**:
  1. `frontend/src/hooks/useNewsFeed.ts`, `useBookmarks.ts` 커스텀 훅으로 비즈니스 로직 완전 분리.
  2. `frontend/src/components/news-detail/AskAiPanel.tsx` 독립 분리.
  3. `frontend/src/components/sources/DeepResearcherTab.tsx`, `SourcesListTab.tsx` 독립 분리.
