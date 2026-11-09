"""FastAPI 자동 생성 스키마(app.openapi())에 코드 사실을 보충해 docs/system-designer/02_OPENAPI_SPEC.yaml 을 만든다.

사용 (저장소 루트에서): cd backend && PYTHONPATH=. ../.venv/bin/python ../.claude/skills/contract-specification/scripts/gen_openapi.py ../docs/system-designer/02_OPENAPI_SPEC.yaml
- lifespan 은 돌지 않는다 (app.openapi() 는 시작 이벤트를 부르지 않는다).
- 자동 생성과 다른 곳에는 x-agentlens-supplemented: true 또는 operation 의 x-agentlens-diff 목록을 단다.
"""
import copy
import json
import sys

import yaml

from app.main import app
from app.schemas import chat as chat_schemas
from app.schemas import news as news_schemas

OUT = sys.argv[1]
SUP = {"x-agentlens-supplemented": True}

spec = app.openapi()
schemas = spec["components"]["schemas"]


def ref(name):
    return {"$ref": f"#/components/schemas/{name}"}


def json_content(schema):
    return {"application/json": {"schema": schema}}


def add_model(model, name=None):
    """Pydantic 모델 스키마를 components 에 넣는다 ($defs 를 끌어올린다)."""
    s = model.model_json_schema(ref_template="#/components/schemas/{model}")
    defs = s.pop("$defs", {})
    for k, v in defs.items():
        if k not in schemas:
            v = dict(v)
            v.update(SUP)
            schemas[k] = v
    s.update(SUP)
    schemas[name or model.__name__] = s


# ---------------------------------------------------------------- components 보충
for m in [
    chat_schemas.ChatStreamRequest,
    chat_schemas.ChatQueryRequest,
    chat_schemas.ChatSessionCreateRequest,
    chat_schemas.ChatMessageHistory,
    chat_schemas.ErrorResponse,
    chat_schemas.ChatStatusPayload,
    chat_schemas.ChatSourcesPayload,
    chat_schemas.StreamErrorPayload,
    chat_schemas.DonePayload,
    news_schemas.ManualCollectResponse,
]:
    add_model(m)

# 모델 기본값이 import 시점 설정값으로 박히는 필드는 설명을 단다
for n in ["ChatStreamRequest", "ChatQueryRequest", "DonePayload", "ChatQueryResponse"]:
    if n in schemas and "model" in schemas[n].get("properties", {}):
        schemas[n]["properties"]["model"]["description"] = (
            "기본값은 default_factory get_default_chat_model() = settings.ANTHROPIC_DEFAULT_CHAT_MODEL "
            "(없으면 claude-sonnet-5-5). 값 검증 없음. 'gemini' 포함이면 Gemini, 'gpt'/'openai' 포함이면 OpenAI 로 보낸다."
        )

schemas["ChatStreamRequest"]["description"] = (
    "POST /api/chat/stream 본문. 라우터가 request.json() 으로 직접 읽은 뒤 ChatStreamRequest(**body) 로 만든다 "
    "(backend/app/api/chat.py:281, :335). 그래서 자동 생성 스키마에 requestBody 가 없다. "
    "검증 실패는 400: model_tier 오류면 ERR_INVALID_MODEL_TIER, 그 밖(본문이 객체 아님, filters·top_k·history, 메시지 id 길이·같은 값)은 ERR_INVALID_PAYLOAD (chat.py:292-345). "
    "user_message_id·assistant_message_id 는 프론트가 만든 이 턴의 메시지 id 로, 서버가 그 id 로 턴을 저장한다 (schemas/chat.py:38-46)."
)
schemas["ChatQueryRequest"]["description"] = (
    "POST /api/chat/query 본문. request.json() 으로 읽고 ChatQueryRequest(**body) 로 만든다 (backend/app/api/chat.py:129, :174). "
    "검증 실패는 500 ERR_SERVER_INTERNAL 로 나간다."
)
schemas["ChatSessionCreateRequest"]["description"] = (
    "POST /api/chat/sessions 본문. request.json() 으로 읽고 ChatSessionCreateRequest(**body) 로 만든다 (backend/app/api/chat.py:472, :484). "
    "JSON 오류·필드 오류·UUID 오류 모두 400 ERR_SESSION_INVALID_UUID."
)
for n, d in {
    "ChatStatusPayload": "SSE event: status 의 data 모양 참고용. stream_chat 은 이 모델을 쓰지 않고 dict 를 직접 json.dumps 한다 (backend/app/services/chat_service.py:612). backend 가 보내는 step 은 extracting_source·synthesizing·thinking·tool_calling 넷뿐이다.",
    "ChatSourcesPayload": "SSE event: sources 의 data 모양 참고용. 스트림은 dict 로 만든다 (chat_service.py:661, :778). supplementary_count 는 항상 0.",
    "StreamErrorPayload": "SSE event: error 의 data 모양 참고용. 스트림은 dict 로 만든다 (chat_service.py:761). error_code 는 항상 ERR_LLM_STREAM_FAILED.",
    "DonePayload": "SSE event: done 의 data 모양 참고용. 스트림은 dict 로 만든다 (chat_service.py:793). usage 는 llm_processor.last_usage 딕셔너리 그대로.",
    "ErrorResponse": "chat 라우터의 오류 본문. 라우터는 이 모델을 import 하지만 같은 모양 dict 를 JSONResponse 로 직접 만든다.",
    "ManualCollectResponse": "정의만 있고 어느 엔드포인트도 response_model 로 쓰지 않는다 (backend/app/schemas/news.py:148).",
}.items():
    schemas[n]["description"] = d

schemas["HTTPExceptionDetail"] = {
    "type": "object",
    "description": "HTTPException 기본 본문. news, briefing, webhook, sources, research 라우터가 쓴다.",
    "properties": {"detail": {"type": "string"}},
    "required": ["detail"],
    **SUP,
}
schemas["GlobalErrorResponse"] = {
    "type": "object",
    "description": "처리하지 않은 예외의 전역 처리 본문 (backend/app/main.py:58). 예외 문자열을 error 에 그대로 싣는다.",
    "properties": {
        "detail": {"type": "string", "const": "Internal server error occurred. Please check server logs."},
        "error": {"type": "string"},
    },
    "required": ["detail", "error"],
    **SUP,
}


def obj(props, required=None, description=None):
    o = {"type": "object", "properties": props, **SUP}
    if required:
        o["required"] = required
    if description:
        o["description"] = description
    return o


S, I, B, N = {"type": "string"}, {"type": "integer"}, {"type": "boolean"}, {"type": "number"}
NS = {"type": ["string", "null"]}

