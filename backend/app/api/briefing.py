import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings, save_json_config
from app.services.briefing_service import briefing_service
from app.services.notion_service import notion_service
from app.services.email_service import email_service
from app.schemas.news import (
    DailyBriefingResponse,
    NotionExportRequest,
    NotionExportResponse,
    EmailSendRequest,
    EmailSendResponse,
    TestNotionRequest,
    TestEmailRequest,
    BriefingSettingsUpdate
)

logger = logging.getLogger("agentlens.api.briefing")
router = APIRouter(prefix="/briefing", tags=["Daily Briefing"])

@router.get("/today", response_model=DailyBriefingResponse)
async def get_today_briefing(db: AsyncSession = Depends(get_db)):
    data = await briefing_service.generate_daily_briefing(session=db)
    return DailyBriefingResponse(
        title=data.get("title", "오늘의 AI 브리핑"),
        date=data["date"],
        headline=data["headline"],
        overview=data.get("overview", ""),
        categories=data.get("categories", []),
        action_items=data.get("action_items", []),
        markdown_report=data["markdown_report"],
        featured_items_count=data["featured_items_count"],
        generated_at=data["generated_at"]
    )

@router.post("/generate", response_model=DailyBriefingResponse)
async def regenerate_briefing(db: AsyncSession = Depends(get_db)):
    data = await briefing_service.generate_daily_briefing(session=db)
    return DailyBriefingResponse(
        title=data.get("title", "오늘의 AI 브리핑"),
        date=data["date"],
        headline=data["headline"],
        overview=data.get("overview", ""),
        categories=data.get("categories", []),
        action_items=data.get("action_items", []),
        markdown_report=data["markdown_report"],
        featured_items_count=data["featured_items_count"],
        generated_at=data["generated_at"]
    )

