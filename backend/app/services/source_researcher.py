import re
import asyncio
import logging
from urllib.parse import urljoin, urlparse
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
import feedparser
from bs4 import BeautifulSoup

from app.services.sources_service import sources_service
from app.collectors.categorizer import classify_and_tag
from app.services.llm_processor import llm_processor

logger = logging.getLogger("agentlens.researcher")

# Curated Ecosystem Knowledge Base for Discovery
CURATED_ECOSYSTEM_CATALOG = [
    {
        "id": "lilian_weng",
        "name": "Lilian Weng (OpenAI) Tech Blog",
        "site_url": "https://lilianweng.github.io",
        "feed_url": "https://lilianweng.github.io/index.xml",
        "category_hint": "agent_tech",
        "country": "GLOBAL",
        "description": "자율 에이전트 아키텍처, LLM 메모리, 툴 유즈, 추론 정렬 심층 기술 분석",
        "tags": ["agent", "reasoning", "memory", "alignment"],
        "base_score": 9.6
    },
    {
        "id": "eugene_yan",
        "name": "Eugene Yan (Applied AI & Eval)",
        "site_url": "https://eugeneyan.com",
        "feed_url": "https://eugeneyan.com/rss/",
        "category_hint": "harness",
        "country": "GLOBAL",
        "description": "실전 AI 평가(Eval), 시스템 벤치마킹, 에이전트 패턴 및 프롬프트 엔지니어링",
        "tags": ["harness", "eval", "benchmark", "patterns"],
        "base_score": 9.4
    },
    {
        "id": "chip_huyen",
        "name": "Chip Huyen (AI Engineering)",
        "site_url": "https://huyenchip.com",
        "feed_url": "https://huyenchip.com/feed.xml",
        "category_hint": "agent_tech",
        "country": "GLOBAL",
        "description": "프로덕션 AI 엔지니어링, 에이전트 런타임 및 모델 서빙 아키텍처",
        "tags": ["engineering", "production", "agent", "architecture"],
        "base_score": 9.3
    },
    {
        "id": "sebastian_raschka",
        "name": "Ahead of AI (Sebastian Raschka)",
        "site_url": "https://magazine.sebastianraschka.com",
        "feed_url": "https://magazine.sebastianraschka.com/feed",
        "category_hint": "ai_news",
        "country": "GLOBAL",
        "description": "최신 오픈소스 LLM, 사전학습/미세조정, 에이전트 추론 능력 분석",
        "tags": ["llm", "reasoning", "fine-tuning", "research"],
        "base_score": 9.2
    },
    {
        "id": "deepmind_blog",
        "name": "Google DeepMind Research Blog",
        "site_url": "https://deepmind.google/blog",
        "feed_url": "https://deepmind.google/blog/rss.xml",
        "category_hint": "ai_news",
        "country": "GLOBAL",
        "description": "구글 딥마인드 프론티어 AI 연구 및 자율 에이전트 알고리즘 공식 블로그",
        "tags": ["deepmind", "gemini", "reasoning", "frontier"],
        "base_score": 9.5
    },
    {
        "id": "microsoft_research",
        "name": "Microsoft Research AI",
        "site_url": "https://www.microsoft.com/en-us/research",
        "feed_url": "https://www.microsoft.com/en-us/research/feed/",
        "category_hint": "agent_tech",
        "country": "GLOBAL",
        "description": "AutoGen 및 마이크로소프트 자율 에이전트 연구진 기술 리포트",
        "tags": ["microsoft", "autogen", "multi-agent", "research"],
        "base_score": 9.1
    },
    {
        "id": "openhands_releases",
        "name": "OpenHands (All-Hands AI) Releases",
        "site_url": "https://github.com/All-Hands-AI/OpenHands",
        "feed_url": "https://github.com/All-Hands-AI/OpenHands/releases.atom",
        "category_hint": "harness",
        "country": "GLOBAL",
        "description": "오픈소스 자율 소프트웨어 개발 에이전트 및 벤치마크 하네스 릴리즈",
        "tags": ["harness", "swe-bench", "coding-agent", "docker"],
        "base_score": 9.4
    },
    {
        "id": "aider_releases",
        "name": "Aider AI Pair Programmer Releases",
        "site_url": "https://github.com/paul-gauthier/aider",
        "feed_url": "https://github.com/paul-gauthier/aider/releases.atom",
        "category_hint": "harness",
        "country": "GLOBAL",
        "description": "터미널 기반 AI 페어 프로그래밍 에이전트 및 벤치마크 리더보드",
        "tags": ["coding-agent", "benchmark", "git", "cli"],
        "base_score": 9.2
    },
    {
        "id": "cline_releases",
        "name": "Cline (Autonomous Coding Agent) Releases",
        "site_url": "https://github.com/cline/cline",
        "feed_url": "https://github.com/cline/cline/releases.atom",
        "category_hint": "mcp_plugins_skills",
        "country": "GLOBAL",
        "description": "VS Code 자율 코딩 에이전트 및 MCP 도구 연동 공식 릴리즈",
        "tags": ["mcp", "agent", "coding", "tools"],
        "base_score": 9.3
    },
    {
        "id": "fastmcp_releases",
        "name": "FastMCP Framework Releases",
        "site_url": "https://github.com/jlowin/fastmcp",
        "feed_url": "https://github.com/jlowin/fastmcp/releases.atom",
        "category_hint": "mcp_plugins_skills",
        "country": "GLOBAL",
        "description": "Python 기반 고성능 Model Context Protocol(MCP) 서버 구축 라이브러리",
        "tags": ["mcp", "fastmcp", "python", "tools"],
        "base_score": 9.3
    },
    {
        "id": "daangn_tech",
        "name": "당근마켓 테크 블로그",
        "site_url": "https://medium.com/daangn",
        "feed_url": "https://medium.com/feed/daangn",
        "category_hint": "agent_tech",
        "country": "KR",
        "description": "국내 하이퍼로컬 AI 검색 및 서비스 엔지니어링 기술 칼럼",
        "tags": ["search", "engineering", "ml"],
        "base_score": 8.7
    },
    {
        "id": "woowahan_tech",
        "name": "우아한형제들 기술블로그",
        "site_url": "https://techblog.woowahan.com",
        "feed_url": "https://techblog.woowahan.com/feed/",
        "category_hint": "agent_tech",
        "country": "KR",
        "description": "배달의민족 대규모 트래픽 및 AI/ML 플랫폼 엔지니어링 블로그",
        "tags": ["platform", "engineering", "backend"],
        "base_score": 8.8
    },
    {
        "id": "line_engineering",
        "name": "LINE Engineering Korea",
        "site_url": "https://engineering.linecorp.com/ko",
        "feed_url": "https://engineering.linecorp.com/ko/feed/",
        "category_hint": "agent_tech",
        "country": "KR",
        "description": "글로벌 메신저 및 AI 연구개발 엔지니어링 블로그",
        "tags": ["global", "architecture", "ai"],
        "base_score": 8.7
    }
]

