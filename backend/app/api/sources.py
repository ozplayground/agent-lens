from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.services.sources_service import sources_service

router = APIRouter(prefix="/sources", tags=["sources"])

class AddRssRequest(BaseModel):
    name: str = Field(..., description="소스 표시명")
    url: str = Field(..., description="RSS/Atom 피드 URL")
    site_url: Optional[str] = Field("", description="웹사이트 URL")
    category_hint: Optional[str] = Field("ai_news", description="기본 카테고리 (harness, mcp_plugins_skills, agent_tech, ai_news)")
    country: Optional[str] = Field("GLOBAL", description="국가 (KR, GLOBAL)")
    description: Optional[str] = Field("", description="소스 설명")

class AddGitHubRepoRequest(BaseModel):
    repo: str = Field(..., description="GitHub 레포지토리 (예: owner/repo)")
    category: Optional[str] = Field("agent_tech", description="기본 카테고리")
    description: Optional[str] = Field("", description="레포 설명")
    stars_hint: Optional[int] = Field(0, description="스타 수 힌트")

@router.get("")
async def get_all_sources():
    """모든 등록된 수집 대상 소스 목록 및 요약 통계를 반환합니다."""
    data = sources_service.get_all_sources()
    rss_list = data.get("rss_feeds", [])
    active_rss = [r for r in rss_list if r.get("enabled", True)]
    gh_repos = data.get("github_sources", {}).get("monitored_repos", [])
    active_gh = [r for r in gh_repos if r.get("enabled", True)]

    return {
        "status": "success",
        "sources_file": str(sources_service.get_file_path()),
        "updated_at": data.get("updated_at"),
        "stats": {
            "total_rss": len(rss_list),
            "active_rss": len(active_rss),
            "total_github_repos": len(gh_repos),
            "active_github_repos": len(active_gh),
            "github_search_enabled": data.get("github_sources", {}).get("enabled", True),
            "reddit_enabled": data.get("reddit_sources", {}).get("enabled", True),
            "hackernews_enabled": data.get("hackernews_sources", {}).get("enabled", True),
            "arxiv_enabled": data.get("arxiv_sources", {}).get("enabled", True),
            "huggingface_enabled": data.get("huggingface_sources", {}).get("enabled", True)
        },
        "data": data
    }

@router.post("/rss")
async def add_rss_source(req: AddRssRequest):
    """신규 RSS/Atom 피드를 sources.json에 등록합니다."""
    if not req.url or not req.name:
        raise HTTPException(status_code=400, detail="Name and URL are required")
    created = sources_service.add_rss_source(
        name=req.name,
        url=req.url,
        site_url=req.site_url or req.url,
        category_hint=req.category_hint or "ai_news",
        country=req.country or "GLOBAL",
        description=req.description or ""
    )
    return {"status": "success", "message": f"'{req.name}' 등록 완료", "source": created}

@router.post("/github")
async def add_github_repo(req: AddGitHubRepoRequest):
    """지속 모니터링할 GitHub 저장소를 sources.json에 등록합니다."""
    if not req.repo:
        raise HTTPException(status_code=400, detail="Repository is required")
    created = sources_service.add_github_repo(
        repo=req.repo,
        category=req.category or "agent_tech",
        description=req.description or "",
        stars_hint=req.stars_hint or 0
    )
    return {"status": "success", "message": f"'{req.repo}' 등록 완료", "repo": created}

@router.patch("/{source_type}/{item_id}/toggle")
async def toggle_source(source_type: str, item_id: str):
    """특정 소스 또는 전체 소스 유형의 수집 활성화/비활성화를 토글합니다."""
    res = sources_service.toggle_source(source_type, item_id)
    if not res:
        raise HTTPException(status_code=404, detail="Source not found or invalid type")
    return {"status": "success", "message": f"소스 상태가 변경되었습니다 ({source_type} / {item_id})"}

@router.delete("/{source_type}/{item_id}")
async def delete_source(source_type: str, item_id: str):
    """등록된 소스를 sources.json에서 제거합니다."""
    res = sources_service.delete_source(source_type, item_id)
    if not res:
        raise HTTPException(status_code=404, detail="Source not found or failed to delete")
    return {"status": "success", "message": f"소스가 삭제되었습니다 ({source_type} / {item_id})"}
