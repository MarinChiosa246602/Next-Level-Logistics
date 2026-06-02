import os
from openai import APIConnectionError, APITimeoutError, OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = (
    os.getenv("API_KEY")
    or os.getenv("OPENAI_API_KEY")
    or os.getenv("GEMINI_API_KEY")
    or os.getenv("ANTHROPIC_API_KEY")
)

if not api_key:
    raise RuntimeError(
        "Missing API key. Set API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY."
    )

base_url = os.getenv("LLM_BASE_URL", "https://edirlei.com/buas-llm-server/v1")
model = os.getenv("LLM_MODEL", "Qwen3.5-122B")
timeout_seconds = float(os.getenv("LLM_TIMEOUT_SECONDS", "60"))
max_retries = int(os.getenv("LLM_MAX_RETRIES", "2"))

client = OpenAI(
    base_url=base_url,
    api_key=api_key,
    timeout=timeout_seconds,
    max_retries=max_retries,
)

try:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful coding assistant"},
            {"role": "user", "content": "Explain this codebase"}
        ],
        temperature=0.7,
        max_tokens=4096,
        extra_body={
            "chat_template_kwargs": {"enable_thinking": False},
            "reasoning_effort": "low",
        },
    )
except (APITimeoutError, APIConnectionError) as exc:
    raise RuntimeError(
        f"Could not reach the LLM server at {base_url}. Check network access, or set LLM_BASE_URL to a reachable endpoint."
    ) from exc

print(response.choices[0].message.content)