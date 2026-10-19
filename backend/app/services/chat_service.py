import os
import time
import json
import uuid
import asyncio
import logging
from typing import List, Optional, Tuple, AsyncGenerator, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.news import NewsItem
from app.schemas.chat import (
    ChatStreamRequest,
    ChatQueryRequest,
    ChatQueryResponse,
    ChatSourceItem,
    ChatSourceMeta,
    ChatSourceDetailResponse,
    ChatSearchResponse,
    ChatSearchChunk,
    ChatFocusFilter,
    ChatStatusPayload,
    ChatSourcesPayload,
    StreamErrorPayload,
    DonePayload,
    TokenUsageMeta,
)
from app.services.retriever import KnowledgeRetrieverFacade
from app.services.scraper import (
    ArticleScraperService,
    ScrapeBlockedException,
    ScrapeTimeoutException,
    ScrapeEmptyContentException,
)
from app.services.agentic_search import AgenticSearchService
from app.services.chat_session_service import ChatSessionService
from app.services.llm_providers.anthropic_provider import resolve_model_and_tier
from app.services.llm_processor import (
    llm_processor,
    LLMProviderUnavailableException,
    LLMUpstreamException,
    LLMQuotaExceededException,
    LLMStreamFailedException,
)
from app.config import settings, load_json_config

logger = logging.getLogger("agentlens.chat")

class HandoverSourceNotFoundException(Exception):
    def __init__(self, source_id: int):
        self.source_id = source_id
        super().__init__(f"기사 ID {source_id}를 데이터베이스에서 찾을 수 없습니다.")

class ChatPayloadEmptyException(Exception):
    pass

class ChatPayloadTooLargeException(Exception):
    pass

class InvalidScopeException(Exception):
    pass

class SearchQueryTooShortException(Exception):
    pass


