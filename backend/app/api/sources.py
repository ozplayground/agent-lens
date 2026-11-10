from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal, Optional
from app.api.errors import ApiError
from app.services.sources_service import SourcesWriteError, sources_service

router = APIRouter(prefix="/sources", tags=["sources"])

class AddRssRequest(BaseModel):
    # 값 검증 실패는 전역 처리기가 400 ERR_INVALID_PAYLOAD 로 바꾼다 (BUG-20)
    name: str = Field(..., min_length=1, max_length=200, description="소스 표시명")
    url: str = Field(..., pattern=r"^https?://\S+$", max_length=1000, description="RSS/Atom 피드 URL (http/https)")
    site_url: Optional[str] = Field("", description="웹사이트 URL")
    category_hint: Literal["harness", "mcp_plugins_skills", "agent_tech", "ai_news"] = Field("ai_news", description="기본 카테고리")
    country: Literal["KR", "GLOBAL"] = Field("GLOBAL", description="국가")
    description: Optional[str] = Field("", description="소스 설명")


def _saving(fn, *args, **kwargs):
    """sources.json 저장 실패를 500 으로 알린다 (예전에는 성공으로 답했다, BUG-20)."""
    try:
        return fn(*args, **kwargs)
    except SourcesWriteError:
        raise ApiError(500, message="소스 파일(sources.json)을 저장하지 못했습니다. 파일 권한과 디스크를 확인해주세요.")

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
        "sources_file": sources_service.get_file_path().name,  # 서버 절대 경로는 내보내지 않는다
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
        raise HTTPException(status_code=400, detail="소스 이름과 URL 을 입력해주세요.")
    created = _saving(
        sources_service.add_rss_source,
        name=req.name,
        url=req.url,
        site_url=req.site_url or req.url,
        category_hint=req.category_hint,
        country=req.country,
        description=req.description or ""
    )
    return {"status": "success", "message": f"'{req.name}' 등록 완료", "source": created}

@router.patch("/{source_type}/{item_id:path}/toggle")
async def toggle_source(source_type: str, item_id: str):
    """특정 소스(rss, github_repo) 또는 소스 유형 전체(github·reddit·hackernews·arxiv·huggingface, item_id 는 'all')의 수집을 토글합니다."""
    res = _saving(sources_service.toggle_source, source_type, item_id)
    if not res:
        raise HTTPException(status_code=404, detail="해당 소스를 찾을 수 없습니다.")
    return {"status": "success", "message": f"소스 상태가 변경되었습니다 ({source_type} / {item_id})"}

@router.delete("/{source_type}/{item_id:path}")
async def delete_source(source_type: str, item_id: str):
    """등록된 소스를 sources.json에서 제거합니다."""
    res = _saving(sources_service.delete_source, source_type, item_id)
    if not res:
        raise HTTPException(status_code=404, detail="해당 소스를 찾을 수 없습니다.")
    return {"status": "success", "message": f"소스가 삭제되었습니다 ({source_type} / {item_id})"}
