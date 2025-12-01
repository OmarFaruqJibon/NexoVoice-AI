import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Bot, Volume2, Sparkles, Pause } from "lucide-react";

export default function VoiceChatbot() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const visualizationRef = useRef(null);
  const waveVisualizationRef = useRef(null);
  const animationRef = useRef(null);
  const waveAnimationRef = useRef(null);
  const autoListenEnabled = true;


  // Robot visualization effect
  useEffect(() => {
    const canvas = visualizationRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const animate = () => {
      if (status === "recording" || isPlaying) {
        drawVisualization();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    const drawVisualization = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 10;

      const time = Date.now() * 0.005;
      const pulse = (Math.sin(time) + 1) * 0.5;

      const gradient = ctx.createRadialGradient(
        centerX, centerY, maxRadius * 0.3,
        centerX, centerY, maxRadius
      );
      gradient.addColorStop(0, status === "recording" ? '#ef4444' : '#3b82f6');
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * (0.7 + pulse * 0.3), 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * 0.3, 0, 2 * Math.PI);
      ctx.fillStyle = status === "recording" ? '#ef4444' : '#3b82f6';
      ctx.fill();
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, isPlaying]);

  // AUTO play generated voice
  useEffect(() => {
    if (status === "ready" && audioUrl && audioRef.current) {
      setIsPlaying(true);
      audioRef.current.play().catch(err => {
        console.warn("Autoplay blocked:", err);
      });
    }
  }, [status, audioUrl]);

  // Wave visualization effect for audio playback
  useEffect(() => {
    const canvas = waveVisualizationRef.current;
    if (!canvas || !isPlaying) return;

    const ctx = canvas.getContext('2d');
    const bars = 50;
    const barWidth = canvas.width / bars;
    let animationId;

    const drawWave = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < bars; i++) {
        const baseHeight = Math.random() * 0.7 + 0.3;
        const time = Date.now() * 0.005 + i * 0.2;
        const wave = Math.sin(time) * 0.3 + 0.7;
        const progress = currentTime / duration || 0;
        const progressEffect = 1 - Math.abs((i / bars) - progress) * 2;

        const barHeight = (baseHeight * wave * Math.max(0.1, progressEffect)) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        if (i / bars < progress) {
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#60a5fa');
        } else {
          gradient.addColorStop(0, '#4b5563');
          gradient.addColorStop(1, '#6b7280');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth + 2, canvas.height - barHeight, barWidth - 4, barHeight);
      }

      animationId = requestAnimationFrame(drawWave);
    };

    drawWave();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying, currentTime, duration]);



// ---- Voice Activity Detection ----
const autoStopTimeout = useRef(null);
const silenceThreshold = 0.02;   // sensitivity
const silenceDuration = 1500;    // silence

const setupVAD = (stream) => {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const micSource = audioContext.createMediaStreamSource(stream);

  analyser.fftSize = 2048;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  micSource.connect(analyser);

  const detect = () => {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    const avg = sum / dataArray.length / 255; 

    if (avg < silenceThreshold) {
      // user is silent
      if (!autoStopTimeout.current) {
        autoStopTimeout.current = setTimeout(() => {
          console.log("Auto-stop: silence detected.");
          stopRecording();
        }, silenceDuration);
      }
    } else {
      // user is speaking
      if (autoStopTimeout.current) {
        clearTimeout(autoStopTimeout.current);
        autoStopTimeout.current = null;
      }
    }

    requestAnimationFrame(detect);
  };

  detect();
};






