# AgentLens 프론트엔드 TDD 사이클 실행 기록서 (Frontend TDD Cycle Log)

- **작성일자**: 2026-09-15
- **엔지니어**: 프론트엔드 TDD 엔지니어 (`frontend-tdd-engineer`)
- **대상 모듈**: `frontend/src/` (Components, Page, API Client)
- **상태**: IN_PROGRESS (테스트 인프라 확립 및 모의 테스트 준비)

---

## 1. 프론트엔드 테스트 환경 및 진단 현황

- **Next.js 빌드 검증**: `next build` (Turbopack) 정상 컴파일 완료 (Exit code: 0)
- **기존 상태 문제점**: 하네스 적용 이전에 구현되어 `vitest`, `@testing-library/react`, `msw` 등 프론트엔드 단위/컴포넌트 테스트 러너가 미설치된 상태였음.
- **TDD 계획**: Vitest 환경을 추가 셋업하고 `NewsCard`, `NewsDetailModal`, `DailyBriefingModal` 컴포넌트의 사용자 인터랙션 테스트를 순차적으로 TDD로 확보.

---

## 2. Red-Green-Refactor 컴포넌트 TDD 시나리오 명세

### 대상 1: `NewsCard.tsx` (핵심 피드 카드 컴포넌트)
- **[RED] 테스트 명세 (`NewsCard.test.tsx`)**:
  1. `NewsItem` props가 주어졌을 때 제목, 출처, 3줄 불릿 요약이 정상 렌더링되는가?
  2. `quality_score >= 7.8`일 때 `⭐️ Must Read` 뱃지가 조건부 노출되는가?
  3. 북마크 아이콘 클릭 시 `e.stopPropagation()`이 호출되고 부모 카드 클릭 이벤트가 발생하지 않는가?
- **[GREEN] 구현 확인**:
  - `NewsCard.tsx` 내에서 `stopPropagation()` 처리 및 하이 시그널 뱃지 정상 바인딩 확인 완료.
- **[REFACTOR] 과제**:
  - 카드 내의 인라인 스타일 및 긴 클래스명을 유틸리티 함수 및 서브 컴포넌트로 정리.

### 대상 2: `NewsDetailModal.tsx` & Ask AI
- **[RED] 테스트 명세 (`NewsDetailModal.test.tsx`)**:
  1. 모달 외부 영역 클릭 시 `onClose` 콜백이 트리거되는가?
  2. 질문창에 1글자 입력 시 전송 버튼이 `disabled` 상태를 유지하는가?
  3. 2글자 이상 입력 후 전송 시 로딩 인디케이터가 표시되고, API 응답 수신 후 마크다운 버블이 렌더링되는가?
- **[GREEN] 구현 확인**:
  - `AskQuestionResponse` 응답 수신 및 인라인 에러 처리 확인.
- **[REFACTOR] 과제**:
  - 26KB에 달하는 단일 모달 파일을 `AskAiPanel`, `ArticleContent` 등으로 하위 분할 필요.
