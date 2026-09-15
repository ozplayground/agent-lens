# AgentLens 백엔드 5-Pillar 코드 품질 감사 보고서 (Code Review Report)

- **검토일자**: 2026-09-15
- **감사자**: 백엔드 코드 리뷰어 (`backend-code-reviewer`)
- **판정 결과**: **REQUEST_CHANGES** (개선 권고 사항 반영 필요)

---

## 1. 5대 핵심 품질 필라별 평가 점수

| 품질 필라 (Pillar) | 평가 점수 | 판정 | 주요 평가 내용 |
| :--- | :---: | :---: | :--- |
| **Pillar 1: 아키텍처 정합성** | 85 / 100 | PASS | FastAPI 계층 분리(`api`, `services`, `models`) 우수하나 설정 파일 이원화 존재 |
| **Pillar 2: 클린코드 & SOLID** | 78 / 100 | WARN | 서비스 파일(`llm_processor.py` 28KB) 내 일부 함수의 책임 과다 |
| **Pillar 3: 보안 & 무결성** | 88 / 100 | PASS | SQL Injection 방어(SQLAlchemy ORM), XSS 방어(BeautifulSoup 태그 정리) 양호 |
| **Pillar 4: 성능 & 리소스** | 82 / 100 | PASS | 비동기 asyncio 기반 수집 및 aiosqlite 풀링, 단 대용량 파싱 시 메모리 주의 |
| **Pillar 5: 테스트 품질** | 92 / 100 | PASS | 49개 테스트 전수 통과, 외부 LLM 의존성 Mocking 및 폴백 테스트 완비 |

---

## 2. 주요 발견 사항 및 개선 권고 (Findings & Action Items)

### 1. 설정 관리 이원화 문제 (Pillar 1) - [CRITICAL]
- **현상**: `config.json`과 `.env`가 혼재되어 있고, `app/config.py`에서 `load_json_config()`와 `BaseSettings`를 혼합하면서 동기화 우선순위가 복잡함.
- **개선 방안**: `BaseSettings`가 최우선 단일 진실 공급원(Single Source of Truth) 역할을 하도록 구조를 일원화하고, `config.json` 저장은 서비스 레이어(`config_service.py`)로 명확히 위임 권장.

### 2. 예외 처리 일관성 및 글로벌 핸들러 (Pillar 2) - [HIGH]
- **현상**: 일부 API 엔드포인트(`api/sources.py`, `api/news.py`)에서 원시 `HTTPException`을 산발적으로 throw하고 있어 공통 에러 포맷(`code`, `message`, `timestamp`)이 일관되지 않음.
- **개선 방안**: 커스텀 비즈니스 예외 클래스 및 FastAPI 글로벌 `ExceptionMiddleware` 등록 필요.

### 3. SQLite 파일 잠금 대비 WAL 모드 명시 (Pillar 4) - [MEDIUM]
- **현상**: 비동기 aiosqlite 세션에서 크롤러와 API 조회가 동시 발생할 때 `database is locked` 예외 발생 가능성 존재.
- **개선 방안**: `app/database.py` 연결 초기화 시 `PRAGMA journal_mode=WAL;` 실행문 명시 강제.
