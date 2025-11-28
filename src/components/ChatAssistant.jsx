import React, { useContext, useEffect, useState } from "react";
import { EVContext } from "./EVContext";
import { sendAssistantMessage } from "../services/assistantApi";

function ChatAssistant({ screen }) {
  const { battery, range, selectedStation, predictedEnergy, booking, userProfile } =
    useContext(EVContext);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi, I can help with charging slots, route safety, and EV alerts. Ask me anything.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);

  const askPreset = async (presetText) => {
    setInput(presetText);
    await handleSend(presetText);
  };

  const handleSend = async (maybeText) => {
    const textSource =
      typeof maybeText === "string" && maybeText.length > 0 ? maybeText : input;
    const trimmed = textSource.trim();
    if (!trimmed || loading) return;

    const userMsg = { from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    if (!maybeText) setInput("");
    setLoading(true);

    const context = {
      screen: screen || "unknown",
      battery,
      range,
      selectedStation,
      predictedEnergy,
      booking,
      userProfile,
    };

    try {
      const res = await sendAssistantMessage(trimmed, context);
      const botText = res.reply || "(No reply)";
      setMessages((prev) => [...prev, { from: "bot", text: botText }]);
    } catch (err) {
      console.error("Assistant error", err);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "I couldn't reach the assistant backend. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🔊 Optional: read out the latest bot reply when enabled
  useEffect(() => {
    if (!speakReplies || !("speechSynthesis" in window)) return;
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.from !== "bot" || !last.text) return;

    const utterance = new SpeechSynthesisUtterance(last.text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [messages, speakReplies]);

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text:
            "Voice input is not supported in this browser. Please use a Chromium-based browser like Chrome or Edge.",
        },
      ]);
      return;
    }

    if (listening) {
      return; // already listening
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 60,
          width: 52,
          height: 52,
          borderRadius: "999px",
          border: "1px solid rgba(148,163,184,0.7)",
          background:
            "radial-gradient(circle at 30% 0, #22c55e, #0ea5e9 55%, #1d4ed8 100%)",
          color: "#f9fafb",
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
          cursor: "pointer",
        }}
      >
        🤖
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 320,
        maxHeight: 420,
        borderRadius: 18,
        border: "1px solid rgba(148,163,184,0.7)",
        background: "rgba(15,23,42,0.97)",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.75)",
        zIndex: 60,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid rgba(51,65,85,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 13,
        }}
      >
        <div>
          <div style={{ fontWeight: 600 }}>EV Copilot</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>
            Ask about slots, routes, and alerts.
          </div>
          <div
            style={{
              marginTop: 4,
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => askPreset("Show me all important alerts right now")}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(248,250,252,0.15)",
                backgroundColor: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              Alerts
            </button>
            <button
              type="button"
              onClick={() =>
                askPreset("Suggest a plan using my nearest charging station")
              }
              style={{
                borderRadius: 999,
                border: "1px solid rgba(248,250,252,0.15)",
                backgroundColor: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              Nearest station
            </button>
            <button
              type="button"
              onClick={() =>
                askPreset(
                  "Can I safely complete my current route with my current battery and conditions?"
                )
              }
              style={{
                borderRadius: 999,
                border: "1px solid rgba(248,250,252,0.15)",
                backgroundColor: "rgba(15,23,42,0.9)",
                color: "#e5e7eb",
                fontSize: 10,
                padding: "3px 8px",
                cursor: "pointer",
              }}
            >
              Route safety
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            onClick={() => setSpeakReplies((v) => !v)}
            title="Toggle voice replies"
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              backgroundColor: speakReplies
                ? "rgba(56,189,248,0.2)"
                : "transparent",
              color: "#e5e7eb",
              fontSize: 11,
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            {speakReplies ? "🔊" : "🔈"}
          </button>
          <button
            onClick={() => setOpen(false)}
            style={{
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: "8px 10px",
          overflowY: "auto",
          fontSize: 12,
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: 6,
              display: "flex",
              justifyContent: m.from === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "6px 9px",
                borderRadius: 10,
                backgroundColor:
                  m.from === "user" ? "#22c55e" : "rgba(15,23,42,0.95)",
                color: m.from === "user" ? "#022c22" : "#e5e7eb",
                border:
                  m.from === "user"
                    ? "1px solid rgba(22,163,74,0.7)"
                    : "1px solid rgba(55,65,81,0.9)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: 11, opacity: 0.7 }}>Thinking...</div>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(51,65,85,0.9)",
          display: "flex",
          padding: 6,
          gap: 4,
        }}
      >
        <input
          type="text"
          placeholder="Ask about route, slots, alerts..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          style={{
            flex: 1,
            borderRadius: 999,
            border: "1px solid rgba(51,65,85,0.9)",
            padding: "6px 10px",
            backgroundColor: "rgba(15,23,42,0.9)",
            color: "#e5e7eb",
            fontSize: 12,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={handleVoiceInput}
          title="Speak instead of typing"
          style={{
            borderRadius: 999,
            border: "1px solid rgba(239,68,68,0.7)",
            padding: "6px 8px",
            marginRight: 4,
            backgroundColor: listening
              ? "rgba(239,68,68,0.3)"
              : "rgba(15,23,42,0.9)",
            color: "#fecaca",
            fontSize: 12,
            cursor: listening ? "default" : "pointer",
          }}
        >
          {listening ? "🎙" : "🎤"}
        </button>
        <button
          onClick={() => handleSend()}
          disabled={loading}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(56,189,248,0.7)",
            padding: "6px 10px",
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.3), rgba(59,130,246,0.5))",
            color: "#e5e7eb",
            fontSize: 12,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatAssistant;
