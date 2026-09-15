import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.news import NewsItem
from app.config import settings

logger = logging.getLogger("agentlens.briefing")

CATEGORY_DEFS = [
    {
        "id": "harness",
        "name": "하네스 & 벤치마크",
        "icon": "🎯",
        "description": "에이전트 평가, 샌드박스, SWE-bench 계열 테스트베드",
        "default_summary": "에이전트 평가 신뢰도 향상을 위한 샌드박스 격리 런타임 및 회귀 테스트베드 소식이 주목받고 있습니다."
    },
    {
        "id": "mcp_plugins_skills",
        "name": "MCP & 도구·스킬 생태계",
        "icon": "🔌",
        "description": "Model Context Protocol, 도구 호출, 스킬 플러그인",
        "default_summary": "Model Context Protocol(MCP) 기반 표준 도구 연동과 오픈소스 서버 생태계 확장이 가속화되고 있습니다."
    },
    {
        "id": "agent_tech",
        "name": "에이전트 아키텍처 & 런타임",
        "icon": "🤖",
        "description": "멀티에이전트 오케스트레이션, 장기 기억, 스캐폴딩",
        "default_summary": "단일 LLM 호출을 넘어 지속적 상태 영속성과 메모리를 갖춘 복합 멀티에이전트 아키텍처가 발전하고 있습니다."
    },
    {
        "id": "ai_news",
        "name": "최신 AI 소식 & 프론티어 모델",
        "icon": "💡",
        "description": "최신 추론 모델, 연구 논문, 프론티어 LLM 브레이크스루",
        "default_summary": "프론티어 모델 발표와 최신 추론(Reasoning) 기법 연구 및 오픈소스 모델 릴리즈가 활발히 이어지고 있습니다."
    }
]

