import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.sources_service import sources_service

HF_PAPERS_URL = "https://huggingface.co/api/daily_papers"

async def fetch_huggingface() -> List[Dict[str, Any]]:
    if not sources_service.is_huggingface_enabled():
        return []
    items = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(HF_PAPERS_URL)
            if resp.status_code == 200:
                for paper in resp.json()[:12]:
                    p = paper.get("paper", {})
                    paper_id = p.get("id")
                    if not paper_id:
                        continue
                    try:
                        pub_date = datetime.fromisoformat(paper.get("publishedAt").replace("Z", "+00:00"))
                    except Exception:
                        pub_date = datetime.now(timezone.utc)
                    items.append({
                        "title": f"[HF Daily] {p.get('title', '')}",
                        "url": f"https://huggingface.co/papers/{paper_id}",
                        "source": "huggingface",
                        "summary": p.get("summary", "")[:300],
                        "author": "Hugging Face Daily Papers",
                        "published_at": pub_date,
                        "raw_score": paper.get("numComments", 0) + 40,
                        "comments_count": paper.get("numComments", 0),
                    })
        except Exception:
            pass
    return items
