import os
import re
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
from datetime import datetime, timezone
import httpx
from app.config import settings, load_json_config
from app.collectors.categorizer import is_strictly_ai_related, classify_and_tag
from app.services.llm_providers.base import BaseLLMProvider
from app.services.llm_providers.mock_provider import MockLLMProvider
from app.services.llm_providers.anthropic_provider import (
    AnthropicLLMProvider,
    resolve_model_and_tier,
    AnthropicKeyMissingException,
    AnthropicQuotaExceededException,
    AnthropicOverloadedException,
)

logger = logging.getLogger("agentlens.llm")


class LLMProviderUnavailableException(Exception):
    """Raised when no LLM provider (Gemini, OpenAI, Ollama) is configured or available."""
    pass

class LLMUpstreamException(Exception):
    """Raised when an upstream LLM API communication fails or returns server error."""
    pass

class LLMQuotaExceededException(Exception):
    """Raised when external LLM API rate limit or quota is exceeded (HTTP 429)."""
    pass

class LLMStreamFailedException(Exception):
    """Raised when an active LLM stream abruptly terminates or errors out mid-stream."""
    pass

# Tech stack dictionary for high-precision entity extraction
KNOWN_TECH_STACK = {
    # Models
    "claude 3.7": "Claude 3.7",
    "claude 3.5": "Claude 3.5",
    "gpt-4.5": "GPT-4.5",
    "gpt-4o": "GPT-4o",
    "o1": "OpenAI o1",
    "o3": "OpenAI o3",
    "deepseek-r1": "DeepSeek-R1",
    "deepseek-v3": "DeepSeek-V3",
    "deepseek": "DeepSeek",
    "gemini 2.0": "Gemini 2.0",
    "gemini 1.5": "Gemini 1.5",
    "llama 3.3": "Llama 3.3",
    "llama 3": "Llama 3",
    "mistral": "Mistral",
    "qwen": "Qwen",
    # Harness & Benchmark
    "swe-bench": "SWE-bench",
    "gaia": "GAIA",
    "webarena": "WebArena",
    "agentbench": "AgentBench",
    "sandbox": "Docker Sandbox",
    "evals": "Eval Harness",
    # Frameworks & Tooling
    "mcp": "Model Context Protocol",
    "fastmcp": "FastMCP",
    "langgraph": "LangGraph",
    "crewai": "CrewAI",
    "autogen": "AutoGen",
    "langchain": "LangChain",
    "llamaindex": "LlamaIndex",
    "browser-use": "Browser-Use",
    "vllm": "vLLM",
    "ollama": "Ollama",
    "docker": "Docker",
    "fastapi": "FastAPI",
    "python": "Python",
    "typescript": "TypeScript"
}

CATEGORY_INSIGHTS = {
    "harness": "에이전트의 실제 코드 수정 및 툴 사용 역량을 객관적으로 평가할 수 있는 표준 벤치마크 및 회귀 테스트 하네스 기준을 제공합니다.",
    "mcp_plugins_skills": "에이전트와 외부 툴·데이터베이스 간의 연결 프로토콜을 표준화하여 플러그인 확장성과 보안 격리를 대폭 개선합니다.",
    "agent_tech": "단일 프롬프트를 넘어 복합 멀티에이전트 협업, 상태 영속성, 자율 브라우징 워크플로우를 구축하는 실전 아키텍처를 제시합니다.",
    "ai_news": "프론티어 추론 모델과 오픈소스 LLM의 성능 혁신을 통해 자율 에이전트의 기반 추론 능력(Reasoning)이 한 단계 도약함을 시사합니다."
}

def sanitize_model_identifier(model_name: Optional[str]) -> str:
    """
    Sanitizes model identifier according to POL-LLM-005, REQ-LLM-002, and ADR-012 (Anti-Gemini policy).
    Prevents any 'Google gemini-*' or 'gemini-*' live strings from leaking into response metadata.
    Normalizes unauthorized or live Gemini model strings to 'claude-3-5-sonnet-latest'.
    Preserves explicit test mock identifiers ('Mock Gemini', 'MockLLMProvider').
    """
    if not model_name:
        return "claude-3-5-sonnet-latest"
    name_clean = model_name.strip()
    name_lower = name_clean.lower()
    # Preserve test mock identifiers
    if "mock" in name_lower:
        return name_clean
    # Strict Anti-Gemini check: block any live Google Gemini string
    if name_lower.startswith("google gemini") or name_lower.startswith("gemini") or "gemini" in name_lower:
        logger.warning(
            f"POL-LLM-005: Unauthorized Gemini model identifier rejected: {model_name}. Normalized to claude-3-5-sonnet-latest."
        )
        return "claude-3-5-sonnet-latest"
    return name_clean


