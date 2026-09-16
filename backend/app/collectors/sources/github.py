import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.services.sources_service import sources_service

GITHUB_SEARCH_URL = "https://api.github.com/search/repositories"

async def fetch_github() -> List[Dict[str, Any]]:
    gh_config = sources_service.get_github_config()
    if not gh_config.get("enabled", True):
        return []

    queries = gh_config.get("search_queries", [])
    monitored_repos = gh_config.get("monitored_repos", [])

    items = []
    seen = set()
    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "AgentLens-Collector/1.0"}

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        for q in queries:
            try:
                resp = await client.get(GITHUB_SEARCH_URL, params={"q": q, "sort": "updated", "order": "desc", "per_page": 8})
                if resp.status_code != 200:
                    continue
                for repo in resp.json().get("items", []):
                    url = repo.get("html_url")
                    if not url or url in seen:
                        continue
                    seen.add(url)
                    try:
                        pub_date = datetime.fromisoformat(repo.get("updated_at").replace("Z", "+00:00"))
                    except Exception:
                        pub_date = datetime.now(timezone.utc)
                    desc = repo.get("description") or "Open-source agent repository"
                    items.append({
                        "title": f"{repo.get('full_name')}: {desc[:100]}",
                        "url": url,
                        "source": "github",
                        "summary": desc,
                        "author": repo.get("owner", {}).get("login", "github"),
                        "published_at": pub_date,
                        "raw_score": repo.get("stargazers_count", 0) or 0,
                        "comments_count": repo.get("forks_count", 0) or 0,
                    })
            except Exception:
                continue

    # Fallback/enrich with monitored repositories from sources.json
    if len(items) < 5 and monitored_repos:
        now = datetime.now(timezone.utc)
        for entry in monitored_repos:
            repo_name = entry.get("repo", "")
            if not repo_name:
                continue
            url = f"https://github.com/{repo_name}"
            if url not in seen:
                seen.add(url)
                desc = entry.get("description", "Open-source repository")
                stars = entry.get("stars_hint", 5000)
                items.append({
                    "title": f"{repo_name}: {desc[:110]}",
                    "url": url,
                    "source": "github",
                    "summary": desc,
                    "author": repo_name.split("/")[0] if "/" in repo_name else "github",
                    "published_at": now,
                    "raw_score": stars,
                    "comments_count": int(stars * 0.12),
                })

    return items
