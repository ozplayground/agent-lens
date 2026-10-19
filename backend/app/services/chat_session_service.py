import re
import json
import uuid
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.models.chat_session import ChatSessionModel, ChatMessageModel
from app.models.news import NewsItem
from app.schemas.chat import (
    ChatSessionSummary,
    ChatSessionDetail,
    ChatMessageItem,
    ChatSessionCreateRequest,
    ChatFocusFilter,
    ChatSourceItem,
    ChatSourceDetailResponse,
    GenericSuccessResponse,
    TokenUsageMeta,
)

class SessionNotFoundException(Exception):
    def __init__(self, session_id: str):
        self.session_id = session_id
        super().__init__(f"ID {session_id}에 해당하는 대화 세션을 찾을 수 없습니다.")

class InvalidSessionUUIDException(Exception):
    def __init__(self, message: str = "유효하지 않은 세션 UUID 형식이거나 파라미터 규격 오류입니다."):
        super().__init__(message)

class SessionDeleteFailedException(Exception):
    def __init__(self, message: str = "CASCADE 삭제 트랜잭션 처리에 실패했습니다."):
        super().__init__(message)


def generate_auto_title(question: str) -> str:
    """Generate automatic 30-char title according to BR-CHAT-012-4."""
    if not question:
        return "새 대화"
    sanitized = re.sub(r"[#*_~`]|<[^>]*>", " ", question)
    sanitized = re.sub(r"[\r\n\t]+", " ", sanitized)
    sanitized = re.sub(r"\s+", " ", sanitized).strip()
    if not sanitized:
        return "새 대화"
    if len(sanitized) <= 30:
        return sanitized
    return sanitized[:30] + "..."


