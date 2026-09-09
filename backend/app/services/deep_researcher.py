import re
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse, urljoin
import httpx
import feedparser
from bs4 import BeautifulSoup
from sqlalchemy import select, desc

from app.database import AsyncSessionLocal
from app.models.news import NewsItem, SourceResearchLog
from app.services.sources_service import sources_service
from app.collectors.categorizer import classify_and_tag
from app.services.llm_processor import llm_processor

logger = logging.getLogger("agentlens.deep_researcher")

# Curated Seeds of Frontier Sources for Deep Investigation
SEED_EXPLORATION_TARGETS = [
    {
        "name": "Lilian Weng Tech Blog",
        "url": "https://lilianweng.github.io",
        "category_hint": "agent_tech",
        "tags": ["agent", "reasoning", "alignment", "memory"],
        "expected_depth": 9.6
    },
    {
        "name": "Eugene Yan (Applied AI & Eval)",
        "url": "https://eugeneyan.com",
        "category_hint": "harness",
        "tags": ["harness", "eval", "benchmark", "patterns"],
        "expected_depth": 9.4
    },
    {
        "name": "Chip Huyen (AI Systems & Engineering)",
        "url": "https://huyenchip.com",
        "category_hint": "agent_tech",
        "tags": ["systems", "production", "engineering"],
        "expected_depth": 9.3
    },
    {
        "name": "Ahead of AI (Sebastian Raschka)",
        "url": "https://magazine.sebastianraschka.com",
        "category_hint": "ai_news",
        "tags": ["llm", "fine-tuning", "architecture"],
        "expected_depth": 9.2
    },
    {
        "name": "Google DeepMind Research Blog",
        "url": "https://deepmind.google/blog",
        "category_hint": "ai_news",
        "tags": ["frontier", "reasoning", "deepmind"],
        "expected_depth": 9.5
    },
    {
        "name": "Microsoft Research AI",
        "url": "https://www.microsoft.com/en-us/research",
        "category_hint": "agent_tech",
        "tags": ["microsoft", "autogen", "agents"],
        "expected_depth": 9.1
    },
    {
        "name": "OpenHands (All-Hands AI) Official Releases",
        "url": "https://github.com/All-Hands-AI/OpenHands",
        "category_hint": "harness",
        "tags": ["harness", "swe-bench", "coding-agent"],
        "expected_depth": 9.4
    },
    {
        "name": "Aider AI Pair Programmer Releases",
        "url": "https://github.com/paul-gauthier/aider",
        "category_hint": "harness",
        "tags": ["coding-agent", "benchmark", "cli"],
        "expected_depth": 9.2
    },
    {
        "name": "Cline (Autonomous Coding Agent) Releases",
        "url": "https://github.com/cline/cline",
        "category_hint": "mcp_plugins_skills",
        "tags": ["mcp", "agent", "coding-tools"],
        "expected_depth": 9.3
    },
    {
        "name": "FastMCP Framework Releases",
        "url": "https://github.com/jlowin/fastmcp",
        "category_hint": "mcp_plugins_skills",
        "tags": ["mcp", "fastmcp", "python"],
        "expected_depth": 9.3
    },
    {
        "name": "당근 테크 블로그",
        "url": "https://medium.com/feed/daangn",
        "category_hint": "agent_tech",
        "tags": ["kr", "search", "engineering"],
        "expected_depth": 8.7
    },
    {
        "name": "우아한형제들 기술블로그",
        "url": "https://techblog.woowahan.com",
        "category_hint": "agent_tech",
        "tags": ["kr", "platform", "backend"],
        "expected_depth": 8.8
    },
    {
        "name": "vLLM Project Blog",
        "url": "https://vllm.ai",
        "category_hint": "agent_tech",
        "tags": ["inference", "serving", "vllm"],
        "expected_depth": 9.2
    },
    {
        "name": "Cursor Forum Announcements",
        "url": "https://forum.cursor.com/c/announcements.rss",
        "category_hint": "agent_tech",
        "tags": ["cursor", "editor", "agent"],
        "expected_depth": 9.0
    }
]

DISALLOWED_DOMAINS = {
    "twitter.com", "x.com", "facebook.com", "instagram.com", "youtube.com",
    "linkedin.com", "reddit.com", "google.com", "news.ycombinator.com",
    "github.com/login", "amazon.com"
}