schemas["RootResponse"] = obj({"service": {"type": "string", "const": "AgentLens API"}, "version": S, "docs": {"type": "string", "const": "/docs"}}, ["service", "version", "docs"])
schemas["HealthResponse"] = obj({"status": {"type": "string", "const": "healthy"}, "version": S, "running": {"type": "boolean", "description": "collector_manager.is_running (메모리 플래그). DB 연결은 확인하지 않는다."}}, ["status", "version", "running"])
schemas["DeleteAllNewsResponse"] = obj({"status": {"type": "string", "const": "success"}, "deleted_count": I}, ["status", "deleted_count"])
schemas["CrawlProgressResponse"] = obj({
    "is_running": B, "current_source": S, "step_message": S, "items_collected": I, "items_saved": I,
    "items_filtered": I, "total_sources": I, "completed_sources": I, "last_crawl_time": NS,
}, description="collector_manager.get_progress() 그대로 (backend/app/collectors/manager.py:59).")
schemas["TriggerCollectResponse"] = obj({
    "status": {"type": "string", "enum": ["started", "already_running"]}, "message": S,
    "total_collected": I, "total_saved": I, "source_results": {"type": "object"},
}, ["status", "message", "total_collected", "total_saved", "source_results"],
    "두 경우 모두 HTTP 200. already_running 이면 total_collected·total_saved 는 지금 진행 중인 수집의 메모리 카운터.")
schemas["ResetAndCollectResponse"] = obj({
    "status": {"type": "string", "enum": ["started", "already_running"]}, "message": S, "deleted_count": I,
}, ["status", "message", "deleted_count"], "already_running 이면 아무것도 지우지 않고 deleted_count 0.")
schemas["McpInfoResponse"] = obj({
    "name": S, "description": S,
    "tools": {"type": "array", "items": obj({"name": S, "description": S})},
    "claude_desktop_config": {"type": "object", "description": "{mcpServers: {agentlens: {command: sys.executable 절대 경로, args: ['-m','app.mcp.server'], cwd: backend 절대 경로}}}"},
}, description="도구 목록은 하드코딩. 서버 절대 경로를 노출한다.")
schemas["SuccessMessageResponse"] = obj({"success": {"type": "boolean", "const": True}, "message": S}, ["success", "message"])
schemas["BriefingSettingsResponse"] = obj({
    "title": S, "auto_dispatch_hour": I,
    "notion": obj({"enabled": B, "has_api_key": B, "masked_api_key": {"type": "string", "description": "9자 이상이면 앞4 + '...' + 뒤4, 아니면 '***', 키 없으면 ''"}, "page_id": S, "auto_export": B}),
    "email": obj({"enabled": B, "smtp_host": S, "smtp_port": I, "smtp_user": S, "has_password": B, "smtp_from": S, "smtp_to": S, "use_tls": B, "auto_send": B}),
    "webhooks": obj({"slack_webhook_url": {"type": "string", "description": "마스킹 없음"}, "discord_webhook_url": {"type": "string", "description": "마스킹 없음"}, "auto_dispatch_daily_briefing": B, "auto_alert_high_signal": B}),
}, description="config.json 원시 값 (settings.raw_json_config). SMTP 비밀번호는 내보내지 않는다.")
tag_item = obj({"name": S, "count": I, "category": S, "recent_count": I, "velocity": {"type": "string", "description": "recent_count>=3 이면 +{recent_count*20}%, 1~2 면 +25%, 0 이고 count>=8 이면 HOT, 아니면 STEADY"}, "sample_news_id": {"type": ["integer", "null"]}})
schemas["TechRadarTag"] = tag_item
schemas["TechRadarResponse"] = obj({
    "updated_at": S, "total_analyzed": I,
    "surging_tags": {"type": "array", "items": ref("TechRadarTag"), "description": "recent_count>0 또는 count>=5 인 태그 상위 6개"},
    "categories": {"type": "array", "items": obj({"name": S, "count": I, "percentage": N})},
    "tags": {"type": "array", "items": ref("TechRadarTag"), "description": "최대 25개"},
}, description="최근 500건의 tech_stack 집계 (backend/app/services/trend_service.py:40).")
schemas["StatusMessageResponse"] = obj({"status": {"type": "string", "const": "success"}, "message": S}, ["status", "message"])
schemas["RssFeed"] = obj({"id": S, "name": S, "url": S, "site_url": S, "category_hint": S, "country": {"type": "string", "description": "KR 또는 GLOBAL (검증 없음)"}, "enabled": B, "description": S, "added_at": S})
schemas["MonitoredRepo"] = obj({"repo": S, "category": S, "enabled": B, "description": S, "stars_hint": I, "added_at": S})
schemas["SourcesListResponse"] = obj({
    "status": {"type": "string", "const": "success"},
    "sources_file": {"type": "string", "description": "서버의 sources.json 절대 경로"},
    "updated_at": NS,
    "stats": obj({"total_rss": I, "active_rss": I, "total_github_repos": I, "active_github_repos": I, "github_search_enabled": B, "reddit_enabled": B, "hackernews_enabled": B, "arxiv_enabled": B, "huggingface_enabled": B}),
    "data": {"type": "object", "description": "sources.json 전체 (version, updated_at, rss_feeds[], github_sources, reddit_sources, hackernews_sources, arxiv_sources, huggingface_sources). 구조는 01_SYSTEM_DESIGN.md '설정 파일 구조'."},
})
schemas["AddRssResponse"] = obj({"status": {"type": "string", "const": "success"}, "message": S, "source": ref("RssFeed")})
schemas["AddGitHubRepoResponse"] = obj({"status": {"type": "string", "const": "success"}, "message": S, "repo": ref("MonitoredRepo")})
schemas["InspectUrlResponse"] = obj({
    "status": {"type": "string", "enum": ["found", "error", "not_found", "empty"], "description": "결과와 상관없이 HTTP 200"},
    "message": S, "input_url": S, "name": S, "feed_url": S, "site_url": S, "description": S, "category_hint": S,
    "relevance_score": N, "is_high_signal": B,
    "recent_posts": {"type": "array", "items": obj({"title": S, "link": S, "published": S, "snippet": S}), "description": "최대 4건"},
    "already_registered": B, "why_recommended": S,
    "type": {"type": "string", "description": "GitHub 저장소면 'atom'"},
    "source_kind": {"type": "string", "description": "GitHub 저장소면 'github_releases'"},
}, ["status"], "status 별 필드: found → name·feed_url·site_url·description·category_hint·relevance_score·is_high_signal·recent_posts·already_registered·why_recommended; error → message·input_url 또는 feed_url; not_found → message·input_url; empty → message·feed_url.")
schemas["DiscoverResponse"] = obj({
    "query": S, "category": S, "total_found": I,
    "candidates": {"type": "array", "items": obj({"id": S, "name": S, "site_url": S, "feed_url": S, "category_hint": S, "country": S, "description": S, "relevance_score": N, "tags": {"type": "array", "items": S}, "already_registered": B, "why_recommended": S}), "description": "미등록 후보 먼저, 그다음 relevance_score 내림차순"},
})
schemas["RegisterCandidateResponse"] = obj({"status": {"type": "string", "const": "success"}, "message": S, "source": ref("RssFeed")})
schemas["DeepResearchStatusResponse"] = obj({
    "is_running": B, "last_run_time": NS, "auto_adopted_count": I,
    "last_run_summary": {"type": "object", "description": "{evaluated_total, auto_adopted, completed_at, results[]} 또는 {}"},
    "cadence": {"type": "string", "const": "Every 12 hours (03:00, 15:00 UTC) + On-demand"},
})
schemas["ResearchAuditLog"] = obj({
    "id": I, "source_name": S, "site_url": S, "feed_url": S, "category": S, "relevance_score": N,
    "verdict": {"type": "string", "enum": ["AUTO_ADOPTED", "WATCHLIST", "REJECTED", "ALREADY_MONITORED"]},
    "verdict_reason": S, "analyzed_articles_count": I, "created_at": NS,
})
schemas["ResearchAuditLogsResponse"] = obj({"status": {"type": "string", "const": "success"}, "total": {"type": "integer", "description": "이번에 돌려준 개수"}, "logs": {"type": "array", "items": ref("ResearchAuditLog")}}, description="DB 오류는 로그만 남기고 logs: [] 로 돌려준다.")
schemas["RunDeepResponse"] = obj({"status": {"type": "string", "enum": ["started", "already_running"]}, "message": S, "max_candidates": I}, ["status", "message"], "already_running 이면 max_candidates 가 없다.")
schemas["NewsAskStreamEvent"] = {
    "description": "POST /api/news/{news_id}/ask/stream 의 data JSON. event: 줄 없이 'data: <JSON>\\n\\n' 만 보낸다. 종류는 JSON 의 event 필드.",
    "oneOf": [
        obj({"event": {"type": "string", "const": "meta"}, "model": {"type": "string", "description": "캐시 적중이면 '<model> (캐시됨)'"}}, ["event", "model"]),
        obj({"event": {"type": "string", "const": "token"}, "text": S}, ["event", "text"]),
        obj({"event": {"type": "string", "const": "done"}, "total_text": S}, ["event", "total_text"]),
    ],
    **SUP,
}

