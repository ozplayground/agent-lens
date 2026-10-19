from abc import ABC, abstractmethod
from typing import AsyncGenerator, Tuple, Optional, Any, Dict

class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers (Gemini, OpenAI, Ollama, Mock).
    Defined in ADR-008 and System Design v3.0.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Provider identifier (e.g. 'gemini', 'openai', 'ollama', 'mock')."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Checks API key validity or local daemon connectivity."""
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, **kwargs) -> Tuple[str, str]:
        """Generates complete text response returning (text, model_identifier)."""
        pass

    @abstractmethod
    async def stream_chat(
        self, prompt: str, **kwargs
    ) -> AsyncGenerator[Tuple[str, str], None]:
        """Yields (token_text, model_identifier) chunks."""
        pass
