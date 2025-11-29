# llm.py
import requests
from colorama import init as colorama_init, Fore, Style
from .config import OLLAMA_API, OLLAMA_MODEL

colorama_init(autoreset=True)


def ask_ollama(chat_payload: dict, max_tokens: int = 250) -> str:

    system_prompt = chat_payload.get("system", "")
    messages = chat_payload.get("messages", [])

    conversation_text = system_prompt + "\n\n"

    for msg in messages:
        role = "User" if msg["role"] == "user" else "Assistant"
        conversation_text += f"{role}: {msg['content']}\n"

    conversation_text += "Assistant:"

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": conversation_text,
        "max_tokens": max_tokens,
        "temperature": 0.4,
        "stream": False
    }

    try:
        resp = requests.post(OLLAMA_API, json=payload, timeout=60)
        resp.raise_for_status()

        data = resp.json()
        if "response" in data:
            return data["response"].strip()

        print(Fore.RED + "[LLM] Unexpected Ollama format!" + Style.RESET_ALL)
        return str(data)

    except Exception as e:
        print(Fore.RED + f"[LLM] Ollama error: {e}" + Style.RESET_ALL)
        return "Sorry, I could not process that. Try again."