# ---------------------------------------------------------------- operation 보충
E_HTTP = json_content(ref("HTTPExceptionDetail"))
E_CHAT = json_content(ref("ErrorResponse"))
E_GLOBAL = json_content(ref("GlobalErrorResponse"))


def resp(desc, content=None):
    r = {"description": desc, **SUP}
    if content:
        r["content"] = content
    return r


def chat_errs(rows):
    """rows: [(status, codes설명)] → 같은 상태 코드는 한 응답으로 합친다."""
    out = {}
    for code, text in rows:
        key = str(code)
        if key in out:
            out[key]["description"] += " / " + text
        else:
            out[key] = resp(text, E_CHAT)
    return out


SSE_CHAT = """\
프레임: `event: <종류>\\ndata: <JSON>\\n\\n` (backend/app/services/chat_service.py:576).
응답 헤더: Content-Type `text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.

| 이벤트 | data | 설명 |
|---|---|---|
| status | step, label, progress, timestamp, (query) | step 은 extracting_source(30), synthesizing(85/80/75), thinking(25), tool_calling(50, query 포함) 넷뿐 |
| sources | sources: ChatSourceItem[], applied_filters, is_relaxed, primary_count, supplementary_count | supplementary_count 는 항상 0, type 은 모두 primary |
| token | token | 답변 조각 |
| done | done: true, session_id, model, model_tier, sources_count, primary_count, supplementary_count, latency_ms, usage | 종료 신호. usage 는 llm_processor.last_usage 그대로 |
| error | error_code: ERR_LLM_STREAM_FAILED, message, status_code: 502, step: synthesizing, retryable: true | 토큰 생성 단계 예외 (Anthropic 스트림 error 이벤트·stop_reason max_tokens 포함). 뒤에 done 없이 끝나고 턴을 저장하지 않는다 |

순서
- scoped: status(extracting_source,30) → status(synthesizing,85) → sources(단일 출처, full_content 포함, applied_filters null) → token* → done
- global, 검색함: status(thinking,25) → status(tool_calling,50) → status(synthesizing,80) → token* → sources(답변에 인용된 출처만, 토큰 뒤) → done
- global, 검색 안 함: status(thinking,25) → status(synthesizing,75) → token* → done (sources 없음)
- 계획·검색·스크래핑 단계 예외는 error 이벤트 없이 스트림이 끊긴다.
- done 을 보내기 직전에 persist_turn 으로 질문·답변 두 메시지를 chat_messages 에 저장한다 (user_message_id·assistant_message_id 가 있으면 그 id, 이미 있는 id 는 건너뜀, 실패는 로그만). done 이 마지막 이벤트다 (backend/app/services/chat_service.py:804-825).
"""

SSE_NEWS = """\
프레임: `event:` 줄 없이 `data: <JSON>\\n\\n` (backend/app/api/news.py:157). 종류는 JSON 의 event 필드 (NewsAskStreamEvent).
응답 헤더: `text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
순서: meta → token* → done. 토큰 전에 Anthropic 이 실패하면 OpenAI, 그다음 휴리스틱으로 넘어간다. 토큰을 보낸 뒤 Anthropic·OpenAI 가 실패하면 이어 붙이지 않고 done 없이 끝내며 캐시하지 않는다 (backend/app/services/llm_processor.py:895-977, :917-919, :950-951).
오류 이벤트는 없다. 토큰 전 실패는 휴리스틱 답변으로 대체한다. 토큰 뒤 실패와 휴리스틱 단계 예외는 오류 이벤트 없이 끊긴다. done 은 full_text 가 비어 있지 않을 때만 보낸다.
캐시 적중이면 meta 의 model 이 '<model> (캐시됨)' 이고 답을 4단어씩 token 으로 나눠 보낸다.
"""

