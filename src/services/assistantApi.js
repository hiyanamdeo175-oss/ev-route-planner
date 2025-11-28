// For now, talk directly to the deployed backend.
// If you change environments, you can swap this to use VITE_BACKEND_URL.
const API_BASE = "https://ev-backend-4u2p.onrender.com";

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    throw new Error(`Assistant request failed with status ${res.status}`);
  }
  return res.json();
}

export function sendAssistantMessage(message, context) {
  return postJson("/api/assistant/chat", { message, context });
}
