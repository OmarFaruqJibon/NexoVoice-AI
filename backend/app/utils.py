# utils.py
import os
import uuid
import subprocess
from pathlib import Path
from pydub import AudioSegment

from .config import TMP_DIR

def make_tmp_filename(ext: str = ".wav") -> str:
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(TMP_DIR, name)
    return path

def save_upload_file_tmp(upload_file) -> str:
    path = make_tmp_filename(".webm")
    with open(path, "wb") as f:
        f.write(upload_file.file.read())
    return path

def convert_to_wav(src_path: str, dst_path: str) -> str:
    audio = AudioSegment.from_file(src_path)
    audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
    audio.export(dst_path, format="wav")
    return dst_path

def cleanup_files(*paths):
    for p in paths:
        try:
            os.remove(p)
        except Exception:
            pass