class BriefingService:
    async def _fetch_category_items(self, session: AsyncSession, category_id: str, limit: int = 3) -> List[NewsItem]:
        """Queries top news items for a specific category."""
        q = (
            select(NewsItem)
            .where(NewsItem.category == category_id)
            .order_by(desc(NewsItem.is_high_signal), desc(NewsItem.hotness_score), desc(NewsItem.id))
            .limit(limit)
        )
        res = await session.execute(q)
        items = res.scalars().all()

        # If sparse, fall back to matching items from general pool
        if len(items) < 2:
            q_fallback = (
                select(NewsItem)
                .order_by(desc(NewsItem.is_high_signal), desc(NewsItem.hotness_score), desc(NewsItem.id))
                .limit(15)
            )
            fb_res = await session.execute(q_fallback)
            all_fb = fb_res.scalars().all()
            for it in all_fb:
                if it not in items and len(items) < limit:
                    # check tag or keyword relevance
                    text_corpus = f"{it.title} {it.summary} {' '.join(it.tags)}".lower()
                    if category_id == "harness" and any(k in text_corpus for k in ["bench", "eval", "test", "harness", "sandbox"]):
                        items.append(it)
                    elif category_id == "mcp_plugins_skills" and any(k in text_corpus for k in ["mcp", "protocol", "tool", "plugin", "skill"]):
                        items.append(it)
                    elif category_id == "agent_tech" and any(k in text_corpus for k in ["agent", "graph", "crew", "memory", "state"]):
                        items.append(it)
                    elif category_id == "ai_news" and any(k in text_corpus for k in ["model", "llm", "reasoning", "paper", "deepseek", "openai"]):
                        items.append(it)
        return items

    def _synthesize_category_summary(self, cat_def: Dict[str, Any], items: List[NewsItem]) -> str:
        """Synthesizes dynamic category summary based on actual retrieved news."""
        if not items:
            return cat_def["default_summary"]

        top = items[0]
        if top.why_it_matters:
            return f"'{top.title[:45]}...' 등이 주목받으며, {top.why_it_matters}"
        elif top.summary:
            return f"'{top.title[:45]}...' 관련 소식으로, {top.summary[:90]}..."
        return cat_def["default_summary"]

    def _generate_headline(self, categories_data: List[Dict[str, Any]]) -> str:
        """Generates dynamic headline based on the day's highest signal news."""
        all_items: List[Dict[str, Any]] = []
        for c in categories_data:
            all_items.extend(c.get("items", []))

        if all_items:
            first = all_items[0]
            title = first.get("title", "")
            cat_name = first.get("category_name", "")
            if len(title) > 40:
                title = title[:40] + "..."
            return f"{title} 및 분야별 핵심 에이전트 기술 동향"
        return "SWE-bench 평가 하네스 및 Model Context Protocol 생태계 동향"

    async def generate_daily_briefing(self, session: AsyncSession = None) -> Dict[str, Any]:
        """Generates rich, category-structured daily briefing with clean formatting."""
        close_session = False
        if session is None:
            session = AsyncSessionLocal()
            close_session = True

        try:
            today_str = datetime.now(timezone.utc).strftime("%Y년 %m월 %d일")
            categories_result: List[Dict[str, Any]] = []
            total_featured = 0

            for cat in CATEGORY_DEFS:
                items = await self._fetch_category_items(session, cat["id"], limit=3)
                total_featured += len(items)

                cat_summary = self._synthesize_category_summary(cat, items)
                cat_items_data = []
                for it in items:
                    cat_items_data.append({
                        "id": it.id,
                        "title": it.title,
                        "url": it.url,
                        "source": it.source,
                        "why_it_matters": it.why_it_matters or "",
                        "summary": it.summary or "",
                        "tags": [t.strip() for t in it.tags.split(",") if t.strip()] if isinstance(it.tags, str) else (it.tags or []),
                        "category": it.category,
                        "category_name": cat["name"],
                        "hotness_score": it.hotness_score
                    })

                categories_result.append({
                    "id": cat["id"],
                    "name": cat["name"],
                    "icon": cat["icon"],
                    "summary": cat_summary,
                    "items": cat_items_data
                })

            headline = self._generate_headline(categories_result)

            # Overview bullet points
            overview_bullets = []
            for c in categories_result:
                overview_bullets.append(f"• **{c['name']}**: {c['summary']}")
            overview_text = "\n".join(overview_bullets)

            # Action Items
            action_items = [
                "사내 에이전트 워크플로우에 단위 평가 및 샌드박스 격리 테스트베드 도입 검토",
                "사내 API 및 외부 연동 도구 인터페이스를 FastMCP 규격으로 표준화",
                "복합 워크플로우를 단일 프롬프트에서 단계별 상태 영속성(State) 구조로 리팩토링"
            ]

            # Build comprehensive Markdown Report
            lines = [
                f"# 🌅 오늘의 AI 브리핑",
                f"**발행 일자**: {today_str} (UTC) | **핵심 토픽**: {headline}\n",
                "## 📌 오늘의 핵심 테이크어웨이 (Overview)",
                overview_text,
                ""
            ]

            for cat in categories_result:
                lines.append(f"## {cat['icon']} {cat['name']}")
                if cat["summary"]:
                    lines.append(f"> 💡 **동향 요약**: {cat['summary']}\n")

                if cat["items"]:
                    for it in cat["items"]:
                        src_label = f" `[{it['source']}]`" if it["source"] else ""
                        lines.append(f"- **[{it['title']}]({it['url']})**{src_label}")
                        if it["why_it_matters"]:
                            lines.append(f"  *↳ 💡 시사점: {it['why_it_matters']}*")
                        elif it["summary"]:
                            lines.append(f"  *↳ 📝 요약: {it['summary']}*")
                else:
                    lines.append("- 현재 해당 카테고리의 새로운 주요 소식을 수집 분석 중입니다.")
                lines.append("")

            lines.append("## ✅ 오늘의 추천 Action Items")
            for idx, act in enumerate(action_items, 1):
                lines.append(f"{idx}. {act}")

            markdown_report = "\n".join(lines)

            briefing_payload = {
                "title": "오늘의 AI 브리핑",
                "date": today_str,
                "headline": headline,
                "overview": overview_text,
                "categories": categories_result,
                "action_items": action_items,
                "markdown_report": markdown_report,
                "featured_items_count": total_featured,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

            return briefing_payload
        finally:
            if close_session:
                await session.close()

    async def auto_dispatch_all(self, briefing_payload: Optional[Dict[str, Any]] = None):
        """Dispatches daily briefing to enabled external channels (Notion, Email, Webhooks)."""
        if briefing_payload is None:
            briefing_payload = await self.generate_daily_briefing()

        # 1. Notion Auto Export
        if settings.NOTION_AUTO_EXPORT and settings.NOTION_API_KEY:
            try:
                from app.services.notion_service import notion_service
                success, msg, url = await notion_service.create_briefing_page(briefing_payload)
                if success:
                    logger.info(f"[Briefing] Notion auto-export success: {url}")
                else:
                    logger.warning(f"[Briefing] Notion auto-export failed: {msg}")
            except Exception as e:
                logger.error(f"[Briefing] Notion auto-export exception: {e}")

        # 2. Email Auto Send
        if settings.EMAIL_AUTO_SEND and settings.SMTP_HOST and settings.SMTP_TO:
            try:
                from app.services.email_service import email_service
                success, msg = await email_service.send_briefing_email(briefing_payload)
                if success:
                    logger.info(f"[Briefing] Email auto-send success: {msg}")
                else:
                    logger.warning(f"[Briefing] Email auto-send failed: {msg}")
            except Exception as e:
                logger.error(f"[Briefing] Email auto-send exception: {e}")

        # 3. Webhook Dispatch
        try:
            from app.services.webhook_service import webhook_service
            webhook_payload = {
                "title": f"🌅 오늘의 AI 브리핑 ({briefing_payload['date']})",
                "executive_summary": f"{briefing_payload['headline']}\n\n{briefing_payload['overview']}",
                "date": briefing_payload["date"],
                "top_highlights": [
                    item
                    for cat in briefing_payload.get("categories", [])
                    for item in cat.get("items", [])[:1]
                ]
            }
            if settings.SLACK_WEBHOOK_URL:
                await webhook_service.dispatch_briefing(settings.SLACK_WEBHOOK_URL, webhook_payload)
            if settings.DISCORD_WEBHOOK_URL:
                await webhook_service.dispatch_briefing(settings.DISCORD_WEBHOOK_URL, webhook_payload)
        except Exception as e:
            logger.error(f"[Briefing] Webhook auto-dispatch exception: {e}")

briefing_service = BriefingService()
