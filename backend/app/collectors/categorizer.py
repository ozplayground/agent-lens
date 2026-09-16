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
        "agent test", "agent testing", "safety eval", "llm eval", "model eval",
        # 한국어
        "하네스", "벤치마크", "평가 프레임워크", "스캐폴딩", "샌드박스", "테스트베드",
        "모델 평가", "에이전트 평가", "ai 평가"
    ],
    "mcp_plugins_skills": [
        "mcp", "model context protocol", "mcp server", "mcp servers", "mcp client",
        "mcp tools", "fastmcp", "agent tool", "agent tools", "agent skill", "agent skills",
        "agent plugin", "agent plugins", "tool calling", "function calling",
        "anthropic mcp", "copilot skill", "claude skill",
        # 한국어
        "모델 컨텍스트 프로토콜", "도구 호출", "함수 호출", "에이전트 도구", "에이전트 스킬",
        "에이전트 플러그인", "mcp 도구", "mcp 서버", "툴 콜링"
    ],
    "agent_tech": [
        "agent", "agents", "agentic", "multi-agent", "multi agent", "autonomous agent",
        "crewai", "autogen", "langgraph", "langchain", "llamaindex", "swarm",
        "browser-use", "browser use", "computer-use", "computer use", "agent workflow",
        "agent architecture", "agent memory", "coding agent", "pydantic-ai", "smolagents",
        # 한국어
        "에이전트", "자율 에이전트", "멀티에이전트", "멀티 에이전트", "에이전틱",
        "에이전트 워크플로우", "에이전트 아키텍처", "코딩 에이전트"
    ],
    "ai_news": [
        "llm", "llms", "openai", "anthropic", "gemini", "claude", "deepseek", "llama",
        "mistral", "gpt-4", "gpt-5", "gpt-6", "reasoning model", "foundation model",
        "transformer", "artificial intelligence", "machine learning", "deep learning",
        "prompt engineering", "vector db", "embedding", "fine-tuning", "rlhf", "rlvr",
        # 한국어
        "인공지능", "생성형 ai", "거대언어모델", "추론 모델", "파운데이션 모델", "딥시크",
        "클로드", "오픈ai", "딥러닝", "머신러닝", "생성 ai", "프롬프트", "파인튜닝", "임베딩"
    ]
}

AI_CORE_PATTERNS = [
    r'\bai\b', r'\bllm\b', r'\bllms\b', r'\bagent\b', r'\bagents\b', r'\bagentic\b',
    r'\bmcp\b', r'\bharness\b', r'\bevals?\b', r'\bbenchmarks?\b', r'\bswe-bench\b',
    r'\bgaia\b', r'\bwebarena\b', r'\bprompt(s|ing)?\b', r'\brag\b',
    r'\bopenai\b', r'\banthropic\b', r'\bclaude\b', r'\bgemini\b', r'\bdeepseek\b',
    r'\bllama\b', r'\bmistral\b', r'\bqwen\b', r'\bgpt-[0-9a-z.-]+\b', r'\bchatgpt\b',
    r'\btransformer(s)?\b', r'\bfine-tuning\b', r'\bembeddings?\b',
    r'\breasoning model(s)?\b', r'\bbrowser-use\b', r'\bcomputer-use\b',
    r'\blanggraph\b', r'\bcrewai\b', r'\bautogen\b', r'\bfastmcp\b',
    r'\bfunction calling\b', r'\btool calling\b', r'\bvector db\b',
    r'\bmachine learning\b', r'\bdeep learning\b', r'\bneural\b', r'\brlhf\b', r'\brlvr\b',
    r'\bmodel context protocol\b', r'\bpydantic-ai\b', r'\bsmolagents\b',
    r'\bmultimodal\b', r'\bvlm\b', r'\bvision model(s)?\b', r'\bencoder(s)?\b',
    r'\bdecoder(s)?\b', r'\bdiffusion\b', r'\bsynthetic data\b', r'\blora\b',
    r'\bqlora\b', r'\bdistillation\b', r'\bcontext window\b', r'\battention\b',
    r'\breinforcement learning\b', r'\bpre-?training\b', r'\bpost-?training\b',
    r'\balignment\b', r'\bjailbreak\b', r'\bred teaming\b', r'\binference\b',
    r'\bquantization\b', r'\bweights?\b', r'\bopen-weight(s)?\b', r'\bcheckpoint(s)?\b',
    r'\bvllm\b', r'\bsglang\b', r'\bollama\b', r'\bgroq\b',
    r'인공지능', r'에이전트', r'거대언어모델', r'하네스', r'벤치마크', r'추론 모델',
    r'딥러닝', r'머신러닝', r'생성형\s*ai', r'생성\s*ai', r'언어\s*모델', r'멀티에이전트',
    r'클로드', r'오픈ai', r'딥시크', r'파운데이션 모델', r'파인튜닝', r'임베딩',
    r'프롬프트', r'도구 호출', r'함수 호출', r'멀티모달', r'강화학습', r'경량화', r'양자화'
]
_AI_REGEX = re.compile('|'.join(AI_CORE_PATTERNS), re.IGNORECASE)

def is_strictly_ai_related(title: str, summary: str = "") -> bool:
    """Strict check whether content has explicit AI / Agent / LLM / Harness / MCP domain relevance."""
    content = f"{title} {summary}"
    return bool(_AI_REGEX.search(content))

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
                # Use regex word boundaries for short ascii words
                if len(kw) <= 5 and re.match(r'^[a-zA-Z0-9_-]+$', kw):
                    if re.search(r'\b' + re.escape(kw) + r'\b', content):
                        w = 3.5 if re.search(r'\b' + re.escape(kw) + r'\b', title.lower()) else 1.5
                        scores[cat] += w
                        found_tags.add(kw)
                else:
                    w = 3.5 if kw in title.lower() else 1.5
                    scores[cat] += w
                    found_tags.add(kw)

    # Priority weighting
    scores["harness"] *= 1.3
    scores["mcp_plugins_skills"] *= 1.2
    scores["agent_tech"] *= 1.1

    best_cat = "unrelated"
    max_score = 0.0
    for cat, score in scores.items():
        if score > max_score:
            max_score = score
            best_cat = cat

    # Explicit title overrides if score is positive
    t_lower = title.lower()
    if any(k in t_lower for k in ["harness", "swe-bench", "benchmark", "하네스", "벤치마크"]) or re.search(r'\bevals?\b', t_lower):
        best_cat = "harness"
        if max_score == 0: max_score = 3.0
    elif any(k in t_lower for k in ["mcp", "model context protocol", "fastmcp", "도구 호출", "함수 호출", "tool calling"]):
        best_cat = "mcp_plugins_skills"
        if max_score == 0: max_score = 3.0
    elif any(k in t_lower for k in ["multi-agent", "crewai", "langgraph", "에이전트", "자율 에이전트"]) or re.search(r'\bagents?\b', t_lower):
        if best_cat not in ["harness", "mcp_plugins_skills"]:
            best_cat = "agent_tech"
            if max_score == 0: max_score = 3.0

    # If no keywords matched and no score, do NOT falsely tag as ai_news!
    if max_score == 0.0:
        return "unrelated", [], 0.0

    return best_cat, sorted(list(found_tags)), max_score

def calculate_hotness(raw_score: int, comments: int, published_at: datetime) -> float:
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)

    hours_ago = max(0.1, (now - published_at).total_seconds() / 3600.0)
    engagement = (raw_score or 0) + (comments or 0) * 2.5 + 5.0
    hotness = engagement / ((hours_ago + 2.0) ** 1.3)
    return round(float(min(100.0, hotness * 8.0)), 2)
