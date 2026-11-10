import json
from sqlalchemy import select, desc
from app.database import AsyncSessionLocal, ensure_db_schema
from app.models.news import NewsItem
from app.collectors.manager import collector_manager

try:  # mcp 2.x 는 FastMCP 를 MCPServer 로 바꿨다. requirements 는 mcp>=1.0.0 이라 둘 다 받는다
    from mcp.server.mcpserver import MCPServer as _Server
except ImportError:  # mcp 1.x
    from mcp.server.fastmcp import FastMCP as _Server

mcp = _Server("AgentLens-MCP-Server")

# 별도 프로세스로 뜨므로 backend 와 같은 DB 경로(settings.DATABASE_URL)에 스키마를 직접 만든다 (ARCH-04).
# 수집 중복 방지는 collector_manager.collect_all 의 프로세스 사이 파일 잠금이 맡는다 (D-40).
_schema_ready = False


async def _ensure_schema() -> None:
    global _schema_ready
    if not _schema_ready:
        await ensure_db_schema()
        _schema_ready = True

@mcp.tool()
async def get_latest_harness_methods(limit: int = 10) -> str:
    """Retrieve the latest agent harness methodologies, benchmarks (SWE-bench, GAIA), testbeds, and eval frameworks."""
    await _ensure_schema()
    async with AsyncSessionLocal() as session:
        q = select(NewsItem).where(NewsItem.category == "harness").order_by(desc(NewsItem.hotness_score)).limit(limit)
        res = await session.execute(q)
        items = res.scalars().all()
        return json.dumps([{"title": i.title, "url": i.url, "summary": i.summary, "hotness": i.hotness_score} for i in items], ensure_ascii=False, indent=2)

@mcp.tool()
async def get_mcp_and_skills_ecosystem(limit: int = 10) -> str:
    """Retrieve trending Model Context Protocol (MCP) servers, tools, skills, and plugins."""
    await _ensure_schema()
    async with AsyncSessionLocal() as session:
        q = select(NewsItem).where(NewsItem.category == "mcp_plugins_skills").order_by(desc(NewsItem.hotness_score)).limit(limit)
        res = await session.execute(q)
        items = res.scalars().all()
        return json.dumps([{"title": i.title, "url": i.url, "summary": i.summary, "hotness": i.hotness_score} for i in items], ensure_ascii=False, indent=2)

@mcp.tool()
async def search_agent_news(query: str, category: str = "all", limit: int = 10) -> str:
    """Search global AI news, agent tech, harness methods, and MCP tools."""
    await _ensure_schema()
    async with AsyncSessionLocal() as session:
        db_q = select(NewsItem)
        if category != "all":
            db_q = db_q.where(NewsItem.category == category)
        if query:
            term = f"%{query}%"
            db_q = db_q.where(NewsItem.title.ilike(term) | NewsItem.summary.ilike(term))
        db_q = db_q.order_by(desc(NewsItem.hotness_score)).limit(limit)
        res = await session.execute(db_q)
        items = res.scalars().all()
        return json.dumps([{"title": i.title, "url": i.url, "category": i.category, "summary": i.summary, "hotness": i.hotness_score} for i in items], ensure_ascii=False, indent=2)

@mcp.tool()
async def trigger_agentlens_crawl() -> str:
    """Trigger an immediate global crawl across all sources."""
    await _ensure_schema()
    res = await collector_manager.collect_all()
    return json.dumps(res, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    mcp.run()