class AutonomousDeepResearcher:
    """
    Autonomous Deep Research & Source Decision Engine:
    - Periodically mines external links from ingested articles.
    - Probes candidate websites and automatically extracts feeds.
    - Performs multi-dimensional LLM-grade evaluation on technical depth, signal-to-noise ratio, and freshness.
    - Automatically adopts verified high-signal sources into sources.json.
    - Maintains an audit trail log in SQLite for human review.
    """

    def __init__(self):
        self.is_running = False
        self.last_run_time: Optional[datetime] = None
        self.last_run_summary: Dict[str, Any] = {}
        self.auto_adopted_count = 0
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; AgentLens-DeepResearcher/2.0; +https://github.com/agentlens)"
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "last_run_time": self.last_run_time.isoformat() if self.last_run_time else None,
            "auto_adopted_count": self.auto_adopted_count,
            "last_run_summary": self.last_run_summary,
            "cadence": "Every 12 hours (03:00, 15:00 UTC) + On-demand"
        }

    async def get_audit_logs(self, limit: int = 30) -> List[Dict[str, Any]]:
        """Retrieves past research verdicts and rationale from the database."""
        async with AsyncSessionLocal() as session:
            try:
                res = await session.execute(
                    select(SourceResearchLog).order_by(desc(SourceResearchLog.created_at)).limit(limit)
                )
                rows = res.scalars().all()
                return [
                    {
                        "id": r.id,
                        "source_name": r.source_name,
                        "site_url": r.site_url,
                        "feed_url": r.feed_url,
                        "category": r.category,
                        "relevance_score": r.relevance_score,
                        "verdict": r.verdict,
                        "verdict_reason": r.verdict_reason,
                        "analyzed_articles_count": r.analyzed_articles_count,
                        "created_at": r.created_at.isoformat() if r.created_at else None
                    }
                    for r in rows
                ]
            except Exception as e:
                logger.error(f"Error fetching research audit logs: {e}")
                return []

    async def mine_reference_domains_from_articles(self) -> List[str]:
        """Stage 1: Extract candidate external technical domains referenced in recent articles."""
        candidate_urls = []
        async with AsyncSessionLocal() as session:
            try:
                res = await session.execute(
                    select(NewsItem.summary, NewsItem.url).order_by(desc(NewsItem.id)).limit(80)
                )
                items = res.all()
                for summary, article_url in items:
                    text = f"{summary or ''} {article_url or ''}"
                    found = re.findall(r'https?://[a-zA-Z0-9.-]+(?:/[^\s"\')>]*)?', text)
                    for u in found:
                        p = urlparse(u)
                        domain = p.netloc.lower()
                        if not domain or any(bad in domain for bad in DISALLOWED_DOMAINS):
                            continue
                        if "." not in domain or len(domain.split(".")) < 2:
                            continue
                        base_url = f"{p.scheme}://{p.netloc}"
                        if base_url not in candidate_urls:
                            candidate_urls.append(base_url)
            except Exception as e:
                logger.debug(f"Citation reference mining: {e}")
        return candidate_urls[:15]

    async def probe_and_discover_feed(self, target_url: str) -> Dict[str, Any]:
        """Stage 2: Network connectivity check, TLS verification, and feed discovery."""
        parsed = urlparse(target_url)
        netloc = parsed.netloc.lower()
        path = parsed.path

        # Handle GitHub repo releases
        if "github.com" in netloc:
            parts = [p for p in path.strip("/").split("/") if p]
            if len(parts) >= 2:
                owner, repo = parts[0], parts[1]
                feed_url = f"https://github.com/{owner}/{repo}/releases.atom"
                return await self._fetch_and_parse_feed(feed_url, site_url=f"https://github.com/{owner}/{repo}", fallback_name=f"{owner}/{repo}")

        async with httpx.AsyncClient(timeout=8.0, headers=self.headers, follow_redirects=True) as client:
            try:
                resp = await client.get(target_url)
            except Exception as e:
                return {"status": "error", "message": f"연결 실패: {e}"}

            if resp.status_code != 200:
                return {"status": "error", "message": f"HTTP {resp.status_code} 오류"}

            content_type = resp.headers.get("content-type", "").lower()
            text = resp.text

            # If it's already a feed XML directly
            if any(t in content_type for t in ["xml", "rss", "atom"]) or "<rss" in text[:300] or "<feed" in text[:300]:
                return await self._fetch_and_parse_feed(target_url, site_url=target_url)

            # Look for <link rel="alternate"> in HTML
            soup = BeautifulSoup(text, "html.parser")
            feed_urls = []
            for link in soup.find_all("link"):
                rel = str(link.get("rel", "")).lower()
                ltype = str(link.get("type", "")).lower()
                href = link.get("href", "")
                if ("alternate" in rel or "feed" in rel) and any(f in ltype for f in ["rss", "atom", "xml"]):
                    feed_urls.append(urljoin(target_url, href))

            # If no link tag, probe standard heuristic endpoints
            if not feed_urls:
                for probe_path in ["/feed", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/index.xml"]:
                    candidate = urljoin(target_url, probe_path)
                    try:
                        probe_res = await client.head(candidate, timeout=3.0)
                        if probe_res.status_code == 200:
                            feed_urls.append(candidate)
                            break
                    except Exception:
                        pass

            if feed_urls:
                page_title = soup.title.string.strip() if soup.title and soup.title.string else parsed.netloc
                return await self._fetch_and_parse_feed(feed_urls[0], site_url=target_url, fallback_name=page_title)

            return {"status": "no_feed", "message": "유효한 RSS 또는 Atom 피드 엔드포인트를 발견하지 못함"}

    async def _fetch_and_parse_feed(self, feed_url: str, site_url: str = "", fallback_name: str = "") -> Dict[str, Any]:
        """Fetches and parses feed entries, inspecting freshness and substantive content."""
        async with httpx.AsyncClient(timeout=8.0, headers=self.headers, follow_redirects=True) as client:
            try:
                resp = await client.get(feed_url)
            except Exception as e:
                return {"status": "error", "message": f"피드 다운로드 실패: {e}"}

        if resp.status_code != 200:
            return {"status": "error", "message": f"피드 HTTP {resp.status_code} 오류"}

        parsed = feedparser.parse(resp.text)
        if not parsed.entries:
            return {"status": "empty", "message": "피드는 열리나 발행된 기사가 존재하지 않음"}

        feed_title = parsed.feed.get("title", fallback_name or "Unknown Source").strip()
        feed_desc = parsed.feed.get("description", "") or parsed.feed.get("subtitle", "")
        feed_site = parsed.feed.get("link", site_url or feed_url)

        entries = []
        for e in parsed.entries[:4]:
            t = e.get("title", "").strip()
            l = e.get("link", "").strip()
            summary = e.get("summary", "") or e.get("description", "")
            clean = re.sub(r'<[^>]+>', '', summary).strip()[:350]
            pub = e.get("published", "") or e.get("updated", "")
            entries.append({"title": t, "link": l, "summary": clean, "published": pub})

        return {
            "status": "success",
            "name": feed_title,
            "feed_url": feed_url,
            "site_url": feed_site,
            "description": feed_desc[:250],
            "entries": entries
        }

    async def evaluate_and_decide(self, feed_info: Dict[str, Any], hint_cat: str = "") -> Dict[str, Any]:
        """
        Stage 3 & 4: Multi-dimensional LLM-grade evaluation and autonomous decision (AUTO_ADOPTED / WATCHLIST / REJECTED).
        """
        name = feed_info.get("name", "Unknown")
        feed_url = feed_info.get("feed_url", "")
        site_url = feed_info.get("site_url", "")
        desc = feed_info.get("description", "")
        entries = feed_info.get("entries", [])

        # Check if already registered
        all_sources = sources_service.get_all_sources()
        existing_urls = set(f.get("url").rstrip("/") for f in all_sources.get("rss_feeds", []))
        if feed_url.rstrip("/") in existing_urls:
            return {
                "verdict": "ALREADY_MONITORED",
                "score": 9.0,
                "category": hint_cat or "ai_news",
                "reason": f"'{name}' 소스는 이미 sources.json에 등록되어 실시간 모니터링 중입니다.",
                "should_add": False
            }

        sample_corpus = f"{name} {desc}\n"
        for e in entries:
            sample_corpus += f"- {e.get('title')}: {e.get('summary')}\n"

        cat, tags, _ = classify_and_tag(name, sample_corpus)
        if hint_cat:
            cat = hint_cat

        # Multi-dimensional signal scoring
        base_eval = llm_processor.evaluate_quality_and_signal(name, sample_corpus, "rss")
        score = base_eval["quality_score"]

        # Technical Depth Boosts
        high_signals = ["harness", "benchmark", "swe-bench", "eval", "mcp", "protocol", "agent", "reasoning", "sandbox", "docker"]
        depth_hits = sum(1 for kw in high_signals if kw in sample_corpus.lower())
        score += min(1.8, depth_hits * 0.3)

        # Quality capping
        score = max(1.0, min(9.9, round(score, 1)))

        # Decision Threshold Matrix
        if score >= 8.2:
            verdict = "AUTO_ADOPTED"
            reason = (
                f"최신 기술 분석 글 {len(entries)}편 검증 결과, {cat.upper()} 영역의 실전 엔지니어링 및 벤치마크 "
                f"관련 고밀도 신호가 확인되어 수집 대상에 자율 채택했습니다. (품질 종합 점수: {score}점)"
            )
            should_add = True
        elif score >= 6.5:
            verdict = "WATCHLIST"
            reason = (
                f"전반적인 콘텐츠 품질은 준수하나(점수 {score}점), 하네스/에이전트 관련 게시물 밀도를 추가 검증하기 위해 "
                f"워치리스트로 분류하고 모니터링합니다."
            )
            should_add = False
        else:
            verdict = "REJECTED"
            reason = (
                f"에이전트/하네스 핵심 기술 연관성이 낮거나 홍보성 내용 비율이 높아 기준 미달로 기각했습니다. (점수 {score}점)"
            )
            should_add = False

        return {
            "verdict": verdict,
            "score": score,
            "category": cat,
            "reason": reason,
            "should_add": should_add
        }

    async def run_deep_research(self, max_candidates: int = 8) -> Dict[str, Any]:
        """
        Executes the 5-Stage Autonomous Deep Research Loop:
        1. Harvest candidate domains (Seed targets + Inbound reference mining).
        2. Probe network, TLS, and discover valid feeds.
        3. Multi-dimensional quality evaluation.
        4. Autonomous adoption into sources.json.
        5. Persist audit log in SQLite.
        """
        if self.is_running:
            return {"status": "already_running", "message": "Deep Research is currently executing."}

        self.is_running = True
        started_at = datetime.now(timezone.utc)
        logger.info("[Deep Researcher] Starting autonomous research cycle...")

        candidates_pool = []

        # 1. Add seeds
        for s in SEED_EXPLORATION_TARGETS:
            candidates_pool.append({
                "name": s["name"],
                "target_url": s["url"],
                "category_hint": s.get("category_hint", "ai_news")
            })

        # 2. Mine referenced domains from recently crawled articles
        mined_urls = await self.mine_reference_domains_from_articles()
        for u in mined_urls:
            candidates_pool.append({
                "name": urlparse(u).netloc,
                "target_url": u,
                "category_hint": ""
            })

        # Shuffle or prioritize candidates
        eval_queue = candidates_pool[:max_candidates]
        evaluated_results = []
        newly_adopted = 0

        async with AsyncSessionLocal() as session:
            for item in eval_queue:
                name = item["name"]
                url = item["target_url"]
                hint_cat = item.get("category_hint", "")

                # Stage 2: Probe
                probe_res = await self.probe_and_discover_feed(url)
                if probe_res.get("status") != "success":
                    verdict = "REJECTED"
                    reason = f"기술 실증 실패: {probe_res.get('message', '피드 탐지 불가')}"
                    score = 2.0
                    cat = hint_cat or "ai_news"
                    feed_url = url
                else:
                    # Stage 3 & 4: Evaluate & Decide
                    decision = await self.evaluate_and_decide(probe_res, hint_cat=hint_cat)
                    verdict = decision["verdict"]
                    score = decision["score"]
                    reason = decision["reason"]
                    cat = decision["category"]
                    feed_url = probe_res.get("feed_url")
                    name = probe_res.get("name", name)

                    # Auto-adopt if approved
                    if decision.get("should_add"):
                        sources_service.add_rss_source(
                            name=name,
                            url=feed_url,
                            site_url=probe_res.get("site_url", url),
                            category_hint=cat,
                            country="KR" if "kr" in url or "daangn" in url or "woowahan" in url else "GLOBAL",
                            description=probe_res.get("description", "자율 딥 리서처에 의해 자동 발굴 및 채택된 소스")
                        )
                        newly_adopted += 1
                        self.auto_adopted_count += 1

                # Stage 5: Save audit log to database
                audit_log = SourceResearchLog(
                    source_name=name,
                    site_url=url,
                    feed_url=feed_url,
                    category=cat,
                    relevance_score=score,
                    verdict=verdict,
                    verdict_reason=reason,
                    analyzed_articles_count=len(probe_res.get("entries", [])) if probe_res.get("status") == "success" else 0,
                    created_at=datetime.now(timezone.utc)
                )
                session.add(audit_log)

                evaluated_results.append({
                    "source_name": name,
                    "site_url": url,
                    "feed_url": feed_url,
                    "category": cat,
                    "score": score,
                    "verdict": verdict,
                    "reason": reason
                })

            await session.commit()

        self.last_run_time = datetime.now(timezone.utc)
        self.last_run_summary = {
            "evaluated_total": len(evaluated_results),
            "auto_adopted": newly_adopted,
            "completed_at": self.last_run_time.isoformat(),
            "results": evaluated_results
        }
        self.is_running = False

        logger.info(f"[Deep Researcher] Completed: {len(evaluated_results)} evaluated, {newly_adopted} auto-adopted.")
        return self.last_run_summary

deep_researcher = AutonomousDeepResearcher()