@router.post("/export/notion", response_model=NotionExportResponse)
async def export_to_notion(
    req: Optional[NotionExportRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    api_key = req.api_key if req else None
    page_id = req.page_id if req else None

    briefing_data = await briefing_service.generate_daily_briefing(session=db)
    success, msg, url = await notion_service.create_briefing_page(
        briefing=briefing_data,
        api_key=api_key,
        parent_page_id=page_id
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return NotionExportResponse(success=True, message=msg, url=url)

@router.post("/send/email", response_model=EmailSendResponse)
async def send_briefing_by_email(
    req: Optional[EmailSendRequest] = None,
    db: AsyncSession = Depends(get_db)
):
    to_email = req.to_email if req else None
    subject = req.subject if req else None

    briefing_data = await briefing_service.generate_daily_briefing(session=db)
    success, msg = await email_service.send_briefing_email(
        briefing=briefing_data,
        to_email=to_email,
        custom_subject=subject
    )

    if not success:
        raise HTTPException(status_code=400, detail=msg)

    return EmailSendResponse(success=True, message=msg)

@router.post("/test/notion")
async def test_notion_connection(req: TestNotionRequest):
    success, msg = await notion_service.test_connection(api_key=req.api_key, page_id=req.page_id)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@router.post("/test/email")
async def test_email_connection(req: TestEmailRequest):
    success, msg = await email_service.test_connection(
        host=req.smtp_host,
        port=req.smtp_port,
        user=req.smtp_user,
        password=req.smtp_password,
        use_tls=req.use_tls,
        to_email=req.to_email
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}

@router.get("/settings")
async def get_briefing_settings():
    raw = settings.raw_json_config
    briefing = raw.get("briefing", {})
    notion = briefing.get("notion", {})
    email = briefing.get("email", {})
    webhooks = raw.get("webhooks", {})

    # Mask passwords and sensitive keys for UI safety
    masked_notion_key = ""
    if notion.get("api_key"):
        k = notion["api_key"]
        masked_notion_key = k[:4] + "..." + k[-4:] if len(k) > 8 else "***"

    masked_smtp_pw = "***" if email.get("smtp_password") else ""

    return {
        "title": briefing.get("title", "오늘의 AI 브리핑"),
        "auto_dispatch_hour": briefing.get("auto_dispatch_hour", 0),
        "notion": {
            "enabled": notion.get("enabled", False),
            "has_api_key": bool(notion.get("api_key")),
            "masked_api_key": masked_notion_key,
            "page_id": notion.get("page_id", ""),
            "auto_export": notion.get("auto_export", False)
        },
        "email": {
            "enabled": email.get("enabled", False),
            "smtp_host": email.get("smtp_host", ""),
            "smtp_port": email.get("smtp_port", 587),
            "smtp_user": email.get("smtp_user", ""),
            "has_password": bool(email.get("smtp_password")),
            "smtp_from": email.get("smtp_from", ""),
            "smtp_to": email.get("smtp_to", ""),
            "use_tls": email.get("use_tls", True),
            "auto_send": email.get("auto_send", False)
        },
        "webhooks": {
            "slack_webhook_url": webhooks.get("slack_webhook_url", ""),
            "discord_webhook_url": webhooks.get("discord_webhook_url", ""),
            "auto_dispatch_daily_briefing": webhooks.get("auto_dispatch_daily_briefing", True),
            "auto_alert_high_signal": webhooks.get("auto_alert_high_signal", True)
        }
    }

@router.post("/settings")
async def update_briefing_settings(update: BriefingSettingsUpdate):
    raw = dict(settings.raw_json_config)
    if "briefing" not in raw:
        raw["briefing"] = {}
    if "notion" not in raw["briefing"]:
        raw["briefing"]["notion"] = {}
    if "email" not in raw["briefing"]:
        raw["briefing"]["email"] = {}
    if "webhooks" not in raw:
        raw["webhooks"] = {}

    # Update Notion
    if update.notion_api_key is not None and update.notion_api_key != "***":
        raw["briefing"]["notion"]["api_key"] = update.notion_api_key.strip()
    if update.notion_page_id is not None:
        raw["briefing"]["notion"]["page_id"] = update.notion_page_id.strip()
    if update.notion_auto_export is not None:
        raw["briefing"]["notion"]["auto_export"] = update.notion_auto_export
        raw["briefing"]["notion"]["enabled"] = update.notion_auto_export or bool(raw["briefing"]["notion"].get("api_key"))

    # Update Email
    if update.smtp_host is not None:
        raw["briefing"]["email"]["smtp_host"] = update.smtp_host.strip()
    if update.smtp_port is not None:
        raw["briefing"]["email"]["smtp_port"] = update.smtp_port
    if update.smtp_user is not None:
        raw["briefing"]["email"]["smtp_user"] = update.smtp_user.strip()
    if update.smtp_password is not None and update.smtp_password != "***":
        raw["briefing"]["email"]["smtp_password"] = update.smtp_password.strip()
    if update.smtp_from is not None:
        raw["briefing"]["email"]["smtp_from"] = update.smtp_from.strip()
    if update.smtp_to is not None:
        raw["briefing"]["email"]["smtp_to"] = update.smtp_to.strip()
    if update.smtp_use_tls is not None:
        raw["briefing"]["email"]["use_tls"] = update.smtp_use_tls
    if update.email_auto_send is not None:
        raw["briefing"]["email"]["auto_send"] = update.email_auto_send
        raw["briefing"]["email"]["enabled"] = update.email_auto_send or bool(raw["briefing"]["email"].get("smtp_host"))

    # Update Webhooks
    if update.slack_webhook_url is not None:
        raw["webhooks"]["slack_webhook_url"] = update.slack_webhook_url.strip()
    if update.discord_webhook_url is not None:
        raw["webhooks"]["discord_webhook_url"] = update.discord_webhook_url.strip()

    ok = save_json_config(raw)
    if not ok:
        raise HTTPException(status_code=500, detail="설정 파일(config.json) 저장에 실패했습니다.")

    return {"success": True, "message": "설정이 성공적으로 저장되었습니다."}
