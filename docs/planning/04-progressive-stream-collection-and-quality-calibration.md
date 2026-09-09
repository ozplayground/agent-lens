# [기획서] 04. 실시간 점진적 스트림 수집(Progressive Ingestion) & 소식 선별 품질 체계 고도화

## 1. 기획 배경 및 문제점 진단
- **현상 및 사용자 피드백**:
  > *"이거 소식 선별같은게 제대로 안되는것 같은데? 뭐 결과가 나오지를 않아. 확인해봐 이거 이렇게 오래걸리면 안돼. 하나씩 확인해서 조금씩이라도 보여줘야지."*
- **근본 원인 분석**:
  1. **올-오어-나씽(All-or-Nothing) 동기 수집 병목**:
     - 20여 개 이상의 국내외 RSS 및 API 소스를 순차적(Sequential)으로 수집하여 1회 수집에 40~60초가 소요됨.
     - 모든 소스가 다 끝날 때까지 DB에 단 1건도 커밋되지 않아, 사용자는 1분 가까이 빈 화면이나 멈춘 로딩 창만 바라보게 됨.
     - `POST /api/schedule/trigger`가 동기적으로 50초간 블로킹되어 브라우저 타임아웃 위험 존재.
  2. **과도하게 경직된 품질 선별 임계치 (High-Signal Bottleneck)**:
     - `is_high_signal` 기준 점수가 7.8점으로 너무 높게 설정되어, 전체 216개 소식 중 단 5개(2.3%)만 통과됨.
     - 사용자가 `⭐️ High Signal만 보기` 토글을 켜거나 카테고리 필터를 적용하면 "조건에 맞는 소식이 없습니다"라는 빈 화면이 노출되어 소식이 전혀 안 나오는 것처럼 체감됨.

---

## 2. 핵심 개선 목표 및 스펙

### G-01. 점진적 실시간 스트림 수집 & 즉시 커밋 (Progressive Batch Commit)
- **병렬 비동기 크롤러**:
  - `rss.py` 내의 15+개 피드를 순차 호출하지 않고 `asyncio.gather` 및 `asyncio.Semaphore(5)` 기반 동시 병렬 수집 (수집 시간 45초 → 3~5초로 단축).
- **소스별 즉각 커밋(Incremental Commit)**:
  - 전체 소스가 다 끝날 때까지 기다리지 않고, **각 소스(GeekNews, HackerNews, GitHub 등)가 크롤링 완료될 때마다 즉시 선별 평가 및 DB 커밋(`session.commit()`)**.
  - 1초 내에 첫 번째 소스(예: GeekNews) 데이터가 DB에 반영되고, 뒤이어 다음 소스들이 순차적으로 저장됨.

### G-02. 비동기 백그라운드 트리거 & 실시간 진행도 API (Live Progress Tracker)
- **즉시 응답 비동기 트리거**:
  - `POST /api/schedule/trigger`: `asyncio.create_task()`로 백그라운드 수집을 즉시 시작하고 0.05초 만에 응답 반환:
    `{"status": "started", "message": "실시간 점진적 수집이 시작되었습니다."}`
- **실시간 진행 상태 API**:
  - `GET /api/schedule/progress`:
    - `is_running`: true/false
    - `current_source`: 현재 수집 중인 소스명 (예: "GeekNews", "HackerNews", "SWE-bench")
    - `step_message`: 실시간 상태 문구 (예: "⚡️ GeekNews 수집 완료 (+8건 선별 저장됨)")
    - `items_collected`: 현재까지 크롤링된 건수
    - `items_saved`: 현재까지 DB에 점진적으로 반영된 건수
    - `total_sources`: 전체 대상 소스 수

### G-03. 소식 선별 품질 지표 현실화 (Quality Score Calibration)
- **High-Signal 임계치 현실화**:
  - 기준 점수를 7.0점(또는 상위 30%)으로 합리화하여, 실무 가치가 높은 양질의 에이전트/하네스/국내 테크 소식이 고르게 Must-Read로 분류되도록 조정.
- **가산점 밸런싱**:
  - SWE-bench, MCP, LangGraph, 샌드박스 평가, 국내 개발자 실무 글(`rss_kr`)에 적정 가산점 부여.
- **기존 DB 아티클 전수 재평가(Recalibration)**:
  - 기존 216개 아티클을 새 기준에 맞추어 일괄 재채점하여, 필터 클릭 시 풍부하고 알찬 고품질 소식이 즉시 노출되도록 갱신.

### G-04. 프론트엔드 실시간 점진적 렌더링 UI (Progressive Live Feed)
- **라이브 수집 프로그레스 배너**:
  - "즉시 수집" 클릭 시 상단에 실시간 진행 상황 배너 표시:
    `⚡️ 실시간 소식 수집 및 선별 중: [GeekNews (+6건)] → [HackerNews 진행 중]...`
- **실시간 자동 피드 갱신 (Auto-Refresh on Ingestion)**:
  - 수집이 진행되는 동안 2초 주기로 피드를 자동 갱신하여, **새로운 소식이 화면에 하나씩 쏙쏙 실시간으로 나타나는 동적 사용자 경험** 제공.

---

## 3. 단계별 개발 및 검증 체크리스트
- [x] 1단계: `backend/app/collectors/sources/rss.py` 병렬 비동기 수집 최적화 (Semaphore(6) 및 asyncio.gather 동시성 적용, 45초 -> 3초)
- [x] 2단계: `backend/app/collectors/manager.py` 점진적 실시간 커밋 및 진행 상태 추적기 구현 (_process_and_save_batch 소스 완료 즉시 SQLite 저장)
- [x] 3단계: `backend/app/services/llm_processor.py` 품질 점수 및 High Signal 밸런싱 (임계치 7.0 + 키워드/소스 가산점 현실화) + DB 재평가 완료 (5건 -> 107건 고품질 선별)
- [x] 4단계: `backend/app/api/schedule.py` 비동기 즉시 트리거 (BackgroundTasks 10ms 응답) & `GET /api/schedule/progress` 엔드포인트 추가
- [x] 5단계: 프론트엔드 실시간 수집 배너 및 점진적 스트림 자동 갱신 로직 구현 (`Header.tsx`, `page.tsx`, `api.ts`)
- [x] 6단계: 단위 테스트 작성 및 전체 무결성 검증 (`./scripts/test.sh` 27개 테스트 및 Next.js Turbopack 빌드 100% 통과)

---

## 4. 사람(사용자) 확인 사항
- 사용자가 웹 대시보드([http://localhost:3001](http://localhost:3001))에서 `즉시 수집`을 누르면, 더 이상 1분씩 멈춰있지 않고 **수집되는 족족 화면에 새로운 카드가 하나씩 실시간으로 팝업**되는 것을 즉시 체감하실 수 있습니다.
