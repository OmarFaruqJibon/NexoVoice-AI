# stt.py
from faster_whisper import WhisperModel
from .config import TMP_DIR

MODEL_NAME = "medium"
DEVICE = "cuda"

print(f">>> [STT] Loading faster-whisper model: {MODEL_NAME} on {DEVICE}...")
model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type="float16")
print(">>> [STT] STT model loaded successfully.")


def transcribe(wav_path: str) -> str:
    print(f">>> [STT] Transcribing file: {wav_path}")

    segments, info = model.transcribe(wav_path)
    text = " ".join([seg.text.strip() for seg in segments if seg.text.strip()])

    print(f">>> [STT] Recognized text: {text}")
    return text
