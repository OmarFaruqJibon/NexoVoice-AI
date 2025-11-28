# stt.py
from faster_whisper import WhisperModel

from .config import TMP_DIR
from colorama import init as colorama_init, Fore, Style
colorama_init(autoreset=True)


MODEL_NAME = "medium"
DEVICE = "cuda"

model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type="float16")
print(Fore.BLUE + "[STT] STT model loaded successfully." + Style.RESET_ALL)
 
def transcribe(wav_path: str) -> str:

    segments, info = model.transcribe(wav_path)
    text = " ".join([seg.text.strip() for seg in segments if seg.text.strip()])

    print(f"{Fore.MAGENTA}[STT] Recognized text: {Style.RESET_ALL} {text}")
    return text
