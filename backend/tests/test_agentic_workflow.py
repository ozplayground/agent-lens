import json
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, Response, Request, TimeoutException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.news import NewsItem
from app.schemas.chat import (
    ChatStreamRequest,
    ChatQueryRequest,
    ChatSourceItem,
    ChatSourcesPayload,
    ChatStatusPayload,
)
from app.services.scraper import (
    ArticleScraperService,
    ScrapeBlockedException,
    ScrapeTimeoutException,
    ScrapeEmptyContentException,
)
from app.services.agentic_search import (
    AgenticSearchService,
    SufficiencyEvaluationResult,
    SupplementarySourceItem,
)
from app.services.chat_service import ChatService
from app.database import AsyncSessionLocal


@pytest.fixture
async def db_session():
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture
async def sample_article_scoped(db_session: AsyncSession):
    import uuid
    uid = uuid.uuid4().hex[:8]
    item = NewsItem(
        title="LangGraph Multi-Agent Workflows v0.3",
        url=f"https://example.com/langgraph-v03-guide-{uid}",
        source="github",
        category="agent_tech",
        summary="LangGraph v0.3 released with persistent checkpointing and human-in-the-loop controls.",
        why_it_matters="Provides enterprise state management for complex multi-agent DAG execution.",
        tech_stack="LangGraph, Python, SQLite",
        tags="agent, workflow, langgraph",
        quality_score=9.0,
        is_high_signal=True,
        hotness_score=95.0,
        full_content=None,
        scraped_at=None,
        dedup_hash=f"hash-agentic-scoped-{uid}"
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)
    yield item
    try:
        await db_session.delete(item)
        await db_session.commit()
    except Exception:
        pass


