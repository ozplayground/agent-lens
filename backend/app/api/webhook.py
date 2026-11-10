from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.webhook_service import webhook_service

router = APIRouter(prefix="/webhook", tags=["Webhook Dispatcher"])

class WebhookTestRequest(BaseModel):
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
