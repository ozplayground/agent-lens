import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.briefing_service import briefing_service
from app.services.notion_service import notion_service
from app.services.email_service import email_service

@pytest.mark.asyncio
async def test_today_briefing_structure():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/briefing/today")
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "오늘의 AI 브리핑"
        assert "date" in data
        assert "headline" in data
        assert "overview" in data
        assert "categories" in data
        assert len(data["categories"]) == 4
        assert "action_items" in data
        assert len(data["action_items"]) > 0
        assert "markdown_report" in data

        # Verify category sections
        cat_ids = [c["id"] for c in data["categories"]]
        assert "harness" in cat_ids
        assert "mcp_plugins_skills" in cat_ids
        assert "agent_tech" in cat_ids
        assert "ai_news" in cat_ids

@pytest.mark.asyncio
async def test_notion_clean_id():
    raw_url = "https://www.notion.so/myworkspace/Daily-Briefing-1234567890abcdef1234567890abcdef"
    cleaned = notion_service.clean_id(raw_url)
    assert cleaned == "12345678-90ab-cdef-1234-567890abcdef"

    raw_uuid = "12345678-90ab-cdef-1234-567890abcdef"
    assert notion_service.clean_id(raw_uuid) == raw_uuid

@pytest.mark.asyncio
async def test_notion_test_connection_mock():
    with patch("httpx.AsyncClient.get") as mock_get:
        # Mock user info response
        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {"name": "AgentLens Bot"}
        mock_get.return_value = mock_res

        success, msg = await notion_service.test_connection(api_key="secret_test123")
        assert success is True
        assert "AgentLens Bot" in msg

@pytest.mark.asyncio
async def test_notion_export_page_mock():
    with patch("httpx.AsyncClient.post") as mock_post:
        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {
            "id": "12345678-90ab-cdef-1234-567890abcdef",
            "url": "https://notion.so/1234567890abcdef1234567890abcdef"
        }
        mock_post.return_value = mock_res

        briefing = await briefing_service.generate_daily_briefing()
        success, msg, url = await notion_service.create_briefing_page(
            briefing=briefing,
            api_key="secret_test123",
            parent_page_id="1234567890abcdef1234567890abcdef"
        )
        assert success is True
        assert url is not None
        assert "notion.so" in url

@pytest.mark.asyncio
async def test_notion_api_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Missing key returns 400
        res = await ac.post("/api/briefing/test/notion", json={"api_key": ""})
        assert res.status_code == 400

        # Export with mock
        with patch.object(notion_service, "create_briefing_page", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = (True, "생성 성공", "https://notion.so/test-page")
            res_export = await ac.post("/api/briefing/export/notion", json={
                "api_key": "secret_mock",
                "page_id": "mock_page_id"
            })
            assert res_export.status_code == 200
            assert res_export.json()["url"] == "https://notion.so/test-page"

@pytest.mark.asyncio
async def test_email_service_html_generation():
    briefing = await briefing_service.generate_daily_briefing()
    html = email_service._build_html(briefing)
    assert "<!DOCTYPE html>" in html
    assert "오늘의 AI 브리핑" in html
    assert "AgentLens" in html

@pytest.mark.asyncio
async def test_email_test_connection_mock():
    with patch("smtplib.SMTP") as mock_smtp_class:
        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        success, msg = await email_service.test_connection(
            host="smtp.example.com",
            port=587,
            user="user@example.com",
            password="password",
            use_tls=True,
            to_email="test@example.com"
        )
        assert success is True
        assert "성공적으로" in msg

@pytest.mark.asyncio
async def test_email_api_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Missing host returns 400
        res = await ac.post("/api/briefing/test/email", json={"smtp_host": ""})
        assert res.status_code == 400

        # Send email with mock
        with patch.object(email_service, "send_briefing_email", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = (True, "발송 성공")
            res_send = await ac.post("/api/briefing/send/email", json={
                "to_email": "dev@example.com"
            })
            assert res_send.status_code == 200
            assert res_send.json()["success"] is True

@pytest.mark.asyncio
async def test_briefing_settings_get_and_post():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/briefing/settings")
        assert res.status_code == 200
        settings_data = res.json()
        assert "title" in settings_data
        assert "notion" in settings_data
        assert "email" in settings_data
        assert "webhooks" in settings_data

        # Update settings
        update_res = await ac.post("/api/briefing/settings", json={
            "notion_page_id": "test_notion_parent_page",
            "smtp_host": "smtp.gmail.com",
            "smtp_port": 587,
            "smtp_to": "team@example.com"
        })
        assert update_res.status_code == 200
        assert update_res.json()["success"] is True
