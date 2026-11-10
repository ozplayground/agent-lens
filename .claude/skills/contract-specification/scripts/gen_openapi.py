"""FastAPI 자동 생성 스키마(app.openapi())에 코드 사실을 보충해 docs/system-designer/02_OPENAPI_SPEC.yaml 을 만든다.

사용 (저장소 루트에서): cd backend && PYTHONPATH=. ../.venv/bin/python ../.claude/skills/contract-specification/scripts/gen_openapi.py ../docs/system-designer/02_OPENAPI_SPEC.yaml
- lifespan 은 돌지 않는다 (app.openapi() 는 시작 이벤트를 부르지 않는다).
- info.version 은 settings.VERSION (환경 변수 VERSION > config.json app.version). 릴리스 버전 bump 전에 뽑으면 앞에 VERSION=<새 버전> 을 붙인다.
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
    chat_schemas.ChatSessionCreateRequest,
    chat_schemas.ChatMessageHistory,
    chat_schemas.ErrorResponse,
    chat_schemas.ChatStatusPayload,
    chat_schemas.ChatSourcesPayload,
    chat_schemas.StreamErrorPayload,
    chat_schemas.DonePayload,
]:
    add_model(m)

schemas["ChatStreamRequest"]["properties"]["model"]["description"] = (
    "기본값 없음(null). 명시 model > model_tier > 기본 챗 모델(settings.ANTHROPIC_DEFAULT_CHAT_MODEL) 순으로 고른다. "
    "값 검증 없음. 'gemini' 포함이면 Gemini, 'gpt'/'openai' 포함이면 OpenAI 로 보낸다."
)
schemas["ChatStreamRequest"]["description"] = (
    "POST /api/chat/stream 본문. 라우터가 request.json() 으로 직접 읽은 뒤 ChatStreamRequest(**body) 로 만든다 "
    "(backend/app/api/chat.py:70-106). 그래서 자동 생성 스키마에 requestBody 가 없다. "
    "검증 실패는 400: model_tier 오류면 ERR_INVALID_MODEL_TIER, 그 밖(본문이 객체 아님, filters·top_k·history, 메시지 id 길이·같은 값)은 ERR_INVALID_PAYLOAD (details null). "
    "session_id 가 있는데 UUID 가 아니면 400 ERR_SESSION_INVALID_UUID (입력값 echo 없음), 생략·null 이면 서버가 만든다. "
    "user_message_id·assistant_message_id 는 프론트가 만든 이 턴의 메시지 id 로, 서버가 그 id 로 턴을 저장한다."
)
schemas["ChatSessionCreateRequest"]["description"] = (
    "POST /api/chat/sessions 본문. request.json() 으로 읽고 ChatSessionCreateRequest(**body) 로 만든다. "
    "JSON 오류·객체 아님·필드 오류는 400 ERR_INVALID_PAYLOAD(필드 오류는 details [{loc, msg}]), id 가 UUID 가 아니면 400 ERR_SESSION_INVALID_UUID, "
    "messages 에 다른 세션의 id 가 있으면 400 ERR_INVALID_PAYLOAD details {message_ids: [...]}."
)
for n, d in {
    "ChatStatusPayload": "SSE event: status 의 data 모양. stream_chat 은 dict 를 직접 json.dumps 한다. step 은 ChatStatusStep 4값(thinking, tool_calling, extracting_source, synthesizing, backend/app/schemas/chat.py:53-59)이고 label 에 이모지가 없다. timestamp 는 UTC 오프셋이 붙은 ISO.",
    "ChatSourcesPayload": "SSE event: sources 의 data 모양. 스트림은 dict 로 만든다. supplementary_count 는 항상 0, 모든 출처 type 은 primary, publisher 는 null. sources[].published_at 은 UTC 오프셋이 붙은 ISO (iso_utc).",
    "StreamErrorPayload": "SSE event: error 의 data 모양. error_code·status_code·step: ERR_LLM_UPSTREAM_FAILED·502·thinking(질문 분석 실패), ERR_RETRIEVER_INDEX_ERROR·500·tool_calling(기사 검색 실패), ERR_LLM_STREAM_FAILED·502·synthesizing(토큰 생성 중 실패). retryable 은 항상 true. 예외 문자열은 싣지 않는다.",
    "DonePayload": "SSE event: done 의 data 모양. 스트림은 dict 로 만든다. usage 는 이 스트림에서 잰 토큰 사용량(요청끼리 공유하지 않는다), 없으면 null.",
    "ErrorResponse": "모든 API 의 오류 본문 {error_code, message, details}. details 는 객체·배열·null (요청 검증 실패는 [{loc, msg}]). 상태별 기본 코드: 400 ERR_INVALID_PAYLOAD, 404 ERR_NOT_FOUND, 405 ERR_METHOD_NOT_ALLOWED, 409 ERR_CONFLICT, 500 ERR_SERVER_INTERNAL, 502 ERR_UPSTREAM_FAILED, 503 ERR_SERVICE_UNAVAILABLE (backend/app/api/errors.py). 422 는 쓰지 않는다.",
}.items():
    schemas[n]["description"] = d
# ErrorResponse.details 는 객체·배열·null (Pydantic 모델은 dict 만 적었지만 라우터·전역 처리기는 배열도 보낸다)
schemas["ErrorResponse"]["properties"]["details"] = {
    "anyOf": [{"type": "object"}, {"type": "array", "items": {"type": "object", "properties": {"loc": {"type": "array"}, "msg": {"type": "string"}}}}, {"type": "null"}],
}
schemas["ErrorResponse"]["required"] = ["error_code", "message", "details"]
for name in ["HTTPValidationError", "ValidationError"]:
    schemas.pop(name, None)
for item in spec["paths"].values():
    for op in item.values():
        op.get("responses", {}).pop("422", None)

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
schemas["CrawlProgressResponse"] = obj({
    "is_running": B, "current_source": S, "step_message": S, "items_collected": I, "items_saved": I,
    "items_filtered": I, "total_sources": I, "completed_sources": I, "last_crawl_time": NS,
}, description="collector_manager.get_progress() 그대로 (backend/app/collectors/manager.py:126). 이 프로세스의 수집만 보인다 (MCP·make collect 직접 모드 수집은 is_running false).")
schemas["ManualCollectResponse"]["description"] = (
    "POST /api/schedule/trigger 응답 (response_model, response_model_exclude_unset, backend/app/schemas/news.py:149-156). 두 경우 모두 HTTP 200. "
    "already_running 은 이 프로세스가 수집 중이거나 다른 프로세스(MCP 서버·make collect)가 수집 잠금 <db>.crawl.lock 을 쥐었을 때 (collector_manager.is_busy). "
    "그때 total_collected·total_saved 는 이 프로세스의 메모리 카운터."
)
schemas["ManualCollectResponse"]["properties"]["other_process"]["description"] = (
    "already_running 일 때만 싣는다 (started 에는 키가 없다). 다른 프로세스가 수집 잠금을 쥐고 있으면 true 이고 message 도 다르다. make collect API 모드는 true 면 기다리지 않고 종료 코드 1."
)
schemas["ManualCollectResponse"].update(SUP)
schemas["ResetAndCollectResponse"] = obj({
    "status": {"type": "string", "enum": ["started", "already_running"]}, "message": S, "deleted_count": I,
}, ["status", "message", "deleted_count"], "already_running(이 프로세스 수집 중, 또는 수집 잠금을 못 쥠)이면 아무것도 지우지 않고 deleted_count 0.")
schemas["SuccessMessageResponse"] = obj({"success": {"type": "boolean", "const": True}, "message": S}, ["success", "message"])
schemas["BriefingSettingsResponse"] = obj({
    "title": S, "auto_dispatch_hour": I,
    "notion": obj({"enabled": B, "has_api_key": B, "masked_api_key": {"type": "string", "description": "9자 이상이면 앞4 + '...' + 뒤4, 아니면 '***', 키 없으면 ''"}, "page_id": S, "auto_export": B}),
    "email": obj({"enabled": B, "smtp_host": S, "smtp_port": I, "smtp_user": S, "has_password": B, "smtp_from": S, "smtp_to": S, "use_tls": B, "auto_send": B}),
    "webhooks": obj({"slack_webhook_url": {"type": "string", "description": "마스킹 없음"}, "discord_webhook_url": {"type": "string", "description": "마스킹 없음"}, "auto_dispatch_daily_briefing": {"type": "boolean", "description": "일일 브리핑 웹훅 자동 발송을 켜고 끈다"}}),
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
schemas["RssFeed"] = obj({
    "id": {"type": "string", "description": "새 항목은 이름 슬러그. 겹치거나 영숫자가 없으면 <슬러그>_<sha1(url)[:8]> (backend/app/services/sources_service.py:35-41)"},
    "name": S, "url": S, "site_url": S,
    "category_hint": {"type": "string", "description": "POST /api/sources/rss 는 harness·mcp_plugins_skills·agent_tech·ai_news 만 받는다. 파일의 옛 항목은 검증하지 않는다"},
    "country": {"type": "string", "description": "KR 또는 GLOBAL (POST /api/sources/rss 가 검증한다)"},
    "enabled": B, "description": S, "added_at": S})
schemas["MonitoredRepo"] = obj({"repo": S, "category": S, "enabled": B, "description": S,
    "stars_hint": {"type": "integer", "description": "sources.json 에 남아 있는 옛 값. 수집기는 쓰지 않는다 (GitHub API 의 실제 별 수를 쓴다)"}, "added_at": S})
schemas["SourcesListResponse"] = obj({
    "status": {"type": "string", "const": "success"},
    "sources_file": {"type": "string", "description": "소스 파일 이름 (예: sources.json). 서버 경로는 내보내지 않는다"},
    "updated_at": NS,
    "stats": obj({"total_rss": I, "active_rss": I, "total_github_repos": I, "active_github_repos": I, "github_search_enabled": B, "reddit_enabled": B, "hackernews_enabled": B, "arxiv_enabled": B, "huggingface_enabled": B}),
    "data": {"type": "object", "description": "sources.json 전체 (version, updated_at, rss_feeds[], github_sources, reddit_sources, hackernews_sources, arxiv_sources, huggingface_sources). 구조는 01_SYSTEM_DESIGN.md '설정 파일 구조'."},
})
schemas["AddRssResponse"] = obj({"status": {"type": "string", "const": "success"}, "message": S, "source": ref("RssFeed")})
schemas["InspectUrlResponse"] = obj({
    "status": {"type": "string", "enum": ["found", "error", "not_found", "empty"], "description": "결과와 상관없이 HTTP 200"},
    "message": S, "input_url": S, "name": S, "feed_url": S, "site_url": S, "description": S, "category_hint": S,
    "relevance_score": N, "is_high_signal": B,
    "recent_posts": {"type": "array", "items": obj({"title": S, "link": S, "published": S, "snippet": S}), "description": "최대 4건"},
    "already_registered": B, "why_recommended": S,
    "type": {"type": "string", "description": "GitHub 저장소면 'atom'"},
    "source_kind": {"type": "string", "description": "GitHub 저장소면 'github_releases'"},
}, ["status"], "status 별 필드: found → name·feed_url·site_url·description·category_hint·relevance_score·is_high_signal·recent_posts·already_registered·why_recommended; error → message·input_url 또는 feed_url; not_found → message·input_url; empty → message·feed_url.")
schemas["DeepResearchStatusResponse"] = obj({
    "is_running": B, "last_run_time": NS, "auto_adopted_count": I,
    "last_run_summary": {"type": "object", "description": "성공 {evaluated_total, auto_adopted, adopt_failed, completed_at, results[]} (adopt_failed: 채택 기준을 넘었으나 sources.json 저장에 실패해 WATCHLIST 로 둔 후보 수), 실패 {status: 'error', error: <예외 클래스 이름>, completed_at}, 실행 전 {} (backend/app/services/deep_researcher.py:395-402, :512-518)"},
    "cadence": {"type": "string", "const": "Every 12 hours (03:00, 15:00 UTC) + On-demand"},
})
schemas["ResearchAuditLog"] = obj({
    "id": I, "source_name": S, "site_url": S, "feed_url": S, "category": S, "relevance_score": N,
    "verdict": {"type": "string", "enum": ["AUTO_ADOPTED", "WATCHLIST", "REJECTED", "ALREADY_MONITORED"]},
    "verdict_reason": S, "analyzed_articles_count": I, "created_at": {"type": ["string", "null"], "description": "UTC 오프셋이 붙은 ISO (iso_utc)"},
})
schemas["ResearchAuditLogsResponse"] = obj({"status": {"type": "string", "const": "success"}, "total": {"type": "integer", "description": "이번에 돌려준 개수"}, "logs": {"type": "array", "items": ref("ResearchAuditLog")}}, description="DB 오류는 로그만 남기고 logs: [] 로 돌려준다.")
schemas["RunDeepResponse"] = obj({"status": {"type": "string", "enum": ["started", "already_running"]}, "message": S, "max_candidates": I}, ["status", "message"], "already_running 이면 max_candidates 가 없다.")
schemas["NewsAskStreamEvent"] = {
    "description": "POST /api/news/{news_id}/ask/stream 의 data JSON. event: 줄 없이 'data: <JSON>\\n\\n' 만 보낸다. 종류는 JSON 의 event 필드.",
    "oneOf": [
        obj({"event": {"type": "string", "const": "meta"}, "model": {"type": "string", "description": "캐시 적중이면 '<model> (캐시됨)'"}}, ["event", "model"]),
        obj({"event": {"type": "string", "const": "token"}, "text": S}, ["event", "text"]),
        obj({"event": {"type": "string", "const": "done"}, "total_text": S}, ["event", "total_text"]),
        obj({"event": {"type": "string", "const": "error"}, "error_code": {"type": "string", "const": "ERR_LLM_STREAM_FAILED"}, "message": {"type": "string", "const": "답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요."}, "retryable": {"type": "boolean", "const": True}}, ["event", "error_code", "message", "retryable"]),
    ],
    **SUP,
}

# ---------------------------------------------------------------- operation 보충
# 오류 본문은 모두 ErrorResponse 다 (v0.4.2). HTTPException 은 상태별 기본 코드, 처리 못 한 예외는 500 ERR_SERVER_INTERNAL
E_CHAT = json_content(ref("ErrorResponse"))
E_HTTP = E_CHAT
E_GLOBAL = E_CHAT


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
프레임: `event: <종류>\\ndata: <JSON>\\n\\n` (backend/app/services/chat_service.py:441 stream_chat).
응답 헤더: Content-Type `text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.

| 이벤트 | data | 설명 |
|---|---|---|
| status | step, label, progress, timestamp, (query) | step 은 extracting_source(30), synthesizing(85/80/75), thinking(25), tool_calling(50, query 포함) 넷뿐. label 에 이모지 없음 |
| sources | sources: ChatSourceItem[], applied_filters, is_relaxed, primary_count, supplementary_count | supplementary_count 는 항상 0, type 은 모두 primary, publisher null |
| token | token | 답변 조각 |
| done | done: true, session_id, model, model_tier, sources_count, primary_count, supplementary_count, latency_ms, usage | 종료 신호. usage 는 이 스트림에서 잰 값(없으면 null) |
| error | error_code, message, status_code, step, retryable: true | thinking 실패 ERR_LLM_UPSTREAM_FAILED 502, tool_calling 실패 ERR_RETRIEVER_INDEX_ERROR 500, 토큰 생성 중 실패 ERR_LLM_STREAM_FAILED 502 (Anthropic 스트림 error·max_tokens 잘림 포함). 뒤에 done 없이 끝나고 턴을 저장하지 않는다 |

순서
- scoped: status(extracting_source,30) → status(synthesizing,85) → sources(단일 출처, full_content 포함, applied_filters null) → token* → done
- global, 검색함: status(thinking,25) → status(tool_calling,50) → status(synthesizing,80) → token* → sources(답변에 인용된 출처만, 토큰 뒤) → done
- global, 검색 안 함: status(thinking,25) → status(synthesizing,75) → token* → done (sources 없음)
- done 을 보내기 직전에 persist_turn 으로 질문·답변 두 메시지를 저장한다 (user_message_id·assistant_message_id 가 있으면 그 id, 이 세션에 이미 있는 id 는 건너뜀, 다른 세션의 id 면 저장하지 않고 로그만). done 이 마지막 이벤트다.
"""

