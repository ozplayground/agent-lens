import json
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.errors import error_response
from app.schemas.chat import (
    ChatStreamRequest,
    ChatSourceDetailResponse,
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
    MessageIdConflictException,
    SessionDeleteFailedException,
)
from app.services.chat_service import (
    ChatService,
    HandoverSourceNotFoundException,
    ChatPayloadEmptyException,
    ChatPayloadTooLargeException,
    InvalidScopeException,
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

logger = logging.getLogger("agentlens.chat")

router = APIRouter(prefix="/chat", tags=["Chat"])

# 스트림 시작 전 LLM 가용성 검사의 예외 → (상태, 오류 코드, 기본 문장)
LLM_ERROR_MAP = {
    AnthropicKeyMissingException: (401, "ERR_CLAUDE_API_KEY_MISSING", "Anthropic Claude API 키가 설정되지 않았습니다."),
    AnthropicQuotaExceededException: (429, "ERR_CLAUDE_QUOTA_EXCEEDED", "Anthropic Claude 호출 한도 초과"),
    AnthropicOverloadedException: (529, "ERR_CLAUDE_OVERLOADED", "Anthropic 서버 과부하"),
    LLMProviderUnavailableException: (503, "ERR_LLM_PROVIDER_UNAVAILABLE", "가용한 LLM 프로바이더 엔진 미설정 (API 키 미등록)"),
    LLMUpstreamException: (502, "ERR_LLM_UPSTREAM_FAILED", "외부 LLM 업스트림 통신 실패 / API 장애"),
    LLMQuotaExceededException: (429, "ERR_LLM_QUOTA_EXCEEDED", "외부 LLM API 호출 한도 초과"),
}

@router.get("/sources/{source_id}", response_model=ChatSourceDetailResponse)
async def get_chat_source(source_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch handover article metadata for context chip and citation popover."""
    service = ChatService(db)
    try:
        detail = await service.get_source_detail(source_id)
        return detail
    except HandoverSourceNotFoundException as e:
        return error_response(404, "ERR_HANDOVER_SOURCE_NOT_FOUND", f"기사 ID {source_id}를 데이터베이스에서 찾을 수 없습니다.")

@router.post("/stream")
async def chat_stream(request: Request, db: AsyncSession = Depends(get_db)):
    """Server-Sent Events (SSE) streaming chat endpoint (sources -> token -> done)."""
    try:
        body = await request.json()
    except Exception:
        return error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문 형식이 올바르지 않습니다.")

    if not isinstance(body, dict):
        return error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문은 JSON 객체여야 합니다.")

    question = body.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return error_response(400, "ERR_CHAT_PAYLOAD_EMPTY", "질문 본문이 비어있습니다.")

    if len(question) > 2000:
        return error_response(400, "ERR_CHAT_PAYLOAD_TOO_LARGE", "질문은 최대 2,000자까지 입력 가능합니다.")

    scope = body.get("scope", "global")
    if scope not in ("scoped", "global"):
        return error_response(400, "ERR_INVALID_SCOPE_PARAM", "유효하지 않은 검색 스코프 모드입니다.")

    try:
        req = ChatStreamRequest(**body)
    except ValidationError as e:
        if any(err["loc"][:1] == ("model_tier",) for err in e.errors()):
            code, message = "ERR_INVALID_MODEL_TIER", f"유효하지 않은 모델 티어입니다: {body.get('model_tier')}"
        else:
            code, message = "ERR_INVALID_PAYLOAD", "요청 필드 형식이 올바르지 않습니다."
        return error_response(400, code, message)

    # 세션 POST 와 같은 규칙: session_id 는 UUID 여야 한다 (없으면 서버가 만든다)
    if req.session_id is not None:
        try:
            uuid.UUID(req.session_id)
        except ValueError:
            return error_response(400, "ERR_SESSION_INVALID_UUID", "유효하지 않은 세션 UUID 형식입니다.")

    source_id = body.get("source_id")
    # Pre-validate scoped article existence to return clean 404 before opening stream
    if scope == "scoped":
        if not source_id:
            return error_response(404, "ERR_HANDOVER_SOURCE_NOT_FOUND", "지정된 기사를 찾을 수 없습니다.")
        try:
            await ChatService(db).get_source_detail(source_id)
        except HandoverSourceNotFoundException:
            return error_response(404, "ERR_HANDOVER_SOURCE_NOT_FOUND", f"기사 ID {source_id}를 데이터베이스에서 찾을 수 없습니다.")

    # Pre-stream LLM availability check
    try:
        await llm_processor.check_provider_available()
    except tuple(LLM_ERROR_MAP) as e:
        status, code, default_message = next(v for k, v in LLM_ERROR_MAP.items() if isinstance(e, k))
        return error_response(status, code, str(e) or default_message)

    service = ChatService(db)

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
    except Exception:
        logger.exception("chat session list failed")
        return error_response(500, "ERR_SERVER_INTERNAL", "대화 목록을 불러오지 못했습니다.")

@router.post("/sessions", response_model=ChatSessionDetail, status_code=201)
async def create_or_upsert_chat_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat session or upsert existing session by UUID."""
    try:
        body = await request.json()
    except Exception:
        return error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문이 올바른 JSON 이 아닙니다.")
    if not isinstance(body, dict):
        return error_response(400, "ERR_INVALID_PAYLOAD", "요청 본문은 JSON 객체여야 합니다.")

    try:
        req = ChatSessionCreateRequest(**body)
    except ValidationError as e:
        details = [{"loc": list(err.get("loc", ())), "msg": str(err.get("msg", ""))} for err in e.errors()]
        return error_response(400, "ERR_INVALID_PAYLOAD", "요청 필드 형식이 올바르지 않습니다.", details)

    service = ChatSessionService(db)
    try:
        detail = await service.create_or_upsert_session(req)
        return JSONResponse(status_code=201, content=json.loads(detail.model_dump_json()))
    except InvalidSessionUUIDException as e:
        await db.rollback()
        return error_response(400, "ERR_SESSION_INVALID_UUID", str(e))
    except MessageIdConflictException as e:
        await db.rollback()
        return error_response(400, "ERR_INVALID_PAYLOAD", str(e), {"message_ids": e.message_ids})
    except Exception:
        logger.exception("chat session upsert failed")
        # 오류 응답을 정상 반환하면 get_db 가 커밋하므로 부분 변경을 여기서 버린다 (ARCH-03R)
        await db.rollback()
        return error_response(500, "ERR_SESSION_CREATE_FAILED", "대화 세션을 저장하지 못했습니다.")

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
        return error_response(404, "ERR_SESSION_NOT_FOUND", str(e))
    except Exception:
        logger.exception("chat session detail failed")
        return error_response(500, "ERR_SERVER_INTERNAL", "대화 내용을 불러오지 못했습니다.")

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
        return error_response(404, "ERR_SESSION_NOT_FOUND", str(e))
    except Exception:  # SessionDeleteFailedException 포함. DB 예외 문장은 로그에만 남긴다
        logger.exception("chat session delete failed")
        await db.rollback()  # ARCH-03R
        return error_response(500, "ERR_SESSION_DELETE_FAILED", "대화를 삭제하지 못했습니다.")
