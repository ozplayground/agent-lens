import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine, Base
from app.models.news import NewsItem, CrawlLog
from app.collectors.categorizer import classify_and_tag, compute_dedup_hash, calculate_hotness
from app.services.llm_processor import llm_processor
from app.collectors.sources.hackernews import fetch_hackernews
from app.collectors.sources.github import fetch_github
from app.collectors.sources.arxiv import fetch_arxiv
from app.collectors.sources.huggingface import fetch_huggingface
from app.collectors.sources.reddit import fetch_reddit
from app.collectors.sources.rss import fetch_rss

logger = logging.getLogger("agentlens.collector")

SEED_ITEMS = [
    {
        "title": "SWE-bench 2.0: Next-Gen Evaluation Harness for Autonomous Coding Agents",
        "url": "https://github.com/princeton-nlp/SWE-bench/releases/tag/v2.0",
        "source": "github",
        "summary": "Standardized evaluation harness and dockerized benchmark for testing autonomous coding agents on real-world repositories with regression suites.",
        "author": "princeton-nlp",
        "published_at": datetime.now(timezone.utc),
        "raw_score": 2400,
        "comments_count": 310
    },
    {
        "title": "Anthropic Model Context Protocol (MCP) Server Specifications",
        "url": "https://www.anthropic.com/news/model-context-protocol",
        "source": "rss",
        "summary": "An open standard connecting AI agents to internal data, APIs, tools, and custom skill plugins securely with JSON-RPC.",
        "author": "Anthropic",
        "published_at": datetime.now(timezone.utc),
        "raw_score": 3950,
        "comments_count": 820
    }
]

