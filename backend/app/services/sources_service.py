import os
import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("agentlens.sources")

def find_sources_file() -> Path:
    candidates = [
        Path.cwd() / "sources.json",
        Path.cwd().parent / "sources.json",
        Path(__file__).resolve().parent.parent.parent.parent / "sources.json",
        Path(__file__).resolve().parent.parent / "config" / "sources.json",
    ]
    for p in candidates:
        if p.exists() and p.is_file():
            return p
    # Default fallback
    default_path = Path(__file__).resolve().parent.parent / "config" / "sources.json"
    default_path.parent.mkdir(parents=True, exist_ok=True)
    return default_path

class SourcesService:
    def __init__(self):
        self._file_path = find_sources_file()

    def get_file_path(self) -> Path:
        if not self._file_path.exists():
            self._file_path = find_sources_file()
        return self._file_path

    def load_sources(self) -> Dict[str, Any]:
        p = self.get_file_path()
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return self._normalize_sources(data)
            except Exception as e:
                logger.error(f"Failed to read sources file from {p}: {e}")
        return self._default_sources()

    def _normalize_sources(self, data: Dict[str, Any]) -> Dict[str, Any]:
        # Backwards compatibility: if data has "korean_sources" instead of "rss_feeds"
        if "rss_feeds" not in data:
            rss = []
            for sec in ["korean_sources", "harness_and_mcp_releases", "global_research_and_blogs"]:
                for item in data.get(sec, []):
                    item_id = re.sub(r'[^a-zA-Z0-9_]', '_', item.get("name", "feed").lower())
                    rss.append({
                        "id": item_id,
                        "name": item.get("name", ""),
                        "url": item.get("url", ""),
                        "site_url": item.get("site_url", ""),
                        "category_hint": item.get("category_hint", "ai_news"),
                        "country": item.get("country", "GLOBAL"),
                        "enabled": item.get("enabled", True),
                        "description": item.get("description", "")
                    })
            data["rss_feeds"] = rss

        if "github_sources" not in data:
            data["github_sources"] = {"enabled": True, "search_queries": [], "monitored_repos": []}
        if "reddit_sources" not in data:
            data["reddit_sources"] = {"enabled": True, "subreddits": ["LocalLLaMA", "MachineLearning"], "keywords": ["agent", "harness", "mcp"]}
        if "hackernews_sources" not in data:
            data["hackernews_sources"] = {"enabled": True, "queries": ["AI agent", "Model Context Protocol"]}
        if "arxiv_sources" not in data:
            data["arxiv_sources"] = {"enabled": True, "queries": ['all:"agent harness"']}
        if "huggingface_sources" not in data:
            data["huggingface_sources"] = {"enabled": True}

        return data

    def _default_sources(self) -> Dict[str, Any]:
        return {
            "version": "1.0.0",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "rss_feeds": [
                {
                    "id": "geeknews",
                    "name": "GeekNews (긱뉴스)",
                    "url": "https://news.hada.io/rss/news",
                    "site_url": "https://news.hada.io",
                    "category_hint": "ai_news",
                    "country": "KR",
                    "enabled": True,
                    "description": "국내 1위 개발자 및 AI 트렌드 큐레이션 커뮤니티"
                }
            ],
            "github_sources": {"enabled": True, "search_queries": ["topic:mcp-server"], "monitored_repos": []},
            "reddit_sources": {"enabled": True, "subreddits": ["LocalLLaMA"], "keywords": ["agent", "mcp"]},
            "hackernews_sources": {"enabled": True, "queries": ["AI agent"]},
            "arxiv_sources": {"enabled": True, "queries": ['all:"agent harness"']},
            "huggingface_sources": {"enabled": True}
        }

    def save_sources(self, data: Dict[str, Any]) -> bool:
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        p = self.get_file_path()
        try:
            temp_path = p.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            temp_path.replace(p)

            # Sync to fallback location if they are distinct
            fallback = Path(__file__).resolve().parent.parent / "config" / "sources.json"
            if fallback != p:
                try:
                    fallback.parent.mkdir(parents=True, exist_ok=True)
                    with open(fallback, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                except Exception:
                    pass
            return True
        except Exception as e:
            logger.error(f"Failed to write sources to {p}: {e}")
            return False

    def get_all_sources(self) -> Dict[str, Any]:
        return self.load_sources()

    def get_active_rss_feeds(self) -> List[Dict[str, Any]]:
        sources = self.load_sources()
        return [f for f in sources.get("rss_feeds", []) if f.get("enabled", True)]

    def get_github_config(self) -> Dict[str, Any]:
        sources = self.load_sources()
        gh = sources.get("github_sources", {})
        if not gh.get("enabled", True):
            return {"enabled": False, "search_queries": [], "monitored_repos": []}
        active_repos = [r for r in gh.get("monitored_repos", []) if r.get("enabled", True)]
        return {
            "enabled": True,
            "search_queries": gh.get("search_queries", []),
            "monitored_repos": active_repos
        }

    def get_reddit_config(self) -> Dict[str, Any]:
        sources = self.load_sources()
        return sources.get("reddit_sources", {"enabled": True, "subreddits": [], "keywords": []})

    def get_hackernews_config(self) -> Dict[str, Any]:
        sources = self.load_sources()
        return sources.get("hackernews_sources", {"enabled": True, "queries": []})

    def get_arxiv_config(self) -> Dict[str, Any]:
        sources = self.load_sources()
        return sources.get("arxiv_sources", {"enabled": True, "queries": []})

    def is_huggingface_enabled(self) -> bool:
        sources = self.load_sources()
        return sources.get("huggingface_sources", {}).get("enabled", True)

    def toggle_source(self, source_type: str, item_id: str) -> bool:
        sources = self.load_sources()
        modified = False

        if source_type == "rss":
            for f in sources.get("rss_feeds", []):
                if f.get("id") == item_id or f.get("url") == item_id:
                    f["enabled"] = not f.get("enabled", True)
                    modified = True
                    break
        elif source_type == "github_repo":
            for r in sources.get("github_sources", {}).get("monitored_repos", []):
                if r.get("repo") == item_id:
                    r["enabled"] = not r.get("enabled", True)
                    modified = True
                    break
        elif source_type in ["github", "reddit", "hackernews", "arxiv", "huggingface"]:
            key = f"{source_type}_sources"
            if key in sources:
                sources[key]["enabled"] = not sources[key].get("enabled", True)
                modified = True

        if modified:
            self.save_sources(sources)
        return modified

    def add_rss_source(self, name: str, url: str, site_url: str = "", category_hint: str = "ai_news", country: str = "GLOBAL", description: str = "") -> Dict[str, Any]:
        sources = self.load_sources()
        # Dedup by URL
        for f in sources.get("rss_feeds", []):
            if f.get("url").rstrip("/") == url.rstrip("/"):
                f["enabled"] = True
                f["name"] = name or f.get("name")
                f["category_hint"] = category_hint or f.get("category_hint")
                self.save_sources(sources)
                return f

        item_id = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower()) if name else f"feed_{int(datetime.now().timestamp())}"
        new_feed = {
            "id": item_id,
            "name": name,
            "url": url,
            "site_url": site_url or url,
            "category_hint": category_hint,
            "country": country,
            "enabled": True,
            "description": description,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        sources.setdefault("rss_feeds", []).append(new_feed)
        self.save_sources(sources)
        return new_feed

    def add_github_repo(self, repo: str, category: str = "agent_tech", description: str = "", stars_hint: int = 0) -> Dict[str, Any]:
        sources = self.load_sources()
        gh = sources.setdefault("github_sources", {"enabled": True, "search_queries": [], "monitored_repos": []})
        repos = gh.setdefault("monitored_repos", [])
        for r in repos:
            if r.get("repo").lower() == repo.lower():
                r["enabled"] = True
                r["category"] = category
                self.save_sources(sources)
                return r

        new_repo = {
            "repo": repo,
            "category": category,
            "enabled": True,
            "description": description,
            "stars_hint": stars_hint,
            "added_at": datetime.now(timezone.utc).isoformat()
        }
        repos.append(new_repo)
        self.save_sources(sources)
        return new_repo

    def delete_source(self, source_type: str, item_id: str) -> bool:
        sources = self.load_sources()
        modified = False
        if source_type == "rss":
            initial_len = len(sources.get("rss_feeds", []))
            sources["rss_feeds"] = [f for f in sources.get("rss_feeds", []) if f.get("id") != item_id and f.get("url") != item_id]
            if len(sources["rss_feeds"]) < initial_len:
                modified = True
        elif source_type == "github_repo":
            repos = sources.get("github_sources", {}).get("monitored_repos", [])
            initial_len = len(repos)
            sources["github_sources"]["monitored_repos"] = [r for r in repos if r.get("repo") != item_id]
            if len(sources["github_sources"]["monitored_repos"]) < initial_len:
                modified = True

        if modified:
            self.save_sources(sources)
        return modified

sources_service = SourcesService()
