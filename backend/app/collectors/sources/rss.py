import os
import json
import httpx
import feedparser
import re
from datetime import datetime, timezone
from typing import List, Dict, Any
from dateutil import parser as date_parser

from app.services.sources_service import sources_service

def load_feeds_from_config() -> List[Dict[str, Any]]:
    feeds = sources_service.get_active_rss_feeds()
    if not feeds:
        feeds = [
            {"name": "GeekNews (긱뉴스)", "url": "https://news.hada.io/rss/news", "country": "KR"},
            {"name": "AI타임스", "url": "https://www.aitimes.com/rss/allArticle.xml", "country": "KR"},
            {"name": "Simon Willison", "url": "https://simonwillison.net/atom/everything/", "country": "GLOBAL"},
            {"name": "OpenAI News", "url": "https://openai.com/news/rss.xml", "country": "GLOBAL"},
            {"name": "LangChain Blog", "url": "https://blog.langchain.dev/rss/", "country": "GLOBAL"}
        ]
    return feeds

import asyncio

async def fetch_rss() -> List[Dict[str, Any]]:
    feeds = load_feeds_from_config()
    headers = {"User-Agent": "Mozilla/5.0 (compatible; AgentLens/1.0; +https://github.com/agentlens)"}
    sem = asyncio.Semaphore(6)

    async def fetch_single_feed(client: httpx.AsyncClient, feed_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        feed_items = []
        async with sem:
            try:
                resp = await client.get(feed_info["url"], timeout=6.0)
                if resp.status_code != 200:
                    return []

                feed = feedparser.parse(resp.text)
                for entry in feed.entries[:8]:
                    url = entry.get("link")
                    if not url:
                        continue

                    raw_summary = entry.get("summary", "") or entry.get("description", "") or entry.get("content", [{}])[0].get("value", "")
                    summary = re.sub(r'<[^>]+>', '', raw_summary).strip()
                    summary = re.sub(r'\s+', ' ', summary)

                    pub_date = datetime.now(timezone.utc)
                    if hasattr(entry, "published"):
                        try:
                            pub_date = date_parser.parse(entry.published)
                            if pub_date.tzinfo is None:
                                pub_date = pub_date.replace(tzinfo=timezone.utc)
                        except Exception:
                            pass
                    elif hasattr(entry, "updated"):
                        try:
                            pub_date = date_parser.parse(entry.updated)
                            if pub_date.tzinfo is None:
                                pub_date = pub_date.replace(tzinfo=timezone.utc)
                        except Exception:
                            pass

                    source_label = "rss_kr" if feed_info.get("country") == "KR" else "rss"
                    author = entry.get("author") or feed_info["name"]

                    feed_items.append({
                        "title": f"[{feed_info['name']}] {entry.get('title', '')}",
                        "url": url,
                        "source": source_label,
                        "summary": summary[:320] + ("..." if len(summary) > 320 else ""),
                        "author": author,
                        "published_at": pub_date,
                        "raw_score": 180 if feed_info.get("country") == "KR" else 150,
                        "comments_count": 0,
                    })
            except Exception as e:
                pass
        return feed_items

    async with httpx.AsyncClient(timeout=8.0, headers=headers, follow_redirects=True) as client:
        results = await asyncio.gather(*(fetch_single_feed(client, f) for f in feeds), return_exceptions=True)

    items = []
    for res in results:
        if isinstance(res, list):
            items.extend(res)
    return items
