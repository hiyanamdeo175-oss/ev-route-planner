const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}

export function predictSlot(payload) {
  return postJson("/api/predict/slot", payload);
}

export function predictEnergy(payload) {
  return postJson("/api/predict/energy", payload);
}

export function predictRoute(payload) {
  return postJson("/api/predict/route", payload);
}

export function getPredictionHistory(stationId, timeRange = "week", limit = 50) {
  const params = new URLSearchParams();
  if (stationId) params.set("stationId", stationId);
  if (timeRange) params.set("timeRange", timeRange);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return getJson(`/api/predict/history${qs ? `?${qs}` : ""}`);
}

export function getPredictionAccuracy(stationId, timeRange = "week") {
  const params = new URLSearchParams();
  if (stationId) params.set("stationId", stationId);
  if (timeRange) params.set("timeRange", timeRange);
  const qs = params.toString();
  return getJson(`/api/predict/accuracy${qs ? `?${qs}` : ""}`);
}

export function getUsagePatterns(timeRange = "week") {
  const params = new URLSearchParams();
  if (timeRange) params.set("timeRange", timeRange);
  const qs = params.toString();
  return getJson(`/api/predict/usage-patterns${qs ? `?${qs}` : ""}`);
}

export function recordActualOutcome(id, actualValue) {
  return postJson("/api/predict/actual", { id, actualValue });
}
