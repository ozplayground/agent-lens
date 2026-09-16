import os
from pathlib import Path
import pytest

# Ensure tests use an isolated test database so agentlens.db is never wiped
TEST_DB_FILE = Path(__file__).resolve().parent / "test_agentlens.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

from app.database import engine, Base, AsyncSessionLocal
from app.models import NewsItem
from datetime import datetime, timezone

@pytest.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed at least one item for endpoints that query or ask AI
    async with AsyncSessionLocal() as session:
        existing = await session.get(NewsItem, 1)
        if not existing:
            import hashlib
            sample = NewsItem(
                id=1,
                title="LangGraph Harness Test Framework Released",
                url="https://github.com/example/langgraph-harness",
                summary="Test summary of LangGraph Harness framework.",
                source="github",
                category="harness",
                tags="agent,harness,python",
                quality_score=8.5,
                published_at=datetime.now(timezone.utc),
                is_high_signal=True,
                why_it_matters="This is a test insight for developers",
                tldr_bullets='["Harness testing", "Agent evaluation"]',
                tech_stack="Python, LangGraph",
                dedup_hash=hashlib.sha256("https://github.com/example/langgraph-harness".encode()).hexdigest(),
                hotness_score=9.5,
            )
            session.add(sample)
            try:
                await session.commit()
            except Exception:
                await session.rollback()
    yield