SSE_NEWS = """\
프레임: `event:` 줄 없이 `data: <JSON>\\n\\n` (backend/app/api/news.py). 종류는 JSON 의 event 필드 (NewsAskStreamEvent).
응답 헤더: `text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
순서: meta → token* → done. 토큰 전에 Anthropic 이 실패하면 OpenAI, 그다음 휴리스틱(이모지 없는 규칙 답)으로 넘어간다. 엔진을 바꾸면 meta 가 다시 온다.
토큰을 보낸 뒤 실패하거나 max_tokens 로 잘리면 error 이벤트 {event: error, error_code: ERR_LLM_STREAM_FAILED, message: '답변 생성이 중간에 끊겼습니다. 다시 시도해 주세요.', retryable: true} 로 끝나고 done 은 없다 (캐시하지 않는다).
question 은 1~2000자 (AskQuestionRequest). 위반은 스트림을 열기 전에 400 ERR_INVALID_PAYLOAD.
캐시 적중이면 meta 의 model 이 '<model> (캐시됨)' 이고 답을 4단어씩 token 으로 나눠 보낸다.
"""

OPS = {
    ("get", "/"): dict(code="backend/app/main.py:64", fe="없음", ok=ref("RootResponse"), tags=["System"]),
    ("get", "/health"): dict(code="backend/app/main.py:68", fe="없음 (docker-compose healthcheck 가 curl -f 로 부른다)", ok=ref("HealthResponse"), tags=["System"]),
    ("get", "/api/news"): dict(code="backend/app/api/news.py:17, backend/app/services/news_service.py:58", fe="fetchNewsFeed",
        desc="category·source 는 소문자로 바꿔 일치 비교(all 이면 필터 없음). search 는 앞뒤 공백 제거 후 title·summary·tags·tech_stack·why_it_matters 에 ILIKE %search% (OR). sort: latest(published_at desc), top(raw_score desc), quality(quality_score desc, hotness_score desc), 그 밖의 값은 모두 hot(hotness_score desc, published_at desc). offset=(page-1)*size, total_pages=ceil(total/size) (total 0 이면 1). tags·tech_stack 은 쉼표 문자열을 배열로, tldr_bullets 는 JSON 파싱(실패 시 []), quality_score 0/NULL 은 6.0 (news_service.py:28-51). published_at·created_at 은 UTC 오프셋이 붙은 ISO 문자열 (schemas/news.py:32-36). page·size 범위 밖은 400 ERR_INVALID_PAYLOAD."),
    ("post", "/api/news/{news_id}/ask/stream"): dict(code="backend/app/api/news.py:33, backend/app/services/llm_processor.py:881", fe="askQuestionAboutNewsStream (NEXT_PUBLIC_API_URL 이 있으면 backend 직결, 없으면 같은 출처 rewrite. 직결 실패 시 상대 경로로 재시도)",
        desc=SSE_NEWS, sse="NewsAskStreamEvent",
        extra={"404": resp('404 ERR_NOT_FOUND "기사를 찾을 수 없습니다." (스트림을 열기 전에 확인)', E_HTTP), "400": resp("ERR_INVALID_PAYLOAD: question 이 없거나 1~2000자 밖, news_id 가 정수 아님 (details [{loc, msg}])", E_HTTP)}),
    ("get", "/api/news/feed/rss.xml"): dict(code="backend/app/api/news.py:66, backend/app/services/news_service.py:106", fe="없음 (Header.tsx 의 링크 href)",
        desc="published_at 내림차순 최대 50건. category 는 all 이 아니면 일치 비교 (GET /api/news 와 달리 소문자로 바꾸지 않는다). channel link 는 settings.PUBLIC_WEB_URL (config.json app.public_web_url, 기본 http://localhost:3000). 항목: title, link, description(summary, NULL 이면 빈 값), category, pubDate('%a, %d %b %Y %H:%M:%S GMT', published_at 이 NULL 이면 created_at, 그것도 없으면 지금), guid(url). 문자열은 모두 XML 이스케이프한다.",
        xml=True),
    ("get", "/api/schedule/status"): dict(code="backend/app/api/schedule.py:14, backend/app/services/news_service.py:125", fe="fetchScheduleStatus",
        desc="schedule_hours·timezone 은 config.json scheduler.crawl_hours·timezone (실제 cron 과 같은 값). next_run 은 APScheduler job daily_crawl 의 next_run_time (스케줄러가 꺼져 있으면 설정 시각으로 계산). recent_logs 는 crawl_logs 최근 5행(id desc, status 는 success·partial_failure·failed). last_crawl_time·recent_logs[].started_at·completed_at 은 UTC 오프셋이 붙은 ISO (iso_utc). is_running·last_crawl_status 는 이 프로세스의 메모리 플래그 collector_manager.is_running 으로 running/idle (다른 프로세스 수집은 보이지 않는다)."),
    ("get", "/api/schedule/progress"): dict(code="backend/app/api/schedule.py:34", fe="fetchCrawlProgress", ok=ref("CrawlProgressResponse")),
    ("post", "/api/schedule/trigger"): dict(code="backend/app/api/schedule.py:39, backend/app/collectors/manager.py:116", fe="triggerManualCollect (make collect API 모드도 부른다)",
        desc="collector_manager.is_busy() 가 거짓이면 BackgroundTasks 로 collect_all() 을 시작하고 바로 응답한다. is_busy 는 이 프로세스 플래그와 프로세스 사이 수집 잠금(<db>.crawl.lock, 비차단 flock)을 함께 본다. 수집: 외부 소스 6종 호출, 항목별 LLM 평가(DB 잠금 밖), 소스별 한 트랜잭션으로 news_items INSERT/UPDATE, 끝에 crawl_logs 1행."),
    ("post", "/api/schedule/reset-and-collect"): dict(code="backend/app/api/schedule.py:64, backend/app/services/news_service.py:137", fe="resetAndRecollect (make reset 도 curl 로 부른다)", ok=ref("ResetAndCollectResponse"),
        desc="이 프로세스가 수집 중이 아니고 수집 잠금을 쥘 수 있으면: LLM 캐시(평가·기사 질문·Ollama 판정) 비우기 → DELETE FROM news_items, DELETE FROM crawl_logs 를 한 트랜잭션으로 커밋 → 수집기 진행 카운터 초기화 → 잠금 해제 → 백그라운드 collect_all(). 잠금을 못 쥐면 아무것도 지우지 않고 already_running. 확인 절차·인증 없음. source_research_logs·chat_* 는 지우지 않는다(chat_sessions.active_source_id 는 FK 로 NULL)."),
    ("get", "/api/stats"): dict(code="backend/app/api/stats.py:9, backend/app/services/news_service.py:112", fe="fetchStats", desc="last_updated 는 데이터 갱신 시각이 아니라 응답 시각."),
    ("get", "/api/briefing/today"): dict(code="backend/app/api/briefing.py:26, backend/app/services/briefing_service.py:120", fe="fetchDailyBriefing",
        desc="분야 4개(harness, mcp_plugins_skills, agent_tech, ai_news)별 상위 기사 최대 3건. 저장·캐시 없이 부를 때마다 만든다. LLM 호출 없음. date 는 '%Y년 %m월 %d일'. categories[].name 은 프론트 긴 라벨(하네스 & 벤치마크, MCP & 생태계, 에이전트 아키텍처, 최신 AI 동향), icon 은 분야 id (이모지 아님). 헤드라인 40자·분야 요약의 제목 45자·요약 90자 한도를 넘으면 공백 경계에서 자르고 '…'. markdown_report 제목은 '# 오늘의 AI 브리핑' (이모지 없음).",
        extra={"500": resp("명시 분기 없음 (전역 처리 ERR_SERVER_INTERNAL)", E_GLOBAL)}),
    ("post", "/api/briefing/export/notion"): dict(code="backend/app/api/briefing.py:31, backend/app/services/notion_service.py:210", fe="exportBriefingToNotion",
        desc="본문 생략 가능. api_key·page_id 가 null 이면 settings.NOTION_API_KEY·NOTION_PAGE_ID. page_id 는 URL·하이픈 섞인 ID 를 clean_id 로 정리. Notion API(https://api.notion.com/v1) POST /pages 로 페이지 생성.",
        extra={"400": resp("ERR_INVALID_PAYLOAD: 키 없음, 부모 페이지 없음, Notion API 오류, 네트워크 오류 모두 message 에 서비스 메시지", E_HTTP)}),
    ("post", "/api/briefing/send/email"): dict(code="backend/app/api/briefing.py:51, backend/app/services/email_service.py:233", fe="sendBriefingByEmail",
        desc="본문 생략 가능. SMTP 설정은 항상 settings(config.json). to_email null → settings.SMTP_TO (쉼표 등으로 여러 명, _parse_recipients). subject null → '[AgentLens] 오늘의 AI 브리핑 - <date>'. HTML 본문은 값을 이스케이프하고 http(s) 링크만 건다. smtplib 은 asyncio.to_thread 로 돈다.",
        extra={"400": resp("ERR_INVALID_PAYLOAD: SMTP 호스트 미설정, 수신자 없음, 인증 실패, 연결 실패, 기타 발송 오류", E_HTTP)}),
    ("post", "/api/briefing/test/notion"): dict(code="backend/app/api/briefing.py:71, backend/app/services/notion_service.py:35", fe="testNotionConnection", ok=ref("SuccessMessageResponse"),
        desc="토큰 인증과 (주어지면) 페이지 접근 권한 확인. 성공 message: 'Notion 연동 성공! (연결된 통합: <bot>)'.",
        extra={"400": resp("ERR_INVALID_PAYLOAD: 토큰 없음, 인증 실패, 페이지 권한 오류, 네트워크 오류", E_HTTP)}),
    ("post", "/api/briefing/test/email"): dict(code="backend/app/api/briefing.py:78, backend/app/services/email_service.py:187", fe="testEmailConnection", ok=ref("SuccessMessageResponse"),
        desc="요청자가 준 SMTP 호스트·포트로 접속·인증하고 테스트 메일을 실제로 보낸다. 값이 null 이면 settings 값. to_email 이 없고 SMTP_TO 도 없으면 smtp_user 가 이메일 형식일 때 그 주소.",
        extra={"400": resp("ERR_INVALID_PAYLOAD: 호스트 없음, 수신자 없음, 인증·연결 실패 등", E_HTTP)}),
    ("get", "/api/briefing/settings"): dict(code="backend/app/api/briefing.py:92", fe="fetchBriefingSettings", ok=ref("BriefingSettingsResponse")),
    ("post", "/api/briefing/settings"): dict(code="backend/app/api/briefing.py:136, backend/app/config.py:178", fe="updateBriefingSettings", ok=ref("SuccessMessageResponse"),
        desc="null 필드는 건드리지 않는다. notion_api_key·smtp_password 가 '***' 이면 무시. notion_auto_export 를 주면 notion.enabled = auto_export or api_key 있음, email_auto_send 를 주면 email.enabled = auto_send or smtp_host 있음. 웹훅 URL·SMTP 값 검증 없음. settings.raw_json_config 의 깊은 사본을 고쳐 config.json.tmp 에 쓰고 replace 로 바꾼 뒤(OSError 면 제자리 쓰기) settings.reload(). 저장이 실패하면 메모리 설정은 바뀌지 않는다.",
        extra={"500": resp('ERR_SERVER_INTERNAL "설정 파일(config.json) 저장에 실패했습니다."', E_HTTP)}),
    ("get", "/api/trends/radar"): dict(code="backend/app/api/trends.py:6, backend/app/services/trend_service.py:40", fe="fetchTechRadar", ok=ref("TechRadarResponse")),
    ("post", "/api/webhook/test"): dict(code="backend/app/api/webhook.py:12, backend/app/services/webhook_service.py:154", fe="testWebhook", ok=ref("SuccessMessageResponse"),
        desc="webhook_url 은 'http' 로 시작해야 한다(그 밖의 검증 없음). provider auto 면 URL 로 판별(slack.com → slack, discord.com/discordapp.com → discord, 그 밖 generic). 그 밖 값은 그대로 쓰고 slack/discord 가 아니면 generic 페이로드. 대상에 HTTP POST(타임아웃 8초). 200/204 가 아니면 실패이고 메시지에 응답 본문 앞 100자.",
        extra={"400": resp("ERR_INVALID_PAYLOAD: '유효한 HTTP/HTTPS 웹훅 URL을 입력해주세요.' 또는 전송 실패 메시지", E_HTTP)}),
    ("get", "/api/sources"): dict(code="backend/app/api/sources.py:26, backend/app/services/sources_service.py:55", fe="fetchSources", ok=ref("SourcesListResponse"),
        desc="파일 (mtime, size) 가 그대로면 메모리 사본을 준다. 파일을 못 읽으면 내장 기본 소스(_default_sources). sources_file 은 파일 이름만."),
    ("post", "/api/sources/rss"): dict(code="backend/app/api/sources.py:53, backend/app/services/sources_service.py:220", fe="addRssSource", ok=ref("AddRssResponse"),
        desc="AddRssRequest 검증: name 1~200자, url 은 ^https?://\\S+$ (1000자 이하), category_hint 는 harness·mcp_plugins_skills·agent_tech·ai_news, country 는 KR·GLOBAL. 같은 URL(끝 / 무시)이 있으면 그 항목을 enabled=true, name·category_hint 덮어쓰기. 새 id 는 이름 슬러그, 겹치거나 영숫자가 없으면 _<sha1(url)[:8]> 를 붙인다. sources.json 저장 실패는 500.",
        extra={"400": resp("ERR_INVALID_PAYLOAD: 필드 검증 실패 (details [{loc, msg}])", E_HTTP), "500": resp('ERR_SERVER_INTERNAL "소스 파일(sources.json)을 저장하지 못했습니다. 파일 권한과 디스크를 확인해주세요."', E_HTTP)}),
    ("patch", "/api/sources/{source_type}/{item_id}/toggle"): dict(code="backend/app/api/sources.py:69, backend/app/services/sources_service.py:193", fe="toggleSource", ok=ref("StatusMessageResponse"),
        desc="source_type: rss(item_id 는 피드 id 또는 url), github_repo(item_id 는 repo), github·reddit·hackernews·arxiv·huggingface(유형 전체 토글, item_id 는 'all' 만. 그 밖 값은 404). 경로 선언은 {item_id:path} 라 item_id 에 '/' 가 들어간다 (owner/repo, URL id). OpenAPI 경로 문자열에는 :path 가 나타나지 않는다.",
        extra={"404": resp('ERR_NOT_FOUND "해당 소스를 찾을 수 없습니다."', E_HTTP), "500": resp("ERR_SERVER_INTERNAL: sources.json 저장 실패", E_HTTP)}),
    ("delete", "/api/sources/{source_type}/{item_id}"): dict(code="backend/app/api/sources.py:77, backend/app/services/sources_service.py:246", fe="deleteSource", ok=ref("StatusMessageResponse"),
        desc="rss(id 또는 url 일치 항목 모두), github_repo(repo 일치)만 지원. 경로 선언은 {item_id:path} 라 item_id 에 '/' 가 들어간다.",
        extra={"404": resp('ERR_NOT_FOUND "해당 소스를 찾을 수 없습니다." (그 밖의 유형 포함)', E_HTTP), "500": resp("ERR_SERVER_INTERNAL: sources.json 저장 실패", E_HTTP)}),
    ("post", "/api/research/inspect-url"): dict(code="backend/app/api/research.py:10, backend/app/services/source_researcher.py:31", fe="inspectUrl", ok=ref("InspectUrlResponse"),
        desc="http(s):// 가 없으면 https:// 를 붙인다. GitHub 저장소 URL 이면 releases.atom 먼저. XML 이면 피드로, HTML 이면 <link rel=alternate> 탐지. 피드 파싱은 asyncio.to_thread. 접속·다운로드 예외 원문은 로그에만 남기고 status error 의 message 는 고정 문장이다. 점수는 동기 휴리스틱 evaluate_quality_and_signal (LLM 없음). 서버가 요청자 URL 로 GET(리다이렉트 따라감, 타임아웃 10초/8초).",
        extra={"400": resp('ERR_INVALID_PAYLOAD "조사할 URL 을 입력해주세요." (빈 문자열)', E_HTTP)}),
    ("get", "/api/research/status"): dict(code="backend/app/api/research.py:26, backend/app/services/deep_researcher.py:149", fe="fetchDeepResearchStatus", ok=ref("DeepResearchStatusResponse")),
    ("get", "/api/research/audit-logs"): dict(code="backend/app/api/research.py:31, backend/app/services/deep_researcher.py:158", fe="fetchResearchAuditLogs", ok=ref("ResearchAuditLogsResponse"),
        desc="source_research_logs 를 created_at 내림차순. limit 1~200 (기본 30), 밖이면 400 ERR_INVALID_PAYLOAD."),
    ("post", "/api/research/run-deep"): dict(code="backend/app/api/research.py:41, backend/app/services/deep_researcher.py:380", fe="triggerDeepResearch", ok=ref("RunDeepResponse"),
        desc="max_candidates 는 본문이 아니라 쿼리 (1~20, 기본 6, 밖이면 400 ERR_INVALID_PAYLOAD). asyncio.create_task 로 run_deep_research 를 띄우고 태스크 참조를 끝날 때까지 모듈 집합에 보관한다. 후보는 sources.json 에 이미 있는 url·site_url 을 빼고, 최근 기사에서 뽑은 외부 도메인과 시드 사이트를 번갈아 채운 뒤 앞에서 max_candidates 개만 평가한다. 피드 탐지 HTTP 요청, 키워드 규칙 점수(LLM 없음), AUTO_ADOPTED 면 sources.json 에 RSS 자동 추가(저장 실패면 그 후보를 WATCHLIST 로 기록하고 adopt_failed 를 센 뒤 계속), source_research_logs INSERT(사이클 끝에 한 번 커밋). 사이클이 예외로 끝나면 last_run_summary 에 {status: error} 를 남기고 is_running 은 finally 로 푼다 (backend/app/services/deep_researcher.py:380-521)."),
    ("get", "/api/chat/sources/{source_id}"): dict(code="backend/app/api/chat.py:60, backend/app/services/chat_service.py:78", fe="fetchChatSourceDetail (frontend/src/lib/chatApi.ts)",
        desc="날짜(published_at·created_at·scraped_at)는 UTC 오프셋이 붙은 ISO 문자열 (iso_utc, backend/app/time_utils.py:6). full_content·scraped_at 포함.",
        extra=chat_errs([(404, "ERR_HANDOVER_SOURCE_NOT_FOUND: 해당 id 의 뉴스 없음"), (400, "ERR_INVALID_PAYLOAD: source_id 가 정수 아님 (details [{loc, msg}])")])),
    ("post", "/api/chat/stream"): dict(code="backend/app/api/chat.py:70, backend/app/services/chat_service.py:441", fe="openChatStream (frontend/src/lib/chatApi.ts, 상대 경로 → Next rewrite 경유). 이벤트 payload 는 lib/contract.ts parseChatSsePayload 로 검증",
        body="ChatStreamRequest", desc=SSE_CHAT, sse_chat=True,
        extra={**chat_errs([
            (400, "ERR_INVALID_PAYLOAD: 본문이 JSON 이 아님·객체가 아님·model_tier 밖의 필드 검증 실패(filters, top_k, history, user_message_id·assistant_message_id 1~36자·서로 다름), details null"),
            (400, "ERR_CHAT_PAYLOAD_EMPTY / ERR_CHAT_PAYLOAD_TOO_LARGE / ERR_INVALID_SCOPE_PARAM"),
            (400, "ERR_SESSION_INVALID_UUID: session_id 가 있는데 UUID 가 아님 (backend/app/api/chat.py:101-106, 입력값 echo 없음)"),
            (400, "ERR_INVALID_MODEL_TIER: model_tier 가 haiku·sonnet·opus 가 아님 (backend/app/api/chat.py:92-99). 모든 400 은 스트림을 열기 전, scoped 기사 확인·LLM 가용성 확인보다 먼저"),
            (404, "ERR_HANDOVER_SOURCE_NOT_FOUND: scoped 인데 source_id 없음·기사 없음 (스트림 열기 전)"),
            (503, "ERR_LLM_PROVIDER_UNAVAILABLE: check_provider_available() 실패 (스트림 열기 전)"),
            (401, "ERR_CLAUDE_API_KEY_MISSING (LLM_ERROR_MAP 분기만 있음, check_provider_available 은 LLMProviderUnavailableException 만 던진다, backend/app/api/chat.py:51-58)"),
            (429, "ERR_CLAUDE_QUOTA_EXCEEDED / ERR_LLM_QUOTA_EXCEEDED (분기만 있음)"),
            (529, "ERR_CLAUDE_OVERLOADED (분기만 있음)"),
            (502, "ERR_LLM_UPSTREAM_FAILED (분기만 있음)"),
        ]), "500": resp("ValidationError 밖의 처리하지 않은 예외만 전역 처리 ERR_SERVER_INTERNAL (요청 모델 검증 실패는 400)", E_GLOBAL)}),
    ("get", "/api/chat/sessions"): dict(code="backend/app/api/chat.py:141, backend/app/services/chat_session_service.py:82", fe="fetchChatSessions (frontend/src/lib/chatApi.ts)",
        desc="updated_at 내림차순(created_at·updated_at 은 UTC 오프셋 ISO). 배열만 주고 전체 개수는 주지 않는다. last_message_preview 는 마지막 메시지 앞 100자. limit 1~50(기본 30), offset ≥0, 밖이면 400 ERR_INVALID_PAYLOAD.",
        extra=chat_errs([(500, 'ERR_SERVER_INTERNAL "대화 목록을 불러오지 못했습니다." (예외 문자열은 로그에만)')])),
    ("post", "/api/chat/sessions"): dict(code="backend/app/api/chat.py:156, backend/app/services/chat_session_service.py:231", fe="saveChatSession (frontend/src/lib/chatApi.ts, ChatWorkspace saveTurn 에서 턴마다 한 번)",
        body="ChatSessionCreateRequest", body_required=False,
        desc="id 가 있으면 업서트(갱신이어도 201). id 는 uuid.UUID() 로 파싱 가능해야 한다. messages 중 이 세션에 이미 있는 id 와 같은 요청 안 중복 id 는 건너뛰고 나머지만 INSERT 한다. 다른 세션에 있는 id 가 섞이면 아무것도 바꾸지 않고 400. 메시지의 model_tier·usage·created_at 을 받은 그대로 저장한다(created_at 이 없으면 서버 시각에 순서대로 1µs 씩 더한 값). 세션 행·메시지·FIFO 정리(settings.CHAT_SESSION_MAX_LIMIT, 기본 30 초과 시 updated_at 이 가장 오래된 세션부터 삭제)를 한 트랜잭션으로 커밋한다. 응답은 갱신 뒤 상태(populate_existing). title·scope_mode 는 Pydantic 기본값이 있어 본문에서 빼면 '새 대화'·'global' 로 덮인다. 오류 응답 전에는 요청 세션을 롤백해 부분 변경을 남기지 않는다 (backend/app/api/chat.py:179-189). 응답 시각(created_at·updated_at·messages[].created_at·active_source.*)은 UTC 오프셋이 붙은 ISO.",
        extra=chat_errs([(400, "ERR_INVALID_PAYLOAD: 본문 JSON 오류·객체 아님·필드 검증 실패(details [{loc, msg}]), 다른 세션의 메시지 id(details {message_ids: [...]})"), (400, "ERR_SESSION_INVALID_UUID: id 가 UUID 형식이 아님"), (500, 'ERR_SESSION_CREATE_FAILED "대화 세션을 저장하지 못했습니다." (예외 문자열은 로그에만)')])),
    ("get", "/api/chat/sessions/{session_id}"): dict(code="backend/app/api/chat.py:191, backend/app/services/chat_session_service.py:124", fe="fetchChatSessionDetail (frontend/src/lib/chatApi.ts, 404 면 null)",
        desc="메시지는 created_at 오름차순. sources_json·usage_json·active_filters_json 은 파싱하고 실패하면 null. session_id 형식 검증 없음. 시각은 UTC 오프셋이 붙은 ISO (iso_utc).",
        extra=chat_errs([(404, "ERR_SESSION_NOT_FOUND"), (500, 'ERR_SERVER_INTERNAL "대화 내용을 불러오지 못했습니다."')])),
    ("delete", "/api/chat/sessions/{session_id}"): dict(code="backend/app/api/chat.py:207, backend/app/services/chat_session_service.py:307", fe="deleteChatSession (frontend/src/lib/chatApi.ts)",
        desc="ORM cascade='all, delete-orphan' 로 하위 메시지까지 한 트랜잭션으로 삭제. 실패하면 서비스와 라우터가 롤백한다 (backend/app/api/chat.py:219-222). 성공 message 고정: '대화 세션 및 하위 메시지가 원자적으로 영구 삭제되었습니다.', deleted_count 1.",
        extra=chat_errs([(404, "ERR_SESSION_NOT_FOUND"), (500, 'ERR_SESSION_DELETE_FAILED "대화를 삭제하지 못했습니다."')])),
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
    "AgentLens backend REST API (FastAPI). 기준: v0.4.2, Updated: 2026-11-10.\n\n"
    "이 파일은 `app.openapi()` (FastAPI 0.162.2 자동 생성, 런타임 `/openapi.json` 과 같은 내용)를 뽑은 뒤 코드에서 확인한 사실을 보충한 것이다.\n"
    "- 자동 생성과 다른 곳: 추가·교체한 응답·요청 본문·컴포넌트에는 `x-agentlens-supplemented: true`, 각 operation 에는 `x-agentlens-diff` 목록을 단다.\n"
    "- `x-agentlens-code`: 라우터·서비스 위치 (path:line). `x-agentlens-frontend`: frontend/src/lib/api.ts 호출 함수나 직접 fetch 위치.\n"
    "- 인증 없음. CORS allow_origins=['*'], allow_credentials=True (backend/app/main.py:51-57).\n"
    "- 오류 형식은 모든 operation 이 ErrorResponse {error_code, message, details} 다 (backend/app/api/errors.py). 요청 검증 실패는 422 가 아니라 400 ERR_INVALID_PAYLOAD (details [{loc, msg}]), HTTPException 은 상태 코드를 유지하고 상태별 기본 코드, 처리하지 않은 예외는 어느 operation 에서든 500 ERR_SERVER_INTERNAL (예외 문자열은 싣지 않는다).\n"
    "- 설계 문서: docs/system-designer/01_SYSTEM_DESIGN.md"
)
spec["info"]["x-agentlens-supplemented"] = True
spec["servers"] = [{"url": "http://localhost:8000", "description": "backend (uvicorn app.main:app, BACKEND_PORT 기본 8000)", **SUP},
                   {"url": "http://localhost:3000", "description": "frontend Next rewrite (/api/:path* → INTERNAL_API_URL). / 와 /health 는 프록시하지 않는다", **SUP}]
