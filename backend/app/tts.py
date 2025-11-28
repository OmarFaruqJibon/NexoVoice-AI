# tts.py
import subprocess
import os
from .config import PIPER_CMD, PIPER_MODEL, TMP_DIR

from colorama import init as colorama_init, Fore, Style
colorama_init(autoreset=True)

def tts_piper(text: str, output_path: str = None) -> str:
    print(f"{Fore.MAGENTA}[TTS] Text: {Style.RESET_ALL} {text}")

    if output_path is None:
        output_path = os.path.join(TMP_DIR, "reply.wav")

    cmd = [
        PIPER_CMD,
        "--model", PIPER_MODEL,
        "--text", text,
        "--output_file", output_path,
    ]

    try:
        subprocess.run(
            cmd,
            input=text.encode("utf-8"),
            check=True
        )
    except Exception as e:
        print(Fore.RED + "[TTS] ERROR: Piper failed!" + Style.RESET_ALL)
        raise RuntimeError(f"Piper TTS failed: {e}")
    return output_path
