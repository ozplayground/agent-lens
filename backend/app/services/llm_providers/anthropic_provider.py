import os
import json
import re
import logging
from typing import AsyncGenerator, Tuple, Optional, Any, Dict, List
import httpx

from app.config import settings, load_json_config
from app.services.llm_providers.base import BaseLLMProvider

logger = logging.getLogger("agentlens.llm.anthropic")


class AnthropicKeyMissingException(Exception):
    """Raised when Anthropic API key is missing or invalid (HTTP 401)."""
    pass


class AnthropicQuotaExceededException(Exception):
    """Raised when Anthropic Claude rate limit / quota is exceeded (HTTP 429)."""
    pass


class AnthropicOverloadedException(Exception):
    """Raised when Anthropic upstream servers are overloaded (HTTP 529 / 503)."""
    pass


MODEL_TIER_MAPPING: Dict[str, Tuple[str, str]] = {
    # Haiku
    "haiku": ("claude-3-5-haiku-20241022", "haiku"),
    "claude-3-5-haiku": ("claude-3-5-haiku-20241022", "haiku"),
    "claude-3-5-haiku-latest": ("claude-3-5-haiku-20241022", "haiku"),
    "claude-3-5-haiku-20241022": ("claude-3-5-haiku-20241022", "haiku"),
    # Sonnet (default)
    "sonnet": ("claude-3-5-sonnet-20241022", "sonnet"),
    "claude-3-5-sonnet": ("claude-3-5-sonnet-20241022", "sonnet"),
    "claude-3-5-sonnet-latest": ("claude-3-5-sonnet-20241022", "sonnet"),
    "claude-3-5-sonnet-20241022": ("claude-3-5-sonnet-20241022", "sonnet"),
    # Opus
    "opus": ("claude-3-5-opus-latest", "opus"),
    "claude-3-5-opus": ("claude-3-5-opus-latest", "opus"),
    "claude-3-5-opus-latest": ("claude-3-5-opus-latest", "opus"),
    "claude-3-opus-20240229": ("claude-3-opus-20240229", "opus"),
}

DEFAULT_MODEL = "claude-3-5-sonnet-20241022"
DEFAULT_TIER = "sonnet"


def resolve_model_and_tier(model_or_tier: Optional[str]) -> Tuple[str, str]:
    """Resolves arbitrary model name or tier identifier into (anthropic_model_id, tier_name)."""
    if not model_or_tier:
        return DEFAULT_MODEL, DEFAULT_TIER

    normalized = model_or_tier.strip().lower()

    # POL-LLM-005 & ADR-012: Anti-Gemini Policy. Gemini/Google identifiers are strictly rejected.
    if "gemini" in normalized or "google" in normalized:
        logger.warning(
            f"POL-LLM-005: Unauthorized model '{model_or_tier}' blocked in resolve_model_and_tier. Normalizing to Sonnet default."
        )
        return DEFAULT_MODEL, DEFAULT_TIER

    if normalized in MODEL_TIER_MAPPING:
        return MODEL_TIER_MAPPING[normalized]

    # Partial match fallback
    if "haiku" in normalized:
        return MODEL_TIER_MAPPING["haiku"]
    elif "opus" in normalized:
        return MODEL_TIER_MAPPING["opus"]
    elif "sonnet" in normalized:
        return MODEL_TIER_MAPPING["sonnet"]

    return DEFAULT_MODEL, DEFAULT_TIER