OPS = {
    ("get", "/"): dict(code="backend/app/main.py:71", fe="없음", ok=ref("RootResponse"), tags=["System"]),
    ("get", "/health"): dict(code="backend/app/main.py:75", fe="없음 (docker-compose healthcheck 가 curl -f 로 부른다)", ok=ref("HealthResponse"), tags=["System"]),
    ("get", "/api/news"): dict(code="backend/app/api/news.py:47", fe="fetchNewsFeed",
        desc="category·source 는 소문자로 바꿔 일치 비교(all 이면 필터 없음). search 는 앞뒤 공백 제거 후 title·summary·tags·tech_stack·why_it_matters 에 ILIKE %search% (OR). sort: latest(published_at desc), top(raw_score desc), quality(quality_score desc, hotness_score desc), 그 밖의 값은 모두 hot(hotness_score desc, published_at desc). offset=(page-1)*size, total_pages=ceil(total/size) (total 0 이면 1). tags·tech_stack 은 쉼표 문자열을 배열로, tldr_bullets 는 JSON 파싱(실패 시 []), quality_score 0/NULL 은 6.0 (news.py:17)."),
    ("delete", "/api/news/all"): dict(code="backend/app/api/news.py:96", fe="deleteAllNews (정의만 있고 호출처 없음)", ok=ref("DeleteAllNewsResponse"),
        desc="news_items 전체 DELETE 후 커밋. FTS 트리거 news_items_ad 가 색인에서도 지운다. crawl_logs 는 지우지 않는다. 확인 절차·인증·수집 실행 중 검사 없음. chat_sessions.active_source_id 는 FK ON DELETE SET NULL.",
        extra={"500": resp("DB 예외 (전역 처리)", E_GLOBAL)}),
    ("get", "/api/news/{news_id}"): dict(code="backend/app/api/news.py:104", fe="없음",
        desc="GET /api/news/all 도 이 경로에 걸려 422 가 난다.",
        extra={"404": resp('{"detail": "News item not found"}', E_HTTP)}),
    ("post", "/api/news/{news_id}/ask"): dict(code="backend/app/api/news.py:111", fe="askQuestionAboutNews (정의만 있고 호출처 없음)",
        desc="question 길이 제약 없음(빈 문자열도 통과). llm_processor.answer_question_with_meta 가 메모리 캐시(_qa_cache, 키 '<제목>:<질문 소문자>')를 먼저 보고, 없으면 generate_live_answer(Anthropic → OpenAI → Ollama). LLM 이 모두 실패하면 휴리스틱 답변과 model_used 'AgentLens Heuristic Engine' 으로 200 (llm_processor.py:756, :853). LLM 실패가 HTTP 오류로 드러나지 않는다.",
        extra={"404": resp('{"detail": "News item not found"}', E_HTTP)}),
    ("post", "/api/news/{news_id}/ask/stream"): dict(code="backend/app/api/news.py:137, backend/app/services/llm_processor.py:855", fe="askQuestionAboutNewsStream (getDirectApiBase 로 backend 직결, 실패 시 상대 경로로 재시도)",
        desc=SSE_NEWS, sse="NewsAskStreamEvent",
        extra={"404": resp('{"detail": "News item not found"} (스트림을 열기 전에 확인)', E_HTTP)}),
    ("get", "/api/news/feed/rss.xml"): dict(code="backend/app/api/news.py:169", fe="없음 (Header.tsx 의 링크 href)",
        desc="published_at 내림차순 최대 50건. category 는 all 이 아니면 일치 비교 (GET /api/news 와 달리 소문자로 바꾸지 않는다). channel link 는 http://localhost:3000 고정. 항목: title, link, description(summary), category(XML 이스케이프 안 함), pubDate('%a, %d %b %Y %H:%M:%S GMT'), guid(url).",
        xml=True, extra={"500": resp("summary 나 published_at 이 NULL 인 행이 있으면 saxutils.escape(None)/None.strftime 예외 (news.py:182, :184)", E_GLOBAL)}),
    ("get", "/api/schedule/status"): dict(code="backend/app/api/schedule.py:14", fe="fetchScheduleStatus",
        desc="schedule_hours·timezone 은 config.json 값(표시만). next_run 은 APScheduler job daily_crawl 의 next_run_time. recent_logs 는 crawl_logs 최근 5행(id desc). last_crawl_status 는 로그 상태가 아니라 메모리 플래그 collector_manager.is_running 으로 running/idle."),
    ("get", "/api/schedule/progress"): dict(code="backend/app/api/schedule.py:43", fe="fetchCrawlProgress", ok=ref("CrawlProgressResponse")),
    ("post", "/api/schedule/trigger"): dict(code="backend/app/api/schedule.py:48", fe="triggerManualCollect", ok=ref("TriggerCollectResponse"),
        desc="BackgroundTasks 로 collector_manager.collect_all() 을 시작하고 바로 응답한다. 외부 소스 6종 호출, 항목별 LLM 평가, news_items INSERT/UPDATE, 끝에 crawl_logs 1행."),
    ("post", "/api/schedule/reset-and-collect"): dict(code="backend/app/api/schedule.py:69", fe="resetAndRecollect (make reset 도 curl 로 부른다)", ok=ref("ResetAndCollectResponse"),
        desc="수집 중이 아니면 DELETE FROM news_items, DELETE FROM crawl_logs 후 커밋, 수집기 메모리 카운터 초기화, 백그라운드 collect_all(). 확인 절차·인증 없음. source_research_logs·chat_* 는 지우지 않는다."),
    ("get", "/api/stats"): dict(code="backend/app/api/stats.py:11", fe="fetchStats", desc="last_updated 는 데이터 갱신 시각이 아니라 응답 시각."),
    ("get", "/api/mcp/info"): dict(code="backend/app/api/mcp.py:6", fe="없음", ok=ref("McpInfoResponse"),
        desc="MCP 서버(stdio, python -m app.mcp.server) 소개와 Claude Desktop 설정 예시. MCP 프로토콜 자체는 HTTP 로 열지 않는다."),
    ("get", "/api/briefing/today"): dict(code="backend/app/api/briefing.py:25, backend/app/services/briefing_service.py:106", fe="fetchDailyBriefing",
        desc="카테고리 4개(harness, mcp_plugins_skills, agent_tech, ai_news)별 상위 기사 최대 3건. 저장·캐시 없이 부를 때마다 만든다. LLM 호출 없음. date 는 '%Y년 %m월 %d일'.",
        extra={"500": resp("명시 분기 없음 (전역 처리)", E_GLOBAL)}),
    ("post", "/api/briefing/generate"): dict(code="backend/app/api/briefing.py:40", fe="없음", desc="GET /api/briefing/today 와 같은 함수·같은 응답. 저장된 브리핑이 없어 '재생성' 의미가 없다."),
    ("post", "/api/briefing/export/notion"): dict(code="backend/app/api/briefing.py:55, backend/app/services/notion_service.py:208", fe="exportBriefingToNotion",
        desc="본문 생략 가능. api_key·page_id 가 null 이면 settings.NOTION_API_KEY·NOTION_PAGE_ID. page_id 는 URL·하이픈 섞인 ID 를 clean_id 로 정리. Notion API(https://api.notion.com/v1) POST /pages 로 페이지 생성.",
        extra={"400": resp("키 없음, 부모 페이지 없음, Notion API 오류, 네트워크 오류 모두 {detail: <서비스 메시지>}", E_HTTP)}),
    ("post", "/api/briefing/send/email"): dict(code="backend/app/api/briefing.py:75, backend/app/services/email_service.py:226", fe="sendBriefingByEmail",
        desc="본문 생략 가능. SMTP 설정은 항상 settings(config.json). to_email null → settings.SMTP_TO (쉼표 등으로 여러 명, _parse_recipients). subject null → '[AgentLens] 오늘의 AI 브리핑 - <date>'. smtplib 은 asyncio.to_thread 로 돈다.",
        extra={"400": resp("SMTP 호스트 미설정, 수신자 없음, 인증 실패, 연결 실패, 기타 발송 오류", E_HTTP)}),
    ("post", "/api/briefing/test/notion"): dict(code="backend/app/api/briefing.py:95, backend/app/services/notion_service.py:33", fe="testNotionConnection", ok=ref("SuccessMessageResponse"),
        desc="토큰 인증과 (주어지면) 페이지 접근 권한 확인. 성공 message: 'Notion 연동 성공! (연결된 통합: <bot>)'.",
        extra={"400": resp("토큰 없음, 인증 실패, 페이지 권한 오류, 네트워크 오류", E_HTTP)}),
    ("post", "/api/briefing/test/email"): dict(code="backend/app/api/briefing.py:102, backend/app/services/email_service.py:180", fe="testEmailConnection", ok=ref("SuccessMessageResponse"),
        desc="요청자가 준 SMTP 호스트·포트로 접속·인증하고 테스트 메일을 실제로 보낸다. 값이 null 이면 settings 값. to_email 이 없고 SMTP_TO 도 없으면 smtp_user 가 이메일 형식일 때 그 주소.",
        extra={"400": resp("호스트 없음, 수신자 없음, 인증·연결 실패 등", E_HTTP)}),
    ("get", "/api/briefing/settings"): dict(code="backend/app/api/briefing.py:116", fe="fetchBriefingSettings", ok=ref("BriefingSettingsResponse")),
    ("post", "/api/briefing/settings"): dict(code="backend/app/api/briefing.py:161", fe="updateBriefingSettings", ok=ref("SuccessMessageResponse"),
        desc="null 필드는 건드리지 않는다. notion_api_key·smtp_password 가 '***' 이면 무시. notion_auto_export 를 주면 notion.enabled = auto_export or api_key 있음, email_auto_send 를 주면 email.enabled = auto_send or smtp_host 있음. 웹훅 URL·SMTP 값 검증 없음. config.json 전체를 indent=2 로 다시 쓰고 settings.reload(). dict(settings.raw_json_config) 는 얕은 복사라 저장 전에 메모리 설정의 중첩 값이 먼저 바뀐다.",
        extra={"500": resp('{"detail": "설정 파일(config.json) 저장에 실패했습니다."}', E_HTTP)}),
    ("get", "/api/trends/radar"): dict(code="backend/app/api/trends.py:6, backend/app/services/trend_service.py:40", fe="fetchTechRadar", ok=ref("TechRadarResponse")),
    ("post", "/api/webhook/test"): dict(code="backend/app/api/webhook.py:19, backend/app/services/webhook_service.py:17", fe="testWebhook", ok=ref("SuccessMessageResponse"),
        desc="webhook_url 은 'http' 로 시작해야 한다(그 밖의 검증 없음). provider auto 면 URL 로 판별(slack.com → slack, discord.com/discordapp.com → discord, 그 밖 generic). 그 밖 값은 그대로 쓰고 slack/discord 가 아니면 generic 페이로드. 대상에 HTTP POST(타임아웃 8초). 200/204 가 아니면 실패이고 메시지에 응답 본문 앞 100자.",
        extra={"400": resp("'유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.' 또는 전송 실패 메시지", E_HTTP)}),
    ("post", "/api/webhook/send-briefing"): dict(code="backend/app/api/webhook.py:28", fe="sendBriefingToWebhook", ok=ref("SuccessMessageResponse"),
        desc="provider 는 받기만 하고 쓰지 않는다(항상 URL 로 판별). 페이로드 executive_summary = headline + markdown_report 앞 600자 + '...', top_highlights = [].",
        extra={"400": resp("URL 형식, 전송 실패", E_HTTP)}),
    ("get", "/api/sources"): dict(code="backend/app/api/sources.py:22", fe="fetchSources", ok=ref("SourcesListResponse"),
        desc="파일을 못 읽으면 내장 기본 소스(_default_sources). 파일이 없으면 기본 경로의 상위 디렉터리를 mkdir."),
    ("post", "/api/sources/rss"): dict(code="backend/app/api/sources.py:49, backend/app/services/sources_service.py:195", fe="addRssSource", ok=ref("AddRssResponse"),
        desc="같은 URL(끝 / 무시)이 있으면 그 항목을 enabled=true, name·category_hint 덮어쓰기. 새 id 는 name 소문자에서 [^a-zA-Z0-9_] 를 _ 로 바꾼 값 (중복 방지 없음). URL 형식·category_hint·country 검증 없음. save_sources 실패(False)를 확인하지 않아 성공으로 응답한다.",
        extra={"400": resp('{"detail": "Name and URL are required"} (빈 문자열)', E_HTTP)}),
    ("post", "/api/sources/github"): dict(code="backend/app/api/sources.py:64, backend/app/services/sources_service.py:222", fe="없음", ok=ref("AddGitHubRepoResponse"),
        desc="같은 repo(대소문자 무시)가 있으면 enabled=true, category 덮어쓰기. owner/repo 형식 검증 없음.",
        extra={"400": resp('{"detail": "Repository is required"}', E_HTTP)}),
    ("patch", "/api/sources/{source_type}/{item_id}/toggle"): dict(code="backend/app/api/sources.py:77, backend/app/services/sources_service.py:169", fe="toggleSource", ok=ref("StatusMessageResponse"),
        desc="source_type: rss(item_id 는 피드 id 또는 url), github_repo(item_id 는 repo), github·reddit·hackernews·arxiv·huggingface(유형 전체 토글, item_id 무시). 경로 선언은 {item_id:path} 라 item_id 에 '/' 가 들어간다 (owner/repo, URL id). OpenAPI 경로 문자열에는 :path 가 나타나지 않는다.",
        extra={"404": resp('{"detail": "Source not found or invalid type"}', E_HTTP)}),
    ("delete", "/api/sources/{source_type}/{item_id}"): dict(code="backend/app/api/sources.py:85, backend/app/services/sources_service.py:245", fe="deleteSource", ok=ref("StatusMessageResponse"),
        desc="rss(id 또는 url 일치 항목 모두), github_repo(repo 일치)만 지원. 경로 선언은 {item_id:path} 라 item_id 에 '/' 가 들어간다.",
        extra={"404": resp('{"detail": "Source not found or failed to delete"} (그 밖의 유형 포함)', E_HTTP)}),
    ("post", "/api/research/inspect-url"): dict(code="backend/app/api/research.py:24, backend/app/services/source_researcher.py:179", fe="inspectUrl", ok=ref("InspectUrlResponse"),
        desc="http(s):// 가 없으면 https:// 를 붙인다. GitHub 저장소 URL 이면 releases.atom 먼저. XML 이면 피드로, HTML 이면 <link rel=alternate> 탐지. 점수는 동기 휴리스틱 evaluate_quality_and_signal (LLM 없음). 서버가 요청자 URL 로 GET(리다이렉트 따라감, 타임아웃 10초/8초).",
        extra={"400": resp('{"detail": "URL is required"} (빈 문자열)', E_HTTP)}),
    ("post", "/api/research/discover"): dict(code="backend/app/api/research.py:35, backend/app/services/source_researcher.py:331", fe="discoverSources (정의만 있고 호출처 없음)", ok=ref("DiscoverResponse"),
        desc="코드 안 CURATED_ECOSYSTEM_CATALOG 에서 고른다(외부 탐색 없음). query 는 이름·설명·카테고리·태그 부분 일치(소문자), category 는 category_hint 일치. limit 상한 없음, 0 이면 8 (req.limit or 8)."),
    ("post", "/api/research/register-candidate"): dict(code="backend/app/api/research.py:48, backend/app/services/source_researcher.py:385", fe="registerCandidate (정의만 있고 호출처 없음)", ok=ref("RegisterCandidateResponse"),
        desc="sources_service.add_rss_source 재사용.",
        extra={"400": resp('{"detail": "name과 feed_url은 필수입니다."} (빈 문자열)', E_HTTP)}),
    ("get", "/api/research/status"): dict(code="backend/app/api/research.py:62, backend/app/services/deep_researcher.py:147", fe="fetchDeepResearchStatus", ok=ref("DeepResearchStatusResponse")),
    ("get", "/api/research/audit-logs"): dict(code="backend/app/api/research.py:67, backend/app/services/deep_researcher.py:156", fe="fetchResearchAuditLogs", ok=ref("ResearchAuditLogsResponse"),
        desc="source_research_logs 를 created_at 내림차순. limit 범위 제약 없음."),
    ("post", "/api/research/run-deep"): dict(code="backend/app/api/research.py:77", fe="triggerDeepResearch", ok=ref("RunDeepResponse"),
        desc="max_candidates 는 본문이 아니라 쿼리(범위 제약 없음). asyncio.create_task 로 run_deep_research 를 띄운다(태스크 참조를 보관하지 않음). 후보는 최근 기사에서 뽑은 외부 도메인을 먼저, 시드 사이트를 뒤에 두고 앞에서 max_candidates 개만 평가한다. 피드 탐지 HTTP 요청, 휴리스틱 평가, AUTO_ADOPTED 면 sources.json 에 RSS 자동 추가, source_research_logs INSERT. is_running 은 finally 로 해제 (backend/app/services/deep_researcher.py:376-496)."),
    ("get", "/api/chat/sources/{source_id}"): dict(code="backend/app/api/chat.py:49, backend/app/services/chat_service.py:86", fe="없음 (ChatWorkspace.tsx 가 직접 fetch)",
        desc="날짜는 isoformat 문자열. full_content·scraped_at 포함.",
        extra=chat_errs([(404, "ERR_HANDOVER_SOURCE_NOT_FOUND: 해당 id 의 뉴스 없음")])),
    ("get", "/api/chat/search"): dict(code="backend/app/api/chat.py:66, backend/app/services/chat_service.py:127", fe="없음",
        desc="SQLite FTS5(BM25)·품질·최신성 점수로 청크를 미리 보여준다. category·time_range·sort 는 ChatFocusFilter 리터럴이어야 하는데 쿼리 스키마는 자유 문자열이라, 리터럴 밖 값은 500 ERR_RETRIEVER_INDEX_ERROR 가 된다. 부수 효과: news_fts·트리거가 없으면 만들고 rebuild, 색인 행 수가 news_items 보다 적으면 rebuild 하고 커밋한다 (backend/app/services/retriever.py:62) — GET 이 스키마를 바꿀 수 있다.",
        extra=chat_errs([(400, "ERR_SEARCH_QUERY_TOO_SHORT: q 가 없거나 공백 제거 후 2자 미만"), (500, "ERR_RETRIEVER_INDEX_ERROR: 그 밖의 모든 예외(필터 리터럴 오류 포함), details.error 에 예외 문자열")])),
    ("post", "/api/chat/query"): dict(code="backend/app/api/chat.py:125, backend/app/services/chat_service.py:478", fe="없음",
        body="ChatQueryRequest",
        desc="scoped 면 기사 본문(full_content, 없으면 스크래핑해 news_items 갱신)을 단일 출처로. global 이면 ReAct 계획(_plan_react_action, 도메인 신호가 있으면 haiku LLM 호출)으로 검색 여부를 정하고 FTS5 결과를 후보로 쓴다. 답변 뒤 global 은 [N] 인용·제목 토큰이 등장한 출처만 남긴다. 대화 세션에 저장하지 않는다 (/stream 과 다르다).",
        extra=chat_errs([
            (400, "ERR_INVALID_PAYLOAD: 본문이 JSON 이 아님"), (400, "ERR_CHAT_PAYLOAD_EMPTY: question 이 문자열이 아니거나 비어 있음"),
            (400, "ERR_CHAT_PAYLOAD_TOO_LARGE: 2000자 초과"), (400, "ERR_INVALID_SCOPE_PARAM: scope 값 오류"),
            (404, "ERR_HANDOVER_SOURCE_NOT_FOUND: scoped 인데 source_id 가 없거나 기사가 없음"),
            (401, "ERR_CLAUDE_API_KEY_MISSING: Anthropic 키 없음·인증 실패"),
            (429, "ERR_CLAUDE_QUOTA_EXCEEDED (분기는 있으나 generate_live_answer 가 Anthropic 429 를 LLMQuotaExceededException 으로 바꿔 실제로는 ERR_LLM_QUOTA_EXCEEDED 가 나갈 것으로 보임)"),
            (429, "ERR_LLM_QUOTA_EXCEEDED: Anthropic/OpenAI 429"),
            (529, "ERR_CLAUDE_OVERLOADED: Anthropic 503/529"),
            (503, "ERR_LLM_PROVIDER_UNAVAILABLE: 쓸 수 있는 LLM 없음 (원인은 서버 로그 WARNING 에만)"),
            (502, "ERR_LLM_UPSTREAM_FAILED: 모든 프로바이더 호출 실패"),
            (500, "ERR_SERVER_INTERNAL: 그 밖의 예외. model_tier·filters·top_k·history 검증 실패도 여기 (400 아님). details.error 에 예외 문자열"),
        ])),
    ("post", "/api/chat/stream"): dict(code="backend/app/api/chat.py:277, backend/app/services/chat_service.py:576", fe="없음 (ChatWorkspace.tsx 가 상대 경로로 직접 fetch → Next rewrite 경유)",
        body="ChatStreamRequest", desc=SSE_CHAT, sse_chat=True,
        extra={**chat_errs([
            (400, "ERR_INVALID_PAYLOAD: 본문이 JSON 이 아님·객체가 아님·model_tier 밖의 필드 검증 실패(filters, top_k, history, user_message_id·assistant_message_id 1~36자·서로 다름), details null"),
            (400, "ERR_CHAT_PAYLOAD_EMPTY / ERR_CHAT_PAYLOAD_TOO_LARGE / ERR_INVALID_SCOPE_PARAM"),
            (400, "ERR_INVALID_MODEL_TIER: model_tier 가 haiku·sonnet·opus 가 아님 (backend/app/api/chat.py:333-345). 모든 400 은 스트림을 열기 전, scoped 기사 확인·LLM 가용성 확인보다 먼저"),
            (404, "ERR_HANDOVER_SOURCE_NOT_FOUND: scoped 인데 source_id 없음·기사 없음 (스트림 열기 전)"),
            (503, "ERR_LLM_PROVIDER_UNAVAILABLE: check_provider_available() 실패 (스트림 열기 전)"),
            (401, "ERR_CLAUDE_API_KEY_MISSING (분기만 있음, check_provider_available 은 LLMProviderUnavailableException 만 던진다)"),
            (429, "ERR_CLAUDE_QUOTA_EXCEEDED / ERR_LLM_QUOTA_EXCEEDED (분기만 있음)"),
            (529, "ERR_CLAUDE_OVERLOADED (분기만 있음)"),
            (502, "ERR_LLM_UPSTREAM_FAILED (분기만 있음)"),
        ]), "500": resp("ValidationError 밖의 처리하지 않은 예외만 전역 처리 (요청 모델 검증 실패는 400)", E_GLOBAL)}),
    ("get", "/api/chat/sessions"): dict(code="backend/app/api/chat.py:444, backend/app/services/chat_session_service.py:58", fe="없음 (useChatSessions.ts 가 직접 fetch)",
        desc="updated_at 내림차순. 배열만 주고 전체 개수는 주지 않는다. last_message_preview 는 마지막 메시지 앞 100자.",
        extra=chat_errs([(500, "ERR_SERVER_INTERNAL: 예외 메시지를 message 에 붙인다")])),
    ("post", "/api/chat/sessions"): dict(code="backend/app/api/chat.py:465, backend/app/services/chat_session_service.py:213", fe="없음 (useChatSessions.ts:234 가 직접 fetch, ChatWorkspace.tsx saveTurn 에서 턴마다 한 번)",
        body="ChatSessionCreateRequest", body_required=False,
        desc="id 가 있으면 업서트(갱신이어도 201). id 는 uuid.UUID() 로 파싱 가능해야 한다. messages 중 DB 에 이미 있는 id(다른 세션 것 포함)와 같은 요청 안 중복 id 는 건너뛰고 나머지만 INSERT 하며 model_tier·usage 는 저장하지 않는다 (backend/app/services/chat_session_service.py:327-338). 응답은 populate_existing 으로 다시 읽은 갱신 뒤 상태. 세션이 30개를 넘으면 updated_at 이 가장 오래된 세션부터 삭제(FIFO).",
        extra=chat_errs([(400, "ERR_SESSION_INVALID_UUID: 본문 JSON 오류·모델 검증 실패·UUID 형식 오류 모두"), (500, "ERR_SESSION_CREATE_FAILED: 그 밖의 예외(예외 메시지를 message 에 붙인다)")])),
    ("get", "/api/chat/sessions/{session_id}"): dict(code="backend/app/api/chat.py:518, backend/app/services/chat_session_service.py:100", fe="없음 (useChatSessions.ts 가 직접 fetch)",
        desc="메시지는 created_at 오름차순. sources_json·usage_json·active_filters_json 은 파싱하고 실패하면 null. session_id 형식 검증 없음.",
        extra=chat_errs([(404, "ERR_SESSION_NOT_FOUND"), (500, "ERR_SERVER_INTERNAL")])),
    ("delete", "/api/chat/sessions/{session_id}"): dict(code="backend/app/api/chat.py:547, backend/app/services/chat_session_service.py:282", fe="없음 (useChatSessions.ts 가 직접 fetch)",
        desc="ORM cascade='all, delete-orphan' 로 하위 메시지까지 삭제. 성공 message 고정: '대화 세션 및 하위 메시지가 원자적으로 영구 삭제되었습니다.', deleted_count 1.",
        extra=chat_errs([(404, "ERR_SESSION_NOT_FOUND"), (500, "ERR_SESSION_DELETE_FAILED")])),
}

