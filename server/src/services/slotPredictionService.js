// Heuristic slot availability + wait-time prediction
// Later you can replace this with a proper ML/time-series model.

export function predictSlotAvailability({
  portsTotal,
  portsBusy,
  powerKw,
  timeOfDay,
  dayOfWeek,
  historicalUtilization = 0.6, // 0-1
}) {
  const total = Math.max(portsTotal || 0, 1);
  const busy = Math.min(Math.max(portsBusy || 0, 0), total);

  const baseFree = Math.max(total - busy, 0);

  // time-of-day factor (rush hours busier)
  const hour = typeof timeOfDay === "number" ? timeOfDay : new Date().getHours();
  let rushFactor = 1;
  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) {
    rushFactor = 0.6;
  } else if (hour >= 0 && hour <= 5) {
    rushFactor = 1.2;
  }

  const utilization = Math.min(
    1,
    Math.max(historicalUtilization * (1 / rushFactor), 0.1)
  );

  const expectedBusy = total * utilization;
  const predictedFree = Math.max(Math.round(total - expectedBusy), 0);

  // wait time heuristic: if everything busy, grow with utilization & inverse power
  let predictedWaitMinutes = 0;
  if (predictedFree <= 0) {
    const baseSessionMin = 40; // a typical fast-charge session
    const powerFactor = powerKw ? Math.max(0.4, 50 / powerKw) : 1;
    predictedWaitMinutes = Math.round(baseSessionMin * utilization * powerFactor);
  }

  const congestionProbability = Math.min(
    1,
    utilization * (rushFactor < 1 ? 1.1 : 0.9)
  );

  return {
    predictedAvailablePorts: predictedFree,
    predictedWaitMinutes,
    congestionProbability,
    modelVersion: "slot-v0.1-heuristic",
  };
}
