from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.source_researcher import source_researcher

router = APIRouter(prefix="/research", tags=["research"])

class InspectUrlRequest(BaseModel):
    url: str = Field(..., description="조사할 웹사이트 또는 GitHub 저장소 URL")

class DiscoverRequest(BaseModel):
    query: Optional[str] = Field("", description="탐색 키워드 (예: harness, mcp, reasoning, deepseek, langgraph)")
    category: Optional[str] = Field("", description="필터링할 카테고리 (harness, mcp_plugins_skills, agent_tech, ai_news)")
    limit: Optional[int] = Field(8, description="반환할 최대 추천 소스 수")

class RegisterCandidateRequest(BaseModel):
    name: str = Field(..., description="소스명")
    feed_url: str = Field(..., description="RSS/Atom 피드 URL")
    site_url: Optional[str] = Field("", description="웹사이트 홈 URL")
    category_hint: Optional[str] = Field("ai_news", description="기본 카테고리")
    country: Optional[str] = Field("GLOBAL", description="국가 (KR / GLOBAL)")
    description: Optional[str] = Field("", description="소스 설명")

@router.post("/inspect-url")
async def inspect_url(req: InspectUrlRequest):
    """
    입력된 임의의 URL(블로그, 웹사이트, GitHub 레포)을 분석하여
    RSS/Atom 피드를 자동 감지하고 최신 기사 및 신호 적합도 점수를 산출합니다.
    """
    if not req.url:
        raise HTTPException(status_code=400, detail="URL is required")
    result = await source_researcher.inspect_url(req.url)
    return result

@router.post("/discover")
async def discover_sources(req: DiscoverRequest):
    """
    키워드 또는 카테고리를 기반으로 AI 에이전트/하네스/MCP 생태계의
    신규 고품질 소스 후보군을 자율 발굴하고 적합도 점수를 매겨 추천합니다.
    """
    results = await source_researcher.discover_sources(
        query=req.query or "",
        category=req.category or "",
        limit=req.limit or 8
    )
    return results

@router.post("/register-candidate")
async def register_candidate(req: RegisterCandidateRequest):
    """
    리서치된 추천 후보 소스를 원클릭으로 sources.json에 정규화하여
    스크래핑 파이프라인에 즉시 등록합니다.
    """
    res = source_researcher.register_candidate(req.model_dump())
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

from app.services.deep_researcher import deep_researcher
import asyncio

@router.get("/status")
async def get_deep_research_status():
    """백엔드 자율 딥 리서치 엔진의 현재 실행 상태와 통계를 반환합니다."""
    return deep_researcher.get_status()

@router.get("/audit-logs")
async def get_research_audit_logs(limit: int = 30):
    """자율 딥 리서치가 수행한 소스 평가 결과, 판정(AUTO_ADOPTED/WATCHLIST/REJECTED), AI 판정 이유를 반환합니다."""
    logs = await deep_researcher.get_audit_logs(limit=limit)
    return {
        "status": "success",
        "total": len(logs),
        "logs": logs
    }

@router.post("/run-deep")
async def trigger_deep_research(max_candidates: int = 6):
    """
    백엔드 자율 딥 리서치 엔진을 즉시 기동합니다.
    인용 도메인 마이닝, 피드 실증, LLM 4축 평가를 거쳐 고신호 소스를 sources.json에 자동 채택합니다.
    """
    if deep_researcher.is_running:
        return {"status": "already_running", "message": "Deep Research is already executing"}

    # Run in background task or directly
    asyncio.create_task(deep_researcher.run_deep_research(max_candidates=max_candidates))
    return {
        "status": "started",
        "message": "자율 딥 리서치 사이클이 백그라운드에서 기동되었습니다.",
        "max_candidates": max_candidates
    }

