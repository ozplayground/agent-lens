# [기획서] 07. 백엔드 자율 딥 리서치(Autonomous Deep Research) 및 지능형 소스 자동 채택/검증 엔진

## 1. 기획 배경 및 요구사항

### 1.1 사용자 피드백
> *"프론트에 리서치 기능을 넣지말고 백엔드에서 그냥 주기적으로 돌려 소식을 제공하는 사이트들을 리서칭 하고 추가할지 말지 결정하고 그런 기능을 만들어야지. 너 너무 간단하게 생각하는 경향이 있어. deep research 기능 같은거 없어? 좀 조사를 어떻게 하고 조사된 소스들을 어떻게 검증해서 추가할지를 멋지게 만들어 보란 말이야"*

### 1.2 문제점 진단
1. **수동 검색의 사용자 피로도**:
   - 사용자가 직접 키워드를 입력하거나 사이트 URL을 찾아서 등록 버튼을 누르는 방식은 '자율 에이전트(Autonomous Agent)'의 취지에 맞지 않음.
   - 사용자가 신경 쓰지 않아도 백엔드가 주기적으로 전세계를 자율 탐색하고 최신 소스 목록을 스스로 갱신해야 함.
2. **표면적 리서치 탈피 & "Deep Research" 체계 필요**:
   - 단순 하드코딩 리스트 조회가 아닌, **실제 기사 인용 링크 마이닝(Inbound Reference Graph)**, **에이전트 생태계 도메인 탐색**, **네트워크 연결/RSS 피드 실증(Probing)**, **최신 글 3편에 대한 LLM 4축 심층 평가**, **엄격한 점수 기준에 따른 자동 채택(Auto-Adopt) / 기각(Reject) 판정**까지 아우르는 엔드투엔드 파이프라인이 요구됨.

---

## 2. 딥 리서치 아키텍처 및 세부 설계

### D-01. 자율 딥 리서치 5단계 파이프라인 (5-Stage Deep Research Pipeline)

```
[Stage 1: 탐색 & 후보 발굴]
  ├── 수집 기사 본문 내 인용 도메인 추출 (Citation Reference Mining)
  ├── 글로벌 프론티어 AI 연구소 / 하네스 / MCP 프로젝트 도메인 순회
  └── GitHub Trending 레포지토리 홈페이지 & 블로그 역추적
          ↓
[Stage 2: 기술 실증 & 헬스 체크]
  ├── 네트워크 연결성 & TLS 검증 (HTTP 200, 응답시간 < 3s)
  ├── RSS/Atom/Feed 자동 프로빙 (/feed, /rss, /atom.xml 등)
  ├── 활성도 검증: 최근 30일 이내 발행 여부 (Dormant 사이트 컷오프)
  └── 정보 밀도 검증: 글 본문 길이 > 300자, 코드 블록, 기술 다이어그램 유무
          ↓
[Stage 3: LLM 4축 심층 평가 & 신호 채점]
  ├── 축 1: 기술 깊이 (Technical Depth, 1~10) - 하네스/코드/벤치마크 실증
  ├── 축 2: 신호 대 잡음비 (Signal-to-Noise, 1~10) - 마케팅/코인/광고 배제
  ├── 축 3: 도메인 일치도 (Domain Relevance, 1~10) - harness, mcp, agent_tech, ai_news
  └── 종합 가중 점수 (Composite Score) & AI 판정 의견서(Verdict Rationale) 생성
          ↓
[Stage 4: 자율 판정 및 자동 채택 (Auto-Adoption)]
  ├── Score ≥ 8.2점: [AUTO_ADOPT] → sources.json 즉시 자동 편입 & 첫 크롤링 트리거
  ├── 6.5점 ≤ Score < 8.2점: [WATCHLIST] → 관찰 대상 등록 및 후속 모니터링
  └── Score < 6.5점: [REJECT] → 기각 사유 기록 & 블랙리스트 처리 (중복 방지)
          ↓
[Stage 5: 감사 일지 기록 (Audit Trail)]
  └── DB(SourceResearchLog)에 평가 일시, 소스명, 피드 URL, 점수, 기각/채택 사유 영속 저장
```

---

### D-02. 백엔드 스케줄러 통합 (Periodic Scheduler)

- `app/scheduler.py`에 `deep_research_job` 등록:
  - 매일 03:00, 15:00 UTC (12시간 주기) 자동 실행 (설정 가능).
  - 수집 배치 완료 후 유입된 기사들의 외부 링크를 자동으로 모아 딥 리서치 큐에 투입.
- 수동 즉시 트리거 API:
  - `POST /api/research/run-deep`: 관리자/사용자가 원할 때 즉시 딥 리서치 엔진 가동.

---

### D-03. 데이터베이스 감사 모델 (`SourceResearchLog`)

```python
class SourceResearchLog(Base):
    __tablename__ = "source_research_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_name = Column(String(200), nullable=False)
    site_url = Column(String(500), nullable=False)
    feed_url = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False)
    relevance_score = Column(Float, nullable=False)
    verdict = Column(String(20), nullable=False) # AUTO_ADOPTED, WATCHLIST, REJECTED
    verdict_reason = Column(Text, nullable=False)
    analyzed_articles_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

---

### D-04. 프론트엔드 UI: 자율 리서치 모니터링 대시보드

- 기존의 수동 검색 인터페이스를 걷어내고, **"AI 자율 딥 리서치 모니터"**로 단순화/고도화:
  1. **딥 리서치 오케스트레이터 상태 카드**:
     - 엔진 가동 상태 (`대기 중 (Idle)` / `딥 리서치 분석 중 (Running)`)
     - AI가 자율 채택한 소스 누적 카운트
     - 마지막 딥 리서치 수행 시간 및 다음 예약 시간
     - `[자율 딥 리서치 지금 실행]` 버튼
  2. **자율 판정 감사 피드 (Decision Audit Feed)**:
     - AI가 조사하고 판정한 최신 소스 목록 노출:
     - `AUTO_ADOPTED` (GitHub Green 뱃지)
     - `WATCHLIST` (GitHub Gold 뱃지)
     - `REJECTED` (Mute Gray 뱃지)
     - 소스명, 피드 URL, 종합 신호 점수, AI가 직접 작성한 판정 사유(Verdict).
  3. **수집 소스 목록 (Active Sources)**:
     - AI에 의해 자동 채택된 소스는 `[AI 자동 채택]` 뱃지가 붙어 한눈에 파악 가능.
     - 사용자는 원할 경우 언제든 ON/OFF 토글하거나 삭제 가능.

---

## 3. 검증 계획

1. **단위 및 통합 테스트**:
   - `test_deep_researcher.py`: 5단계 파이프라인, 링크 추출, 헬스 체크, LLM 4축 채점, 자동 채택 및 DB 기록 검증.
2. **전체 테스트 하네스 (`./scripts/test.sh`)**:
   - 백엔드 pytest 전 항목 통과 + 프론트엔드 tsc 검증.
3. **E2E 헤드리스 브라우저 테스트**:
   - 딥 리서치 모달 진입 -> 상태 확인 -> 수동 딥 리서치 트리거 -> 감사 피드 반영 검증.
