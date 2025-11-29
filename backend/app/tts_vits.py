# tts_vits.py
import os
import re
import torch
import numpy as np
import soundfile as sf
from TTS.utils.synthesizer import Synthesizer

# Paths
BASE_DIR = r"C:\Users\omarf\Desktop\Jibon\projects\voice-agent\backend"
MODEL_PATH = os.path.join(BASE_DIR, "models", "vits_bn", "pytorch_model.pth")
CONFIG_PATH = os.path.join(BASE_DIR, "models", "vits_bn", "config.json")

print(">>> Loading Bangla VITS synthesizer...")
synthesizer = Synthesizer(
    tts_checkpoint=MODEL_PATH,
    tts_config_path=CONFIG_PATH,
    use_cuda=torch.cuda.is_available()
)

# Bangla digits mapping
DIGIT_MAP = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
}

def preprocess_bangla_text(text: str) -> str:
    """
    Clean text for Bangla VITS:
    - Remove URLs, English letters, punctuation symbols
    - Convert numbers to Bangla digits
    """
    # Remove URLs
    text = re.sub(r"http\S+", "", text)
    # Convert digits to Bangla
    text = ''.join(DIGIT_MAP.get(ch, ch) for ch in text)
    # Remove English letters and unwanted symbols
    text = re.sub(r"[A-Za-z\[\]\(\)_\-:*`~]", "", text)
    # Remove extra whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def tts_bn(text: str, output_path: str):
    """
    Generate Bangla speech directly via VITS Synthesizer
    """
    # Split Bangla text into sentences
    sentences = re.split(r"[।!?]", text)
    combined_audio = np.array([], dtype=np.float32)

    for s in sentences:
        s = preprocess_bangla_text(s)
        if not s:
            continue
        print(f">>> [VITS] Generating audio for: {s}")
        audio = synthesizer.tts(s)
        combined_audio = np.concatenate([combined_audio, audio])

    sf.write(output_path, combined_audio, synthesizer.output_sample_rate)
    print(f">>> [VITS] Saved to {output_path}")
    return output_path
