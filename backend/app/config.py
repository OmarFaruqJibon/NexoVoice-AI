# config.py
import os

BASE_DIR = r"C:\Users\omarf\Desktop\Jibon\projects\voice-agent\backend"

TMP_DIR = os.getenv("TMP_DIR", os.path.join(BASE_DIR, "tmp"))
os.makedirs(TMP_DIR, exist_ok=True)

# OLLAMA CONFIG
OLLAMA_API = os.getenv("OLLAMA_API", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# Piper
PIPER_CMD = os.path.join(BASE_DIR, "models", "piper", "piper.exe")
PIPER_MODEL = os.path.join(BASE_DIR, "models", "piper", "en_US-lessac-medium.onnx")

# VALIDATION
if not os.path.exists(PIPER_CMD):
    print("⚠ WARNING: Piper binary not found at PIPER_CMD:", PIPER_CMD)

if not os.path.exists(PIPER_MODEL):
    print("⚠ WARNING: Piper model (.onnx) not found at PIPER_MODEL:", PIPER_MODEL)

if not os.path.exists(TMP_DIR):
    os.makedirs(TMP_DIR, exist_ok=True)
