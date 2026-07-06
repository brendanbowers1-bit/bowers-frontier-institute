"""Local Ollama client for hedge memo explanations."""

from __future__ import annotations

import requests

from currency_hedge_llm.llm.base import LLMClient


class OllamaClient(LLMClient):
    """Generate text with a local Ollama model."""

    def __init__(
        self,
        model: str = "qwen2.5:7b-instruct",
        url: str = "http://localhost:11434/api/generate",
        temperature: float = 0.2,
        timeout_seconds: int = 120,
    ) -> None:
        self.model = model
        self.url = url
        self.temperature = temperature
        self.timeout_seconds = timeout_seconds

    def generate(self, prompt: str) -> str:
        """Call the Ollama generate endpoint."""

        response = requests.post(
            self.url,
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": self.temperature},
            },
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        return str(payload.get("response", "")).strip()