class ChatSessionService:
    """Service handling ChatSession and ChatMessage persistence, multi-turn hydration, and FIFO 30 retention."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_sessions(self, limit: int = 30, offset: int = 0) -> List[ChatSessionSummary]:
        """Fetch chat session summaries ordered by updated_at DESC."""
        stmt = (
            select(ChatSessionModel)
            .options(selectinload(ChatSessionModel.messages))
            .order_by(ChatSessionModel.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        sessions = result.scalars().all()

        summaries: List[ChatSessionSummary] = []
        for s in sessions:
            active_filters = None
            if s.active_filters_json:
                try:
                    active_filters = ChatFocusFilter(**json.loads(s.active_filters_json))
                except Exception:
                    active_filters = None

            msgs = s.messages or []
            last_preview = msgs[-1].content[:100] if msgs else None

            created_str = s.created_at.isoformat() if hasattr(s.created_at, "isoformat") else str(s.created_at)
            updated_str = s.updated_at.isoformat() if hasattr(s.updated_at, "isoformat") else str(s.updated_at)

            summaries.append(
                ChatSessionSummary(
                    id=s.id,
                    title=s.title,
                    created_at=created_str,
                    updated_at=updated_str,
                    scope_mode=s.scope_mode,
                    active_source_id=s.active_source_id,
                    message_count=len(msgs),
                    last_message_preview=last_preview,
                    active_filters=active_filters,
                )
            )
        return summaries

    async def get_session_detail(self, session_id: str) -> ChatSessionDetail:
        """Fetch session detail with all child messages and hydrated active_source."""
        stmt = (
            select(ChatSessionModel)
            .options(selectinload(ChatSessionModel.messages))
            .where(ChatSessionModel.id == session_id)
        )
        result = await self.session.execute(stmt)
        s = result.scalar_one_or_none()
        if not s:
            raise SessionNotFoundException(session_id)

        # Hydrate messages
        chat_messages: List[ChatMessageItem] = []
        for m in (s.messages or []):
            sources = None
            if m.sources_json:
                try:
                    raw_sources = json.loads(m.sources_json)
                    if isinstance(raw_sources, list):
                        sources = [ChatSourceItem(**item) for item in raw_sources]
                except Exception:
                    sources = None

            usage_meta = None
            if getattr(m, "usage_json", None):
                try:
                    usage_raw = json.loads(m.usage_json)
                    if isinstance(usage_raw, dict):
                        usage_meta = TokenUsageMeta(**usage_raw)
                except Exception:
                    usage_meta = None

            m_created = m.created_at.isoformat() if hasattr(m.created_at, "isoformat") else str(m.created_at)
            chat_messages.append(
                ChatMessageItem(
                    id=m.id,
                    session_id=m.session_id,
                    role=m.role,
                    content=m.content,
                    created_at=m_created,
                    sources=sources,
                    status=m.status or "completed",
                    model=m.model,
                    model_tier=getattr(m, "model_tier", None),
                    latency_ms=m.latency_ms,
                    usage=usage_meta,
                )
            )

        # Hydrate active_source if present
        active_source: Optional[ChatSourceDetailResponse] = None
        if s.active_source_id:
            item = await self.session.get(NewsItem, s.active_source_id)
            if item:
                tldr = []
                try:
                    tldr = json.loads(item.tldr_bullets) if item.tldr_bullets else []
                    if not isinstance(tldr, list):
                        tldr = [str(tldr)]
                except Exception:
                    tldr = []
                tech = [t.strip() for t in item.tech_stack.split(",") if t.strip()] if item.tech_stack else []
                tags = [t.strip() for t in item.tags.split(",") if t.strip()] if item.tags else []
                pub_str = item.published_at.isoformat() if hasattr(item.published_at, "isoformat") else str(item.published_at)
                c_str = item.created_at.isoformat() if hasattr(item.created_at, "isoformat") else str(item.created_at)
                sc_str = item.scraped_at.isoformat() if item.scraped_at and hasattr(item.scraped_at, "isoformat") else None

                active_source = ChatSourceDetailResponse(
                    id=item.id,
                    title=item.title,
                    url=item.url,
                    source=item.source,
                    category=item.category,
                    author=item.author,
                    summary=item.summary or "",
                    tldr_bullets=tldr,
                    why_it_matters=item.why_it_matters or "",
                    tech_stack=tech,
                    tags=tags,
                    quality_score=float(item.quality_score or 6.0),
                    is_high_signal=bool(item.is_high_signal),
                    hotness_score=float(item.hotness_score or 0.0),
                    published_at=pub_str,
                    created_at=c_str,
                    full_content=item.full_content,
                    scraped_at=sc_str,
                )

        active_filters = None
        if s.active_filters_json:
            try:
                active_filters = ChatFocusFilter(**json.loads(s.active_filters_json))
            except Exception:
                active_filters = None

        created_str = s.created_at.isoformat() if hasattr(s.created_at, "isoformat") else str(s.created_at)
        updated_str = s.updated_at.isoformat() if hasattr(s.updated_at, "isoformat") else str(s.updated_at)

        return ChatSessionDetail(
            id=s.id,
            title=s.title,
            created_at=created_str,
            updated_at=updated_str,
            scope_mode=s.scope_mode,
            active_source_id=s.active_source_id,
            active_source=active_source,
            active_filters=active_filters,
            messages=chat_messages,
        )

    async def create_or_upsert_session(self, req: ChatSessionCreateRequest) -> ChatSessionDetail:
        """Create new session or upsert existing session by UUID."""
        if req.id:
            try:
                uuid.UUID(req.id)
            except (ValueError, AttributeError):
                raise InvalidSessionUUIDException("유효하지 않은 세션 UUID 형식이거나 파라미터 규격 오류입니다.")

        session_id = req.id or str(uuid.uuid4())
        filters_json = req.active_filters.model_dump_json() if req.active_filters else None

        stmt = (
            select(ChatSessionModel)
            .options(selectinload(ChatSessionModel.messages))
            .where(ChatSessionModel.id == session_id)
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if existing:
            if req.title is not None:
                existing.title = req.title
            if req.scope_mode is not None:
                existing.scope_mode = req.scope_mode
            if req.active_source_id is not None:
                existing.active_source_id = req.active_source_id
            if filters_json is not None:
                existing.active_filters_json = filters_json
            existing.updated_at = now
        else:
            new_session = ChatSessionModel(
                id=session_id,
                title=req.title or "새 대화",
                scope_mode=req.scope_mode or "global",
                active_source_id=req.active_source_id,
                active_filters_json=filters_json,
                created_at=now,
                updated_at=now,
            )
            self.session.add(new_session)

        await self.session.commit()

        if req.messages:
            msg_dicts = [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "sources": m.sources,
                    "status": m.status,
                    "model": m.model,
                    "latency_ms": m.latency_ms,
                }
                for m in req.messages
            ]
            await self.append_messages_batch(
                session_id=session_id,
                messages=msg_dicts,
                scope_mode=req.scope_mode or "global",
                source_id=req.active_source_id,
                filters=req.active_filters,
            )

        # Enforce FIFO retention limit (max 30)
        await self.enforce_fifo_retention(max_limit=30)
        return await self.get_session_detail(session_id)

    async def delete_session(self, session_id: str) -> GenericSuccessResponse:
        """Atomically delete session and cascade delete all child messages."""
        s = await self.session.get(ChatSessionModel, session_id)
        if not s:
            raise SessionNotFoundException(session_id)

        try:
            await self.session.delete(s)
            await self.session.commit()
        except Exception as e:
            await self.session.rollback()
            raise SessionDeleteFailedException(str(e))

        return GenericSuccessResponse(
            status="success",
            message="대화 세션 및 하위 메시지가 원자적으로 영구 삭제되었습니다.",
            deleted_count=1,
        )

    async def append_messages_batch(
        self,
        session_id: str,
        messages: List[Dict[str, Any]],
        scope_mode: str = "global",
        source_id: Optional[int] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> List[ChatMessageModel]:
        """Atomically append a batch of messages to a session, auto-title if needed, update updated_at."""
        now = datetime.now(timezone.utc)

        s = await self.session.get(ChatSessionModel, session_id)
        if not s:
            filters_json = filters.model_dump_json() if filters else None
            s = ChatSessionModel(
                id=session_id,
                title="새 대화",
                scope_mode=scope_mode,
                active_source_id=source_id,
                active_filters_json=filters_json,
                created_at=now,
                updated_at=now,
            )
            self.session.add(s)
            await self.session.flush()

        created_models: List[ChatMessageModel] = []
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            # Auto-title on user question if title is default
            if role == "user" and (s.title == "새 대화" or not s.title):
                s.title = generate_auto_title(content)

            sources = m.get("sources")
            src_json = None
            if sources:
                if isinstance(sources, list) and len(sources) > 0 and hasattr(sources[0], "model_dump"):
                    src_json = json.dumps([item.model_dump() for item in sources], ensure_ascii=False)
                elif isinstance(sources, list):
                    src_json = json.dumps(sources, ensure_ascii=False)

            usage = m.get("usage")
            usage_json = None
            if usage:
                if hasattr(usage, "model_dump"):
                    usage_json = json.dumps(usage.model_dump(), ensure_ascii=False)
                elif isinstance(usage, dict):
                    usage_json = json.dumps(usage, ensure_ascii=False)

            msg = ChatMessageModel(
                id=m.get("id") or str(uuid.uuid4()),
                session_id=session_id,
                role=role,
                content=content,
                sources_json=src_json,
                status=m.get("status", "completed"),
                model=m.get("model"),
                model_tier=m.get("model_tier"),
                usage_json=usage_json,
                latency_ms=m.get("latency_ms"),
                created_at=now,
            )
            self.session.add(msg)
            created_models.append(msg)

        s.updated_at = now
        await self.session.commit()

        await self.enforce_fifo_retention(max_limit=30)
        return created_models

    async def persist_turn(
        self,
        session_id: str,
        user_content: str,
        assistant_content: str,
        sources: Optional[List[ChatSourceItem]] = None,
        model: Optional[str] = None,
        model_tier: Optional[str] = None,
        usage: Optional[Any] = None,
        latency_ms: Optional[int] = None,
        scope_mode: str = "global",
        source_id: Optional[int] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> Tuple[ChatMessageModel, ChatMessageModel]:
        """Atomically persist a complete conversation turn (user + assistant) and auto-title session."""
        created = await self.append_messages_batch(
            session_id=session_id,
            messages=[
                {"role": "user", "content": user_content, "status": "completed"},
                {
                    "role": "assistant",
                    "content": assistant_content,
                    "sources": sources,
                    "status": "completed",
                    "model": model,
                    "model_tier": model_tier,
                    "usage": usage,
                    "latency_ms": latency_ms,
                }
            ],
            scope_mode=scope_mode,
            source_id=source_id,
            filters=filters,
        )
        return created[0], created[1]

    async def append_message_and_update_session(
        self,
        session_id: str,
        role: str,
        content: str,
        sources: Optional[List[ChatSourceItem]] = None,
        status: str = "completed",
        model: Optional[str] = None,
        latency_ms: Optional[int] = None,
        scope_mode: str = "global",
        source_id: Optional[int] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> ChatMessageModel:
        """Add a single message to session, auto-title if needed, update updated_at, enforce FIFO."""
        created = await self.append_messages_batch(
            session_id=session_id,
            messages=[{
                "role": role,
                "content": content,
                "sources": sources,
                "status": status,
                "model": model,
                "latency_ms": latency_ms,
            }],
            scope_mode=scope_mode,
            source_id=source_id,
            filters=filters,
        )
        return created[0]

    async def enforce_fifo_retention(self, max_limit: int = 30) -> int:
        """Keep at most max_limit sessions; evict oldest by updated_at."""
        total_stmt = select(func.count(ChatSessionModel.id))
        total_count = (await self.session.execute(total_stmt)).scalar_one()

        if total_count <= max_limit:
            return 0

        excess = total_count - max_limit
        oldest_stmt = (
            select(ChatSessionModel.id)
            .order_by(ChatSessionModel.updated_at.asc())
            .limit(excess)
        )
        oldest_ids = (await self.session.execute(oldest_stmt)).scalars().all()

        if oldest_ids:
            for oid in oldest_ids:
                sess_to_del = await self.session.get(ChatSessionModel, oid)
                if sess_to_del:
                    await self.session.delete(sess_to_del)
            await self.session.commit()
            return len(oldest_ids)
        return 0