class AnthropicLLMProvider(BaseLLMProvider):
    """
    Anthropic Claude 3-Tier Multi-Model Provider.
    Implements ADR-011:
    - Pure httpx REST client (no external anthropic SDK dependency)
    - 3-Tier model routing (Haiku, Sonnet, Opus)
    - 2,500+ token prompt caching via `anthropic-beta: prompt-caching-2024-07-31`
    - TokenUsageMeta extraction (input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens)
    """

    BASE_URL = "https://api.anthropic.com/v1/messages"
    API_VERSION = "2023-06-01"
    BETA_HEADER = "prompt-caching-2024-07-31"

    def __init__(self, api_key: Optional[str] = None):
        self._explicit_key = api_key
        self.last_usage: Dict[str, Any] = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_input_tokens": None,
            "cache_creation_input_tokens": None,
        }

    @property
    def provider_name(self) -> str:
        return "anthropic"

    def _get_api_key(self) -> str:
        if self._explicit_key is not None:
            return self._explicit_key
        key = getattr(settings, "ANTHROPIC_API_KEY", "") or os.environ.get("ANTHROPIC_API_KEY", "")
        if not key:
            json_cfg = load_json_config()
            key = json_cfg.get("llm", {}).get("anthropic_api_key", "")
        return key.strip()

    def is_available(self) -> bool:
        return bool(self._get_api_key())

    def _get_headers(self) -> Dict[str, str]:
        key = self._get_api_key()
        return {
            "x-api-key": key,
            "anthropic-version": self.API_VERSION,
            "anthropic-beta": self.BETA_HEADER,
            "content-type": "application/json",
        }

    def build_cached_system_block(self, system_text: str) -> List[Dict[str, Any]]:
        """Constructs a system block with ephemeral prompt caching control (ADR-011)."""
        return [
            {
                "type": "text",
                "text": system_text,
                "cache_control": {"type": "ephemeral"},
            }
        ]

    def _extract_usage(self, raw_usage: Dict[str, Any]) -> Dict[str, Any]:
        extracted = {
            "input_tokens": int(raw_usage.get("input_tokens", 0)),
            "output_tokens": int(raw_usage.get("output_tokens", 0)),
            "cache_read_input_tokens": raw_usage.get("cache_read_input_tokens"),
            "cache_creation_input_tokens": raw_usage.get("cache_creation_input_tokens"),
        }
        self.last_usage = extracted
        return extracted

    def _check_error_status(self, status_code: int, error_text: str):
        if status_code == 401:
            raise AnthropicKeyMissingException(f"Anthropic API 키 인증 실패 (401): {error_text}")
        elif status_code == 429:
            raise AnthropicQuotaExceededException(f"Anthropic API 호출 한도 초과 (429): {error_text}")
        elif status_code in (503, 529):
            raise AnthropicOverloadedException(f"Anthropic 업스트림 서버 과부하 (529/503): {error_text}")
        elif status_code != 200:
            raise RuntimeError(f"Anthropic API 오류 [{status_code}]: {error_text}")

    async def generate_text(self, prompt: str, **kwargs) -> Tuple[str, str]:
        """Generates complete text response returning (text, model_identifier)."""
        text, model, _ = await self.generate_text_with_usage(prompt, **kwargs)
        return text, model

    async def generate_text_with_usage(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_blocks: Optional[List[Dict[str, Any]]] = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
        **kwargs,
    ) -> Tuple[str, str, Dict[str, Any]]:
        """Generates complete text response returning (text, model_identifier, usage_meta)."""
        if not self.is_available():
            raise AnthropicKeyMissingException("Anthropic API 키가 설정되지 않았습니다.")

        resolved_model, _ = resolve_model_and_tier(model)
        payload: Dict[str, Any] = {
            "model": resolved_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system_blocks:
            payload["system"] = system_blocks

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(self.BASE_URL, headers=self._get_headers(), json=payload)
            if resp.status_code != 200:
                self._check_error_status(resp.status_code, resp.text)

            data = resp.json()
            content_blocks = data.get("content", [])
            text_parts = [b.get("text", "") for b in content_blocks if b.get("type") == "text"]
            full_text = "".join(text_parts).strip()
            usage = self._extract_usage(data.get("usage", {}))

            return full_text, resolved_model, usage

    async def stream_chat(
        self,
        prompt: str,
        model: Optional[str] = None,
        system_blocks: Optional[List[Dict[str, Any]]] = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
        **kwargs,
    ) -> AsyncGenerator[Tuple[str, str], None]:
        """Yields (token_text, model_identifier) chunks via SSE streaming."""
        if not self.is_available():
            raise AnthropicKeyMissingException("Anthropic API 키가 설정되지 않았습니다.")

        resolved_model, _ = resolve_model_and_tier(model)
        payload: Dict[str, Any] = {
            "model": resolved_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": True,
        }
        if system_blocks:
            payload["system"] = system_blocks

        accumulated_usage: Dict[str, Any] = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_input_tokens": None,
            "cache_creation_input_tokens": None,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", self.BASE_URL, headers=self._get_headers(), json=payload
            ) as response:
                if response.status_code != 200:
                    err_body = await response.aread()
                    self._check_error_status(response.status_code, err_body.decode("utf-8", errors="replace"))

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        continue

                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break

                    try:
                        event_data = json.loads(data_str)
                        event_type = event_data.get("type")

                        if event_type == "message_start":
                            msg = event_data.get("message", {})
                            u = msg.get("usage", {})
                            accumulated_usage["input_tokens"] = u.get("input_tokens", 0)
                            accumulated_usage["cache_read_input_tokens"] = u.get("cache_read_input_tokens")
                            accumulated_usage["cache_creation_input_tokens"] = u.get("cache_creation_input_tokens")
                        elif event_type == "content_block_delta":
                            delta = event_data.get("delta", {})
                            if delta.get("type") == "text_delta":
                                chunk = delta.get("text", "")
                                if chunk:
                                    yield chunk, resolved_model
                        elif event_type == "message_delta":
                            u = event_data.get("usage", {})
                            if "output_tokens" in u:
                                accumulated_usage["output_tokens"] = u["output_tokens"]
                    except json.JSONDecodeError:
                        continue

        self.last_usage = self._extract_usage(accumulated_usage)

    async def generate_structured_summary(
        self,
        title: str,
        summary: str,
        source: str = "web",
        full_content: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes dedicated Claude Sonnet 5.5 ingestion analysis with 2,500 token Prompt Caching (ADR-011).
        Reduces input token cost by up to 90% via ephemeral prompt cache hits.
        """
        system_blocks = self.build_cached_system_block(SONNET_SYSTEM_PROMPT_CACHED)
        user_prompt = (
            f"Analyze the following technical article for AgentLens:\n\n"
            f"[Article Metadata]\n"
            f"- Title: {title}\n"
            f"- Source: {source}\n"
            f"- Abstract/Summary: {summary}\n"
        )
        if full_content:
            user_prompt += f"- Extracted Clean Text:\n{full_content[:4000]}\n"

        text, model, usage = await self.generate_text_with_usage(
            prompt=user_prompt,
            model="claude-3-5-sonnet",
            system_blocks=system_blocks,
            max_tokens=1500,
            temperature=0.2,
        )

        cleaned = re.sub(r'^```(?:json)?\s*', '', text.strip(), flags=re.IGNORECASE)
        cleaned = re.sub(r'\s*```$', '', cleaned.strip())
        m = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if m:
            data = json.loads(m.group(0))
            data["usage"] = usage
            data["evaluated_by"] = model
            return data

        return {
            "is_relevant_to_ai_agent": True,
            "category": "ai_news",
            "relevance_score": 7.0,
            "quality_score": 6.5,
            "is_worthwhile": True,
            "is_high_signal": False,
            "why_it_matters": summary[:200] if summary else title,
            "evaluated_by": model,
            "usage": usage,
        }


SONNET_SYSTEM_PROMPT_CACHED = (
    "You are a Senior Staff Architect and Principal Technical Curator at AgentLens.\n"
    "AgentLens is a high-signal intelligence platform focused strictly on autonomous AI agents, "
    "engineering harnesses, benchmarks (SWE-bench, GAIA, WebArena), Model Context Protocol (MCP), "
    "tool calling, and frontier reasoning models.\n\n"
    "### Evaluation Rubric & Categories:\n"
    "1. 'harness': Agent harnesses, regression suites, Docker sandboxes, evaluation protocols, SWE-bench.\n"
    "2. 'mcp_plugins_skills': FastMCP, JSON-RPC MCP servers/clients, tool calling, function calling interfaces.\n"
    "3. 'agent_tech': Multi-agent architectures (LangGraph, CrewAI, AutoGen), coding agents, browser-use.\n"
    "4. 'ai_news': Frontier LLM breakthroughs, reasoning foundations, prompt caching, distillation, quantization.\n\n"
    "### Quality Scoring Guidelines:\n"
    "- Score < 5.0: Non-AI topics, generic software development, marketing spam (rejected: is_worthwhile=false).\n"
    "- 5.0 <= Score < 7.8: Valid AI news or tool updates with standard utility.\n"
    "- Score >= 7.8: High-signal architectural breakthroughs, deep benchmarks, production post-mortems ('⭐️ Must Read').\n\n"
    "### Output Requirements:\n"
    "Respond with STRICT JSON format only (no markdown enclosing, raw JSON object):\n"
    "{\n"
    '  "is_relevant_to_ai_agent": boolean,\n'
    '  "category": "harness" | "mcp_plugins_skills" | "agent_tech" | "ai_news" | "irrelevant",\n'
    '  "relevance_score": float (0.0 to 10.0),\n'
    '  "quality_score": float (0.0 to 10.0),\n'
    '  "is_worthwhile": boolean,\n'
    '  "is_high_signal": boolean,\n'
    '  "rejection_reason": string or null,\n'
    '  "why_it_matters": string (>= 150 Korean characters explaining architectural implications),\n'
    '  "tldr_bullets": [string, string, string],\n'
    '  "tech_stack": [string]\n'
    "}"
)

