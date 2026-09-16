import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.sources_service import sources_service

HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search_by_date"

async def fetch_hackernews() -> List[Dict[str, Any]]:
    hn_cfg = sources_service.get_hackernews_config()
    if not hn_cfg.get("enabled", True):
        return []

    queries = hn_cfg.get("queries", ["AI agent", "Model Context Protocol", "agent harness"])
    items = []
    seen = set()
    async with httpx.AsyncClient(timeout=10.0) as client:
        for q in queries:
            try:
                resp = await client.get(HN_SEARCH_URL, params={"query": q, "tags": "story", "hitsPerPage": 12})
                if resp.status_code != 200:
                    continue
                for hit in resp.json().get("hits", []):
                    url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
                    if url in seen:
                        continue
                    seen.add(url)
                    try:
                        pub_date = datetime.fromisoformat(hit.get("created_at").replace("Z", "+00:00"))
                    except Exception:
                        pub_date = datetime.now(timezone.utc)
                    items.append({
                        "title": hit.get("title", ""),
                        "url": url,
                        "source": "hackernews",
                        "summary": hit.get("story_text") or f"Hacker News discussion ({hit.get('points', 0)} pts, {hit.get('num_comments', 0)} comments)",
                        "author": hit.get("author", "hn_user"),
                        "published_at": pub_date,
                        "raw_score": hit.get("points", 0) or 0,
                        "comments_count": hit.get("num_comments", 0) or 0,
                    })
            except Exception:
                continue
    return items
