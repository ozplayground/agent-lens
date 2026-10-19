import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import Response
from datetime import datetime, timezone, timedelta
from app.database import AsyncSessionLocal
from app.models.news import NewsItem
from app.services.retriever import SqliteFtsRetriever, KnowledgeRetrieverFacade
from app.services.llm_processor import llm_processor, LLMUpstreamException, LLMProviderUnavailableException
from app.config import settings, find_config_json


@pytest.fixture(autouse=True)
async def seed_distinct_rag_articles():
    """Ensure distinct articles for Claude, MCP, and Benchmark exist in the test DB."""
    async with AsyncSessionLocal() as session:
        test_items = [
            {
                "id": 9001,
                "title": "Anthropic Claude 3.7 Sonnet Hybrid Reasoning Architecture",
                "url": "https://anthropic.com/news/claude-3-7-sonnet",
                "source": "anthropic",
                "category": "ai_news",
                "summary": "Anthropic releases Claude 3.7 Sonnet featuring hybrid standard and extended thinking reasoning modes.",
                "why_it_matters": "Enables developers to dynamically adjust reasoning budget for coding agent harnesses.",
                "tech_stack": "Claude 3.7, Anthropic, Python, Reasoning",
                "tags": "claude, anthropic, reasoning, sonnet",
                "quality_score": 9.5,
                "is_high_signal": True,
                "published_at": datetime.now(timezone.utc) - timedelta(hours=1),
                "dedup_hash": "hash_claude_9001",
            },
            {
                "id": 9002,
                "title": "Model Context Protocol (MCP) Standard Specification v1.0",
                "url": "https://modelcontextprotocol.io/spec",
                "source": "github",
                "category": "mcp_plugins_skills",
                "summary": "The Model Context Protocol establishes an open standard for secure client-to-server AI tool integrations.",
                "why_it_matters": "Unifies plugin and skill architectures across agent frameworks and local tools.",
                "tech_stack": "MCP, FastMCP, TypeScript, Protocol",
                "tags": "mcp, protocol, tools, fastmcp",
                "quality_score": 9.4,
                "is_high_signal": True,
                "published_at": datetime.now(timezone.utc) - timedelta(hours=2),
                "dedup_hash": "hash_mcp_9002",
            },
            {
                "id": 9003,
                "title": "SWE-bench Verified Coding Agent Benchmark Evaluation Harness",
                "url": "https://swebench.com/verified",
                "source": "github",
                "category": "harness",
                "summary": "SWE-bench Verified provides human-validated benchmark test cases for autonomous software engineering agents.",
                "why_it_matters": "Serves as the gold standard benchmark for real-world software engineering agent performance.",
                "tech_stack": "SWE-bench, Benchmark, Docker, Python",
                "tags": "benchmark, swe-bench, evals, harness",
                "quality_score": 9.6,
                "is_high_signal": True,
                "published_at": datetime.now(timezone.utc) - timedelta(hours=3),
                "dedup_hash": "hash_benchmark_9003",
            },
        ]

        for item_data in test_items:
            existing = await session.get(NewsItem, item_data["id"])
            if not existing:
                session.add(NewsItem(**item_data))
            else:
                for k, v in item_data.items():
                    setattr(existing, k, v)
        await session.commit()
    yield


@pytest.mark.asyncio
async def test_dynamic_rag_retrieval_returns_distinct_articles_by_query():
    """Verify that different technical queries dynamically return distinct and relevant articles."""
    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        await retriever._ensure_fts_table()

        claude_results = await retriever.retrieve("Claude", top_k=3)
        mcp_results = await retriever.retrieve("MCP", top_k=3)
        bench_results = await retriever.retrieve("Benchmark", top_k=3)

        assert len(claude_results) > 0, "Claude search should return results"
        assert len(mcp_results) > 0, "MCP search should return results"
        assert len(bench_results) > 0, "Benchmark search should return results"

        # Verify relevance of top results
        assert any("claude" in (c.title + c.snippet).lower() for c in claude_results)
        assert any("mcp" in (c.title + c.snippet).lower() for c in mcp_results)
        assert any("bench" in (c.title + c.snippet).lower() for c in bench_results)

        # Dynamic retrieval check: top-1 IDs must be completely different
        claude_top_id = claude_results[0].id
        mcp_top_id = mcp_results[0].id
        bench_top_id = bench_results[0].id

        assert claude_top_id != mcp_top_id, "Claude and MCP top results must not be identical"
        assert claude_top_id != bench_top_id, "Claude and Benchmark top results must not be identical"
        assert mcp_top_id != bench_top_id, "MCP and Benchmark top results must not be identical"


