# llm.py
import requests
from .config import OLLAMA_API, OLLAMA_MODEL
from colorama import init as colorama_init, Fore, Style
colorama_init(autoreset=True)

def ask_ollama(prompt: str, max_tokens: int = 512) -> str:
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "max_tokens": max_tokens,
        "temperature": 0.2,
        "stream": False
    }

    resp = requests.post(OLLAMA_API, json=payload, timeout=60)
    resp.raise_for_status()

    data = resp.json()

    if isinstance(data, dict):
        if "response" in data:
            reply = data["response"]
            return reply

        if "choices" in data:
            collected = []
            for c in data["choices"]:
                if "message" in c and "content" in c["message"]:
                    collected.append(c["message"]["content"])
                elif "text" in c:
                    collected.append(c["text"])
            reply = "\n".join(collected).strip()
            return reply

    print(Fore.RED + "[LLM] Unknown Ollama response format" + Style.RESET_ALL)
    return str(data)
