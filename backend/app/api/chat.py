import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chat import (
    ChatStreamRequest,
    ChatQueryRequest,
    ChatQueryResponse,
    ChatSourceDetailResponse,
    ChatSearchResponse,
    ChatFocusFilter,
    ChatSessionSummary,
    ChatSessionDetail,
    ChatSessionCreateRequest,
    GenericSuccessResponse,
    ErrorResponse,
)
from app.services.chat_session_service import (
    ChatSessionService,
    SessionNotFoundException,
    InvalidSessionUUIDException,
    SessionDeleteFailedException,
)
from app.services.chat_service import (
    ChatService,
    HandoverSourceNotFoundException,
    ChatPayloadEmptyException,
    ChatPayloadTooLargeException,
    InvalidScopeException,
    SearchQueryTooShortException,
    LLMProviderUnavailableException,
    LLMUpstreamException,
    LLMQuotaExceededException,
    LLMStreamFailedException,
)
from app.services.llm_providers.anthropic_provider import (
    AnthropicKeyMissingException,
    AnthropicQuotaExceededException,
    AnthropicOverloadedException,
)
from app.services.llm_processor import llm_processor

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/sources/{source_id}", response_model=ChatSourceDetailResponse)
async def get_chat_source(source_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch handover article metadata for context chip and citation popover."""
    service = ChatService(db)
    try:
        detail = await service.get_source_detail(source_id)
        return detail
    except HandoverSourceNotFoundException as e:
        return JSONResponse(
            status_code=404,
            content={
                "error_code": "ERR_HANDOVER_SOURCE_NOT_FOUND",
                "message": f"기사 ID {source_id}를 데이터베이스에서 찾을 수 없습니다.",
                "details": None
            }
        )

@router.get("/search", response_model=ChatSearchResponse)
async def search_chat_corpus(
    q: Optional[str] = Query(None, description="Search query string"),
    top_k: int = Query(5, ge=1, le=20),
    min_quality: float = Query(5.0, ge=1.0, le=10.0),
    category: Optional[str] = Query("all"),
    time_range: Optional[str] = Query("all"),
    sort: Optional[str] = Query("hot"),
    high_signal_only: bool = Query(False),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Corpus knowledge search preview using SQLite FTS5 + BM25 + Quality + Recency with Focus Filters."""
    if not q or len(q.strip()) < 2:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_SEARCH_QUERY_TOO_SHORT",
                "message": "검색어는 최소 2글자 이상이어야 합니다.",
                "details": None
            }
        )

    service = ChatService(db)
    try:
        filters = ChatFocusFilter(
            category=category or "all",
            time_range=time_range or "all",
            sort=sort or "hot",
            high_signal_only=high_signal_only
        )
        result = await service.search_corpus(
            query=q,
            top_k=top_k,
            min_quality=min_quality,
            category=category,
            source=source,
            filters=filters,
        )
        return result
    except SearchQueryTooShortException as e:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_SEARCH_QUERY_TOO_SHORT",
                "message": str(e),
                "details": None
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_RETRIEVER_INDEX_ERROR",
                "message": "검색 인덱스 처리 중 오류가 발생했습니다.",
                "details": {"error": str(e)}
            }
        )

