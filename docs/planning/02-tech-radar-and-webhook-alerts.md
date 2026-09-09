# [기획서] 02. 실시간 에이전트 기술 트렌드 레이더(Tech Radar) 및 웹훅 알림 디스패처(Webhook Dispatcher)

## 1. 기획 배경 및 목적
- **현상 및 문제점**:
  1. 수집된 200여 건 이상의 아티클이 누적되면서, 개별 글을 일일이 읽지 않고도 **현재 글로벌 에이전트 및 하네스 생태계에서 어떤 기술/도구/모델이 가장 핫하게 부상하고 있는지(Velocity & Trend)**를 조망하기 어렵습니다.
  2. 개발자나 엔지니어링 팀은 브라우저에 상시 접속하기보다, 팀 슬랙(Slack) 채널이나 디스코드(Discord)로 **매일 아침 1분 브리핑 리포트**와 **품질 8.5 이상의 Must-Read 특종**을 푸시(Push) 형태로 받아보길 원합니다.
- **목적**:
  1. DB에 축적된 `tech_stack` 엔티티와 품질 지표를 바탕으로 **실시간 에이전트 기술 트렌드 레이더(Tech Radar)**를 구축하고, 태그 클릭 원클릭 필터링을 제공합니다.
  2. **슬랙/디스코드 웹훅 디스패처(Webhook Dispatcher)**를 구현하여, 출근 시간 정기 브리핑 자동 전송 및 고품질 하네스 소식 실시간 알림을 제공합니다.

---

## 2. 핵심 기능 명세 (Feature Specifications)

### F-07. 실시간 에이전트 기술 트렌드 레이더 (Tech Radar)
- **개념**: 최근 7일 및 전체 기간 동안 수집된 데이터에서 언급된 기술 스택(`tech_stack`)을 집계하여, 출현 빈도와 최근 급상승(Surging) 지표를 한눈에 제공.
- **4대 분류 체계**:
  1. `Harness & Benchmark`: `SWE-bench`, `GAIA`, `Docker Sandbox`, `WebArena`, `Aider`, `Eval Harness` 등
  2. `Protocols & Tooling`: `FastMCP`, `MCP (Model Context Protocol)`, `LangGraph`, `CrewAI`, `Browser-Use` 등
  3. `Models & Reasoning`: `Claude 3.7`, `DeepSeek-R1`, `GPT-4.5`, `Gemini 2.0`, `Llama 3.3` 등
  4. `Infra & Runtime`: `vLLM`, `Ollama`, `SGLang`, `LiteLLM`, `Triton` 등
- **지표 산출**:
  - `frequency`: 언급된 총 기사 건수
  - `velocity`: 최근 24시간 내 언급 비중 증감률 (예: `+35%`, `NEW`, `HOT`)
  - `category_share`: 4대 영역별 상대적 비중 점유율 (%)
- **프론트엔드 인터랙션**:
  - 메인 대시보드 상단에 Collapsible 형태의 **"🔥 에이전트 Tech Radar"** 패널 제공.
  - 급상승 기술 태그를 누르면 메인 피드가 해당 기술 스택으로 즉시 필터링.

### F-08. 슬랙/디스코드 웹훅 알림 디스패처 (Webhook Dispatcher)
- **지원 채널**:
  - **Slack**: Block Kit UI 기반의 깔끔하고 구조화된 서식 메시지 (헤더, 요약, 핵심 불릿, 버튼 링크).
  - **Discord**: Rich Embeds 서식 (컬러 코드, 필드별 TL;DR, 원문 링크).
  - **Generic Webhook**: 커스텀 엔드포인트 수신용 표준 JSON 페이로드.
- **발송 트리거 시나리오**:
  1. **Daily Briefing Push**: 매일 KST 09:00 정기 크론 수집 완료 직후, 오늘의 AI 브리핑 리포트를 웹훅으로 자동 전송.
  2. **High-Signal Alert (선택)**: 수집 품질 점수 8.5 이상의 핵심 벤치마크/하네스 특종이 들어왔을 때 즉시 전송.
  3. **On-Demand Dispatch**: 웹 UI에서 "📢 오늘의 브리핑 슬랙으로 전송" 버튼 클릭 시 즉각 발송.
  4. **연동 테스트**: UI 설정 모달에서 Webhook URL 입력 후 "테스트 발송" 원클릭 검증.

---

## 3. 백엔드 아키텍처 및 API 설계

