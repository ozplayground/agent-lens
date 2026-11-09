# [프로덕트명] 배포 명세 및 환경 검증서 (Deployment Specification)

- **작성일자**: YYYY-MM-DD
- **작성자**: 데브옵스 엔지니어 (`devops-engineer`)
- **문서 버전**: v1.0
- **상태**: Draft / Review / Approved

---

## 1. 컨테이너 빌드 및 런타임 토폴로지 (Container Architecture)

| 서비스명 | 베이스 이미지 | 노출 포트 | 헬스체크 엔드포인트 | 재시작 정책 |
| :--- | :--- | :---: | :--- | :--- |
| **frontend** | `node:20-alpine` | `3000` | `http://localhost:3000/api/health` | `unless-stopped` |
| **backend** | `python:3.11-slim` | `8000` | `http://localhost:8000/health` | `unless-stopped` |
| **database** | `postgres:16-alpine` | `5432` | `pg_isready -U user` | `unless-stopped` |

---

## 2. 언어별 환경변수 모범사례 검증 체크리스트 (Environment Verification)

### 백엔드 (Python FastAPI / `pydantic-settings`)
- [ ] `.env.example`에 모든 필수 키(DB, SECRET_KEY, CORS_ORIGINS) 명시 여부
- [ ] `BaseSettings` 클래스에서 누락된 필수 환경변수 인입 시 앱 기동 즉시 Failsafe(Validation Error) 차단 여부
- [ ] 운영 환경 SECRET_KEY 최소 32자 이상 암호화 복잡도 충족 여부

### 프론트엔드 (Next.js / TypeScript)
- [ ] 브라우저 노출 환경변수는 `NEXT_PUBLIC_` 접두사 엄격 분리 여부
- [ ] 빌드 시 Zod 스키마로 클라이언트/서버 환경변수 런타임 타입 검증 완료 여부
- [ ] 프로덕션 빌드 시 콘솔 디버깅 로그 및 소스맵 노출 방어 여부

---

## 3. 헬스체크 및 무중단 배포 검증 결과
- **백엔드 헬스체크 응답 (`GET /health`)**: `{"status": "healthy", "version": "1.0.0"}`
- **프론트엔드 SSR 렌더링 응답**: HTTP 200 OK
- **컨테이너 기동 소요 시간**: 전체 서비스 정상화 $\le 15$초