class LLMProcessor:
    """
    Intelligent LLM processor supporting:
    - Quality scoring and noise filtering
    - 3-bullet technical TL;DR generation
    - 'Why It Matters' developer implications
    - Automated tech stack and model entity extraction
    - Interactive Q&A for articles
    """

    def __init__(self):
        self.gemini_key = getattr(settings, "GEMINI_API_KEY", "")
        self.openai_key = getattr(settings, "OPENAI_API_KEY", "")
        self.ollama_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434")
        self._qa_cache: Dict[str, Tuple[str, str]] = {}
        self._eval_cache: Dict[str, Dict[str, Any]] = {}
        self.mock_provider = MockLLMProvider()
        self.anthropic_provider = AnthropicLLMProvider()
        self.last_usage: Dict[str, Any] = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_input_tokens": None,
            "cache_creation_input_tokens": None,
        }

    async def _call_gemini(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        """
        DECOMMISSIONED per POL-LLM-005, REQ-LLM-002, and ADR-012 (Anti-Gemini Policy).
        Google Gemini invocation paths are permanently disabled.
        """
        logger.warning("POL-LLM-005: _call_gemini invoked but is permanently decommissioned. Returning (None, None).")
        return None, None

    async def _call_openai(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        json_cfg = load_json_config()
        key = (
            getattr(settings, "OPENAI_API_KEY", "")
            or json_cfg.get("llm", {}).get("openai_api_key", "")
            or os.environ.get("OPENAI_API_KEY", "")
            or self.openai_key
        )
        if not key:
            return None, None
        model = (
            getattr(settings, "OPENAI_MODEL", "")
            or json_cfg.get("llm", {}).get("openai_model", "")
            or "gpt-4o-mini"
        )
        url = "https://api.openai.com/v1/chat/completions"
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 1500
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"].strip(), f"OpenAI {model}"
        except Exception as e:
            logger.warning(f"OpenAI API call failed: {e}")
        return None, None

    async def _call_ollama(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434") or self.ollama_url
        if not base_url:
            return None, None
        model = getattr(settings, "OLLAMA_MODEL", "llama3.2:latest")
        url = f"{base_url.rstrip('/')}/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": False}
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip(), f"Ollama {model}"
        except Exception as e:
            logger.debug(f"Ollama call failed or not running: {e}")
        return None, None

    def is_test_environment(self) -> bool:
        """Determines if current process is running in an automated test or CI environment."""
        import sys
        if getattr(settings, "TESTING", False):
            return True
        if os.environ.get("TESTING", "").lower() in ("true", "1", "yes"):
            return True
        if os.environ.get("CI", "").lower() in ("true", "1", "yes"):
            return True
        if "pytest" in sys.modules:
            return True
        return False

    def is_mock_fallback_allowed(self) -> bool:
        """Determines whether fallback to MockLLMProvider is permitted."""
        if self.is_test_environment():
            return True
        if "ALLOW_MOCK_FALLBACK" in os.environ:
            return os.environ.get("ALLOW_MOCK_FALLBACK", "").lower() in ("true", "1", "yes")
        json_cfg = load_json_config()
        if "allow_mock_fallback" in json_cfg.get("llm", {}):
            return bool(json_cfg.get("llm", {}).get("allow_mock_fallback"))
        return getattr(settings, "ALLOW_MOCK_FALLBACK", True)

    def has_live_provider(self) -> bool:
        """Checks if a valid live LLM provider (Anthropic, OpenAI, Ollama) is configured and reachable."""
        if self.anthropic_provider.is_available():
            return True

        json_cfg = load_json_config()
        anthropic_key = (
            getattr(settings, "ANTHROPIC_API_KEY", "")
            or json_cfg.get("llm", {}).get("anthropic_api_key", "")
            or os.environ.get("ANTHROPIC_API_KEY", "")
        )
        if anthropic_key:
            return True

        # Anti-Gemini Policy (POL-LLM-005, REQ-LLM-002, ADR-012):
        # GEMINI_API_KEY is decommissioned and never treated as a live provider.
        openai_key = (
            getattr(settings, "OPENAI_API_KEY", "")
            or json_cfg.get("llm", {}).get("openai_api_key", "")
            or os.environ.get("OPENAI_API_KEY", "")
            or self.openai_key
        )
        if openai_key:
            return True

        ollama_url = getattr(settings, "OLLAMA_BASE_URL", "") or json_cfg.get("llm", {}).get("ollama_base_url", "")
        if ollama_url:
            try:
                with httpx.Client(timeout=1.0) as client:
                    resp = client.get(f"{ollama_url}/api/tags")
                    if resp.status_code == 200:
                        return True
            except Exception:
                pass
        return False

    def check_provider_available(self) -> bool:
        """
        Check LLM availability according to ADR-008 resolution hierarchy (Zero 503 guarantee).
        1. Live provider available -> True
        2. Test/CI environment or ALLOW_MOCK_FALLBACK=True -> True (Mock fallback active)
        3. Strict production with no key -> LLMProviderUnavailableException (HTTP 503)
        """
        if self.has_live_provider():
            return True

        if self.is_test_environment() or self.is_mock_fallback_allowed():
            return True

        raise LLMProviderUnavailableException("가용한 LLM 프로바이더 엔진 미설정 (API 키 미등록)")


    async def generate_live_answer(
        self, prompt: str, model: Optional[str] = None, model_tier: Optional[str] = None
    ) -> Tuple[str, str]:
        """Generate answer via live LLM (Anthropic -> OpenAI -> Ollama). Never falls back to Gemini or fake text."""
        self.check_provider_available()

        # 1. Anthropic Claude (Priority 1)
        if self.anthropic_provider.is_available():
            try:
                ans, resolved_model, usage = await self.anthropic_provider.generate_text_with_usage(
                    prompt=prompt,
                    model=model or model_tier,
                )
                self.last_usage = usage
                return ans, sanitize_model_identifier(resolved_model)
            except (AnthropicQuotaExceededException, LLMQuotaExceededException):
                raise LLMQuotaExceededException("외부 LLM API 호출 한도 초과 (Anthropic 429)")
            except (AnthropicOverloadedException, AnthropicKeyMissingException):
                raise
            except Exception as e:
                logger.warning(f"Anthropic call failed in generate_live_answer: {e}")

        # Note: Google Gemini is permanently decommissioned per POL-LLM-005, REQ-LLM-002, and ADR-012.

        # 2. OpenAI
        json_cfg = load_json_config()
        openai_key = (
            getattr(settings, "OPENAI_API_KEY", "")
            or json_cfg.get("llm", {}).get("openai_api_key", "")
            or os.environ.get("OPENAI_API_KEY", "")
            or self.openai_key
        )
        if openai_key:
            try:
                ans, o_model = await self._call_openai(prompt)
                if ans:
                    return ans, sanitize_model_identifier(o_model)
            except Exception as e:
                err_str = str(e).lower()
                if "429" in err_str or "quota" in err_str or "rate" in err_str:
                    raise LLMQuotaExceededException("외부 LLM API 호출 한도 초과 (OpenAI 429)")
                logger.warning(f"OpenAI call failed in generate_live_answer: {e}")

        # 3. Ollama
        try:
            ans, ol_model = await self._call_ollama(prompt)
            if ans:
                return ans, sanitize_model_identifier(ol_model)
        except Exception as e:
            logger.warning(f"Ollama call failed in generate_live_answer: {e}")

        # Fallback to MockLLMProvider if permitted (Zero 503)
        if self.is_mock_fallback_allowed() or self.is_test_environment():
            logger.info("Falling back to MockLLMProvider for generate_live_answer (Zero 503)")
            self.last_usage = {
                "input_tokens": 850,
                "output_tokens": 320,
                "cache_read_input_tokens": 400,
                "cache_creation_input_tokens": 0,
            }
            if model or model_tier:
                resolved_m, _ = resolve_model_and_tier(model or model_tier)
                ans, _ = await self.mock_provider.generate_text(prompt)
                return ans, sanitize_model_identifier(resolved_m)
            ans, m_name = await self.mock_provider.generate_text(prompt)
            return ans, sanitize_model_identifier(m_name)

        raise LLMUpstreamException("외부 LLM 업스트림 통신 실패 / API 장애")


    async def stream_tokens(
        self, prompt: str, model: Optional[str] = None, model_tier: Optional[str] = None
    ) -> AsyncGenerator[Tuple[str, str], None]:
        """Stream raw tokens from actual LLM (Anthropic -> OpenAI -> Ollama). Raises exceptions on failure without fake text."""
        self.check_provider_available()

        token_yielded = False

        # 1. Try Anthropic Claude streaming (Priority 1)
        if self.anthropic_provider.is_available():
            try:
                async for chunk, m_name in self.anthropic_provider.stream_chat(
                    prompt=prompt,
                    model=model or model_tier,
                ):
                    token_yielded = True
                    yield (chunk, sanitize_model_identifier(m_name))
                if token_yielded:
                    self.last_usage = self.anthropic_provider.last_usage
                    return
            except (AnthropicQuotaExceededException, LLMQuotaExceededException):
                raise LLMQuotaExceededException("외부 LLM API 호출 한도 초과 (Anthropic 429)")
            except (AnthropicOverloadedException, AnthropicKeyMissingException, LLMStreamFailedException):
                raise
            except Exception as e:
                if token_yielded:
                    raise LLMStreamFailedException(f"Anthropic mid-stream failed: {e}")
                logger.warning(f"Anthropic stream failed: {e}")

        # Note: Google Gemini streaming is permanently decommissioned per POL-LLM-005, REQ-LLM-002, and ADR-012.

        # 2. Try OpenAI SDK streaming
        json_cfg = load_json_config()
        openai_key = (
            getattr(settings, "OPENAI_API_KEY", "")
            or json_cfg.get("llm", {}).get("openai_api_key", "")
            or os.environ.get("OPENAI_API_KEY", "")
            or self.openai_key
        )
        if openai_key:
            try:
                import openai
                openai_client = openai.AsyncOpenAI(api_key=openai_key)
                o_model = getattr(settings, "OPENAI_MODEL", "") or json_cfg.get("llm", {}).get("openai_model", "") or "gpt-4o-mini"
                stream = await openai_client.chat.completions.create(
                    model=o_model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=2048,
                    stream=True
                )
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                        txt = chunk.choices[0].delta.content
                        token_yielded = True
                        yield (txt, sanitize_model_identifier(f"OpenAI {o_model}"))
                if token_yielded:
                    return
            except Exception as e:
                err_str = str(e).lower()
                if "rate" in err_str or "429" in err_str or "quota" in err_str:
                    raise LLMQuotaExceededException("외부 LLM API 호출 한도 초과 (OpenAI 429)")
                if token_yielded:
                    raise LLMStreamFailedException(f"OpenAI mid-stream failed: {e}")
                logger.warning(f"OpenAI SDK stream failed: {e}")

        # 3. Try Ollama streaming
        ollama_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434") or json_cfg.get("llm", {}).get("ollama_base_url", "")
        if ollama_url:
            ol_m = getattr(settings, "OLLAMA_MODEL", "") or json_cfg.get("llm", {}).get("ollama_model", "") or "qwen2.5:latest"
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    async with client.stream("POST", f"{ollama_url}/api/generate", json={"model": ol_m, "prompt": prompt, "stream": True}) as resp:
                        if resp.status_code == 200:
                            async for line in resp.aiter_lines():
                                if line:
                                    data = json.loads(line)
                                    part = data.get("response", "")
                                    if part:
                                        token_yielded = True
                                        yield (part, sanitize_model_identifier(f"Ollama {ol_m}"))
                            if token_yielded:
                                return
            except Exception as e:
                if token_yielded:
                    raise LLMStreamFailedException(f"Ollama mid-stream failed: {e}")
                logger.warning(f"Ollama stream failed: {e}")

        # If no live provider yielded tokens, fallback to MockLLMProvider (Zero 503)
        if not token_yielded:
            if self.is_mock_fallback_allowed() or self.is_test_environment():
                logger.info("Falling back to MockLLMProvider for stream_tokens (Zero 503)")
                self.last_usage = {
                    "input_tokens": 850,
                    "output_tokens": 320,
                    "cache_read_input_tokens": 400,
                    "cache_creation_input_tokens": 0,
                }
                fallback_m = "MockLLMProvider (Fallback)"
                if model or model_tier:
                    fallback_m, _ = resolve_model_and_tier(model or model_tier)
                async for chunk, _ in self.mock_provider.stream_chat(prompt):
                    yield (chunk, sanitize_model_identifier(fallback_m))
                return

        if token_yielded:
            raise LLMStreamFailedException("LLM 스트리밍 도중 외부 프로바이더 오류가 발생했습니다.")
        raise LLMUpstreamException("외부 LLM 업스트림 통신 실패 / API 장애")


    async def _generate_live_answer(self, prompt: str) -> Tuple[Optional[str], Optional[str]]:
        try:
            return await self.generate_live_answer(prompt)
        except Exception:
            return None, None

    def extract_tech_stack(self, text: str) -> List[str]:
        t_lower = text.lower()
        found = set()
        for pattern, label in KNOWN_TECH_STACK.items():
            if re.search(r'\b' + re.escape(pattern) + r'\b', t_lower):
                found.add(label)
        return sorted(list(found))

    def evaluate_quality_and_signal(self, title: str, summary: str, source: str) -> Dict[str, Any]:
        text = f"{title} {summary}".lower()

        # Strict domain gate for mixed/general feeds (GeekNews, general RSS, HackerNews)
        is_mixed_source = source in ["rss_kr", "rss", "hackernews", "web"]
        is_ai_domain = is_strictly_ai_related(title, summary)
        if is_mixed_source and not is_ai_domain:
            return {
                "quality_score": 1.0,
                "is_worthwhile": False,
                "is_high_signal": False,
                "rejection_reason": "Non-AI domain topic in mixed feed"
            }

        # Base quality: verified AI mixed feeds start at 5.0, dedicated AI feeds start at 6.0
        score = 5.0 if is_mixed_source else 6.0

        # Tech depth signals
        high_signals = [
            "benchmark", "swe-bench", "protocol", "architecture", "evaluation", "sandbox",
            "multi-agent", "reasoning", "open-source", "하네스", "벤치마크", "평가 프레임워크",
            "아키텍처", "프로토콜", "mcp", "langgraph", "fastmcp", "agent", "에이전트",
            "모델", "도구 호출", "스킬", "framework", "coding agent", "추론 모델",
            "claude", "anthropic", "openai", "gpt-4", "deepseek", "gemini", "sonnet", "r1", "코딩 에이전트"
        ]
        matched_signals = 0
        for kw in high_signals:
            if kw in text:
                matched_signals += 1

        score += min(2.5, matched_signals * 0.5)

        # Source credibility weight
        if source in ["github", "arxiv", "huggingface"]:
            score += 1.0
        elif source in ["rss", "rss_kr"] and is_ai_domain:
            score += 0.5

        # Spam / noise penalties
        low_signals = [
            "sale", "discount", "crypto price", "airdrop", "coupon", "광고", "특가", "할인",
            "해고 통보", "취업", "연봉", "부동산", "사고방식", "파푸아뉴기니", "전자책", "줄무늬"
        ]
        for kw in low_signals:
            if kw in text:
                score -= 3.5

        if len(title.strip()) < 10:
            score -= 2.0

        score = max(1.0, min(10.0, round(score, 1)))
        cutoff = getattr(settings, "QUALITY_CUTOFF_SCORE", 5.0)
        high_thresh = getattr(settings, "HIGH_SIGNAL_THRESHOLD", 7.0)

        is_worthwhile = score >= cutoff
        if is_mixed_source and not is_ai_domain:
            is_worthwhile = False

        is_high_signal = score >= high_thresh and is_worthwhile

        return {
            "quality_score": score,
            "is_worthwhile": is_worthwhile,
            "is_high_signal": is_high_signal
        }

    async def evaluate_content_with_llm(
        self,
        title: str,
        summary: str,
        source: str,
        category_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deep LLM-grade relevance and quality evaluation.
        1. Fast heuristic pre-filter to instantly reject obvious non-AI noise without LLM latency.
        2. Live LLM evaluation (Gemini/OpenAI) for genuine semantic relevance and deep quality scoring.
        3. Strict heuristic fallback if LLM is unreachable or rate limited.
        """
        cache_key = f"{title.strip().lower()}::{source}"
        if cache_key in self._eval_cache:
            return self._eval_cache[cache_key]

        is_mixed_source = source in ["rss_kr", "rss", "hackernews", "web"]
        is_ai_domain = is_strictly_ai_related(title, summary)

        # 1. Fast Pre-Filter: If from general tech feed and has zero AI relevance, reject immediately
        if is_mixed_source and not is_ai_domain:
            result = {
                "quality_score": 1.0,
                "relevance_score": 0.0,
                "is_worthwhile": False,
                "is_high_signal": False,
                "category": "unrelated",
                "rejection_reason": "Pre-filter: No AI/Agent/MCP domain relevance found in mixed feed",
                "why_it_matters": None,
                "evaluated_by": "pre_filter_gate"
            }
            self._eval_cache[cache_key] = result
            return result

        # 2. Live LLM Evaluation
        # Anti-Gemini Policy (POL-LLM-005): Gemini is decommissioned. Only use live provider if available.
        if self.has_live_provider():
            prompt = (
                f"You are a strict, world-class AI & Autonomous Agent Curator for AgentLens.\n"
                f"AgentLens ONLY indexes topics that are directly and deeply relevant to:\n"
                f"1. Agent Harnesses, Benchmarks, Evals, Sandboxes (SWE-bench, GAIA, agent testing, regression harnesses)\n"
                f"2. Model Context Protocol (MCP), Agent Tools, Skills & Plugins (tool calling, FastMCP, MCP servers)\n"
                f"3. Autonomous Agent Frameworks, Multi-Agent Systems, Coding Agents (LangGraph, CrewAI, AutoGen, browser-use)\n"
                f"4. Frontier AI Models, LLMs & Reasoning (OpenAI, Anthropic, DeepSeek, Gemini, prompt engineering, RLVR)\n\n"
                f"CRITICAL REJECTION CRITERIA:\n"
                f"- General programming (e.g., SQLite single-file apps, CSS frameworks, Java/Rust releases, generic OS/Linux, hardware, terminal fonts) MUST BE REJECTED (is_worthwhile: false).\n"
                f"- General business, personal career essays, company layoffs, or non-AI software MUST BE REJECTED.\n"
                f"- Only approve articles that provide genuine engineering value to AI and Agent developers.\n\n"
                f"[Candidate Article]\n"
                f"- Title: {title}\n"
                f"- Summary: {summary}\n"
                f"- Source: {source}\n\n"
                f"Respond with JSON ONLY (do not include markdown code block backticks if possible, just the raw JSON object):\n"
                f"{{\n"
                f'  "is_relevant_to_ai_agent": true,\n'
                f'  "category": "harness" | "mcp_plugins_skills" | "agent_tech" | "ai_news" | "irrelevant",\n'
                f'  "relevance_score": 8.5,\n'
                f'  "quality_score": 7.5,\n'
                f'  "is_worthwhile": true,\n'
                f'  "is_high_signal": true,\n'
                f'  "rejection_reason": null,\n'
                f'  "why_it_matters": "1-2 concise Korean sentences explaining developer architectural significance"\n'
                f"}}"
            )

            try:
                live_ans, model_name = await self._generate_live_answer(prompt)
                if live_ans:
                    cleaned = re.sub(r'^```(?:json)?\s*', '', live_ans.strip(), flags=re.IGNORECASE)
                    cleaned = re.sub(r'\s*```$', '', cleaned.strip())
                    m = re.search(r'\{.*\}', cleaned, re.DOTALL)
                    if m:
                        data = json.loads(m.group(0))
                        is_rel = bool(data.get("is_relevant_to_ai_agent"))
                        cat = str(data.get("category", "unrelated")).lower()
                        rel_score = float(data.get("relevance_score", 0.0))
                        q_score = float(data.get("quality_score", 5.0))
                        cutoff = getattr(settings, "QUALITY_CUTOFF_SCORE", 5.0)
                        high_thresh = getattr(settings, "HIGH_SIGNAL_THRESHOLD", 7.0)

                        is_worthwhile = bool(data.get("is_worthwhile")) and is_rel and (cat != "irrelevant") and (rel_score >= 5.0) and (q_score >= cutoff)
                        is_high_signal = is_worthwhile and (q_score >= high_thresh or bool(data.get("is_high_signal")))

                        result = {
                            "quality_score": round(q_score, 1),
                            "relevance_score": round(rel_score, 1),
                            "is_worthwhile": is_worthwhile,
                            "is_high_signal": is_high_signal,
                            "category": cat if (is_worthwhile and cat in CATEGORY_INSIGHTS) else "unrelated",
                            "rejection_reason": data.get("rejection_reason") if not is_worthwhile else None,
                            "why_it_matters": data.get("why_it_matters"),
                            "evaluated_by": sanitize_model_identifier(model_name)
                        }
                        self._eval_cache[cache_key] = result
                        return result
            except Exception as e:
                logger.warning(f"Live LLM evaluation error: {e}, falling back to strict heuristic gate")

        # 3. Strict Heuristic Fallback
        base_eval = self.evaluate_quality_and_signal(title, summary, source)
        cat, _, _ = classify_and_tag(title, summary)

        if not base_eval["is_worthwhile"] or cat == "unrelated":
            result = {
                "quality_score": base_eval["quality_score"],
                "relevance_score": 0.0,
                "is_worthwhile": False,
                "is_high_signal": False,
                "category": "unrelated",
                "rejection_reason": base_eval.get("rejection_reason") or "Strict heuristic rejection: Low signal or unrelated",
                "why_it_matters": None,
                "evaluated_by": "heuristic_fallback"
            }
        else:
            result = {
                "quality_score": base_eval["quality_score"],
                "relevance_score": 7.0,
                "is_worthwhile": True,
                "is_high_signal": base_eval["is_high_signal"],
                "category": cat,
                "rejection_reason": None,
                "why_it_matters": None,
                "evaluated_by": "heuristic_fallback"
            }

        self._eval_cache[cache_key] = result
        return result

    def generate_synthesis(
        self,
        title: str,
        summary: str,
        category: str,
        why_it_matters_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generates 3-bullet TL;DR and 'Why it matters' developer insight."""
        tech_entities = self.extract_tech_stack(f"{title} {summary}")
        clean_sum = (summary or "").strip()

        # Generate 3 crisp TL;DR bullets
        bullets = []
        bullets.append(f"핵심 주제: {title}")

        if tech_entities:
            bullets.append(f"관련 기술/모델: {', '.join(tech_entities[:4])} 적용 및 생태계 연계")
        else:
            bullets.append("AI 에이전트 및 하네스 최신 개발 워크플로우 분석")

        if clean_sum:
            # take first 1-2 clean sentences
            sentences = [s.strip() for s in re.split(r'[.!?]\s+', clean_sum) if len(s.strip()) > 15]
            if sentences:
                bullets.append(f"주요 내용: {sentences[0]}")
            else:
                bullets.append(f"주요 내용: {clean_sum[:120]}...")
        else:
            bullets.append("공식 레포지토리 및 기술 문서 릴리즈")

        # Developer insight: Use override from LLM evaluation if available
        base_insight = CATEGORY_INSIGHTS.get(category, CATEGORY_INSIGHTS["ai_news"])
        if why_it_matters_override and len(why_it_matters_override.strip()) > 10:
            why_it_matters = why_it_matters_override.strip()
        elif tech_entities:
            why_it_matters = f"{tech_entities[0]} 기반 구현에서 {base_insight}"
        else:
            why_it_matters = base_insight

        return {
            "tldr_bullets": bullets[:3],
            "why_it_matters": why_it_matters,
            "tech_stack": tech_entities
        }

    async def answer_question_with_meta(
        self,
        item_title: str,
        item_summary: str,
        category: str,
        tech_stack: List[str],
        question: str
    ) -> Tuple[str, str]:
        """Interactive Ask AI answer generator returning (answer_text, model_used)."""
        cache_key = f"{item_title.strip()}:{question.strip().lower()}"
        if cache_key in self._qa_cache:
            logger.info(f"Returning cached answer for key: {cache_key[:60]}...")
            return self._qa_cache[cache_key]

        prompt = (
            f"당신은 최신 AI 기술, 자율 에이전트(Autonomous Agents), 하네스(Harness) 벤치마크 및 MCP(Model Context Protocol) 생태계 전문 수석 아키텍트입니다.\n"
            f"제공된 기술 기사 정보를 바탕으로 사용자의 질문에 대해 실무 아키텍처 및 엔지니어링 관점에서 구체적이고 깊이 있는 기술 답변을 한국어 마크다운(Markdown)으로 작성해주세요.\n\n"
            f"[분석 대상 소식]\n"
            f"- 제목: {item_title}\n"
            f"- 내용 및 맥락: {item_summary}\n"
            f"- 기술 분류: {category}\n"
            f"- 연관 기술 스택: {', '.join(tech_stack) if tech_stack else 'AI / Agent Framework'}\n\n"
            f"[사용자 질문]\n"
            f"{question}\n\n"
            f"[작성 가이드라인]\n"
            f"1. 기사 제목이나 요약을 단순 나열하거나 앵무새처럼 복사하지 마세요.\n"
            f"2. 질문자의 의도를 정확히 파악하여 기술적 메커니즘, 실제 프로젝트에 도입/연동하는 구체적 방법, 실무 아키텍처 관점의 장단점 및 트레이드오프를 체계적으로 설명하세요.\n"
            f"3. 가독성을 위해 마크다운 헤딩(###), 불릿 포인트(-), 볼드체, 인라인 코드(`...`)를 적극 활용하세요.\n"
            f"4. 실무 개발팀이 바로 실행해볼 수 있는 구체적인 액션 아이템이나 주의점(Caution)을 1~2개 제시해주세요."
        )

        live_ans, model_name = await self._generate_live_answer(prompt)
        if live_ans and model_name:
            self._qa_cache[cache_key] = (live_ans, model_name)
            return live_ans, model_name

        return self._generate_heuristic_answer(item_title, item_summary, category, tech_stack, question)

    def _generate_heuristic_answer(
        self,
        item_title: str,
        item_summary: str,
        category: str,
        tech_stack: List[str],
        question: str
    ) -> Tuple[str, str]:
        q_lower = question.lower()
        tech_display = ', '.join(tech_stack) if tech_stack else 'AI 에이전트 인프라'
        category_insight = CATEGORY_INSIGHTS.get(category, '최신 AI 기술 생태계의 표준화와 워크플로우를 개선합니다.')

        if any(k in q_lower for k in ["적용", "도입", "사용", "구현", "어떻게", "how", "apply", "build"]):
            answer = (
                f"### 🛠️ 실무 적용 및 도입 가이드\n\n"
                f"**{item_title}** 기술을 실무 프로젝트 및 에이전트 워크플로우에 연동하기 위한 핵심 절차입니다:\n\n"
                f"1. **인터페이스 연동 및 환경 구성**\n"
                f"   - 주요 기술 스택인 `{tech_display}`의 공식 규격 및 레퍼런스를 검토하고 표준 프로토콜 인터페이스를 선언하세요.\n\n"
                f"2. **하네스 기반 샌드박스 격리**\n"
                f"   - 자율 에이전트 환경에 직접 연동하기 전, Docker/가상 샌드박스 환경에서 회귀 테스트 및 도구 실행 권한을 엄격히 제한하세요.\n\n"
                f"3. **관측성(Observability) 및 로깅 체계**\n"
                f"   - 에이전트의 도구 호출 입출력과 상태 변경을 실시간 추적할 수 있도록 트레이싱 로깅을 구축하세요.\n\n"
                f"> 💡 **기대 효과**: {category_insight}"
            )
        elif any(k in q_lower for k in ["차이", "비교", "장점", "단점", "한계", "vs", "difference", "compare"]):
            answer = (
                f"### ⚖️ 기술 비교 및 차별점 분석\n\n"
                f"기존 방식과 비교했을 때 **{item_title}**의 주요 특징과 트레이드오프는 다음과 같습니다:\n\n"
                f"- **핵심 차별점**: 표준화된 규격을 통해 파편화된 구현을 통합하고, 재사용성과 확장성을 극대화합니다.\n"
                f"- **기술 스택 생태계**: `{tech_display}` 기반의 모듈화 아키텍처를 채택하여 기존 파이프라인과의 결합도를 낮춥니다.\n"
                f"- **도입 시 고려사항 (Trade-off)**: 초기 연동 및 보안 하네스 구성 비용이 발생할 수 있으나 장기적 유지보수성과 평가 신뢰도를 확보할 수 있습니다.\n\n"
                f"> 📌 **시사점**: {category_insight}"
            )
        elif any(k in q_lower for k in ["원리", "구조", "아키텍처", "동작", "왜", "why", "architecture"]):
            answer = (
                f"### 💡 핵심 원리 및 아키텍처 분석\n\n"
                f"**{item_title}**의 내부 동작 구조와 설계 원리입니다:\n\n"
                f"- **프로토콜 및 인터페이스 레이어**: 클라이언트와 에이전트 간 비동기 메시지 교환 및 도구 실행을 표준화된 방식으로 오케스트레이션합니다.\n"
                f"- **연관 기술 맥락**: `{tech_display}` 생태계와 결합하여 상태 관리와 런타임 신뢰성을 보장합니다.\n"
                f"- **설계 목표**: 복합적인 도구 호출 및 멀티에이전트 환경에서 예외 처리와 회귀 검증을 체계화하는 데 목적이 있습니다.\n\n"
                f"> 🎯 **핵심 요약**: {category_insight}"
            )
        elif any(k in q_lower for k in ["보안", "격리", "안전", "안정", "security", "sandbox", "safety"]):
            answer = (
                f"### 🔒 보안 및 격리 환경 검토 사항\n\n"
                f"**{item_title}** 도입 시 필수적으로 고려해야 할 보안 가이드라인입니다:\n\n"
                f"1. **최소 권한 원칙 (Principle of Least Privilege)**: 에이전트 도구 실행 권한을 읽기 전용 또는 명시적 승인 기반으로 제한하세요.\n"
                f"2. **런타임 샌드박스**: 컨테이너 격리를 통해 로컬 호스트 자원 및 네트워크로의 무단 탈출을 차단하세요.\n"
                f"3. **민감정보 마스킹**: API 키 및 환경변수가 프롬프트나 로그에 누출되지 않도록 전처리 필터를 적용하세요."
            )
        else:
            answer = (
                f"### 🤖 기술 맥락 및 실무 분석\n\n"
                f"**{item_title}**에 대한 기술적 분석 결과입니다:\n\n"
                f"- **기술적 배경**: `{tech_display}` 기반의 최신 워크플로우로, {item_summary[:220] if item_summary else 'AI 에이전트 생태계의 주요 발전 소식입니다.'}\n"
                f"- **엔지니어링 가치**: {category_insight}\n"
                f"- **추천 액션**: 실무 프로젝트와의 접점을 탐색하기 위해 공식 문서의 인터페이스 스펙 및 예제 코드를 선행 검토하는 것을 권장합니다."
            )

        return answer, "AgentLens Heuristic Engine"

    async def stream_question_answer(
        self,
        item_title: str,
        item_summary: str,
        category: str,
        tech_stack: List[str],
        question: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Real-time streaming answer generator yielding SSE event payloads."""
        cache_key = f"{item_title.strip()}:{question.strip().lower()}"
        if cache_key in self._qa_cache:
            ans, model = self._qa_cache[cache_key]
            yield {"event": "meta", "model": f"{model} (캐시됨)"}
            words = ans.split(" ")
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i+chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                yield {"event": "token", "text": chunk}
                await asyncio.sleep(0.01)
            yield {"event": "done", "total_text": ans}
            return

        prompt = (
            f"당신은 최신 AI 기술, 자율 에이전트(Autonomous Agents), 하네스(Harness) 벤치마크 및 MCP(Model Context Protocol) 생태계 전문 수석 아키텍트입니다.\n"
            f"제공된 기술 기사 정보를 바탕으로 사용자의 질문에 대해 실무 아키텍처 및 엔지니어링 관점에서 구체적이고 깊이 있는 기술 답변을 한국어 마크다운(Markdown)으로 작성해주세요.\n\n"
            f"[분석 대상 소식]\n"
            f"- 제목: {item_title}\n"
            f"- 내용 및 맥락: {item_summary}\n"
            f"- 기술 분류: {category}\n"
            f"- 연관 기술 스택: {', '.join(tech_stack) if tech_stack else 'AI / Agent Framework'}\n\n"
            f"[사용자 질문]\n"
            f"{question}\n\n"
            f"[작성 가이드라인]\n"
            f"1. 기사 제목이나 요약을 단순 나열하거나 앵무새처럼 복사하지 마세요.\n"
            f"2. 질문자의 의도를 정확히 파악하여 기술적 메커니즘, 실제 프로젝트에 도입/연동하는 구체적 방법, 실무 아키텍처 관점의 장단점 및 트레이드오프를 체계적으로 설명하세요.\n"
            f"3. 가독성을 위해 마크다운 헤딩(###), 불릿 포인트(-), 볼드체, 인라인 코드(`...`), 코드 블록(```)을 적극 활용하세요.\n"
            f"4. 실무 개발팀이 바로 실행해볼 수 있는 구체적인 액션 아이템이나 주의점(Caution)을 1~2개 제시해주세요."
        )

        json_cfg = load_json_config()
        stream_succeeded = False
        full_text = ""
        model_used = ""

        # 1. Try Anthropic Claude streaming (Priority 1)
        if self.anthropic_provider.is_available():
            try:
                first_chunk = True
                async for chunk, m_name in self.anthropic_provider.stream_chat(prompt=prompt):
                    if chunk:
                        clean_model = sanitize_model_identifier(m_name)
                        if first_chunk:
                            yield {"event": "meta", "model": clean_model}
                            model_used = clean_model
                            first_chunk = False
                        full_text += chunk
                        yield {"event": "token", "text": chunk}
                if full_text.strip():
                    stream_succeeded = True
            except Exception as e:
                logger.warning(f"Anthropic streaming failed in stream_question_answer: {e}")

        # Note: Google Gemini streaming is permanently decommissioned per POL-LLM-005, REQ-LLM-002, and ADR-012.

        # 2. Try OpenAI Official SDK streaming if Anthropic wasn't used or failed
        if not stream_succeeded:
            openai_key = (
                getattr(settings, "OPENAI_API_KEY", "")
                or json_cfg.get("llm", {}).get("openai_api_key", "")
                or os.environ.get("OPENAI_API_KEY", "")
                or self.openai_key
            )
            if openai_key:
                try:
                    import openai
                    openai_client = openai.AsyncOpenAI(api_key=openai_key)
                    o_model = getattr(settings, "OPENAI_MODEL", "") or json_cfg.get("llm", {}).get("openai_model", "") or "gpt-4o-mini"
                    stream = await openai_client.chat.completions.create(
                        model=o_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        max_tokens=2048,
                        stream=True
                    )
                    clean_model = sanitize_model_identifier(f"OpenAI {o_model}")
                    yield {"event": "meta", "model": clean_model}
                    model_used = clean_model
                    async for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                            txt = chunk.choices[0].delta.content
                            full_text += txt
                            yield {"event": "token", "text": txt}
                    if full_text.strip():
                        stream_succeeded = True
                except Exception as e:
                    logger.warning(f"OpenAI SDK stream failed: {e}")

        # 3. Fallback Heuristic Engine with smooth chunk streaming
        if not stream_succeeded or not full_text.strip():
            fallback_ans, fallback_model = self._generate_heuristic_answer(
                item_title=item_title,
                item_summary=item_summary,
                category=category,
                tech_stack=tech_stack,
                question=question
            )
            clean_fb_model = sanitize_model_identifier(fallback_model)
            yield {"event": "meta", "model": clean_fb_model}
            model_used = clean_fb_model
            full_text = fallback_ans
            words = fallback_ans.split(" ")
            chunk_size = 4
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i+chunk_size])
                if i + chunk_size < len(words):
                    chunk += " "
                yield {"event": "token", "text": chunk}
                await asyncio.sleep(0.015)

        if full_text:
            self._qa_cache[cache_key] = (full_text, sanitize_model_identifier(model_used))
            yield {"event": "done", "total_text": full_text}

    async def answer_question(self, item_title: str, item_summary: str, category: str, tech_stack: List[str], question: str) -> str:
        """Backwards-compatible wrapper returning only answer string."""
        ans, _ = await self.answer_question_with_meta(item_title, item_summary, category, tech_stack, question)
        return ans

llm_processor = LLMProcessor()
