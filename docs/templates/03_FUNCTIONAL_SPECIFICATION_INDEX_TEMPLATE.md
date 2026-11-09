# [프로덕트명] 전체 기능정의서 인덱스 (Functional Specification Index)

- **작성일자**: YYYY-MM-DD
- **작성자**: 기획 명세 작성가 (`spec-writer`)
- **문서 버전**: v1.0
- **상태**: Draft / Review / Approved

---

## 1. 기능 계층 구조도 (Feature Hierarchy Tree)

```
[1Depth: 도메인]
  └── [2Depth: 화면/모듈]
        ├── [3Depth: 단위 기능 1] (FUNC-도메인-001)
        ├── [3Depth: 단위 기능 2] (FUNC-도메인-002)
        └── [3Depth: 단위 기능 3] (FUNC-도메인-003)
```

---

## 2. 전체 단위 기능 목록 요약 (Function Index)

모든 단위 기능은 도메인별 상세기능정의서(`docs/spec-writer/fsd/*.md`)에 7대 상세 명세가 완비되어 있습니다.

| 기능 ID | 1Depth (도메인) | 2Depth (화면/모듈) | 3Depth (단위기능명) | 우선순위 | 대응 요구사항 ID | 상세 명세 문서 링크 |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| `FUNC-AUTH-001` | 인증/계정 | 로그인 화면 | 소셜 간편 로그인 및 회원가입 | Must | `REQ-AUTH-001` | [`fsd/01_AUTH_SPECIFICATION.md`](./fsd/01_AUTH_SPECIFICATION.md) |
| `FUNC-AUTH-002` | 인증/계정 | 세션 관리 | 토큰 자동 갱신 및 만료 로그아웃 | Must | `REQ-AUTH-001` | [`fsd/01_AUTH_SPECIFICATION.md`](./fsd/01_AUTH_SPECIFICATION.md) |
| `FUNC-CORE-001` | 핵심 작업 | 메인 대시보드 | 작업 목록 카드 조회 및 필터링 | Must | `REQ-CORE-001` | [`fsd/02_CORE_SPECIFICATION.md`](./fsd/02_CORE_SPECIFICATION.md) |
| `FUNC-CORE-002` | 핵심 작업 | 작업 상세 화면 | 신규 작업 생성 및 실시간 유효성 검증 | Must | `REQ-CORE-001` | [`fsd/02_CORE_SPECIFICATION.md`](./fsd/02_CORE_SPECIFICATION.md) |
| `FUNC-CORE-003` | 핵심 작업 | 작업 상세 화면 | 작업 상태 전이 및 인라인 편집 | Should | `REQ-CORE-001` | [`fsd/02_CORE_SPECIFICATION.md`](./fsd/02_CORE_SPECIFICATION.md) |

---

## 3. 도메인별 분할 명세서 맵 (Modular FSD Map)

- [계정 및 인증 상세기능정의서](./fsd/01_AUTH_SPECIFICATION.md)
- [핵심 작업 및 대시보드 상세기능정의서](./fsd/02_CORE_SPECIFICATION.md)
- [알림 및 피드백 상세기능정의서](./fsd/03_NOTIFICATION_SPECIFICATION.md)