seen = set()
for path, item in spec["paths"].items():
    for method, op in item.items():
        key = (method, path)
        seen.add(key)
        sup = OPS.get(key)
        if sup is None:
            raise SystemExit(f"보충 정의 없음: {key}")
        diff = []
        op["x-agentlens-code"] = sup["code"]
        op["x-agentlens-frontend"] = sup["fe"]
        if sup.get("tags"):
            op["tags"] = sup["tags"]
            diff.append("tags 추가 (자동 생성에는 태그 없음)")
        if sup.get("desc"):
            base = op.get("description", "")
            op["description"] = (base + "\n\n---\n[보충]\n" if base else "[보충]\n") + sup["desc"]
            diff.append("description 보충")
        ok = op["responses"].setdefault("200" if "201" not in op["responses"] else "201", {})
        if sup.get("ok"):
            ok["content"] = json_content(sup["ok"])
            ok.update(SUP)
            diff.append("성공 응답 스키마 보충 (자동 생성은 빈 스키마 {})")
        if sup.get("sse"):
            ok["content"] = {"text/event-stream": {"schema": {"type": "string", "description": "data: <NewsAskStreamEvent JSON>\\n\\n 의 연속"}, "x-agentlens-event-schema": ref(sup["sse"])}}
            ok.update(SUP)
            diff.append("200 content 를 text/event-stream 으로 교체 (자동 생성은 application/json)")
        if sup.get("sse_chat"):
            ok["content"] = {"text/event-stream": {"schema": {"type": "string", "description": "event: <status|sources|token|done|error>\\ndata: <JSON>\\n\\n 의 연속"},
                "x-agentlens-event-schemas": {"status": ref("ChatStatusPayload"), "sources": ref("ChatSourcesPayload"), "token": obj({"token": S}, ["token"]), "done": ref("DonePayload"), "error": ref("StreamErrorPayload")}}}
            ok.update(SUP)
            diff.append("200 content 를 text/event-stream 으로 교체하고 이벤트별 data 스키마 추가")
        if sup.get("xml"):
            ok["content"] = {"application/xml": {"schema": {"type": "string", "description": "RSS 2.0 XML"}}}
            ok.update(SUP)
            diff.append("200 content 를 application/xml 로 교체")
        if sup.get("body"):
            op["requestBody"] = {"required": sup.get("body_required", True), "content": json_content(ref(sup["body"])), **SUP}
            diff.append(f"requestBody 추가 ({sup['body']}, 라우터가 request.json() 으로 직접 읽어 자동 생성에 없음)")
        if sup.get("extra"):
            for code, r in sup["extra"].items():
                op["responses"][code] = r
            diff.append("오류 응답 추가: " + ", ".join(sorted(sup["extra"].keys())))
        op["x-agentlens-diff"] = diff or ["없음 (자동 생성 그대로)"]

