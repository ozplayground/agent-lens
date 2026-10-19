import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base

class ChatSessionModel(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(100), nullable=False, default="새 대화")
    scope_mode = Column(String(20), nullable=False, default="global")
    active_source_id = Column(Integer, ForeignKey("news_items.id", ondelete="SET NULL"), nullable=True)
    active_filters_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    messages = relationship(
        "ChatMessageModel",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessageModel.created_at.asc()",
    )

    __table_args__ = (
        Index("idx_chat_sessions_updated_at", "updated_at"),
    )

class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String(36),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    sources_json = Column(Text, nullable=True)  # JSON-serialized sources
    status = Column(String(20), nullable=False, default="completed")  # pending, streaming, completed, error, aborted
    latency_ms = Column(Integer, nullable=True)
    model = Column(String(50), nullable=True)
    model_tier = Column(String(20), nullable=True)
    usage_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("ChatSessionModel", back_populates="messages")

    __table_args__ = (
        Index("idx_chat_messages_session_created", "session_id", "created_at"),
    )

# Aliases
ChatSession = ChatSessionModel
ChatMessage = ChatMessageModel
