import sys, os
from fastapi import APIRouter

router = APIRouter(prefix="/mcp", tags=["MCP"])

@router.get("/info")
async def get_mcp_info():
    py_path = sys.executable
    return {
        "name": "AgentLens MCP Server",
        "description": "Model Context Protocol server exposing tools for AI Agent, Harness, and MCP news.",
        "tools": [
            {"name": "get_latest_harness_methods", "description": "Retrieve SWE-bench, test harnesses, and eval methods"},
            {"name": "get_mcp_and_skills_ecosystem", "description": "Retrieve trending MCP servers, skills, and tools"},
            {"name": "search_agent_news", "description": "Search global AI news and agent tech"},
            {"name": "trigger_agentlens_crawl", "description": "Trigger an immediate global crawl"}
        ],
        "claude_desktop_config": {
            "mcpServers": {
                "agentlens": {
                    "command": py_path,
                    "args": ["-m", "app.mcp.server"],
                    "cwd": os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
                }
            }
        }
    }
