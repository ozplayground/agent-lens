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

    # Fallback/enrich with monitored repositories from sources.json.
    # 저장소 API 의 실제 별·포크·최근 push 시각을 쓴다. 못 받으면 지표·시각을 지어내지 않고 건너뛴다 (BUG-18)
    if len(items) < 5 and monitored_repos:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            for entry in monitored_repos:
                repo_name = entry.get("repo", "")
                if not repo_name or f"https://github.com/{repo_name}" in seen:
                    continue
                try:
                    resp = await client.get(f"https://api.github.com/repos/{repo_name}")
                    if resp.status_code != 200:
                        continue
                    repo = resp.json()
                    pub_date = datetime.fromisoformat((repo.get("pushed_at") or repo["updated_at"]).replace("Z", "+00:00"))
                except Exception:
                    continue
                url = repo.get("html_url") or f"https://github.com/{repo_name}"
                seen.add(url)
                desc = repo.get("description") or entry.get("description") or "Open-source repository"
                items.append({
                    "title": f"{repo_name}: {desc[:110]}",
                    "url": url,
                    "source": "github",
                    "summary": desc,
                    "author": repo.get("owner", {}).get("login") or repo_name.split("/")[0],
                    "published_at": pub_date,
                    "raw_score": repo.get("stargazers_count", 0) or 0,
                    "comments_count": repo.get("forks_count", 0) or 0,
                })

    return items
