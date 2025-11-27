# tts.py
import subprocess
import os
from .config import PIPER_CMD, PIPER_MODEL, TMP_DIR

def tts_piper(text: str, output_path: str = None) -> str:
    print(">>> [TTS] Starting Piper TTS...")
    print(f">>> [TTS] Text: {text}")
    print(f">>> [TTS] Piper CMD: {PIPER_CMD}")
    print(f">>> [TTS] Piper MODEL: {PIPER_MODEL}")

    if output_path is None:
        output_path = os.path.join(TMP_DIR, "reply.wav")

    print(f">>> [TTS] Output file: {output_path}")

    cmd = [
        PIPER_CMD,
        "--model", PIPER_MODEL,
        "--text", text,
        "--output_file", output_path,
    ]

    print(f">>> [TTS] Running command: {' '.join(cmd)}")

    try:
        subprocess.run(
            cmd,
            input=text.encode("utf-8"),
            check=True
        )
    except Exception as e:
        print(">>> [TTS] ERROR: Piper failed!")
        raise RuntimeError(f"Piper TTS failed: {e}")

    print(">>> [TTS] Piper completed successfully")
    return output_path
