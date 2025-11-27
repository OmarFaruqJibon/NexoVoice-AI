# main.py
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .utils import save_upload_file_tmp, convert_to_wav, cleanup_files, make_tmp_filename
from .stt import transcribe
from .llm import ask_ollama
from .tts import tts_piper


app = FastAPI(title="Voice AI Chatbot API")

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


@app.post("/voice-chat")
async def voice_chat(audio: UploadFile = File(...)):
    print(">>> [VOICE-CHAT] Request received")

    src_path = None
    wav_path = None

    try:
        # Save upload
        print(">>> [VOICE-CHAT] Saving uploaded audio...")
        src_path = save_upload_file_tmp(audio)

        wav_path = make_tmp_filename('.wav')
        print(f">>> [VOICE-CHAT] Converting to WAV -> {wav_path}")
        convert_to_wav(src_path, wav_path)

        # STT
        print(">>> [STT] Starting transcription...")
        text = transcribe(wav_path)
        print(f">>> [STT] Transcribed text: {text}")

        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty or unrecognized speech.")

        # LLM
        print(">>> [LLM] Sending text to Ollama...")
        prompt = f"User said: {text}\nAssistant:"
        reply = ask_ollama(prompt)
        print(f">>> [LLM] Ollama reply: {reply}")

        # TTS
        print(">>> [TTS] Generating voice using Piper...")
        out_wav = make_tmp_filename('.wav')
        tts_path = tts_piper(reply, output_path=out_wav)
        print(f">>> [TTS] Piper output saved at: {tts_path}")

        print(">>> [VOICE-CHAT] Completed. Sending audio response.")
        return FileResponse(tts_path, media_type="audio/wav")

    finally:
        print(">>> [CLEANUP] Removing temp files...")
        if src_path:
            cleanup_files(src_path)
        if wav_path:
            cleanup_files(wav_path)
