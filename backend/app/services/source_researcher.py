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
from app.services.categorizer import classify_and_tag
from app.services.llm_processor import llm_processor

logger = logging.getLogger("agentlens.researcher")

class SourceResearcher:
    """
    URL 조사 (POST /api/research/inspect-url):
    - Auto-probes websites for RSS/Atom/JSON feeds.
    - Inspects GitHub repositories for release feeds.
    - Evaluates signal relevance to AgentLens curation themes.
    (v0.4.2: 화면이 부르지 않던 카탈로그 추천·후보 등록은 지웠다, CC-02)
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
                # 예외 원문(내부 주소·경로 등)은 로그에만 남기고 응답은 고정 문장 (SEC-03 과 같은 규칙)
                logger.warning(f"inspect-url connection failed for {raw_url}: {e!r}")
                return {
                    "status": "error",
                    "message": "URL 에 접속하지 못했습니다. 주소와 네트워크를 확인해주세요.",
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
                logger.warning(f"feed download failed for {feed_url}: {e!r}")
                return {"status": "error", "message": "피드를 내려받지 못했습니다.", "feed_url": feed_url}

        if resp.status_code != 200:
            return {"status": "error", "message": f"피드 응답 오류 ({resp.status_code})", "feed_url": feed_url}

        parsed = await asyncio.to_thread(feedparser.parse, resp.text)  # CPU 파싱은 루프 밖에서 (PERF-03)
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

source_researcher = SourceResearcher()