class CollectorManager:
    def __init__(self):
        self.is_running = False
        self.current_source = ""
        self.step_message = "대기 중"
        self.items_collected = 0
        self.items_saved = 0
        self.items_filtered = 0
        self.total_sources = 6
        self.completed_sources = 0
        self.last_crawl_time = None
        self.last_crawl_stats = {}
        self._db_lock = asyncio.Lock()

    def get_progress(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "current_source": self.current_source,
            "step_message": self.step_message,
            "items_collected": self.items_collected,
            "items_saved": self.items_saved,
            "items_filtered": self.items_filtered,
            "total_sources": self.total_sources,
            "completed_sources": self.completed_sources,
            "last_crawl_time": self.last_crawl_time.isoformat() if self.last_crawl_time else None
        }

    async def _process_and_save_batch(self, raw_items: List[Dict[str, Any]], source_name: str) -> int:
        if not raw_items:
            return 0

        saved_count = 0
        async with self._db_lock:
            async with AsyncSessionLocal() as session:
                try:
                    for raw in raw_items:
                        title = raw.get("title", "").strip()
                        url = raw.get("url", "").strip()
                        summary = raw.get("summary", "") or ""
                        source = raw.get("source", "web")

                        if not title or not url:
                            continue

                        self.items_collected += 1

                        # 1. Strict Relevance & Quality Gate (LLM + Domain Pre-filter)
                        eval_result = await llm_processor.evaluate_content_with_llm(
                            title=title,
                            summary=summary,
                            source=source,
                            category_hint=raw.get("category_hint")
                        )

                        if not eval_result["is_worthwhile"]:
                            logger.info(f"Filtering out non-AI or low-quality article [{source}]: {title[:60]} (Reason: {eval_result.get('rejection_reason')})")
                            self.items_filtered += 1
                            continue

                        # 2. Categorization & Dedup
                        dedup_hash = compute_dedup_hash(title, url)
                        cat, tags, _ = classify_and_tag(title, summary)
                        # If LLM classified a valid category, use it if heuristic was general
                        if eval_result.get("category") and eval_result["category"] in ["harness", "mcp_plugins_skills", "agent_tech", "ai_news"]:
                            if cat in ["unrelated", "ai_news"]:
                                cat = eval_result["category"]

                        if cat == "unrelated":
                            logger.info(f"Filtering out article with no AI category [{source}]: {title[:60]}")
                            self.items_filtered += 1
                            continue

                        pub_at = raw.get("published_at") or datetime.now(timezone.utc)
                        raw_score = raw.get("raw_score", 0)
                        comments_count = raw.get("comments_count", 0)
                        hotness = calculate_hotness(raw_score, comments_count, pub_at)

                        # 3. LLM Synthesis (reusing why_it_matters from LLM eval if present)
                        synth = llm_processor.generate_synthesis(
                            title=title,
                            summary=summary,
                            category=cat,
                            why_it_matters_override=eval_result.get("why_it_matters")
                        )

                        existing_q = await session.execute(
                            select(NewsItem).where(NewsItem.dedup_hash == dedup_hash)
                        )
                        existing = existing_q.scalar_one_or_none()

                        if existing:
                            existing.raw_score = max(existing.raw_score, raw_score)
                            existing.comments_count = max(existing.comments_count, comments_count)
                            existing.hotness_score = hotness
                            existing.quality_score = eval_result["quality_score"]
                            existing.is_high_signal = eval_result["is_high_signal"]
                            if not existing.why_it_matters:
                                existing.why_it_matters = synth["why_it_matters"]
                                existing.tldr_bullets = json.dumps(synth["tldr_bullets"], ensure_ascii=False)
                                existing.tech_stack = ",".join(synth["tech_stack"])
                        else:
                            new_item = NewsItem(
                                title=title,
                                url=url,
                                source=source,
                                category=cat,
                                summary=summary,
                                author=raw.get("author"),
                                tags=",".join(tags),
                                tldr_bullets=json.dumps(synth["tldr_bullets"], ensure_ascii=False),
                                why_it_matters=synth["why_it_matters"],
                                tech_stack=",".join(synth["tech_stack"]),
                                quality_score=eval_result["quality_score"],
                                is_high_signal=eval_result["is_high_signal"],
                                raw_score=raw_score,
                                comments_count=comments_count,
                                hotness_score=hotness,
                                published_at=pub_at,
                                dedup_hash=dedup_hash
                            )
                            session.add(new_item)
                            saved_count += 1

                    await session.commit()
                    self.items_saved += saved_count
                    return saved_count
                except Exception as e:
                    await session.rollback()
                    logger.error(f"Error saving batch for {source_name}: {e}")
                    return 0

    async def collect_all(self, session: AsyncSession = None) -> Dict[str, Any]:
        if self.is_running:
            return {"status": "already_running", "message": "Collector is currently running"}

        self.is_running = True
        self.current_source = "시작 중"
        self.step_message = "전세계 소스 실시간 수집을 시작합니다..."
        self.items_collected = 0
        self.items_saved = 0
        self.items_filtered = 0
        self.completed_sources = 0
        started_at = datetime.now(timezone.utc)

        source_results = {}

        source_tasks = [
            ("국내 & 글로벌 RSS 피드", fetch_rss()),
            ("HackerNews", fetch_hackernews()),
            ("GitHub Releases", fetch_github()),
            ("arXiv Papers", fetch_arxiv()),
            ("Hugging Face", fetch_huggingface()),
            ("Reddit", fetch_reddit())
        ]
        self.total_sources = len(source_tasks)

        async def run_source_worker(name: str, coro):
            try:
                self.current_source = name
                self.step_message = f"⚡️ {name} 수집 중..."
                raw_items = await coro
                source_results[name] = {"count": len(raw_items)}
                saved = await self._process_and_save_batch(raw_items, name)
                self.completed_sources += 1
                self.step_message = f"✅ {name} 완료 (+{saved}건 선별 저장)"
            except Exception as e:
                logger.error(f"Failed to crawl {name}: {e}")
                source_results[name] = {"error": str(e), "count": 0}
                self.completed_sources += 1

        try:
            # Run all sources concurrently with progressive saving
            await asyncio.gather(*(run_source_worker(n, c) for n, c in source_tasks), return_exceptions=True)

            # If completely empty, insert seeds
            if self.items_collected == 0:
                await self._process_and_save_batch(SEED_ITEMS, "Seeds")

            # Final log entry
            async with AsyncSessionLocal() as final_session:
                log = CrawlLog(
                    source="all_sources_stream_ingestion",
                    items_crawled=self.items_collected,
                    items_saved=self.items_saved,
                    status="success",
                    started_at=started_at,
                    completed_at=datetime.now(timezone.utc)
                )
                final_session.add(log)
                await final_session.commit()

            self.last_crawl_time = datetime.now(timezone.utc)
            self.last_crawl_stats = {
                "total_collected": self.items_collected,
                "total_saved": self.items_saved,
                "total_filtered_low_quality": self.items_filtered,
                "source_results": source_results
            }
            self.step_message = f"🎉 수집 완료! 총 {self.items_saved}건 신규 선별 저장"

            return {
                "status": "success",
                "total_collected": self.items_collected,
                "total_saved": self.items_saved,
                "total_filtered_low_quality": self.items_filtered,
                "source_results": source_results
            }
        except Exception as e:
            logger.error(f"Global collection error: {e}")
            self.step_message = f"수집 오류: {e}"
            return {"status": "error", "error": str(e)}
        finally:
            self.is_running = False

collector_manager = CollectorManager()
