# 시스템 아키텍처 및 데이터 설계 (v2.0)

## 1. 전체 파이프라인 구조
```
[Global & Domestic Sources] (GitHub, HN, arXiv, HF, Reddit, RSS, GeekNews, etc.)
       │
       ▼
[Collector Pipeline] ── (APScheduler: 0, 6, 12, 18 UTC)
       │
  - Text Extraction & Normalization
  - Canonical Deduplication (SHA-256)
       │
       ▼
[LLM Processor & Quality Gate] (Dual Mode: Heuristic Engine / Live LLM)
       │
  - Quality Scoring (Tech Depth, Novelty, Actionability) & Noise Filter
  - 3-Bullet TL;DR Synthesis
  - "Why It Matters" Developer Insight
  - Tech Stack & Model Entity Extraction
  - Category Classifier (harness, mcp_plugins_skills, agent_tech, ai_news)
  - Hotness Gravity Ranker
       │
       ▼
[SQLite DB (Async aiosqlite + SQLAlchemy)]
       │
       ├─────────────────────────┬────────────────────────┐
       ▼                         ▼                        ▼
[FastAPI REST API]       [FastMCP Server]        [Daily Briefing Engine]
- /api/news              - get_latest_harness    - Top news synthesis
- /api/news/{id}/ask     - get_mcp_skills        - Markdown report
- /api/briefing          - search_agent_news     - Executive summary
- /api/stats /schedule
       │
       ▼
[Next.js React Frontend]
- Real-time Feed with High-Signal Badges
- Daily Intelligence Briefing Banner & Modal
- Interactive "Ask AI" Deep-Dive Drawer
- Category & Source Filtering (Domestic/Global)
- Bookmarks Reading List (LocalStorage)
```

## 2. 데이터베이스 스키마 확장
- **NewsItem**:
  - `id`: Integer (PK)
  - `title`: String
  - `url`: String
  - `source`: String
  - `category`: String
  - `summary`: Text
  - `tldr_bullets`: Text (JSON string: 3 bullet points)
  - `why_it_matters`: Text (Insight for agent developers)
  - `tech_stack`: String (Extracted entities, comma-separated)
  - `quality_score`: Float (1.0 ~ 10.0)
  - `is_high_signal`: Boolean
  - `author`: String
  - `tags`: String
  - `raw_score`: Integer
  - `comments_count`: Integer
  - `hotness_score`: Float
  - `published_at`: DateTime
  - `created_at`: DateTime
  - `dedup_hash`: String (Unique Index)

## 3. 신규 서비스 및 API
- `app.services.llm_processor`: 품질 평가, 3줄 요약, 시사점 생성, 기술 스택 추출
- `app.services.briefing_service`: 상위 소식 기반 일일 브리핑 생성
- `POST /api/news/{id}/ask`: 특정 아티클 대상 대화형 AI 질의응답
- `GET /api/briefing/latest`: 오늘의 AI 브리핑 조회