@pytest.mark.asyncio
async def test_article_scraper_l1_l2_cache_and_db_persistence(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Test ArticleScraperService:
    1. First call scrapes via HTTP, extracts >500 chars, updates DB, populates L1 LRU cache.
    2. Second call returns from L1 LRU cache with 0 HTTP calls.
    3. New scraper instance (empty L1) loads from L2 SQLite DB persistence with 0 HTTP calls.
    """
    html_content = """
    <html>
      <head><title>LangGraph v0.3 Guide</title></head>
      <body>
        <article>
          <h1>LangGraph Multi-Agent Workflows v0.3 Release Overview</h1>
          <p>LangGraph v0.3 introduces breakthrough capabilities for cyclic state graphs in Python.
          With this release, developers can coordinate multi-agent teams with fault-tolerant persistence,
          time-travel debugging, and explicit human-in-the-loop review checkpoints.</p>
          <h2>Core Architecture & State Management</h2>
          <p>State is represented as a typed dictionary or Pydantic model passed across nodes in a directed graph.
          Every step in graph execution automatically commits a state snapshot to the configured checkpointer,
          such as MemorySaver or SqliteSaver. This guarantees that long-running multi-agent pipelines can be
          paused, audited, or rewound to any previous checkpoint seamlessly.</p>
          <pre><code>
          from langgraph.graph import StateGraph, START, END
          builder = StateGraph(State)
          builder.add_node("agent", agent_node)
          builder.add_edge(START, "agent")
          builder.add_edge("agent", END)
          graph = builder.compile(checkpointer=MemorySaver())
          </code></pre>
          <p>Performance benchmarks indicate a 40% reduction in serialization overhead compared to v0.2.
          Production deployments with thousands of concurrent sessions show minimal latency impact.</p>
        </article>
      </body>
    </html>
    """
    scraper = ArticleScraperService(session=db_session)
    mock_response = Response(200, text=html_content, request=Request("GET", sample_article_scoped.url))

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        # 1. First scrape (Cache miss -> Network I/O -> DB & L1 update)
        content = await scraper.get_article_content(sample_article_scoped)
        assert content is not None
        assert len(content) >= 500
        assert "LangGraph" in content
        assert mock_get.call_count == 1

        # Verify DB updated
        await db_session.refresh(sample_article_scoped)
        assert sample_article_scoped.full_content is not None
        assert len(sample_article_scoped.full_content) >= 500
        assert sample_article_scoped.scraped_at is not None

        # 2. Second scrape on same instance (L1 Cache hit -> 0 HTTP calls)
        content_l1 = await scraper.get_article_content(sample_article_scoped)
        assert content_l1 == content
        assert mock_get.call_count == 1  # Still 1, no extra network call

        # 3. Third scrape on fresh scraper instance (L1 Miss, L2 DB Hit -> 0 HTTP calls)
        fresh_scraper = ArticleScraperService(session=db_session)
        content_l2 = await fresh_scraper.get_article_content(sample_article_scoped)
        assert content_l2 == content
        assert mock_get.call_count == 1  # Still 1, served from SQLite DB


@pytest.mark.asyncio
async def test_article_scraper_graceful_fallback_on_403_and_timeout(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Test ArticleScraperService graceful fallback:
    - 403 Forbidden / Cloudflare -> returns None / fallback summary and does not crash.
    - 5s Timeout -> returns None / fallback summary without failing pipeline.
    """
    scraper = ArticleScraperService(session=db_session)

    # 1. 403 Forbidden
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = Response(403, text="Access Denied", request=Request("GET", sample_article_scoped.url))
        with pytest.raises(ScrapeBlockedException):
            await scraper.fetch_and_parse(sample_article_scoped.url)

    # 2. Timeout > 5s
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = TimeoutException("Connection timed out after 5.0s")
        with pytest.raises(ScrapeTimeoutException):
            await scraper.fetch_and_parse(sample_article_scoped.url)


@pytest.mark.asyncio
async def test_article_scraper_single_flight_lock(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Test Single-Flight Concurrency:
    Concurrent requests for the same URL share a single HTTP flight.
    """
    scraper = ArticleScraperService(session=db_session)
    html_content = "<html><body><article>" + "<p>LangGraph robust multi-agent architecture details. </p>" * 30 + "</article></body></html>"

    call_count = 0
    async def slow_get(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.05)
        return Response(200, text=html_content, request=Request("GET", sample_article_scoped.url))

    with patch("httpx.AsyncClient.get", side_effect=slow_get):
        results = await asyncio.gather(*[
            scraper.get_article_content(sample_article_scoped)
            for _ in range(5)
        ])
        assert len(results) == 5
        assert all(r is not None and len(r) >= 500 for r in results)
        assert call_count == 1  # Only 1 network request fired


@pytest.mark.asyncio
async def test_agentic_search_sufficiency_and_anchoring(sample_article_scoped: NewsItem):
    """
    Test AgenticSearchService:
    1. Missing installation / setup commands triggers is_sufficient = False.
    2. Anchored sub-queries must include article entity title / tech stack prefix.
    3. Maximum of 2 sub-queries allowed.
    """
    searcher = AgenticSearchService()
    scraped_content = "LangGraph v0.3 introduces StateGraph with checkpointers. No install commands or pip commands are discussed."

    question = "LangGraph v0.3를 실제로 설치하고 로컬 SQLite로 시작하는 pip 명령어와 설정 방법을 알려줘."
    eval_res: SufficiencyEvaluationResult = await searcher.evaluate_sufficiency(
        question=question,
        article_title=sample_article_scoped.title,
        tech_stack=sample_article_scoped.tech_stack,
        scraped_content=scraped_content,
    )

    assert eval_res.is_sufficient is False
    assert len(eval_res.queries) >= 1
    assert len(eval_res.queries) <= 2
    # Check context anchoring: either title or tech stack prefix present
    first_q = eval_res.queries[0]
    assert "LangGraph" in first_q


@pytest.mark.asyncio
async def test_agentic_search_relevance_filtering():
    """
    Test AgenticSearchService relevance filtering:
    - Items with relevance < 0.60 are filtered out.
    - Top items >= 0.60 are formatted as SupplementarySourceItem with [S1], [S2] indices.
    """
    searcher = AgenticSearchService()
    mock_candidates = [
        {"title": "LangGraph Official Installation & Quickstart", "url": "https://python.langchain.com/docs/langgraph/install", "snippet": "pip install -U langgraph langchain-core", "score": 0.92},
        {"title": "LangGraph SQLite Checkpointer API Reference", "url": "https://langchain-ai.github.io/langgraph/reference/checkpointers", "snippet": "from langgraph.checkpoint.sqlite import SqliteSaver", "score": 0.78},
        {"title": "Totally Unrelated Weather API in Python", "url": "https://weather.example.com", "snippet": "Get current weather with requests", "score": 0.35},
    ]

    with patch.object(searcher, "_search_web_candidates", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_candidates

        supp_sources = await searcher.search_supplementary(
            queries=["LangGraph official installation pip quickstart"],
            topic_context="LangGraph Multi-Agent Workflows v0.3",
        )

        assert len(supp_sources) == 2
        assert supp_sources[0].index == "S1"
        assert supp_sources[0].type == "supplementary"
        assert supp_sources[0].relevance_score >= 0.60
        assert supp_sources[1].index == "S2"
        assert supp_sources[1].type == "supplementary"


@pytest.mark.asyncio
async def test_chat_scoped_sse_agentic_lifecycle(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Test ChatService.stream_chat in Scoped mode emits the complete v2.4 SSE protocol:
    1. event: status (extracting_source, 20%)
    2. event: status (evaluating_sufficiency, 45%)
    3. event: status (agentic_searching, 65%)
    4. event: status (synthesizing, 85%)
    5. event: sources (primary [1] + supplementary [S1], primary_count: 1, supplementary_count: >= 1)
    6. event: token (streamed tokens with 4 mandatory engineering sections)
    7. event: done (done: true, primary_count, supplementary_count)
    """
    chat_service = ChatService(db_session)

    req = ChatStreamRequest(
        question="LangGraph v0.3의 내부 아키텍처와 실제 설치 및 실행 코드를 자세히 분석해줘.",
        scope="scoped",
        source_id=sample_article_scoped.id,
    )

    # Mock scraper & agentic search
    mock_scraped_text = (
        "## LangGraph Architecture\n"
        "LangGraph models agent execution as a state machine where nodes represent compute steps and edges represent transitions. "
        * 15
    )
    mock_supp = [
        ChatSourceItem(
            index="S1",
            type="supplementary",
            title="LangGraph Installation Docs",
            url="https://python.langchain.com/langgraph/install",
            source="web_search",
            snippet="pip install -U langgraph",
            domain="python.langchain.com",
            relevance_score=0.88,
        )
    ]

    with patch("app.services.scraper.ArticleScraperService.get_article_content", new_callable=AsyncMock) as mock_scrape, \
         patch("app.services.agentic_search.AgenticSearchService.evaluate_and_search", new_callable=AsyncMock) as mock_eval_search, \
         patch("app.services.llm_processor.llm_processor.check_provider_available", return_value=(True, "mock-gemini")), \
         patch("app.services.llm_processor.llm_processor.stream_tokens") as mock_stream_tokens:

        mock_scrape.return_value = mock_scraped_text
        mock_eval_search.return_value = (
            False,
            ["LangGraph v0.3 pip install official"],
            mock_supp
        )

        async def fake_tokens(prompt: str):
            yield "## 1. 핵심 아키텍처 및 동작 원리\nLangGraph는 상태 머신 기반입니다[1].\n", "mock-gemini"
            yield "## 2. 주요 기능 및 코드 구현 예시\n```python\npip install langgraph\n```[S1]\n", "mock-gemini"
            yield "## 3. 기존 기술 대비 차별점 및 벤치마크\n2배 빠릅니다[1].\n", "mock-gemini"
            yield "## 4. 실무 도입 시 고려사항 및 튜닝 파라미터\n체크포인터 설정에 주의하세요.\n", "mock-gemini"

        mock_stream_tokens.side_effect = fake_tokens

        events = []
        async for chunk in chat_service.stream_chat(req):
            events.append(chunk)

        full_stream = "".join(events)
        assert "event: status" in full_stream
        assert "extracting_source" in full_stream
        assert "evaluating_sufficiency" in full_stream
        assert "agentic_searching" in full_stream
        assert "synthesizing" in full_stream

        assert "event: sources" in full_stream
        assert '"primary_count": 1' in full_stream
        assert '"supplementary_count": 1' in full_stream
        assert '"index": 1' in full_stream
        assert '"index": "S1"' in full_stream

        assert "event: token" in full_stream
        assert "## 1. 핵심 아키텍처 및 동작 원리" in full_stream

        assert "event: done" in full_stream
        assert '"done": true' in full_stream
        assert '"primary_count": 1' in full_stream
        assert '"supplementary_count": 1' in full_stream


@pytest.mark.asyncio
async def test_chat_scoped_graceful_degradation_when_scrape_fails(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Test ChatService graceful degradation:
    When article scraping fails (403, timeout, etc.), it notifies via status event
    and degrades gracefully to article summary and web search without crashing.
    """
    chat_service = ChatService(db_session)
    req = ChatStreamRequest(
        question="LangGraph v0.3를 어떻게 사용하나요?",
        scope="scoped",
        source_id=sample_article_scoped.id,
    )

    with patch("app.services.scraper.ArticleScraperService.get_article_content", side_effect=ScrapeBlockedException("HTTP 403 Forbidden")), \
         patch("app.services.agentic_search.AgenticSearchService.evaluate_and_search", new_callable=AsyncMock) as mock_eval_search, \
         patch("app.services.llm_processor.llm_processor.check_provider_available", return_value=(True, "mock-gemini")), \
         patch("app.services.llm_processor.llm_processor.stream_tokens") as mock_stream_tokens:

        mock_eval_search.return_value = (
            False,
            ["LangGraph official guide"],
            [
                ChatSourceItem(
                    index="S1",
                    type="supplementary",
                    title="LangGraph Supplementary Guide",
                    url="https://example.com/supp",
                    source="web_search",
                    snippet="Supplementary info",
                    domain="example.com",
                    relevance_score=0.85
                )
            ]
        )

        async def fake_tokens(prompt: str):
            yield "## 1. 핵심 아키텍처 및 동작 원리\n요약 기반 분석입니다[1].", "mock-gemini"

        mock_stream_tokens.side_effect = fake_tokens

        events = []
        async for chunk in chat_service.stream_chat(req):
            events.append(chunk)

        full_stream = "".join(events)
        # Should not crash with event: error, but succeed gracefully
        assert "event: error" not in full_stream
        assert "event: status" in full_stream
        assert "event: sources" in full_stream
        assert "event: done" in full_stream


@pytest.mark.asyncio
async def test_article_scraper_readability_fallback_when_trafilatura_fails(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Verify ArticleScraperService uses readability-lxml + BeautifulSoup fallback
    when trafilatura returns None or <500 chars.
    """
    scraper = ArticleScraperService(session=db_session)
    html_with_boilerplate = (
        "<html><head><title>Test</title></head><body>"
        "<div class='ad'>Ad Banner</div>"
        "<main><article><p>" + "Readability extracted production architecture and guidelines. " * 30 + "</p></article></main>"
        "<footer>Footer Links</footer>"
        "</body></html>"
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
         patch("trafilatura.extract", return_value=None):
        mock_get.return_value = Response(200, text=html_with_boilerplate, request=Request("GET", sample_article_scoped.url))
        content = await scraper.fetch_and_parse(sample_article_scoped.url)
        assert content is not None
        assert len(content) >= 500
        assert "Readability" in content


@pytest.mark.asyncio
async def test_article_scraper_empty_content_exception(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Verify ScrapeEmptyContentException when both trafilatura and readability extract <500 chars.
    """
    scraper = ArticleScraperService(session=db_session)
    empty_html = "<html><body><p>Too short page.</p></body></html>"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = Response(200, text=empty_html, request=Request("GET", sample_article_scoped.url))
        with pytest.raises(ScrapeEmptyContentException):
            await scraper.fetch_and_parse(sample_article_scoped.url)


@pytest.mark.asyncio
async def test_agentic_search_sufficiency_true_when_content_already_answers(sample_article_scoped: NewsItem):
    """
    Verify is_sufficient = True when content already contains full installation and answers.
    """
    searcher = AgenticSearchService()
    rich_content = (
        "LangGraph installation: run `pip install -U langgraph` to install. "
        "Initialize your graph with StateGraph. " * 20
    )
    res = await searcher.evaluate_sufficiency(
        question="LangGraph 설치하는 pip 명령어가 뭐야?",
        article_title=sample_article_scoped.title,
        tech_stack=sample_article_scoped.tech_stack,
        scraped_content=rich_content,
    )
    assert res.is_sufficient is True
    assert len(res.queries) == 0


@pytest.mark.asyncio
async def test_chat_query_scoped_with_agentic_workflow_success(db_session: AsyncSession, sample_article_scoped: NewsItem):
    """
    Verify synchronous query_chat in Scoped mode returns dual sources,
    primary_count=1, supplementary_count>=1, and 4-tier structured answer.
    """
    chat_service = ChatService(db_session)
    req = ChatQueryRequest(
        question="LangGraph v0.3 상세 분석 및 시작 코드",
        scope="scoped",
        source_id=sample_article_scoped.id,
    )

    mock_content = "LangGraph v0.3 comprehensive guide. " * 30
    mock_supp = [
        ChatSourceItem(
            index="S1",
            type="supplementary",
            title="LangGraph Quickstart",
            url="https://example.com/quickstart",
            source="web_search",
            snippet="pip install langgraph",
            relevance_score=0.9
        )
    ]

    with patch("app.services.scraper.ArticleScraperService.get_article_content", new_callable=AsyncMock, return_value=mock_content), \
         patch("app.services.agentic_search.AgenticSearchService.evaluate_and_search", new_callable=AsyncMock, return_value=(False, ["LangGraph pip install"], mock_supp)), \
         patch("app.services.llm_processor.llm_processor.generate_live_answer", new_callable=AsyncMock) as mock_gen:

        mock_gen.return_value = (
            "## 1. 핵심 아키텍처 및 동작 원리\n상태 머신[1]\n## 2. 주요 기능 및 코드 구현 예시\n코드[S1]\n## 3. 기존 기술 대비 차별점 및 벤치마크\n차별점\n## 4. 실무 도입 시 고려사항 및 튜닝 파라미터\n주의점",
            "gemini-2.5-flash"
        )

        res = await chat_service.query_chat(req)
        assert res.scope == "scoped"
        assert res.primary_count == 1
        assert res.supplementary_count == 1
        assert len(res.sources) == 2
        assert res.sources[0].index == 1
        assert res.sources[0].type == "primary"
        assert res.sources[1].index == "S1"
        assert res.sources[1].type == "supplementary"
        assert "## 1. 핵심 아키텍처 및 동작 원리" in res.answer


@pytest.mark.asyncio
async def test_agentic_search_comparison_and_patch_triggers():
    """Verify comparison (vs) and patch/changelog triggers."""
    searcher = AgenticSearchService()

    # Comparison trigger
    res_comp = await searcher.evaluate_sufficiency(
        question="LangGraph vs AutoGen vs CrewAI 성능 차이점 비교 분석",
        article_title="LangGraph Overview",
        tech_stack="Python, LangGraph",
        scraped_content="LangGraph is a library for building stateful, multi-actor applications with LLMs.",
    )
    assert res_comp.is_sufficient is False
    assert "comparison_benchmarks" in res_comp.missing_aspects
    assert any("comparison" in q for q in res_comp.queries)

    # Patch / Changelog trigger
    res_patch = await searcher.evaluate_sufficiency(
        question="LangGraph v0.3 최신 릴리즈 패치 내역 및 브레이킹 체인지",
        article_title="LangGraph Overview",
        tech_stack="Python, LangGraph",
        scraped_content="LangGraph basic overview without version notes.",
    )
    assert res_patch.is_sufficient is False
    assert "patch_changelog" in res_patch.missing_aspects
    assert any("release notes" in q for q in res_patch.queries)


@pytest.mark.asyncio
async def test_agentic_search_web_candidates_and_relevance():
    """Verify web candidate search parsing and keyword relevance calculation."""
    searcher = AgenticSearchService()

    # Calculate relevance test
    cand_high = {"title": "LangGraph StateGraph Architecture", "snippet": "Detailed graph state guide"}
    score_high = searcher._calculate_relevance(cand_high, "LangGraph StateGraph Multi-Agent")
    assert score_high >= 0.60

    cand_low = {"title": "Cooking Recipes for Soup", "snippet": "Tomato soup in 15 minutes"}
    score_low = searcher._calculate_relevance(cand_low, "LangGraph StateGraph Multi-Agent")
    assert score_low < 0.60

    # Search candidates with mock
    mock_ddg_response = {
        "Heading": "LangGraph Python",
        "AbstractText": "LangGraph is a stateful multi-agent framework.",
        "AbstractURL": "https://python.langchain.com/langgraph",
        "RelatedTopics": [
            {
                "Text": "LangGraph GitHub - Official Repo",
                "FirstURL": "https://github.com/langchain-ai/langgraph"
            }
        ]
    }
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = Response(200, json=mock_ddg_response, request=Request("GET", "https://api.duckduckgo.com/"))
        cands = await searcher._search_web_candidates("LangGraph official")
        assert len(cands) >= 1
        assert any("langgraph" in c["url"].lower() for c in cands)


