# main.py
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import re
from colorama import init as colorama_init, Fore, Style

from .utils import save_upload_file_tmp, convert_to_wav, cleanup_files, make_tmp_filename
from .stt import transcribe
from .llm import ask_ollama
from .tts import tts_piper

app = FastAPI(title="Voice AI Chatbot API")

colorama_init(autoreset=True)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_text_for_tts(text: str) -> str:
    
    text = re.sub(r"[*_`~]", "", text)
    text = re.sub(r"^#+\s*", "", text)

    return text.strip()


@app.post("/voice-chat")
async def voice_chat(audio: UploadFile = File(...)):
    print(Fore.BLUE + "[VOICE-CHAT] Request received" + Style.RESET_ALL)

    src_path = None
    wav_path = None

    try:
        # Save upload
        src_path = save_upload_file_tmp(audio)

        wav_path = make_tmp_filename('.wav')
        convert_to_wav(src_path, wav_path)

        # STT
        text = transcribe(wav_path)
        print(f"{Fore.MAGENTA}[STT] Transcribed text: {Style.RESET_ALL} {text}")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty or unrecognized speech.")

        # LLM
        prompt = f"User said: {text}\nAssistant:"
        reply = ask_ollama(prompt)
        # print(Fore.RED + f"[LLM] Replay: {reply}" + Style.RESET_ALL)
        print(f"{Fore.MAGENTA}[LLM] Reply: {Style.RESET_ALL} {reply}")
        
        # Clean the reply for TTS
        cleaned_reply = clean_text_for_tts(reply)

        # TTS
        out_wav = make_tmp_filename('.wav')
        tts_path = tts_piper(cleaned_reply, output_path=out_wav)

        return FileResponse(tts_path, media_type="audio/wav")

    finally:
        if src_path:
            cleanup_files(src_path)
        if wav_path:
            cleanup_files(wav_path)



