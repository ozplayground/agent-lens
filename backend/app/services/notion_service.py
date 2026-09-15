import re
import httpx
import logging
from typing import Dict, Any, Tuple, Optional, List
from app.config import settings

logger = logging.getLogger("agentlens.notion")

class NotionService:
    NOTION_API_URL = "https://api.notion.com/v1"
    NOTION_VERSION = "2022-06-28"

    def clean_id(self, raw_id: str) -> str:
        """Extracts a valid 32-character Notion UUID from a raw string or full URL."""
        if not raw_id:
            return ""
        # Match 32 hex chars with or without hyphens
        # e.g., https://www.notion.so/workspace/Page-Title-1234567890abcdef1234567890abcdef
        m = re.findall(r"([0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", raw_id)
        if m:
            target = m[-1].replace("-", "")
            # Format as 8-4-4-4-12
            return f"{target[:8]}-{target[8:12]}-{target[12:16]}-{target[16:20]}-{target[20:]}"
        return raw_id.strip()

    def get_headers(self, api_key: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {api_key.strip()}",
            "Notion-Version": self.NOTION_VERSION,
            "Content-Type": "application/json"
        }

    async def test_connection(self, api_key: Optional[str] = None, page_id: Optional[str] = None) -> Tuple[bool, str]:
        """Tests Notion API key authentication and optional page access."""
        key = (api_key or settings.NOTION_API_KEY).strip()
        if not key:
            return False, "Notion API 토큰(Internal Integration Token)을 입력해주세요."

        headers = self.get_headers(key)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. Test bot user identity
                user_res = await client.get(f"{self.NOTION_API_URL}/users/me", headers=headers)
                if user_res.status_code != 200:
                    err_msg = user_res.json().get("message", user_res.text)
                    return False, f"Notion 인증 실패: {err_msg}"
                
                bot_name = user_res.json().get("name", "AgentLens Integration")

                # 2. If page_id is provided, verify access to the parent page
                target_page = self.clean_id(page_id or settings.NOTION_PAGE_ID)
                if target_page:
                    page_res = await client.get(f"{self.NOTION_API_URL}/pages/{target_page}", headers=headers)
                    if page_res.status_code == 404:
                        # Could be a database instead of a page
                        db_res = await client.get(f"{self.NOTION_API_URL}/databases/{target_page}", headers=headers)
                        if db_res.status_code != 200:
                            return False, (
                                f"봇({bot_name})이 대상 페이지에 접근할 수 없습니다. "
                                "노션 페이지 우측 상단 '...' > '연결(Connections)' 메뉴에서 해당 통합(Integration)을 페이지에 초대해주세요."
                            )
                    elif page_res.status_code != 200:
                        err_msg = page_res.json().get("message", page_res.text)
                        return False, f"대상 페이지 접근 권한 오류: {err_msg}"

                return True, f"Notion 연동 성공! (연결된 통합: {bot_name})"
        except httpx.RequestError as e:
            return False, f"Notion API 네트워크 오류: {str(e)}"
        except Exception as e:
            return False, f"Notion 검증 중 오류: {str(e)}"

    def _build_blocks(self, briefing: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Converts structured briefing data into native Notion API blocks."""
        blocks: List[Dict[str, Any]] = []

        # 1. Headline Callout
        headline = briefing.get("headline", "오늘의 AI 핵심 동향")
        overview = briefing.get("overview", "")
        callout_text = f"📌 {headline}"
        if overview:
            callout_text += f"\n\n{overview}"

        blocks.append({
            "object": "block",
            "type": "callout",
            "callout": {
                "rich_text": [{"type": "text", "text": {"content": callout_text[:1900]}}],
                "icon": {"type": "emoji", "emoji": "🌅"},
                "color": "blue_background"
            }
        })

        blocks.append({"object": "block", "type": "divider", "divider": {}})

        # 2. Category Sections
        categories = briefing.get("categories", [])
        for cat in categories:
            cat_name = cat.get("name", "카테고리")
            cat_icon = cat.get("icon", "🎯")
            cat_summary = cat.get("summary", "")
            items = cat.get("items", [])

            # Heading 2
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": f"{cat_icon} {cat_name}"}}],
                    "color": "default"
                }
            })

            # Category Summary paragraph
            if cat_summary:
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {"type": "text", "text": {"content": "💡 동향: "}, "annotations": {"bold": True}},
                            {"type": "text", "text": {"content": cat_summary[:1900]}}
                        ],
                        "color": "gray"
                    }
                })

            # Item bullets
            for item in items:
                title = item.get("title", "소식")
                url = item.get("url") or "#"
                why = item.get("why_it_matters", "")
                summary = item.get("summary", "")
                source = item.get("source", "")

                rich_texts = [
                    {
                        "type": "text",
                        "text": {
                            "content": title[:100],
                            "link": {"url": url} if url.startswith("http") else None
                        },
                        "annotations": {"bold": True}
                    }
                ]
                if source:
                    rich_texts.append({
                        "type": "text",
                        "text": {"content": f" [{source}]"},
                        "annotations": {"color": "gray"}
                    })
                if why:
                    rich_texts.append({
                        "type": "text",
                        "text": {"content": f"\n↳ 💡 시사점: {why[:250]}"}
                    })
                elif summary:
                    rich_texts.append({
                        "type": "text",
                        "text": {"content": f"\n↳ 📝 요약: {summary[:250]}"}
                    })

                blocks.append({
                    "object": "block",
                    "type": "bulleted_list_item",
                    "bulleted_list_item": {
                        "rich_text": rich_texts
                    }
                })

            blocks.append({"object": "block", "type": "divider", "divider": {}})

        # 3. Action Items
        action_items = briefing.get("action_items", [])
        if action_items:
            blocks.append({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "✅ 오늘의 실무 Action Items"}}],
                    "color": "green"
                }
            })
            for idx, act in enumerate(action_items, 1):
                blocks.append({
                    "object": "block",
                    "type": "to_do",
                    "to_do": {
                        "rich_text": [{"type": "text", "text": {"content": f"{idx}. {act[:1900]}"}}],
                        "checked": False
                    }
                })

        # Footer
        blocks.append({
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{
                    "type": "text",
                    "text": {"content": f"AgentLens AI Curation Platform • 발행 일시: {briefing.get('date', '')}"},
                    "annotations": {"italic": True, "color": "gray"}
                }]
            }
        })

        return blocks

    async def create_briefing_page(
        self,
        briefing: Dict[str, Any],
        api_key: Optional[str] = None,
        parent_page_id: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Creates a new Notion page containing the daily briefing.
        Returns: (success: bool, message: str, page_url: Optional[str])
        """
        key = (api_key or settings.NOTION_API_KEY).strip()
        raw_parent = (parent_page_id or settings.NOTION_PAGE_ID).strip()
        parent_id = self.clean_id(raw_parent)

        if not key:
            return False, "Notion API 토큰(Internal Integration Token)이 설정되지 않았습니다.", None
        if not parent_id:
            return False, "Notion 부모 페이지(Parent Page ID)가 설정되지 않았습니다.", None

        headers = self.get_headers(key)
        date_str = briefing.get("date", "")
        title_text = f"오늘의 AI 브리핑 - {date_str}"

        # Determine parent type (page or database)
        parent_payload: Dict[str, Any] = {"page_id": parent_id}
        properties_payload: Dict[str, Any] = {
            "title": [{"text": {"content": title_text}}]
        }

        # Check if parent is database
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                check_db = await client.get(f"{self.NOTION_API_URL}/databases/{parent_id}", headers=headers)
                if check_db.status_code == 200:
                    parent_payload = {"database_id": parent_id}
                    properties_payload = {
                        "Name": {"title": [{"text": {"content": title_text}}]}
                    }
        except Exception:
            pass

        blocks = self._build_blocks(briefing)

        # Notion accepts max 100 children per create request
        initial_blocks = blocks[:100]
        remaining_blocks = blocks[100:]

        payload = {
            "parent": parent_payload,
            "icon": {"type": "emoji", "emoji": "🌅"},
            "properties": properties_payload,
            "children": initial_blocks
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(f"{self.NOTION_API_URL}/pages", headers=headers, json=payload)
                if res.status_code not in (200, 201):
                    err_json = res.json()
                    err_msg = err_json.get("message", res.text)
                    code = err_json.get("code", "")
                    if code == "object_not_found":
                        return False, (
                            "노션 부모 페이지를 찾을 수 없습니다. "
                            "해당 노션 페이지의 우측 상단 '...' > '연결' 메뉴에서 통합(Integration)을 초대했는지 확인해주세요."
                        ), None
                    return False, f"Notion 페이지 생성 실패 ({res.status_code}): {err_msg}", None

                page_data = res.json()
                created_page_id = page_data.get("id", "").replace("-", "")
                page_url = page_data.get("url") or f"https://notion.so/{created_page_id}"

                # Append any remaining blocks
                if remaining_blocks and created_page_id:
                    for i in range(0, len(remaining_blocks), 100):
                        chunk = remaining_blocks[i:i+100]
                        await client.patch(
                            f"{self.NOTION_API_URL}/blocks/{created_page_id}/children",
                            headers=headers,
                            json={"children": chunk}
                        )

                return True, "Notion 페이지가 성공적으로 생성되었습니다!", page_url
        except httpx.RequestError as e:
            return False, f"Notion API 통신 실패: {str(e)}", None
        except Exception as e:
            return False, f"Notion 페이지 생성 중 예외 발생: {str(e)}", None

notion_service = NotionService()
