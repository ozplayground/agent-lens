import os
import copy
import json
import logging
import re
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
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

TYPE_TOGGLE_ID = "all"


class SourcesWriteError(Exception):
    """sources.json 저장 실패. 라우터는 500 으로 바꾼다."""


def _new_rss_id(name: str, url: str, taken: set) -> str:
    """이름 슬러그. 영숫자가 없거나(한글 이름) 이미 쓰인 슬러그면 URL 해시를 붙여 겹치지 않게 한다 (BUG-20)."""
    slug = re.sub(r'[^a-z0-9_]', '_', (name or "").lower())
    if slug.strip("_") and slug not in taken:
        return slug
    digest = hashlib.sha1(url.rstrip("/").encode("utf-8")).hexdigest()[:8]
    return f"{slug.strip('_') or 'feed'}_{digest}"


class SourcesService:
    def __init__(self):
        self._file_path = find_sources_file()
        self._mirror_path = Path(__file__).resolve().parent.parent / "config" / "sources.json"
        self._cache: Optional[Tuple[Tuple[str, int, int], Dict[str, Any]]] = None

    def get_file_path(self) -> Path:
        if not self._file_path.exists():
            self._file_path = find_sources_file()
        return self._file_path

    def load_sources(self) -> Dict[str, Any]:
        """sources.json 의 사본. 파일 (mtime, size) 가 그대로면 다시 열지 않는다 (PERF-04). 호출자가 고쳐도 캐시는 그대로다."""
        p = self.get_file_path()
        if p.exists():
            try:
                st = p.stat()
                stamp = (str(p), st.st_mtime_ns, st.st_size)
                if self._cache is None or self._cache[0] != stamp:
                    with open(p, "r", encoding="utf-8") as f:
                        self._cache = (stamp, self._normalize_sources(json.load(f)))
                return copy.deepcopy(self._cache[1])
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
        """sources.json 을 쓴다. 실패하면 SourcesWriteError (예전에는 False 를 돌려주고 아무도 보지 않았다, BUG-20)."""
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        p = self.get_file_path()
        try:
            temp_path = p.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            try:
                temp_path.replace(p)
            except OSError as e:
                # 단일 파일 bind mount(Docker) 위로는 rename 이 EBUSY 로 실패한다 → 대상 파일에 제자리로 쓴다
                logger.warning(f"sources.json 원자적 교체 실패, 제자리 쓰기로 저장한다 ({p}): {e}")
                with open(temp_path, "r", encoding="utf-8") as src:
                    content = src.read()
                with open(p, "w", encoding="utf-8") as f:
                    f.write(content)
                temp_path.unlink(missing_ok=True)

            # Sync to fallback location if they are distinct
            fallback = self._mirror_path
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
            raise SourcesWriteError(p.name) from e

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
        elif source_type in ["github", "reddit", "hackernews", "arxiv", "huggingface"] and item_id == TYPE_TOGGLE_ID:
            # 유형 전체 토글은 item_id 가 'all' 일 때만 한다. 다른 값은 없는 대상이다 (D-53)
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

        new_feed = {
            "id": _new_rss_id(name, url, {f.get("id") for f in sources.get("rss_feeds", [])}),
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
