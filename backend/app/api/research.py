from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.services.source_researcher import source_researcher

router = APIRouter(prefix="/research", tags=["research"])

class InspectUrlRequest(BaseModel):
    url: str = Field(..., description="조사할 웹사이트 또는 GitHub 저장소 URL")

@router.post("/inspect-url")
async def inspect_url(req: InspectUrlRequest):
    """
    입력된 임의의 URL(블로그, 웹사이트, GitHub 레포)을 분석하여
    RSS/Atom 피드를 자동 감지하고 최신 기사 및 신호 적합도 점수를 산출합니다.
    """
    if not req.url:
        raise HTTPException(status_code=400, detail="조사할 URL 을 입력해주세요.")
    result = await source_researcher.inspect_url(req.url)
    return result

from app.services.deep_researcher import deep_researcher
import asyncio

_background_tasks: set = set()

@router.get("/status")
async def get_deep_research_status():
    """백엔드 자율 딥 리서치 엔진의 현재 실행 상태와 통계를 반환합니다."""
    return deep_researcher.get_status()

@router.get("/audit-logs")
async def get_research_audit_logs(limit: int = Query(30, ge=1, le=200)):
    """자율 딥 리서치가 수행한 소스 평가 결과, 판정(AUTO_ADOPTED/WATCHLIST/REJECTED), AI 판정 이유를 반환합니다."""
    logs = await deep_researcher.get_audit_logs(limit=limit)
    return {
        "status": "success",
        "total": len(logs),
        "logs": logs
    }

@router.post("/run-deep")
async def trigger_deep_research(max_candidates: int = Query(6, ge=1, le=20)):
    """
    백엔드 자율 딥 리서치 엔진을 즉시 기동합니다.
    인용 도메인 마이닝, 피드 실증, 키워드 규칙 점수를 거쳐 고신호 소스를 sources.json에 자동 채택합니다.
    """
    if deep_researcher.is_running:
        return {"status": "already_running", "message": "Deep Research is already executing"}

    # 태스크 참조를 끝날 때까지 들고 있어야 실행 중에 GC 되지 않는다 (N-02). 실패 요약은 deep_researcher 가 남긴다
    task = asyncio.create_task(deep_researcher.run_deep_research(max_candidates=max_candidates))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
    return {
        "status": "started",
        "message": "자율 딥 리서치 사이클이 백그라운드에서 기동되었습니다.",
        "max_candidates": max_candidates
    }

