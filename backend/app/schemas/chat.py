from typing import List, Optional, Dict, Any, Literal, Union
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.config import settings

def get_default_chat_model() -> str:
    """Dynamically resolves default chat model from settings/config."""
    return getattr(settings, "ANTHROPIC_DEFAULT_CHAT_MODEL", "claude-sonnet-5-5")

ModelTier = Literal["haiku", "sonnet", "opus"]
ChatModel = str  # Dynamic model identifier, open to any configured LLM model

class TokenUsageMeta(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_input_tokens: Optional[int] = None
    cache_creation_input_tokens: Optional[int] = None

class ChatMessageHistory(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatFocusFilter(BaseModel):
    category: Literal["all", "harness", "mcp_plugins_skills", "agent_tech", "ai_news"] = "all"
    time_range: Literal["all", "24h", "7d", "30d"] = "all"
    sort: Literal["hot", "latest", "quality"] = "hot"
    high_signal_only: bool = False

class ChatStreamRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    # 기본값을 채우지 않는다: 명시 model > model_tier > 기본 챗 모델 순으로 고른다 (BUG-14)
    model: Optional[str] = None
    model_tier: Optional[ModelTier] = None
    scope: Literal["scoped", "global"] = "global"
    source_id: Optional[int] = None
    session_id: Optional[str] = None
    history: Optional[List[ChatMessageHistory]] = None
    top_k: int = Field(5, ge=1, le=10)
    filters: Optional[ChatFocusFilter] = None
    # 프론트가 만든 이 턴의 메시지 id. 서버가 이 id 로 저장해 프론트 세션 POST 와 한 벌만 남긴다 (계약 8.1절)
    user_message_id: Optional[str] = Field(default=None, min_length=1, max_length=36)
    assistant_message_id: Optional[str] = Field(default=None, min_length=1, max_length=36)

    @model_validator(mode="after")
    def _message_ids_must_differ(self):
        if self.user_message_id and self.assistant_message_id and self.user_message_id == self.assistant_message_id:
            raise ValueError("user_message_id 와 assistant_message_id 는 서로 달라야 합니다.")
        return self

# ============================================================================
# v2.4 Status & Dual Source Schemas
# ============================================================================

# stream_chat 이 실제로 보내는 단계만 둔다 (scoped: extracting_source → synthesizing, global: thinking → [tool_calling] → synthesizing)
ChatStatusStep = Literal[
    "thinking",
    "tool_calling",
    "extracting_source",
    "synthesizing",
]

class ChatStatusPayload(BaseModel):
    step: ChatStatusStep
    label: str
    timestamp: str
    progress: Optional[int] = None
    query: Optional[str] = None
    queries: Optional[List[str]] = None
    sources_found: Optional[int] = None

ChatSourceType = Literal["primary", "supplementary"]

class ChatSourceItem(BaseModel):
    index: Union[int, str]
    type: ChatSourceType = "primary"
    id: Optional[int] = None
    title: str
    url: str
    source: str
    category: Optional[str] = None
    quality_score: Optional[float] = None
    score: Optional[float] = None
    snippet: Optional[str] = None
    full_content: Optional[str] = None
    domain: Optional[str] = None
    relevance_score: Optional[float] = None
    published_at: Optional[str] = None
    publisher: Optional[str] = None

# Backward compatibility alias
ChatSourceMeta = ChatSourceItem

class ChatSourcesPayload(BaseModel):
    sources: List[ChatSourceItem]
    applied_filters: Optional[Any] = None
    is_relaxed: bool = False
    primary_count: Optional[int] = None
    supplementary_count: Optional[int] = None

class StreamErrorPayload(BaseModel):
    error_code: str
    message: str
    status_code: int = 502
    step: Optional[str] = None
    retryable: bool = True

class DonePayload(BaseModel):
    done: bool = True
    session_id: str
    model: Optional[str] = Field(default_factory=get_default_chat_model)
    model_tier: Optional[ModelTier] = "sonnet"
    sources_count: int
    primary_count: Optional[int] = None
    supplementary_count: Optional[int] = None
    latency_ms: int
    usage: Optional[TokenUsageMeta] = None

class ChatSourceDetailResponse(BaseModel):
    id: int
    title: str
    url: str
    source: str
    category: str
    author: Optional[str] = None
    summary: str = ""
    tldr_bullets: List[str] = Field(default_factory=list)
    why_it_matters: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    quality_score: float
    is_high_signal: bool = False
    hotness_score: float = 0.0
    published_at: str
    created_at: Optional[str] = None
    full_content: Optional[str] = None
    scraped_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ChatSearchChunk(BaseModel):
    index: int
    id: int
    title: str
    url: str
    source: str
    category: str
    snippet: str
    quality_score: float
    published_at: str
    bm25_score: float
    rag_score: float

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    # 객체·배열·null. 요청 검증 실패는 [{"loc": [...], "msg": "..."}] (app/api/errors.py)
    details: Optional[Union[Dict[str, Any], List[Any]]] = None

class GenericSuccessResponse(BaseModel):
    status: str = "success"
    message: Optional[str] = None
    deleted_count: Optional[int] = None

class ChatMessageItem(BaseModel):
    id: str
    session_id: str
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: str
    sources: Optional[List[ChatSourceItem]] = None
    status: Literal["pending", "streaming", "completed", "error", "aborted"] = "completed"
    model: Optional[str] = None
    model_tier: Optional[ModelTier] = None
    latency_ms: Optional[int] = None
    usage: Optional[TokenUsageMeta] = None

    model_config = ConfigDict(from_attributes=True)

class ChatSessionSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    scope_mode: Literal["scoped", "global"]
    active_source_id: Optional[int] = None
    message_count: int = 0
    last_message_preview: Optional[str] = None
    active_filters: Optional[ChatFocusFilter] = None

    model_config = ConfigDict(from_attributes=True)

class ChatSessionDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    scope_mode: Literal["scoped", "global"]
    active_source_id: Optional[int] = None
    active_source: Optional[ChatSourceDetailResponse] = None
    active_filters: Optional[ChatFocusFilter] = None
    messages: List[ChatMessageItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class ChatSessionCreateRequest(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "새 대화"
    scope_mode: Optional[Literal["scoped", "global"]] = "global"
    active_source_id: Optional[int] = None
    active_filters: Optional[ChatFocusFilter] = None
    messages: Optional[List[ChatMessageItem]] = None
