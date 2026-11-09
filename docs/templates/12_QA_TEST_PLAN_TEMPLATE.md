# [프로덕트명] 통합 QA 테스트 계획서 (QA Test Plan)

- **작성일자**: YYYY-MM-DD
- **작성자**: 품질 보증 엔지니어 (`qa-engineer`)
- **문서 버전**: v1.0
- **상태**: Draft / Review / Approved

---

## 1. 테스트 범위 및 환경 (Test Scope & Environment)
- **테스트 대상**: 기획 요구사항(`01_PRD.md`) 및 상세 기능정의서(`02_FUNCTIONAL_SPECIFICATION.md`)에 정의된 핵심 기능 전수
- **테스트 환경**:
  - API 서버: 라이브 로컬 인스턴스 (`http://localhost:8000`)
  - 웹 클라이언트: 모바일(375px), 태블릿(768px), 데스크톱(1440px)
  - 브라우저: Chromium, Firefox, WebKit (Safari)

---

## 2. 테스트 시나리오 매트릭스 (Test Matrix)

| 케이스 ID | 테스트 구분 | 검증 시나리오 | 사전 조건 및 입력 데이터 | 기대 결과 (Pass Criteria) |
| :--- | :---: | :--- | :--- | :--- |
| `TC-E2E-001` | E2E 정상 | 신규 대화 세션 생성 및 첫 메시지 전송 | 로그인 완료 상태, 메시지: "테스트" | 세션 목록에 즉시 반영되고 AI 응답 수신 성공 |
| `TC-SEC-001` | 보안/인증 | 만료된 세션 토큰으로 API 호출 시 | 헤더에 임의의 만료 토큰 주입 | 401 Unauthorized 응답 및 로그인 유도 모달 노출 |
| `TC-EDGE-001`| 엣지/네트워크| 메시지 전송 중 오프라인 전환 | 네트워크 Throttling Offline 설정 | 에러 토스트 노출 및 [재시도] 버튼 활성화 |
| `TC-A11Y-001`| 접근성 | 키보드 Tab 및 Enter만으로 전체 워크플로우 수행 | 마우스 미사용 | 포커스 링 시각적 확인 및 모든 액션 수행 가능 |
