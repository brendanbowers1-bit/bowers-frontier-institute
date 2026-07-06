"""Abstract LLM client contract."""

from __future__ import annotations

from abc import ABC, abstractmethod


class LLMClient(ABC):
    """Interface used by memo writing code to request treasury-language text."""

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """Generate text from a prompt."""
