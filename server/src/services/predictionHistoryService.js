// Simple in-memory prediction history and metrics
// This avoids DB changes but still gives useful AI metrics.

const history = [];
const MAX_HISTORY = 500; // cap to avoid unbounded growth

function filterByTimeRange(items, timeRange) {
  if (!timeRange || timeRange === "all") return items;

  const now = Date.now();
  let windowMs;
  if (timeRange === "day") windowMs = 24 * 60 * 60 * 1000;
  else if (timeRange === "month") windowMs = 30 * 24 * 60 * 60 * 1000;
  else windowMs = 7 * 24 * 60 * 60 * 1000; // default week

  const cutoff = now - windowMs;
  return items.filter((h) => new Date(h.timestamp).getTime() >= cutoff);
}

export function addPrediction(entry) {
  const enriched = {
    id: history.length + 1,
    timestamp: new Date().toISOString(),
    stationId: entry.stationId || null,
    type: entry.type, // 'slot' | 'energy' | 'route'
    predictedValue: entry.predictedValue ?? null,
    actualValue: entry.actualValue ?? null,
    errorValue:
      entry.actualValue != null && entry.predictedValue != null
        ? Math.abs(entry.actualValue - entry.predictedValue)
        : null,
    confidence: entry.confidence ?? null,
    meta: entry.meta || {},
  };

  history.push(enriched);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  return enriched;
}

export function getHistory({ stationId, limit = 100, timeRange } = {}) {
  let items = history;
  if (stationId) {
    items = items.filter((h) => h.stationId === stationId);
  }
  items = filterByTimeRange(items, timeRange);
  return items.slice(-limit);
}

export function getAccuracy({ stationId, timeRange } = {}) {
  const items = getHistory({ stationId, timeRange });
  const withActual = items.filter((h) => h.actualValue != null);

  if (!withActual.length) {
    return {
      totalPredictions: items.length,
      accuratePredictions: 0,
      accuracy: 0,
      averageError: 0,
    };
  }

  const total = withActual.length;
  const errors = withActual.map((h) =>
    Math.abs((h.actualValue ?? 0) - (h.predictedValue ?? 0))
  );
  const avgError = errors.reduce((a, b) => a + b, 0) / total;
  const accurate = withActual.filter((h) => (h.errorValue ?? 0) <= 5).length; // within 5 units

  return {
    totalPredictions: items.length,
    accuratePredictions: accurate,
    accuracy: total ? (accurate / total) * 100 : 0,
    averageError: avgError,
  };
}

export function getUsagePatterns({ timeRange } = {}) {
  // group by hour of day based on timestamp and predictedValue (occupancy/load)
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    sum: 0,
    count: 0,
  }));

  const source = filterByTimeRange(history, timeRange);

  source.forEach((h) => {
    const date = new Date(h.timestamp);
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    const value = h.predictedValue;
    if (value == null) return;
    buckets[hour].sum += value;
    buckets[hour].count += 1;
  });

  return buckets.map((b) => ({
    hour: b.hour,
    avgOccupancy: b.count ? b.sum / b.count : 0,
  }));
}

export function setActual({ id, actualValue }) {
  const item = history.find((h) => h.id === id);
  if (!item) return null;

  item.actualValue = actualValue;
  if (item.predictedValue != null && actualValue != null) {
    item.errorValue = Math.abs(actualValue - item.predictedValue);
  }
  return item;
}
