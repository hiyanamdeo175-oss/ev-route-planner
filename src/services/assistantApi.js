// For now, talk directly to the backend running on port 5000.
// If you deploy, change this to use VITE_BACKEND_URL.
const API_BASE = "http://localhost:5000";

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
