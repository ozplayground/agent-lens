import json
from mcp.server.fastmcp import FastMCP
from sqlalchemy import select, desc
from app.database import AsyncSessionLocal
from app.models.news import NewsItem
from app.collectors.manager import collector_manager

mcp = FastMCP("AgentLens-MCP-Server")

@mcp.tool()
async def get_latest_harness_methods(limit: int = 10) -> str:
    """Retrieve the latest agent harness methodologies, benchmarks (SWE-bench, GAIA), testbeds, and eval frameworks."""
    async with AsyncSessionLocal() as session:
        q = select(NewsItem).where(NewsItem.category == "harness").order_by(desc(NewsItem.hotness_score)).limit(limit)
        res = await session.execute(q)
        items = res.scalars().all()
        return json.dumps([{"title": i.title, "url": i.url, "summary": i.summary, "hotness": i.hotness_score} for i in items], ensure_ascii=False, indent=2)

@mcp.tool()
async def get_mcp_and_skills_ecosystem(limit: int = 10) -> str:
    """Retrieve trending Model Context Protocol (MCP) servers, tools, skills, and plugins."""
    async with AsyncSessionLocal() as session:
        q = select(NewsItem).where(NewsItem.category == "mcp_plugins_skills").order_by(desc(NewsItem.hotness_score)).limit(limit)
        res = await session.execute(q)
        items = res.scalars().all()
        return json.dumps([{"title": i.title, "url": i.url, "summary": i.summary, "hotness": i.hotness_score} for i in items], ensure_ascii=False, indent=2)

@mcp.tool()
async def search_agent_news(query: str, category: str = "all", limit: int = 10) -> str:
    """Search global AI news, agent tech, harness methods, and MCP tools."""
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
    res = await collector_manager.collect_all()
    return json.dumps(res, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    mcp.run()