spec["tags"] = [
    {"name": "News", "description": "뉴스 목록·Ask AI(SSE)·RSS. 라우터 backend/app/api/news.py"},
    {"name": "Chat", "description": "AI 챗 스트림(SSE)·기사 상세·세션. 라우터 backend/app/api/chat.py"},
    {"name": "Daily Briefing", "description": "오늘의 브리핑·Notion·이메일·설정. 라우터 backend/app/api/briefing.py"},
    {"name": "Schedule", "description": "수집 스케줄·진행·수동 수집·리셋. 라우터 backend/app/api/schedule.py"},
    {"name": "sources", "description": "sources.json 소스 관리. 라우터 backend/app/api/sources.py"},
    {"name": "research", "description": "URL 피드 탐지·딥 리서치. 라우터 backend/app/api/research.py"},
    {"name": "trends", "description": "기술 레이더. 라우터 backend/app/api/trends.py"},
    {"name": "Webhook Dispatcher", "description": "Slack/Discord/generic 웹훅 테스트 발송. 라우터 backend/app/api/webhook.py"},
    {"name": "Stats", "description": "뉴스 개수 통계. 라우터 backend/app/api/stats.py"},
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
    "# Updated: 2026-11-10\n"
    "# 기준: v0.4.2\n"
    "# 생성: cd backend && PYTHONPATH=. ../.venv/bin/python ../.claude/skills/contract-specification/scripts/gen_openapi.py ../docs/system-designer/02_OPENAPI_SPEC.yaml 로 app.openapi() 를 뽑고 코드 사실을 보충했다 (lifespan 은 돌지 않는다).\n"
    "# 표시: 자동 생성(/openapi.json)과 다른 곳은 x-agentlens-supplemented: true, operation 별 x-agentlens-diff.\n"
)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(header)
    yaml.dump(ordered, f, Dumper=Dumper, allow_unicode=True, sort_keys=False, width=200)
print("ok", len(spec["paths"]), sum(len(v) for v in spec["paths"].values()), len(schemas))