missing = set(OPS) - seen
if missing:
    raise SystemExit(f"앱에 없는 경로: {missing}")

# 공통: 모든 operation 은 처리하지 않은 예외 시 전역 500 이 날 수 있다 (명시하지 않은 곳 포함)
spec["info"]["description"] = (
    "AgentLens backend REST API (FastAPI). 기준: v0.4.1 (main), Updated: 2026-11-09.\n\n"
    "이 파일은 `app.openapi()` (FastAPI 0.162.2 자동 생성, 런타임 `/openapi.json` 과 같은 내용)를 뽑은 뒤 코드에서 확인한 사실을 보충한 것이다.\n"
    "- 자동 생성과 다른 곳: 추가·교체한 응답·요청 본문·컴포넌트에는 `x-agentlens-supplemented: true`, 각 operation 에는 `x-agentlens-diff` 목록을 단다.\n"
    "- `x-agentlens-code`: 라우터·서비스 위치 (path:line). `x-agentlens-frontend`: frontend/src/lib/api.ts 호출 함수나 직접 fetch 위치.\n"
    "- 인증 없음. CORS allow_origins=['*'], allow_credentials=True (backend/app/main.py:50).\n"
    "- 오류 형식이 라우터마다 다르다: HTTPExceptionDetail {detail}, FastAPI 422 HTTPValidationError, chat ErrorResponse {error_code, message, details}, 전역 500 GlobalErrorResponse {detail, error}. 처리하지 않은 예외는 어느 operation 에서든 GlobalErrorResponse 500 이 된다 (명시하지 않은 곳 포함).\n"
    "- 설계 문서: docs/system-designer/01_SYSTEM_DESIGN.md"
)
spec["info"]["x-agentlens-supplemented"] = True
spec["servers"] = [{"url": "http://localhost:8000", "description": "backend (uvicorn app.main:app, BACKEND_PORT 기본 8000)", **SUP},
                   {"url": "http://localhost:3000", "description": "frontend Next rewrite (/api/:path* → INTERNAL_API_URL). / 와 /health 는 프록시하지 않는다", **SUP}]
