import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.sources_service import sources_service

async def fetch_reddit() -> List[Dict[str, Any]]:
    reddit_cfg = sources_service.get_reddit_config()
    if not reddit_cfg.get("enabled", True):
        return []

    subreddits = reddit_cfg.get("subreddits", ["LocalLLaMA", "MachineLearning"])
    keywords = reddit_cfg.get("keywords", ["agent", "harness", "mcp", "eval", "tool", "llm"])

    items = []
    headers = {"User-Agent": "AgentLens-Collector/1.0"}
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        for sub in subreddits:
            try:
                resp = await client.get(f"https://www.reddit.com/r/{sub}/hot.json?limit=12")
                if resp.status_code != 200:
                    continue
                for post in resp.json().get("data", {}).get("children", []):
                    p = post.get("data", {})
                    title = p.get("title", "")
                    if not any(k in title.lower() for k in keywords):
                        continue
                    pub_date = datetime.fromtimestamp(p.get("created_utc", 0), tz=timezone.utc)
                    items.append({
                        "title": f"[r/{sub}] {title}",
                        "url": f"https://www.reddit.com{p.get('permalink', '')}",
                        "source": "reddit",
                        "summary": (p.get("selftext", "")[:300]) or f"Reddit discussion on r/{sub}",
                        "author": f"u/{p.get('author', 'redditor')}",
                        "published_at": pub_date,
                        "raw_score": p.get("score", 0),
                        "comments_count": p.get("num_comments", 0),
                    })
            except Exception:
                continue
    return items