class SourceResearcher:
    """
    Autonomous Source Discovery & Validation Engine:
    - Auto-probes websites for RSS/Atom/JSON feeds.
    - Inspects GitHub repositories for release feeds.
    - Conducts topic & ecosystem-based discovery of candidate sources.
    - Evaluates signal relevance to AgentLens curation themes.
    - Integrates with sources_service for one-click target registration.
    """

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; AgentLens-Researcher/2.0; +https://github.com/agentlens)"
        }

    async def inspect_url(self, raw_url: str) -> Dict[str, Any]:
        """
        Given any website or GitHub URL, auto-detects RSS/Atom feed,
        validates connectivity, extracts recent items, and computes a signal score.
        """
        raw_url = raw_url.strip()
        if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
            raw_url = "https://" + raw_url

        parsed = urlparse(raw_url)
        netloc = parsed.netloc.lower()
        path = parsed.path

        # 1. Check if it is a GitHub repository
        if "github.com" in netloc:
            parts = [p for p in path.strip("/").split("/") if p]
            if len(parts) >= 2:
                owner, repo = parts[0], parts[1]
                feed_url = f"https://github.com/{owner}/{repo}/releases.atom"
                res = await self._test_and_extract_feed(feed_url, site_url=f"https://github.com/{owner}/{repo}", name=f"{owner}/{repo}")
                if res.get("status") == "found":
                    res["type"] = "atom"
                    res["source_kind"] = "github_releases"
                    return res

        # 2. Try fetching the URL directly to see if it's already a feed or HTML
        async with httpx.AsyncClient(timeout=10.0, headers=self.headers, follow_redirects=True) as client:
            try:
                resp = await client.get(raw_url)
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"URL 접속 실패: {e}",
                    "input_url": raw_url
                }

            if resp.status_code != 200:
                return {
                    "status": "error",
                    "message": f"HTTP 응답 코드 오류 ({resp.status_code})",
                    "input_url": raw_url
                }

            content_type = resp.headers.get("content-type", "").lower()
            text = resp.text

            # If it is directly an XML/RSS/Atom feed
            if any(t in content_type for t in ["xml", "rss", "atom"]) or "<rss" in text[:300] or "<feed" in text[:300]:
                return await self._test_and_extract_feed(raw_url, site_url=raw_url)

            # 3. If HTML, parse <link rel="alternate" ...> tags
            soup = BeautifulSoup(text, "html.parser")
            feed_links = []
            for link in soup.find_all("link"):
                rel = link.get("rel", [])
                if isinstance(rel, list):
                    rel = " ".join(rel).lower()
                else:
                    rel = str(rel).lower()

                ltype = link.get("type", "").lower()
                href = link.get("href", "")
                if ("alternate" in rel or "feed" in rel) and any(f in ltype for f in ["rss", "atom", "xml"]):
                    full_href = urljoin(raw_url, href)
                    feed_links.append(full_href)

            # 4. If no <link> found, probe standard heuristic paths
            if not feed_links:
                probes = ["/feed", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/index.xml"]
                for p in probes:
                    candidate = urljoin(raw_url, p)
                    try:
                        probe_resp = await client.head(candidate, timeout=4.0)
                        if probe_resp.status_code == 200:
                            feed_links.append(candidate)
                            break
                    except Exception:
                        pass

            # If a feed was discovered
            if feed_links:
                best_feed = feed_links[0]
                page_title = soup.title.string.strip() if soup.title and soup.title.string else parsed.netloc
                return await self._test_and_extract_feed(best_feed, site_url=raw_url, name=page_title)

            return {
                "status": "not_found",
                "message": "해당 페이지에서 RSS 또는 Atom 피드를 자동으로 발견하지 못했습니다.",
                "input_url": raw_url
            }

    async def _test_and_extract_feed(self, feed_url: str, site_url: str = "", name: str = "") -> Dict[str, Any]:
        """Fetches and parses the feed XML, extracting recent articles and evaluating quality score."""
        async with httpx.AsyncClient(timeout=8.0, headers=self.headers, follow_redirects=True) as client:
            try:
                resp = await client.get(feed_url)
            except Exception as e:
                return {"status": "error", "message": f"피드 다운로드 실패: {e}", "feed_url": feed_url}

        if resp.status_code != 200:
            return {"status": "error", "message": f"피드 응답 오류 ({resp.status_code})", "feed_url": feed_url}

        parsed = feedparser.parse(resp.text)
        if not parsed.entries:
            return {
                "status": "empty",
                "message": "피드는 유효하나 발행된 최신 기사가 없습니다.",
                "feed_url": feed_url
            }

        feed_title = parsed.feed.get("title", name or "발굴된 소스")
        feed_desc = parsed.feed.get("description", "") or parsed.feed.get("subtitle", "")
        feed_link = parsed.feed.get("link", site_url or feed_url)

        recent_posts = []
        sample_text_for_eval = feed_title + " " + feed_desc
        for entry in parsed.entries[:4]:
            t = entry.get("title", "")
            l = entry.get("link", "")
            pub = entry.get("published", "") or entry.get("updated", "")
            summary = entry.get("summary", "") or entry.get("description", "")
            clean_summary = re.sub(r'<[^>]+>', '', summary).strip()[:200]
            recent_posts.append({
                "title": t,
                "link": l,
                "published": pub,
                "snippet": clean_summary
            })
            sample_text_for_eval += " " + t + " " + clean_summary

        # Categorize & Quality score
        cat, tags, _ = classify_and_tag(feed_title, sample_text_for_eval)
        eval_res = llm_processor.evaluate_quality_and_signal(feed_title, sample_text_for_eval, "rss")

        # Check if already in sources.json
        active_feeds = sources_service.get_all_sources().get("rss_feeds", [])
        already_registered = any(f.get("url").rstrip("/") == feed_url.rstrip("/") for f in active_feeds)

        return {
            "status": "found",
            "name": feed_title,
            "feed_url": feed_url,
            "site_url": feed_link,
            "description": feed_desc[:250] if feed_desc else "실시간 최신 기술 피드",
            "category_hint": cat,
            "relevance_score": eval_res["quality_score"],
            "is_high_signal": eval_res["is_high_signal"],
            "recent_posts": recent_posts,
            "already_registered": already_registered,
            "why_recommended": f"최신 {cat.upper()} 관련 {len(recent_posts)}건의 활성 글 발행 확인 (신호 강도 {eval_res['quality_score']}점)"
        }

    async def discover_sources(self, query: str = "", category: str = "", limit: int = 8) -> Dict[str, Any]:
        """
        Searches the curated ecosystem knowledge base and performs live feed probing
        to discover top-tier candidate sources matching the user's research focus.
        """
        all_sources = sources_service.get_all_sources()
        registered_urls = set(f.get("url").rstrip("/") for f in all_sources.get("rss_feeds", []))

        candidates = []
        q_lower = query.lower().strip() if query else ""

        for item in CURATED_ECOSYSTEM_CATALOG:
            # Filter by query if provided
            if q_lower:
                match = (
                    q_lower in item["name"].lower() or
                    q_lower in item["description"].lower() or
                    q_lower in item["category_hint"].lower() or
                    any(q_lower in tag for tag in item.get("tags", []))
                )
                if not match:
                    continue

            # Filter by category if specified
            if category and item["category_hint"] != category:
                continue

            is_already = item["feed_url"].rstrip("/") in registered_urls

            candidates.append({
                "id": item["id"],
                "name": item["name"],
                "site_url": item["site_url"],
                "feed_url": item["feed_url"],
                "category_hint": item["category_hint"],
                "country": item["country"],
                "description": item["description"],
                "relevance_score": item["base_score"],
                "tags": item.get("tags", []),
                "already_registered": is_already,
                "why_recommended": f"{item['category_hint'].upper()} 생태계 핵심 레퍼런스 소스 (기본 신호 점수 {item['base_score']}점)"
            })

        # Sort candidates: non-registered first, then by score descending
        candidates.sort(key=lambda x: (not x["already_registered"], x["relevance_score"]), reverse=True)
        selected = candidates[:limit]

        return {
            "query": query,
            "category": category,
            "total_found": len(candidates),
            "candidates": selected
        }

    def register_candidate(self, candidate: Dict[str, Any]) -> Dict[str, Any]:
        """Registers a discovered candidate into sources.json."""
        name = candidate.get("name", "")
        feed_url = candidate.get("feed_url", "")
        site_url = candidate.get("site_url", "")
        cat = candidate.get("category_hint", "ai_news")
        country = candidate.get("country", "GLOBAL")
        desc = candidate.get("description", "")

        if not name or not feed_url:
            return {"status": "error", "message": "name과 feed_url은 필수입니다."}

        added = sources_service.add_rss_source(
            name=name,
            url=feed_url,
            site_url=site_url,
            category_hint=cat,
            country=country,
            description=desc
        )
        return {
            "status": "success",
            "message": f"'{name}' 소스가 성공적으로 스크래핑 대상에 등록되었습니다.",
            "source": added
        }

source_researcher = SourceResearcher()
