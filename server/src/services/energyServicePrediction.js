// Heuristic energy consumption + service prediction module.
// Inputs roughly follow your notes: mileage, battery age, temperature history, avg current draw.

export function predictEnergyAndService({
  currentSoCPercent,
  batteryCapacityKWh,
  distanceKmPlanned,
  avgConsumptionKWhPer100Km = 18,
  batteryAgeMonths = 12,
  odometerKm = 20000,
  avgTemperatureC = 30,
  avgCurrentDrawA = 150,
  batteryHealthPercent,
  preferredChargeLimitPercent,
}) {
  const capacity = batteryCapacityKWh || 40;

  // simple temperature effect: very hot or very cold reduces effective capacity
  let tempFactor = 1;
  if (avgTemperatureC < 5 || avgTemperatureC > 40) tempFactor = 0.85;
  else if (avgTemperatureC < 10 || avgTemperatureC > 35) tempFactor = 0.9;

  // battery health: prefer explicit profile input if provided, otherwise derive from age/mileage
  let health;
  let totalDegradation = 0;
  if (typeof batteryHealthPercent === "number" && batteryHealthPercent > 0) {
    health = Math.max(0.4, Math.min(1, batteryHealthPercent / 100));
    totalDegradation = 1 - health;
  } else {
    const ageYears = batteryAgeMonths / 12;
    const degradationFromAge = ageYears * 0.03; // 3% per year
    const degradationFromMileage = (odometerKm / 50000) * 0.05; // 5% every 50k km

    totalDegradation = Math.min(0.4, degradationFromAge + degradationFromMileage);
    health = 1 - totalDegradation;
  }
  const effectiveCapacity = capacity * health * tempFactor;

  // projected range from currentSoC (respect preferred charge limit if set)
  const effectiveSoCPercent = preferredChargeLimitPercent
    ? Math.min(currentSoCPercent, preferredChargeLimitPercent)
    : currentSoCPercent;

  const usableKWh = (effectiveSoCPercent / 100) * effectiveCapacity;
  const projectedRangeKm = (usableKWh / (avgConsumptionKWhPer100Km / 100));

  const energyNeededKWh = (distanceKmPlanned * avgConsumptionKWhPer100Km) / 100;
  const predictedRemainingKWh = usableKWh - energyNeededKWh;
  const predictedRemainingSoC = Math.max(
    0,
    Math.min(100, (predictedRemainingKWh / effectiveCapacity) * 100 || 0)
  );

  // service interval heuristic
  const kmSinceLastService = odometerKm % 10000;
  const serviceDuePercent = Math.min(1, kmSinceLastService / 10000);

  const alerts = [];
  if (serviceDuePercent > 0.8) alerts.push("Service due soon");
  if (health < 0.7) alerts.push("Battery health degraded");
  if (predictedRemainingSoC < 15) alerts.push("Low battery on planned route");

  return {
    projectedRangeKm: Math.round(projectedRangeKm),
    predictedRemainingSoC: Math.round(predictedRemainingSoC),
    batteryHealth: Number(health.toFixed(2)),
    rangeDegradationPercent: Math.round((totalDegradation || 0) * 100),
    nextServiceDuePercent: Number(serviceDuePercent.toFixed(2)),
    alerts,
    modelVersion: "energy-service-v0.1-heuristic",
  };
}