spec["tags"] = [
    {"name": "News", "description": "뉴스 목록·단건·Ask AI(동기·SSE)·RSS. 라우터 backend/app/api/news.py"},
    {"name": "Chat", "description": "AI 챗 질의(동기·SSE)·코퍼스 검색·세션. 라우터 backend/app/api/chat.py. 오류는 ErrorResponse"},
    {"name": "Daily Briefing", "description": "브리핑 생성·Notion·이메일·설정. 라우터 backend/app/api/briefing.py"},
    {"name": "Schedule", "description": "수집 스케줄·진행·수동 수집·리셋. 라우터 backend/app/api/schedule.py"},
    {"name": "sources", "description": "sources.json 소스 관리. 라우터 backend/app/api/sources.py"},
    {"name": "research", "description": "URL 탐지·후보 추천·딥 리서치. 라우터 backend/app/api/research.py"},
    {"name": "trends", "description": "기술 레이더. 라우터 backend/app/api/trends.py"},
    {"name": "Webhook Dispatcher", "description": "Slack/Discord/generic 웹훅. 라우터 backend/app/api/webhook.py"},
    {"name": "Stats", "description": "뉴스 개수 통계. 라우터 backend/app/api/stats.py"},
    {"name": "MCP", "description": "MCP 서버 정보. 라우터 backend/app/api/mcp.py"},
    {"name": "System", "description": "GET /, GET /health (backend/app/main.py). 자동 생성에는 태그가 없어 보충했다", **SUP},
]

