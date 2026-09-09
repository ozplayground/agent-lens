import httpx
import logging
from typing import Dict, Any, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("agentlens.webhook")

class WebhookService:
    def detect_provider(self, url: str) -> str:
        url_lower = url.lower()
        if "slack.com" in url_lower:
            return "slack"
        elif "discord.com" in url_lower or "discordapp.com" in url_lower:
            return "discord"
        return "generic"

    async def send_payload(self, url: str, payload: Dict[str, Any]) -> Tuple[bool, str]:
        if not url or not url.startswith("http"):
            return False, "유효한 웹훅 URL이 아닙니다."

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code in (200, 204):
                    return True, "전송 성공"
                return False, f"서버 응답 오류 (HTTP {res.status_code}): {res.text[:100]}"
        except httpx.RequestError as e:
            logger.error(f"Webhook request failed: {e}")
            return False, f"웹훅 요청 실패: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected webhook error: {e}")
            return False, f"예기치 못한 오류: {str(e)}"

    def build_test_payload(self, provider: str) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        if provider == "slack":
            return {
                "text": "🔔 AgentLens 웹훅 연동 테스트 성공!",
                "blocks": [
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": "🔔 AgentLens 웹훅 알림 연동 완료"}
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*AgentLens AI Intelligence Engine*과 성공적으로 연결되었습니다.\n앞으로 매일 아침 정기 브리핑 및 `⭐️ Must Read` 하네스 소식이 이 채널로 자동 전달됩니다.\n• 확인 시각: `{now_str}`"
                        }
                    }
                ]
            }
        elif provider == "discord":
            return {
                "content": "🔔 **AgentLens 웹훅 연동 테스트 성공!**",
                "embeds": [
                    {
                        "title": "AgentLens AI 알림 연동 완료",
                        "description": f"AgentLens 인텔리전스 엔진과 정상적으로 연결되었습니다.\n• 확인 시각: `{now_str}`",
                        "color": 3900150 # blue
                    }
                ]
            }
        else:
            return {
                "event": "agentlens.test",
                "message": "AgentLens Webhook Test Successful",
                "timestamp": now_str
            }

    def build_briefing_payload(self, briefing_data: Dict[str, Any], provider: str) -> Dict[str, Any]:
        title = briefing_data.get("title", "🌅 오늘의 AI 에이전트 인텔리전스 브리핑")
        summary = briefing_data.get("executive_summary", "")
        top_items = briefing_data.get("top_highlights", [])

        if provider == "slack":
            blocks = [
                {
                    "type": "header",
                    "text": {"type": "plain_text", "text": title}
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*📌 오늘의 총평*\n{summary}"
                    }
                },
                {"type": "divider"}
            ]

            # Highlights
            if top_items:
                highlight_lines = []
                for idx, it in enumerate(top_items[:5], 1):
                    item_title = it.get("title", "News")
                    item_url = it.get("url", "#")
                    category = it.get("category", "")
                    why = it.get("why_it_matters", "")
                    line = f"*{idx}. <{item_url}|{item_title}>* `[{category}]`"
                    if why:
                        line += f"\n   ↳ 💡 _{why}_"
                    highlight_lines.append(line)

                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*🎯 핵심 하이라이트*\n\n" + "\n\n".join(highlight_lines)
                    }
                })

            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"AgentLens AI Curation Platform • {briefing_data.get('date', '')}"
                    }
                ]
            })
            return {"blocks": blocks, "text": f"{title}\n{summary}"}

        elif provider == "discord":
            embed_fields = []
            for it in top_items[:4]:
                embed_fields.append({
                    "name": it.get("title", "News")[:100],
                    "value": f"[기사 원문 바로가기]({it.get('url', '#')})\n💡 {it.get('why_it_matters', it.get('summary', ''))[:200]}",
                    "inline": False
                })

            return {
                "content": f"**{title}**",
                "embeds": [
                    {
                        "title": "📌 Executive Summary",
                        "description": summary[:1500],
                        "color": 3900150,
                        "fields": embed_fields,
                        "footer": {"text": f"AgentLens • {briefing_data.get('date', '')}"}
                    }
                ]
            }
        else:
            return {
                "event": "agentlens.daily_briefing",
                "title": title,
                "summary": summary,
                "top_highlights": top_items,
                "date": briefing_data.get("date", "")
            }

    async def send_test(self, webhook_url: str, provider: str = "auto") -> Tuple[bool, str]:
        actual_provider = self.detect_provider(webhook_url) if provider == "auto" else provider
        payload = self.build_test_payload(actual_provider)
        return await self.send_payload(webhook_url, payload)

    async def dispatch_briefing(self, webhook_url: str, briefing_data: Dict[str, Any]) -> Tuple[bool, str]:
        provider = self.detect_provider(webhook_url)
        payload = self.build_briefing_payload(briefing_data, provider)
        return await self.send_payload(webhook_url, payload)

webhook_service = WebhookService()