### 3.1 신규 서비스 컴포넌트
1. `backend/app/services/trend_service.py`:
   - DB 비동기 쿼리를 통해 `NewsItem.tech_stack` 파싱 및 카테고리 매핑.
   - 빈도수 정렬, Velocity 계산, 카테고리별 통계 반환.
2. `backend/app/services/webhook_service.py`:
   - `HTTPX` 비동기 클라이언트를 통한 웹훅 페이로드 전송.
   - Slack Block Kit / Discord Embed 템플릿 생성기.

### 3.2 신규 API 엔드포인트
- `GET /api/trends/radar`:
  - 응답:
    ```json
    {
      "updated_at": "2026-09-08T15:00:00Z",
      "total_analyzed": 210,
      "surging_tags": [
        {"name": "SWE-bench", "count": 14, "category": "Harness", "velocity": "+50%"},
        {"name": "FastMCP", "count": 11, "category": "Tooling", "velocity": "+40%"}
      ],
      "categories": [
        {"name": "Harness & Benchmark", "count": 45, "percentage": 30},
        {"name": "Protocols & Tooling", "count": 55, "percentage": 37},
        {"name": "Models & Reasoning", "count": 35, "percentage": 23},
        {"name": "Infra & Runtime", "count": 15, "percentage": 10}
      ],
      "tags": [
        {"name": "SWE-bench", "count": 14, "category": "Harness"}
      ]
    }
    ```
- `POST /api/webhook/test`:
  - 요청: `{"webhook_url": "https://hooks.slack.com/services/...", "provider": "slack"}`
  - 응답: `{"success": true, "message": "테스트 메시지가 성공적으로 전송되었습니다."}`
- `POST /api/webhook/send-briefing`:
  - 요청: `{"webhook_url": "https://...", "provider": "slack"}`
  - 오늘 생성된 AI 브리핑을 서식화하여 지정된 웹훅으로 발송.

---

## 4. 프론트엔드 컴포넌트 설계
1. `components/TechRadar.tsx`:
   - 헤더 바로 아래 또는 필터 상단에 위치.
   - 카테고리별 칩 및 "🔥 급상승 기술 TOP 5" 뱃지 표시.
   - 클릭 시 해당 태그 검색으로 즉시 전환되는 원클릭 탐색 경험.
2. `components/WebhookSettingsModal.tsx`:
   - Slack / Discord Webhook URL 입력 및 저장 (`localStorage` 및 백엔드 연동).
   - "테스트 발송" 버튼 및 성공/실패 토스트 피드백.
   - "오늘의 브리핑 지금 전송" 버튼 제공.

---

## 5. 단계별 개발 및 검증 체크리스트
- [x] 1단계: `backend/app/services/trend_service.py` 구현 및 단위 테스트
- [x] 2단계: `backend/app/services/webhook_service.py` 구현 및 단위 테스트
- [x] 3단계: 신규 API 라우트 등록 (`/api/trends/radar`, `/api/webhook/test`, `/api/webhook/send-briefing`)
- [x] 4단계: `scripts/test.sh` 백엔드 테스트 추가 및 무결성 검증 (24개 테스트 전 항목 패스)
- [x] 5단계: 프론트엔드 `TechRadar.tsx`, `WebhookSettingsModal.tsx` 컴포넌트 구현
- [x] 6단계: 프론트엔드 메인 페이지 통합 및 UI 상호작용 검증
- [x] 7단계: `make test` 및 `make build` 최종 통과 확인 (TypeScript 및 Next.js 빌드 성공)

---

## 6. 사람(사용자) 액션 아이템 & 피드백 필요 사항
1. **Slack 또는 Discord Webhook URL (선택 사항)**:
   - 슬랙 채널에 브리핑 알림을 받으려면, Slack 앱의 `Incoming Webhooks` URL을 발급받아 웹 UI 설정 창 또는 `backend/.env`의 `SLACK_WEBHOOK_URL`에 입력하시면 됩니다.
   - 디스코드의 경우 채널 설정 > 연동 > 웹후크 생성에서 복사한 URL을 입력하시면 됩니다.
2. **트렌드 레이더 모니터링 키워드 추가**:
   - 특별히 관심 있는 신규 프로젝트나 내부 엔지니어링 프레임워크가 있다면, `trend_service.py`의 사전 카테고리에 우선순위 키워드로 등록해 드릴 수 있습니다.