@router.post("/query", response_model=ChatQueryResponse)
async def chat_query(request: Request, db: AsyncSession = Depends(get_db)):
    """Synchronous single-shot chat question answering."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_INVALID_PAYLOAD",
                "message": "요청 본문 형식이 올바르지 않습니다.",
                "details": None
            }
        )

    question = body.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_CHAT_PAYLOAD_EMPTY",
                "message": "질문 본문이 비어있습니다.",
                "details": None
            }
        )

    if len(question) > 2000:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_CHAT_PAYLOAD_TOO_LARGE",
                "message": "질문은 최대 2,000자까지 입력 가능합니다.",
                "details": None
            }
        )

    scope = body.get("scope", "global")
    if scope not in ("scoped", "global"):
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_INVALID_SCOPE_PARAM",
                "message": "유효하지 않은 검색 스코프 모드입니다.",
                "details": None
            }
        )

    service = ChatService(db)
    try:
        req = ChatQueryRequest(**body)
        res = await service.query_chat(req)
        return res
    except HandoverSourceNotFoundException as e:
        return JSONResponse(
            status_code=404,
            content={
                "error_code": "ERR_HANDOVER_SOURCE_NOT_FOUND",
                "message": f"기사 ID {e.source_id}를 데이터베이스에서 찾을 수 없습니다.",
                "details": None
            }
        )
    except ChatPayloadEmptyException as e:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_CHAT_PAYLOAD_EMPTY",
                "message": str(e),
                "details": None
            }
        )
    except ChatPayloadTooLargeException as e:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_CHAT_PAYLOAD_TOO_LARGE",
                "message": str(e),
                "details": None
            }
        )
    except InvalidScopeException as e:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_INVALID_SCOPE_PARAM",
                "message": str(e),
                "details": None
            }
        )
    except AnthropicKeyMissingException as e:
        return JSONResponse(
            status_code=401,
            content={
                "error_code": "ERR_CLAUDE_API_KEY_MISSING",
                "message": str(e) or "Anthropic Claude API 키가 설정되지 않았습니다.",
                "details": None
            }
        )
    except AnthropicQuotaExceededException as e:
        return JSONResponse(
            status_code=429,
            content={
                "error_code": "ERR_CLAUDE_QUOTA_EXCEEDED",
                "message": str(e) or "Anthropic Claude 호출 한도 초과",
                "details": None
            }
        )
    except AnthropicOverloadedException as e:
        return JSONResponse(
            status_code=529,
            content={
                "error_code": "ERR_CLAUDE_OVERLOADED",
                "message": str(e) or "Anthropic 서버 과부하",
                "details": None
            }
        )
    except LLMProviderUnavailableException as e:
        return JSONResponse(
            status_code=503,
            content={
                "error_code": "ERR_LLM_PROVIDER_UNAVAILABLE",
                "message": str(e) or "가용한 LLM 프로바이더 엔진 미설정 (API 키 미등록)",
                "details": None
            }
        )
    except LLMUpstreamException as e:
        return JSONResponse(
            status_code=502,
            content={
                "error_code": "ERR_LLM_UPSTREAM_FAILED",
                "message": str(e) or "외부 LLM 업스트림 통신 실패 / API 장애",
                "details": None
            }
        )
    except LLMQuotaExceededException as e:
        return JSONResponse(
            status_code=429,
            content={
                "error_code": "ERR_LLM_QUOTA_EXCEEDED",
                "message": str(e) or "외부 LLM API 호출 한도 초과",
                "details": None
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_SERVER_INTERNAL",
                "message": "서버 내부 처리 중 오류가 발생했습니다.",
                "details": {"error": str(e)}
            }
        )

@router.post("/stream")
async def chat_stream(request: Request, db: AsyncSession = Depends(get_db)):
    """Server-Sent Events (SSE) streaming chat endpoint (sources -> token -> done)."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_INVALID_PAYLOAD",
                "message": "요청 본문 형식이 올바르지 않습니다.",
                "details": None
            }
        )

    question = body.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_CHAT_PAYLOAD_EMPTY",
                "message": "질문 본문이 비어있습니다.",
                "details": None
            }
        )

    if len(question) > 2000:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_CHAT_PAYLOAD_TOO_LARGE",
                "message": "질문은 최대 2,000자까지 입력 가능합니다.",
                "details": None
            }
        )

    scope = body.get("scope", "global")
    if scope not in ("scoped", "global"):
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_INVALID_SCOPE_PARAM",
                "message": "유효하지 않은 검색 스코프 모드입니다.",
                "details": None
            }
        )

    source_id = body.get("source_id")
    # Pre-validate scoped article existence to return clean 404 before opening stream
    if scope == "scoped":
        if not source_id:
            return JSONResponse(
                status_code=404,
                content={
                    "error_code": "ERR_HANDOVER_SOURCE_NOT_FOUND",
                    "message": "지정된 기사를 찾을 수 없습니다.",
                    "details": None
                }
            )
        from app.models.news import NewsItem
        item = await db.get(NewsItem, source_id)
        if not item:
            return JSONResponse(
                status_code=404,
                content={
                    "error_code": "ERR_HANDOVER_SOURCE_NOT_FOUND",
                    "message": f"기사 ID {source_id}를 데이터베이스에서 찾을 수 없습니다.",
                    "details": None
                }
            )

    # Pre-stream LLM availability check
    try:
        llm_processor.check_provider_available()
    except AnthropicKeyMissingException as e:
        return JSONResponse(
            status_code=401,
            content={
                "error_code": "ERR_CLAUDE_API_KEY_MISSING",
                "message": str(e) or "Anthropic Claude API 키가 설정되지 않았습니다.",
                "details": None
            }
        )
    except AnthropicQuotaExceededException as e:
        return JSONResponse(
            status_code=429,
            content={
                "error_code": "ERR_CLAUDE_QUOTA_EXCEEDED",
                "message": str(e) or "Anthropic Claude 호출 한도 초과",
                "details": None
            }
        )
    except AnthropicOverloadedException as e:
        return JSONResponse(
            status_code=529,
            content={
                "error_code": "ERR_CLAUDE_OVERLOADED",
                "message": str(e) or "Anthropic 서버 과부하",
                "details": None
            }
        )
    except LLMProviderUnavailableException as e:
        return JSONResponse(
            status_code=503,
            content={
                "error_code": "ERR_LLM_PROVIDER_UNAVAILABLE",
                "message": str(e) or "가용한 LLM 프로바이더 엔진 미설정 (API 키 미등록)",
                "details": None
            }
        )
    except LLMUpstreamException as e:
        return JSONResponse(
            status_code=502,
            content={
                "error_code": "ERR_LLM_UPSTREAM_FAILED",
                "message": str(e) or "외부 LLM 업스트림 통신 실패 / API 장애",
                "details": None
            }
        )
    except LLMQuotaExceededException as e:
        return JSONResponse(
            status_code=429,
            content={
                "error_code": "ERR_LLM_QUOTA_EXCEEDED",
                "message": str(e) or "외부 LLM API 호출 한도 초과",
                "details": None
            }
        )

    service = ChatService(db)
    req = ChatStreamRequest(**body)

    return StreamingResponse(
        service.stream_chat(req),
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ============================================================================
# Session Management REST Endpoints (v2.6 FUNC-CHAT-012)
# ============================================================================

@router.get("/sessions", response_model=List[ChatSessionSummary])
async def list_chat_sessions(
    limit: int = Query(30, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve chat sessions ordered by updated_at DESC."""
    service = ChatSessionService(db)
    try:
        sessions = await service.list_sessions(limit=limit, offset=offset)
        return sessions
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_SERVER_INTERNAL",
                "message": f"세션 목록 인출 중 내부 오류가 발생했습니다: {str(e)}",
                "details": None
            }
        )

@router.post("/sessions", response_model=ChatSessionDetail, status_code=201)
async def create_or_upsert_chat_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat session or upsert existing session by UUID."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_SESSION_INVALID_UUID",
                "message": "요청 본문 형식이 올바르지 않습니다.",
                "details": None
            }
        )

    try:
        req = ChatSessionCreateRequest(**body)
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_SESSION_INVALID_UUID",
                "message": f"요청 유효성 검증 실패: {str(e)}",
                "details": None
            }
        )

    service = ChatSessionService(db)
    try:
        detail = await service.create_or_upsert_session(req)
        return JSONResponse(status_code=201, content=json.loads(detail.model_dump_json()))
    except InvalidSessionUUIDException as e:
        return JSONResponse(
            status_code=400,
            content={
                "error_code": "ERR_SESSION_INVALID_UUID",
                "message": str(e),
                "details": None
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_SESSION_CREATE_FAILED",
                "message": f"데이터베이스 세션 트랜잭션 커밋에 실패했습니다: {str(e)}",
                "details": None
            }
        )

@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_chat_session_detail(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve chat session details and message history for multi-turn restoration."""
    service = ChatSessionService(db)
    try:
        detail = await service.get_session_detail(session_id)
        return detail
    except SessionNotFoundException as e:
        return JSONResponse(
            status_code=404,
            content={
                "error_code": "ERR_SESSION_NOT_FOUND",
                "message": str(e),
                "details": None
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_SERVER_INTERNAL",
                "message": f"세션 상세 인출 중 오류가 발생했습니다: {str(e)}",
                "details": None
            }
        )

@router.delete("/sessions/{session_id}", response_model=GenericSuccessResponse)
async def delete_chat_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat session and cascade delete all associated messages."""
    service = ChatSessionService(db)
    try:
        res = await service.delete_session(session_id)
        return res
    except SessionNotFoundException as e:
        return JSONResponse(
            status_code=404,
            content={
                "error_code": "ERR_SESSION_NOT_FOUND",
                "message": str(e),
                "details": None
            }
        )
    except SessionDeleteFailedException as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_SESSION_DELETE_FAILED",
                "message": str(e),
                "details": None
            }
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "error_code": "ERR_SESSION_DELETE_FAILED",
                "message": f"세션 삭제 중 오류가 발생했습니다: {str(e)}",
                "details": None
            }
        )