@pytest.mark.asyncio
async def test_conversational_queries_extract_keywords_and_return_distinct_articles():
    """Verify conversational queries with Korean stopwords dynamically return relevant articles."""
    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        await retriever._ensure_fts_table()

        claude_conv = await retriever.retrieve("최신 Claude 관련 소식 알려줘", top_k=3)
        mcp_conv = await retriever.retrieve("최신 MCP 관련 소식 알려줘", top_k=3)
        bench_conv = await retriever.retrieve("최신 Benchmark 관련 소식 알려줘", top_k=3)

        assert len(claude_conv) > 0
        assert len(mcp_conv) > 0
        assert len(bench_conv) > 0

        # Verify that top results match the subject keyword despite stopwords
        assert any("claude" in (c.title + c.snippet).lower() for c in claude_conv)
        assert any("mcp" in (c.title + c.snippet).lower() for c in mcp_conv)
        assert any("bench" in (c.title + c.snippet).lower() for c in bench_conv)

        # IDs must be different across the three queries
        assert claude_conv[0].id != mcp_conv[0].id
        assert claude_conv[0].id != bench_conv[0].id
        assert mcp_conv[0].id != bench_conv[0].id


@pytest.mark.asyncio
async def test_ensure_fts_table_creates_table_and_indexes_items():
    """Verify _ensure_fts_table creates news_fts and synchronizes index with news_items."""
    from sqlalchemy import text
    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        await retriever._ensure_fts_table()

        # Check virtual table exists
        res = await session.execute(text("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='news_fts';"))
        assert res.scalar() == 1, "news_fts virtual table must exist"

        # Check index is populated
        fts_cnt = (await session.execute(text("SELECT count(*) FROM news_fts;"))).scalar()
        items_cnt = (await session.execute(text("SELECT count(*) FROM news_items;"))).scalar()
        assert fts_cnt >= items_cnt, f"news_fts count ({fts_cnt}) should match news_items ({items_cnt})"


@pytest.mark.asyncio
async def test_sql_like_fallback_ranks_by_relevance_when_fts_fails():
    """Verify SQL LIKE fallback uses sanitized keywords and relevance ranking when FTS5 is bypassed."""
    async with AsyncSessionLocal() as session:
        retriever = SqliteFtsRetriever(session)
        # Patch _sanitize_fts_query or simulate FTS5 match failure
        with patch.object(retriever, "_sanitize_fts_query", return_value="INVALID_FTS_QUERY_TRIGGERING_FALLBACK"):
            claude_fb = await retriever.retrieve("최신 Claude 관련 소식 알려줘", top_k=3)
            mcp_fb = await retriever.retrieve("최신 MCP 관련 소식 알려줘", top_k=3)

            assert len(claude_fb) > 0
            assert len(mcp_fb) > 0
            assert claude_fb[0].id != mcp_fb[0].id, "Fallback must return distinct top articles for different queries"
            assert any("claude" in (c.title + c.snippet).lower() for c in claude_fb)
            assert any("mcp" in (c.title + c.snippet).lower() for c in mcp_fb)


@pytest.mark.asyncio
async def test_gemini_call_restored_and_invokes_specified_model():
    """Verify _call_gemini is restored and honestly invokes the specified model without silent priority fallback."""
    fake_gemini_resp = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "Gemini 3.5 Flash-lite analysis report."}
                    ]
                }
            }
        ]
    }

    mock_resp = Response(
        status_code=200,
        json=fake_gemini_resp,
        request=MagicMock()
    )
    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    mock_client.__aenter__.return_value = mock_client
    mock_client.__aexit__.return_value = None

    with patch("httpx.AsyncClient", return_value=mock_client), \
         patch.object(settings, "GEMINI_API_KEY", "test-gemini-key-xyz"), \
         patch.object(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite"):

        ans, model_name = await llm_processor._call_gemini(
            prompt="Explain MCP architecture",
            model="gemini-3.5-flash-lite"
        )

        assert ans == "Gemini 3.5 Flash-lite analysis report."
        assert model_name == "Google gemini-3.5-flash-lite"

        # Verify honest calling: post URL must call the exact specified model
        call_url = mock_client.post.call_args[0][0]
        assert "models/gemini-3.5-flash-lite:generateContent" in call_url
        assert "key=test-gemini-key-xyz" in call_url


@pytest.mark.asyncio
async def test_generate_live_answer_honestly_routes_to_gemini_when_requested():
    """Verify generate_live_answer routes to Gemini when gemini model is explicitly requested."""
    with patch.object(settings, "GEMINI_API_KEY", "test-gemini-key-xyz"), \
         patch.object(llm_processor, "_call_gemini", new_callable=AsyncMock) as mock_gemini:
        mock_gemini.return_value = ("Gemini Answer", "Google gemini-3.5-flash-lite")

        ans, model = await llm_processor.generate_live_answer(
            prompt="Test prompt",
            model="gemini-3.5-flash-lite"
        )

        assert ans == "Gemini Answer"
        assert model == "Google gemini-3.5-flash-lite"
        assert mock_gemini.call_count == 1


def test_version_0_2_2_consistency():
    """Verify version 0.2.2 is synchronized across configuration sources."""
    assert settings.VERSION == "0.2.2"
    cfg_path = find_config_json()
    assert cfg_path is not None
    with open(cfg_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data.get("app", {}).get("version") == "0.2.2"