const startRecording = async () => {
  try {
    setStatus("requesting-permission");
    setError("");
    setAudioUrl("");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // ---- Enable Voice Activity Detection ----
    setupVAD(stream);

    const mimeType =
      MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/ogg")
        ? "audio/ogg"
        : "audio/webm";

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
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
      if (autoStopTimeout.current) {
        clearTimeout(autoStopTimeout.current);
        autoStopTimeout.current = null;
      }

      setRecording(false);
      setStatus("processing");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const mime = mediaRecorder.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mime });

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
        setAudioUrl(url);
        setStatus("ready");
      } catch (err) {
        console.error(err);
        setError(err.message || "Something went wrong.");
        setStatus("error");
      }
    };

    mediaRecorder.start();
  } catch (err) {
    console.error("Permission Error:", err);
    setError("Microphone permission denied.");
    setStatus("error");
  }
};






  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      setTimeout(() => mr.stop(), 150);
    }
  };

  const playAudio = async () => {
    if (audioRef.current && audioUrl) {
      setIsPlaying(true);
      await audioRef.current.play();
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);

    if (autoListenEnabled) {
      startRecording();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    const messages = {
      idle: "Ready to chat",
      "requesting-permission": "Requesting microphone access...",
      recording: "Listening... Speak now",
      processing: "Processing your message...",
      uploading: "Sending to AI...",
      ready: "AI response ready",
      error: "Error occurred"
    };
    return messages[status] || status;
  };

  const getStatusColor = () => {
    const colors = {
      idle: "text-blue-400",
      "requesting-permission": "text-yellow-400",
      recording: "text-red-400",
      processing: "text-purple-400",
      uploading: "text-purple-400",
      ready: "text-green-400",
      error: "text-red-400"
    };
    return colors[status] || "text-gray-400";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bot className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Nexora AI
            </h1>
            <Sparkles className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-gray-400 text-lg">
            Speak naturally and get intelligent voice responses
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl border border-gray-700/50 p-8 shadow-2xl">
          {/* Robot Visualization Area */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
            {/* AI Robot Visualization */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <canvas
                  ref={visualizationRef}
                  width={300}
                  height={300}
                  className="rounded-full border-2 border-gray-600/50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="w-16 h-16 text-white mx-auto mb-2" />
                    <span className="text-white font-semibold text-lg">
                      {status === "recording" ? "Listening..." :
                        status === "processing" ? "Thinking..." :
                          ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Controls */}
            <div className="flex-1 space-y-6">
              {/* Status Display */}
              <div className="text-center">
                <div className={`text-lg font-semibold ${getStatusColor()} mb-2`}>
                  {getStatusMessage()}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${status === "recording" ? "bg-red-500 animate-pulse" :
                      status === "processing" ? "bg-purple-500" :
                        status === "ready" ? "bg-green-500" :
                          "bg-blue-500"
                      }`}
                    style={{
                      width: status === "recording" ? "100%" :
                        status === "processing" ? "70%" :
                          status === "ready" ? "100%" : "0%"
                    }}
                  />
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={startRecording}
                  disabled={recording || status === "processing"}
                  className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${recording ? 'bg-red-500/20 cursor-not-allowed' : 'bg-green-500/20 hover:bg-green-500/30'
                    } border border-green-500/30 disabled:opacity-50`}
                >
                  <Mic className="w-8 h-8 text-green-400" />
                </button>

                <button
                  onClick={stopRecording}
                  disabled={!recording}
                  className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Square className="w-8 h-8 text-red-400" />
                </button>

                <button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  disabled={!audioUrl}
                  className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 ${audioUrl ? 'bg-blue-500/20 hover:bg-blue-500/30' : 'bg-gray-500/20 cursor-not-allowed'
                    } border border-blue-500/30 disabled:opacity-50`}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-blue-400" />
                  ) : (
                    <Play className="w-8 h-8 text-blue-400" />
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <div className="text-red-400 text-sm font-medium">
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Audio Player with Wave Visualization */}
          {audioUrl && (
            <div className="bg-gray-700/50 rounded-2xl p-6 border border-gray-600/50">
              <div className="flex items-center gap-3 mb-4">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">AI Response</span>
              </div>

              {/* Wave Visualization */}
              <div className="mb-4 rounded-xl overflow-hidden bg-gray-800/50 p-4">
                <canvas
                  ref={waveVisualizationRef}
                  width={600}
                  height={120}
                  className="w-full h-20 rounded-lg"
                />
              </div>

              <audio
                ref={audioRef}
                onEnded={handleAudioEnd}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              >
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <div className="text-gray-400 text-sm bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Powered by Nexovision AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}