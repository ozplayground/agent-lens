import re
import hashlib
from datetime import datetime, timezone
from typing import Tuple, List, Dict, Set

CATEGORIES = {
    "harness": "Agent Harness & Evaluation",
    "mcp_plugins_skills": "Skills, Plugins & MCP",
    "agent_tech": "Agent Technology & Workflows",
    "ai_news": "General AI & Foundation Models"
}

KEYWORDS = {
    "harness": [
        "harness", "agent harness", "test harness", "eval", "evaluation", "evals",
        "benchmark", "benchmarks", "benchmarking", "swe-bench", "gaia", "webarena",
        "scaffold", "scaffolding", "sandbox", "sandboxing", "guardrails", "testbench",
        "agent test", "agent testing", "safety eval", "unit test",
        # 한국어
        "하네스", "벤치마크", "평가", "평가 프레임워크", "스캐폴딩", "샌드박스", "테스트베드"
    ],
    "mcp_plugins_skills": [
        "mcp", "model context protocol", "mcp server", "mcp client", "mcp tools",
        "plugin", "plugins", "skill", "skills", "tool calling", "function calling",
        "agent tool", "agent tools", "agent skill", "agent plugin", "anthropic mcp",
        # 한국어
        "모델 컨텍스트 프로토콜", "도구 호출", "함수 호출", "스킬", "플러그인", "도구", "커넥터"
    ],
    "agent_tech": [
        "agent", "agents", "agentic", "multi-agent", "multi agent", "autonomous agent",
        "crewai", "autogen", "langgraph", "langchain", "llamaindex", "swarm",
        "browser-use", "browser use", "computer-use", "computer use", "agent workflow",
        "agent architecture", "agent memory",
        # 한국어
        "에이전트", "자율 에이전트", "멀티에이전트", "멀티 에이전트", "에이전틱", "에이전트 워크플로우"
    ],
    "ai_news": [
        "llm", "llms", "openai", "anthropic", "gemini", "claude", "deepseek", "llama",
        "mistral", "gpt-4", "gpt-5", "reasoning model", "foundation model",
        "transformer", "artificial intelligence", "machine learning",
        # 한국어
        "인공지능", "생성형 ai", "거대언어모델", "추론 모델", "파운데이션 모델", "딥시크", "클로드", "오픈ai"
    ]
}

def compute_dedup_hash(title: str, url: str) -> str:
    clean_url = re.sub(r'\?utm_[^&]+(&utm_[^&]+)*', '', (url or "").strip().rstrip('/'))
    clean_title = re.sub(r'[^a-zA-Z0-9가-힣]', '', (title or "").lower().strip())
    key = f"{clean_title}::{clean_url}"
    return hashlib.sha256(key.encode('utf-8')).hexdigest()

def classify_and_tag(title: str, summary: str = "") -> Tuple[str, List[str], float]:
    content = f"{title} {summary}".lower()
    scores: Dict[str, float] = {cat: 0.0 for cat in KEYWORDS}
    found_tags: Set[str] = set()

    for cat, kw_list in KEYWORDS.items():
        for kw in kw_list:
            if kw in content:
                if len(kw) <= 4 and re.match(r'^[a-zA-Z0-9]+$', kw):
                    if re.search(r'\b' + re.escape(kw) + r'\b', content):
                        w = 3.0 if kw in title.lower() else 1.5
                        scores[cat] += w
                        found_tags.add(kw)
                else:
                    w = 3.0 if kw in title.lower() else 1.5
                    scores[cat] += w
                    found_tags.add(kw)

    # Priority weighting
    scores["harness"] *= 1.3
    scores["mcp_plugins_skills"] *= 1.2
    scores["agent_tech"] *= 1.1

    best_cat = "ai_news"
    max_score = 0.0
    for cat, score in scores.items():
        if score > max_score:
            max_score = score
            best_cat = cat

    t_lower = title.lower()
    if any(k in t_lower for k in ["harness", "swe-bench", "eval", "benchmark", "하네스", "벤치마크", "평가"]):
        best_cat = "harness"
    elif any(k in t_lower for k in ["mcp", "model context protocol", "plugin", "skill", "도구 호출", "플러그인", "스킬"]):
        best_cat = "mcp_plugins_skills"
    elif any(k in t_lower for k in ["agent", "multi-agent", "crewai", "langgraph", "에이전트", "자율"]):
        if best_cat not in ["harness", "mcp_plugins_skills"]:
            best_cat = "agent_tech"

    return best_cat, sorted(list(found_tags)), max_score

def calculate_hotness(raw_score: int, comments: int, published_at: datetime) -> float:
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)

    hours_ago = max(0.1, (now - published_at).total_seconds() / 3600.0)
    engagement = (raw_score or 0) + (comments or 0) * 2.5 + 5.0
    hotness = engagement / ((hours_ago + 2.0) ** 1.3)
    return round(float(min(100.0, hotness * 8.0)), 2)
