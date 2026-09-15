# AgentLens 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: 2026-09-15
- **담당자**: 리드 QA 엔지니어 (`qa-engineer`)
- **문서 버전**: v2.0
- **상태**: Approved

---

## 1. 테스트 목적 및 범위 (Scope & Objectives)
- **테스트 목적**: AgentLens 풀스택 시스템(Next.js 16 + FastAPI + SQLite + FastMCP)의 사용자 핵심 시나리오, API 엔드포인트 무결성, 엣지 케이스 및 반응형 브라우징 안정성 검증.
- **테스트 대상 범위**:
  1. 메인 피드 필터링, 정렬, 검색, 북마크 저장.
  2. 아티클 상세 모달 및 Ask AI 대화형 질의응답.
  3. 오늘의 AI 브리핑 생성, 마크다운 다운로드, Notion/Email 연동.
  4. 수집원 관리(RSS/GitHub 등록 및 토글) 및 자율 Deep Researcher.
  5. 정기 스케줄 확인 및 온디맨드 즉시 수집 트리거.

---

## 2. 테스트 시나리오 및 케이스 명세 (Test Scenarios)

| 시나리오 ID | 대상 기능 | 테스트 케이스 및 입력 절차 | 기대 결과 (Expected Result) | 우선순위 |
| :--- | :--- | :--- | :--- | :---: |
| `TC-FEED-01` | 피드 필터 | 'harness' 카테고리 탭 클릭 | URL 및 피드 카드 목록이 harness 카테고리로 필터링됨 | P0 |
| `TC-FEED-02` | Must Read | '⭐️ Must Read' 토글 스위치 켜기 | `is_high_signal === true` (score >= 7.8) 카드만 노출 | P0 |
| `TC-FEED-03` | 북마크 | 카드 북마크 아이콘 클릭 후 '보관함' 탭 이동 | 해당 카드가 보관함 목록에 정확히 표시되고 브라우저 새로고침 후에도 유지됨 | P1 |
| `TC-ASK-01`  | Ask AI | 상세 모달에서 "벤치마크 결과는?" 질문 입력 | 2초 내 LLM 답변 버블이 마크다운 형태로 렌더링됨 | P0 |
| `TC-BRIEF-01`| 브리핑 | 상단 배너 클릭 및 "마크다운 복사" 클릭 | 클립보드에 전문 마크다운 복사 성공 토스트 출력 | P0 |
| `TC-SRC-01`  | 소스 추가 | 유효한 RSS 피드 URL 입력 후 등록 | `sources.json`에 저장되고 200 OK 수신 후 피드 갱신 | P1 |
| `TC-SCHED-01`| 즉시 수집 | 스케줄 모달에서 "지금 수집 시작" 클릭 | 수집 로딩 인디케이터 동작 후 수집 결과 통계 토스트 출력 | P0 |
| `TC-EDGE-01` | 수집 연타 | 즉시 수집 진행 중 버튼 재클릭 | 409 Conflict 감지 및 "이미 수집 진행 중" 경고 출력 | P1 |

---

## 3. 테스트 환경 및 진입/종료 기준 (Entry/Exit Criteria)
- **테스트 환경**: 로컬 및 Docker Compose 컨테이너 환경 (Node.js 20+, Python 3.11+, Chrome/Safari)
- **통과 기준 (Exit Criteria)**:
  - P0 우선순위 결함 0건 (Zero P0 Bugs)
  - 전체 API 통합 테스트 성공률 100%
  - Next.js 프로덕션 빌드 오류 0건