class ChatService:
    """
    Core AI Chat Service handling:
    - Scoped (single article handover) vs Global (corpus RAG) modes
    - ArticleScraperService on-demand scraping & L1/L2 caching
    - AgenticSearchService sufficiency evaluation & context-anchored search
    - Inline citation [1] (Primary) and [S1] (Supplementary) dual mapping
    - Real-time SSE streaming (status -> sources -> token -> done) with honest error handling
    - Senior Staff Architect 4-Section Structured Engineering Reports
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.facade = KnowledgeRetrieverFacade(session)
        self.scraper = ArticleScraperService(session)
        self.agentic_search = AgenticSearchService()
        self.session_service = ChatSessionService(session)

    async def get_source_detail(self, source_id: int) -> ChatSourceDetailResponse:
        """Fetch full article metadata for handover or citation popover."""
        item = await self.session.get(NewsItem, source_id)
        if not item:
            raise HandoverSourceNotFoundException(source_id)

        try:
            tldr = json.loads(item.tldr_bullets) if item.tldr_bullets else []
            if not isinstance(tldr, list):
                tldr = [str(tldr)]
        except Exception:
            tldr = []

        tech = [t.strip() for t in item.tech_stack.split(",") if t.strip()] if item.tech_stack else []
        tags = [t.strip() for t in item.tags.split(",") if t.strip()] if item.tags else []

        pub_str = item.published_at.isoformat() if hasattr(item.published_at, "isoformat") else str(item.published_at)
        created_str = item.created_at.isoformat() if hasattr(item.created_at, "isoformat") else str(item.created_at)
        scraped_str = item.scraped_at.isoformat() if item.scraped_at and hasattr(item.scraped_at, "isoformat") else None

        return ChatSourceDetailResponse(
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
            created_at=created_str,
            full_content=item.full_content,
            scraped_at=scraped_str,
        )

    async def search_corpus(
        self,
        query: str,
        top_k: int = 5,
        min_quality: float = 5.0,
        category: Optional[str] = None,
        source: Optional[str] = None,
        filters: Optional[ChatFocusFilter] = None,
    ) -> ChatSearchResponse:
        """Pre-search news corpus chunks using FTS5 BM25 + Quality + Recency hybrid scoring."""
        cleaned_q = query.strip() if query else ""
        if len(cleaned_q) < 2:
            raise SearchQueryTooShortException("검색어는 최소 2글자 이상이어야 합니다.")

        start_time = time.time()
        chunks = await self.facade.search_knowledge(
            query=cleaned_q,
            top_k=top_k,
            min_quality=min_quality,
            category=category,
            source=source,
            filters=filters,
        )
        latency_ms = int((time.time() - start_time) * 1000)

        return ChatSearchResponse(
            query=cleaned_q,
            total_matches=len(chunks),
            chunks=chunks,
            latency_ms=latency_ms
        )

    async def _resolve_sources(
        self,
        scope: str,
        source_id: Optional[int],
        query: str,
        top_k: int = 5,
        filters: Optional[ChatFocusFilter] = None,
    ) -> Tuple[List[ChatSourceItem], bool, ChatFocusFilter]:
        """Resolve citation sources according to Scoped or Global mode with focus filters and auto-relaxation."""
        if scope == "scoped":
            if not source_id:
                raise HandoverSourceNotFoundException(0)
            item = await self.session.get(NewsItem, source_id)
            if not item:
                raise HandoverSourceNotFoundException(source_id)

            pub_str = item.published_at.isoformat() if hasattr(item.published_at, "isoformat") else str(item.published_at)
            return [
                ChatSourceItem(
                    index=1,
                    type="primary",
                    id=item.id,
                    title=item.title,
                    url=item.url,
                    source=item.source,
                    category=item.category,
                    quality_score=float(item.quality_score or 6.0),
                    snippet=item.summary or item.why_it_matters or item.title,
                    published_at=pub_str
                )
            ], False, filters or ChatFocusFilter()

        # Global Corpus RAG Mode
        chunks, is_relaxed, applied_filters = await self.facade.search_knowledge_with_meta(
            query=query, top_k=top_k, min_quality=5.0, filters=filters
        )
        sources: List[ChatSourceItem] = []
        for c in chunks:
            sources.append(
                ChatSourceItem(
                    index=c.index,
                    type="primary",
                    id=c.id,
                    title=c.title,
                    url=c.url,
                    source=c.source,
                    category=c.category,
                    quality_score=c.quality_score,
                    snippet=c.snippet,
                    published_at=c.published_at
                )
            )
        return sources, is_relaxed, applied_filters

    def _validate_request(self, question: str, scope: str):
        """Validate input payload rules."""
        if not question or not question.strip():
            raise ChatPayloadEmptyException("질문 본문이 비어있습니다.")
        if len(question) > 2000:
            raise ChatPayloadTooLargeException("질문은 최대 2,000자까지 입력 가능합니다.")
        if scope not in ("scoped", "global"):
            raise InvalidScopeException("유효하지 않은 검색 스코프 모드입니다.")

    def _build_grounding_prompt(
        self,
        question: str,
        sources: List[ChatSourceItem],
        scope: str,
        history: Optional[List[Any]] = None,
        full_content: Optional[str] = None,
    ) -> str:
        """
        Assemble strict Senior Staff Architect prompt.
        Mandates 4 structured sections in Scoped mode and enforces dual citations ([1], [S1]).
        Strictly forbids 2-line parrot summaries.
        """
        prompt_parts = [
            "당신은 15년 이상의 분산 시스템 및 AI 엔지니어링 실무 경험을 보유한 Senior Staff Architect입니다.",
            "기술적 깊이와 구현 세부사항을 중시하며, 단순한 개요나 2줄 요약 앵무새 답변을 절대 하지 않습니다.",
            "\n[인라인 인용 규칙]",
            "- 원본 소스 기사 내용은 [1] 뱃지로 인라인 인용하세요.",
            "- 자율 보충 웹 검색 문서 내용은 [S1], [S2] 등으로 명확히 구분하여 인라인 인용하세요.",
            "- 제공된 출처에 없는 가상의 인용 번호를 생성하지 마세요.",
        ]

        if scope == "scoped":
            prompt_parts.extend([
                "\n[4단 구조화 엔지니어링 리포트 필수 작성 규칙]",
                "반드시 아래 4개의 마크다운 헤딩(##)을 포함하여 구조화된 엔지니어링 분석을 제공하세요:",
                "## 1. 핵심 아키텍처 및 동작 원리",
                "## 2. 주요 기능 및 코드 구현 예시",
                "## 3. 기존 기술 대비 차별점 및 벤치마크",
                "## 4. 실무 도입 시 고려사항 및 튜닝 파라미터",
            ])

            if sources:
                primary = sources[0]
                prompt_parts.append(f"\n[포커스 분석 대상 기사 원본 출처 [1]]\n제목: {primary.title}\n출처: {primary.source} | 카테고리: {primary.category}")
                if primary.snippet:
                    prompt_parts.append(f"기사 요약(Summary):\n{primary.snippet}")
                if full_content and full_content.strip() and full_content.strip() != (primary.snippet or "").strip():
                    prompt_parts.append(f"전문 본문(Full Content):\n{full_content[:5000]}")

            supplements = [s for s in sources if s.type == "supplementary"]
            if supplements:
                prompt_parts.append("\n[자율 보충 웹 검색 출처 [S1], [S2]...]")
                for s in supplements:
                    prompt_parts.append(f"[{s.index}] {s.title} ({s.domain or s.url}): {s.snippet}")

            prompt_parts.extend([
                "\n[🚨 필수 분석 지침]",
                "- 현재 세션은 사용자가 위 [포커스 분석 대상 기사 [1]]을 선택하여 집중 질의하는 모드입니다.",
                "- 반드시 위 기사의 제목, 요약, 본문 내용과 관련된 구체적 기술 메커니즘을 핵심 근거로 삼아 답변하십시오.",
                "- 기사의 실제 기술 내용과 무관한 일반 시스템 소개(예: AgentLens 자체 설명 등)를 앵무새처럼 반복 출력하는 것은 절대 금지됩니다.",
            ])
        else:
            if sources:
                prompt_parts.append("\n[검색된 코퍼스 지식 출처 목록]")
                for s in sources:
                    prompt_parts.append(f"[{s.index}] #{s.id} {s.title} ({s.category}): {s.snippet}")
            else:
                prompt_parts.append("\n[알림: 관련 기사를 직접 찾지 못해 범용 AI 에이전트 엔지니어링 지식을 토대로 답변합니다.]")

        if history:
            prompt_parts.append("\n[이전 대화 이력]")
            for h in history[-4:]:
                role = getattr(h, "role", "user")
                content = getattr(h, "content", "")
                prompt_parts.append(f"- {role}: {content}")

        prompt_parts.append(f"\n[사용자 질문]\n{question}")
        return "\n".join(prompt_parts)

    def _plan_react_action(self, question: str, scope: str) -> Dict[str, Any]:
        """ReAct Planner: Decides whether to invoke search_news_corpus tool or answer directly."""
        if scope == "scoped":
            return {"action": "none", "search_query": ""}

        from app.services.retriever import SqliteFtsRetriever

        casual_greetings = {
            "안녕", "안녕하세요", "반가워", "반갑습니다", "고마워", "고맙습니다",
            "감사", "감사합니다", "ㅎㅎ", "ㅋㅋ", "테스트", "하이", "헬로",
            "hello", "hi", "hey", "thanks", "thank you", "누구야", "너는 누구야", "뭐해"
        }
        q_clean = question.strip().lower().rstrip("?!.~")
        if q_clean in casual_greetings:
            return {"action": "none", "search_query": ""}

        keywords = [
            kw for kw in SqliteFtsRetriever.extract_keywords(question)
            if kw.lower() not in casual_greetings
        ]
        if not keywords:
            return {"action": "none", "search_query": ""}

        return {"action": "search_news_corpus", "search_query": " ".join(keywords)}

    async def query_chat(self, req: ChatQueryRequest) -> ChatQueryResponse:
        """Synchronous query-response handler with live LLM (Anthropic -> OpenAI -> Ollama). No fake fallback."""
        self._validate_request(req.question, req.scope)
        start_time = time.time()
        session_id = req.session_id or str(uuid.uuid4())

        full_content: Optional[str] = None
        primary_count = 1
        supplementary_count = 0

        if req.scope == "scoped":
            if not req.source_id:
                raise HandoverSourceNotFoundException(0)
            item = await self.session.get(NewsItem, req.source_id)
            if not item:
                raise HandoverSourceNotFoundException(req.source_id)

            if item.full_content and len(item.full_content.strip()) > 0:
                full_content = item.full_content
            else:
                try:
                    full_content = await self.scraper.get_article_content(item)
                except Exception as e:
                    logger.warning(f"Scoped scraper fallback in query_chat: {e}")
                    full_content = None

            pub_str = item.published_at.isoformat() if hasattr(item.published_at, "isoformat") else str(item.published_at)
            primary_source = ChatSourceItem(
                index=1,
                type="primary",
                id=item.id,
                title=item.title,
                url=item.url,
                source=item.source,
                category=item.category,
                quality_score=float(item.quality_score or 6.0),
                snippet=item.summary or item.why_it_matters or (full_content[:400] if full_content else item.title),
                full_content=full_content,
                published_at=pub_str,
            )
            sources = [primary_source]
            primary_count = 1
            supplementary_count = 0
            is_relaxed = False
            applied_filters = req.filters or ChatFocusFilter()
        else:
            plan = self._plan_react_action(req.question, req.scope)
            if plan["action"] == "search_news_corpus":
                sources, is_relaxed, applied_filters = await self._resolve_sources(
                    scope=req.scope,
                    source_id=req.source_id,
                    query=plan["search_query"],
                    top_k=req.top_k,
                    filters=req.filters,
                )
                primary_count = len(sources)
                supplementary_count = 0
            else:
                sources = []
                primary_count = 0
                supplementary_count = 0
                is_relaxed = False
                applied_filters = req.filters or ChatFocusFilter()

        prompt = self._build_grounding_prompt(req.question, sources, req.scope, req.history, full_content=full_content)
        try:
            answer, model_name = await llm_processor.generate_live_answer(
                prompt, model=req.model, model_tier=req.model_tier
            )
        except TypeError:
            answer, model_name = await llm_processor.generate_live_answer(prompt)

        latency_ms = int((time.time() - start_time) * 1000)
        _, resolved_tier = resolve_model_and_tier(req.model or req.model_tier or model_name)
        usage_dict = getattr(llm_processor, "last_usage", None)
        usage_meta = TokenUsageMeta(**usage_dict) if usage_dict else None

        return ChatQueryResponse(
            answer=answer,
            sources=sources,
            session_id=session_id,
            model=model_name,
            model_tier=resolved_tier,
            scope=req.scope,
            applied_filters=applied_filters,
            is_relaxed=is_relaxed,
            primary_count=primary_count,
            supplementary_count=supplementary_count,
            latency_ms=latency_ms,
            usage=usage_meta,
        )

    async def stream_chat(self, req: ChatStreamRequest) -> AsyncGenerator[str, None]:
        """
        SSE Generator yielding multi-event stream:
        - In Scoped mode:
          1. event: status (extracting_source, 20%)
          2. event: status (evaluating_sufficiency, 45%)
          3. event: status (agentic_searching, 65%) [if missing aspects detected]
          4. event: status (synthesizing, 85%)
          5. event: sources (dual sources: primary [1] + supplementary [S1], primary_count & supplementary_count)
          6. event: token (streamed 4-section structured markdown tokens)
          7. event: done (done: true, primary_count, supplementary_count, stats)
        - In Global mode:
          1. event: status (synthesizing, 85%)
          2. event: sources (corpus chunks, primary_count, is_relaxed)
          3. event: token (live tokens)
          4. event: done
        On mid-stream failure:
          event: error (StreamErrorPayload)
        """
        self._validate_request(req.question, req.scope)
        start_time = time.time()
        session_id = req.session_id or str(uuid.uuid4())

        if req.scope == "scoped":
            if not req.source_id:
                raise HandoverSourceNotFoundException(0)
            item = await self.session.get(NewsItem, req.source_id)
            if not item:
                raise HandoverSourceNotFoundException(req.source_id)

            # Step 1: extracting_source (30%)
            now_iso = datetime.now(timezone.utc).isoformat()
            status_p1 = json.dumps({
                "step": "extracting_source",
                "label": "📄 지정된 단일 뉴스 기사 컨텍스트 로드 중...",
                "progress": 30,
                "timestamp": now_iso
            }, ensure_ascii=False)
            yield f"event: status\ndata: {status_p1}\n\n"
            await asyncio.sleep(0.01)

            full_content: Optional[str] = None
            if item.full_content and len(item.full_content.strip()) > 0:
                full_content = item.full_content
            else:
                try:
                    full_content = await self.scraper.get_article_content(item)
                except Exception as e:
                    logger.warning(f"Scraper fallback: {e}")
                    full_content = None

            # Step 2: synthesizing (85%)
            now_iso = datetime.now(timezone.utc).isoformat()
            status_p4 = json.dumps({
                "step": "synthesizing",
                "label": "📝 Senior Staff Architect 단일 기사 심층 리포트 프롬프트 조립...",
                "progress": 85,
                "timestamp": now_iso
            }, ensure_ascii=False)
            yield f"event: status\ndata: {status_p4}\n\n"
            await asyncio.sleep(0.01)

            # Step 3: Single Primary Source Only (supplementary_count = 0)
            pub_str = item.published_at.isoformat() if hasattr(item.published_at, "isoformat") else str(item.published_at)
            primary_source = ChatSourceItem(
                index=1,
                type="primary",
                id=item.id,
                title=item.title,
                url=item.url,
                source=item.source,
                category=item.category,
                quality_score=float(item.quality_score or 6.0),
                snippet=item.summary or item.why_it_matters or (full_content[:400] if full_content else item.title),
                full_content=full_content,
                published_at=pub_str,
            )
            sources = [primary_source]
            primary_count = 1
            supplementary_count = 0

            sources_payload = json.dumps({
                "sources": [s.model_dump() for s in sources],
                "applied_filters": None,
                "is_relaxed": False,
                "primary_count": primary_count,
                "supplementary_count": supplementary_count,
            }, ensure_ascii=False)
            yield f"event: sources\ndata: {sources_payload}\n\n"
            await asyncio.sleep(0.01)

            prompt = self._build_grounding_prompt(req.question, sources, req.scope, req.history, full_content=full_content)

        else:
            # Global Mode: ReAct (Thought -> Action -> Observation -> Final Answer)
            now_iso = datetime.now(timezone.utc).isoformat()
            think_status = json.dumps({
                "step": "thinking",
                "label": "🧠 ReAct 추론: 질문 의도 및 검색 도구 필요성 판단 중...",
                "progress": 25,
                "timestamp": now_iso,
            }, ensure_ascii=False)
            yield f"event: status\ndata: {think_status}\n\n"
            await asyncio.sleep(0.01)

            plan = self._plan_react_action(req.question, req.scope)
            if plan["action"] == "search_news_corpus":
                search_q = plan["search_query"]
                now_iso = datetime.now(timezone.utc).isoformat()
                tool_status = json.dumps({
                    "step": "tool_calling",
                    "label": f"🛠️ Action: search_news_corpus('{search_q}') 도구 실행 중...",
                    "progress": 55,
                    "timestamp": now_iso,
                    "query": search_q,
                }, ensure_ascii=False)
                yield f"event: status\ndata: {tool_status}\n\n"
                await asyncio.sleep(0.01)

                sources, is_relaxed, applied_filters = await self._resolve_sources(
                    scope=req.scope,
                    source_id=req.source_id,
                    query=search_q,
                    top_k=req.top_k,
                    filters=req.filters,
                )
                primary_count = len(sources)
                supplementary_count = 0

                now_iso = datetime.now(timezone.utc).isoformat()
                obs_status = json.dumps({
                    "step": "observing",
                    "label": f"👀 Observation: 관련 뉴스 {primary_count}건 관찰 완료",
                    "progress": 80,
                    "timestamp": now_iso,
                    "sources_found": primary_count,
                }, ensure_ascii=False)
                yield f"event: status\ndata: {obs_status}\n\n"
                await asyncio.sleep(0.01)

                sources_payload = json.dumps({
                    "sources": [s.model_dump() for s in sources],
                    "applied_filters": applied_filters.model_dump() if applied_filters else None,
                    "is_relaxed": is_relaxed,
                    "primary_count": primary_count,
                    "supplementary_count": supplementary_count,
                }, ensure_ascii=False)
                yield f"event: sources\ndata: {sources_payload}\n\n"
                await asyncio.sleep(0.01)
            else:
                sources = []
                primary_count = 0
                supplementary_count = 0
                is_relaxed = False
                applied_filters = req.filters or ChatFocusFilter()

            prompt = self._build_grounding_prompt(req.question, sources, req.scope, req.history)

        # Stage: Generate and stream live tokens from llm_processor
        model_name = "LLM Stream"
        full_tokens = []
        try:
            try:
                stream_gen = llm_processor.stream_tokens(
                    prompt, model=req.model, model_tier=req.model_tier
                )
            except TypeError:
                stream_gen = llm_processor.stream_tokens(prompt)

            async for chunk_text, m_name in stream_gen:
                model_name = m_name
                full_tokens.append(chunk_text)
                token_payload = json.dumps({"token": chunk_text}, ensure_ascii=False)
                yield f"event: token\ndata: {token_payload}\n\n"
        except Exception as e:
            logger.error(f"Mid-stream LLM exception: {e}")
            err_payload = json.dumps({
                "error_code": "ERR_LLM_STREAM_FAILED",
                "message": "LLM 스트리밍 도중 외부 프로바이더 오류가 발생했습니다.",
                "status_code": 502,
                "step": "synthesizing",
                "retryable": True
            }, ensure_ascii=False)
            yield f"event: error\ndata: {err_payload}\n\n"
            return

        # Stage: Send done event
        latency_ms = int((time.time() - start_time) * 1000)
        _, resolved_tier = resolve_model_and_tier(req.model or req.model_tier or model_name)
        usage_dict = getattr(llm_processor, "last_usage", None)

        done_payload = json.dumps({
            "done": True,
            "session_id": session_id,
            "model": model_name,
            "model_tier": resolved_tier,
            "sources_count": len(sources),
            "primary_count": primary_count,
            "supplementary_count": supplementary_count,
            "latency_ms": latency_ms,
            "usage": usage_dict,
        }, ensure_ascii=False)
        yield f"event: done\ndata: {done_payload}\n\n"

        # Auto-persist turn (user question + assistant response) to DB
        try:
            full_answer = "".join(full_tokens)
            await self.session_service.persist_turn(
                session_id=session_id,
                user_content=req.question,
                assistant_content=full_answer,
                sources=sources,
                model=model_name,
                model_tier=resolved_tier,
                usage=usage_dict,
                latency_ms=latency_ms,
                scope_mode=req.scope,
                source_id=req.source_id,
                filters=req.filters,
            )
        except Exception as pe:
            logger.error(f"Failed to auto-persist turn to DB for session {session_id}: {pe}")
