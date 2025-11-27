import React, { useState, useRef } from "react";

export default function VoiceChatbot() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("idle");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const startRecording = async () => {
    try {
      setStatus("requesting-permission");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstart = () => {
        setRecording(true);
        setStatus("recording");
      };

      mediaRecorder.onstop = async () => {
        setRecording(false);
        setStatus("uploading");

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        try {
          const form = new FormData();
          form.append("audio", blob, "voice.webm");

          const res = await fetch("http://localhost:8000/voice-chat", {
            method: "POST",
            body: form,
          });

          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || "Server error");
          }

          const audioBlob = await res.blob();
          const url = URL.createObjectURL(audioBlob);

          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play();
          }

          setStatus("played");
        } catch (err) {
          console.error(err);
          setStatus("error");
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Permission Error:", err);
      setStatus("error");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">Voice AI Chatbot</h1>

        <p className="text-sm text-gray-600 mb-4">
          Speak to the microphone and get an audio reply from the LLM.
        </p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={startRecording}
            disabled={recording}
            className="px-4 py-2 rounded bg-green-500 text-white disabled:opacity-50"
          >
            Start Recording
          </button>

          <button
            onClick={stopRecording}
            disabled={!recording}
            className="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-50"
          >
            Stop
          </button>

          <div className="flex-1 text-right text-sm text-gray-500">
            Status: {status}
          </div>
        </div>

        <audio controls ref={audioRef} className="w-full" />

        <div className="mt-4 text-xs text-gray-500">
          Make sure the backend is running at{" "}
          <code>http://localhost:8000</code> and that **Ollama** + **Piper**
          are available.
        </div>
      </div>
    </div>
  );
}
