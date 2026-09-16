import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any
from collections import Counter
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.news import NewsItem

CATEGORY_MAP = {
    "Harness & Benchmark": [
        "SWE-bench", "SWE-bench Verified", "GAIA", "WebArena", "HumanEval",
        "Docker Sandbox", "Eval Harness", "Benchmark", "Aider", "Testbed",
        "Gymnasium", "AgentBench"
    ],
    "Protocols & Tooling": [
        "FastMCP", "MCP", "Model Context Protocol", "LangGraph", "CrewAI",
        "Browser-Use", "Autogen", "LlamaIndex", "Tool Calling", "Function Calling",
        "Semantic Kernel", "Pydantic AI"
    ],
    "Models & Reasoning": [
        "Claude 3.7", "Claude 3.5 Sonnet", "DeepSeek-R1", "DeepSeek-V3",
        "GPT-4.5", "GPT-4o", "Gemini 2.0", "Gemini 1.5 Pro", "Llama 3.3",
        "Reasoning Model", "o3-mini", "o1", "Qwen 2.5", "OpenAI", "Anthropic"
    ],
    "Infra & Runtime": [
        "vLLM", "Ollama", "SGLang", "LiteLLM", "Docker", "PyTorch", "Triton",
        "Hugging Face", "Ray", "Nvidia NIM", "CUDA"
    ]
}

def classify_tag_category(tag_name: str) -> str:
    tag_lower = tag_name.lower()
    for cat, keywords in CATEGORY_MAP.items():
        for kw in keywords:
            if kw.lower() == tag_lower or kw.lower() in tag_lower:
                return cat
    return "Protocols & Tooling"

class TrendService:
    async def get_tech_radar(self) -> Dict[str, Any]:
        async with AsyncSessionLocal() as session:
            stmt = select(NewsItem).order_by(NewsItem.published_at.desc()).limit(500)
            result = await session.execute(stmt)
            items = result.scalars().all()

        if not items:
            return {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "total_analyzed": 0,
                "surging_tags": [],
                "categories": [],
                "tags": []
            }

        now = datetime.now(timezone.utc)
        one_day_ago = now - timedelta(hours=24)

        all_counter = Counter()
        recent_counter = Counter()
        tag_sample_ids = {}

        for item in items:
            item_tags = []
            if item.tech_stack:
                for part in item.tech_stack.split(","):
                    p = part.strip()
                    if p and len(p) > 1:
                        item_tags.append(p)

            # Deduplicate per article
            unique_tags = set(item_tags)
            pub_at = item.published_at
            if pub_at and pub_at.tzinfo is None:
                pub_at = pub_at.replace(tzinfo=timezone.utc)

            is_recent = pub_at and (pub_at >= one_day_ago)

            for tag in unique_tags:
                all_counter[tag] += 1
                if is_recent:
                    recent_counter[tag] += 1
                if tag not in tag_sample_ids:
                    tag_sample_ids[tag] = item.id

        # Format tags list
        formatted_tags = []
        for tag, count in all_counter.most_common(25):
            cat = classify_tag_category(tag)
            recent_count = recent_counter[tag]
            # Velocity heuristic
            if recent_count >= 3:
                velocity = f"+{recent_count * 20}%"
            elif recent_count > 0:
                velocity = "+25%"
            elif count >= 8:
                velocity = "HOT"
            else:
                velocity = "STEADY"

            formatted_tags.append({
                "name": tag,
                "count": count,
                "category": cat,
                "recent_count": recent_count,
                "velocity": velocity,
                "sample_news_id": tag_sample_ids.get(tag)
            })

        # Surging tags: top by recent count or high velocity
        surging_tags = sorted(
            [t for t in formatted_tags if t["recent_count"] > 0 or t["count"] >= 5],
            key=lambda x: (x["recent_count"], x["count"]),
            reverse=True
        )[:6]

        # Category distribution
        category_counts = Counter()
        for item in formatted_tags:
            category_counts[item["category"]] += item["count"]

        total_cat_points = sum(category_counts.values()) or 1
        categories_data = [
            {
                "name": cat_name,
                "count": category_counts[cat_name],
                "percentage": round((category_counts[cat_name] / total_cat_points) * 100, 1)
            }
            for cat_name in CATEGORY_MAP.keys()
        ]

        return {
            "updated_at": now.isoformat(),
            "total_analyzed": len(items),
            "surging_tags": surging_tags,
            "categories": categories_data,
            "tags": formatted_tags
        }

trend_service = TrendService()