# 키 순서: openapi, info, servers, tags, paths, components
ordered = {k: spec[k] for k in ["openapi", "info", "servers", "tags", "paths", "components"] if k in spec}


class Dumper(yaml.SafeDumper):
    def ignore_aliases(self, data):
        return True


def str_presenter(dumper, data):
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


Dumper.add_representer(str, str_presenter)

header = (
    "# AgentLens OpenAPI 3.1 — docs/system-designer/02_OPENAPI_SPEC.yaml\n"
    "# Updated: 2026-11-09\n"
    "# 기준: v0.4.1 (main)\n"
    "# 생성: cd backend && PYTHONPATH=. ../.venv/bin/python ../.claude/skills/contract-specification/scripts/gen_openapi.py ../docs/system-designer/02_OPENAPI_SPEC.yaml 로 app.openapi() 를 뽑고 코드 사실을 보충했다 (lifespan 은 돌지 않는다).\n"
    "# 표시: 자동 생성(/openapi.json)과 다른 곳은 x-agentlens-supplemented: true, operation 별 x-agentlens-diff.\n"
)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(header)
    yaml.dump(ordered, f, Dumper=Dumper, allow_unicode=True, sort_keys=False, width=200)
print("ok", len(spec["paths"]), sum(len(v) for v in spec["paths"].values()), len(schemas))
