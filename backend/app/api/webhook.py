from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.webhook_service import webhook_service
from app.services.briefing_service import briefing_service

router = APIRouter(prefix="/webhook", tags=["Webhook Dispatcher"])

class WebhookTestRequest(BaseModel):
    webhook_url: str
    provider: Optional[str] = "auto"

class WebhookBriefingRequest(BaseModel):
    webhook_url: str
    provider: Optional[str] = "auto"

@router.post("/test")
async def test_webhook(req: WebhookTestRequest):
    if not req.webhook_url.startswith("http"):
        raise HTTPException(status_code=400, detail="유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.")
    success, msg = await webhook_service.send_test(req.webhook_url, req.provider)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": "테스트 웹훅 메시지가 성공적으로 전송되었습니다."}

@router.post("/send-briefing")
async def send_briefing_to_webhook(req: WebhookBriefingRequest, db: AsyncSession = Depends(get_db)):
    if not req.webhook_url.startswith("http"):
        raise HTTPException(status_code=400, detail="유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.")

    briefing = await briefing_service.generate_daily_briefing(session=db)
    briefing_payload = {
        "title": f"🌅 AgentLens 일일 AI 브리핑 ({briefing['date']})",
        "executive_summary": briefing["headline"] + "\n\n" + briefing["markdown_report"][:600] + "...",
        "date": briefing["date"],
        "top_highlights": []
    }
    success, msg = await webhook_service.dispatch_briefing(req.webhook_url, briefing_payload)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": "오늘의 일일 브리핑이 웹훅으로 성공적으로 발송되었습니다."}
