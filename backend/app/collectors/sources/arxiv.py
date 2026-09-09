import httpx
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.sources_service import sources_service

ARXIV_API_URL = "http://export.arxiv.org/api/query"

async def fetch_arxiv() -> List[Dict[str, Any]]:
    arxiv_cfg = sources_service.get_arxiv_config()
    if not arxiv_cfg.get("enabled", True):
        return []

    queries = arxiv_cfg.get("queries", ['all:"agent harness" OR all:"agent evaluation"'])
    items = []
    seen = set()
    async with httpx.AsyncClient(timeout=12.0) as client:
        for q in queries:
            try:
                resp = await client.get(ARXIV_API_URL, params={"search_query": q, "start": 0, "max_results": 8, "sortBy": "submittedDate", "sortOrder": "descending"})
                if resp.status_code != 200:
                    continue
                root = ET.fromstring(resp.text)
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                for entry in root.findall("atom:entry", ns):
                    id_elem = entry.find("atom:id", ns)
                    url = id_elem.text.strip() if id_elem is not None else ""
                    if not url or url in seen:
                        continue
                    seen.add(url)
                    title_elem = entry.find("atom:title", ns)
                    title = " ".join(title_elem.text.split()) if title_elem is not None else "Untitled Paper"
                    summary_elem = entry.find("atom:summary", ns)
                    summary = " ".join(summary_elem.text.split()) if summary_elem is not None else ""
                    pub_elem = entry.find("atom:published", ns)
                    try:
                        pub_date = datetime.fromisoformat(pub_elem.text.replace("Z", "+00:00"))
                    except Exception:
                        pub_date = datetime.now(timezone.utc)
                    items.append({
                        "title": f"[arXiv] {title}",
                        "url": url,
                        "source": "arxiv",
                        "summary": summary[:350] + ("..." if len(summary) > 350 else ""),
                        "author": "arXiv Researcher",
                        "published_at": pub_date,
                        "raw_score": 120,
                        "comments_count": 0,
                    })
            except Exception:
                continue
    return items
