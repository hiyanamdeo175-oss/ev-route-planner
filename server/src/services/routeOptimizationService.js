// Route optimization stub that scores candidate routes based on
// time, distance, station availability, charging power, and congestion.

// Each candidate route is expected to have:
// {
//   id,
//   totalDistanceKm,
//   estimatedDriveMinutes,
//   stations: [
//     { id, powerKw, congestionProbability, isCompatible, predictedWaitMinutes }
//   ]
// }

export function scoreRouteCandidates(candidates, preferences = {}) {
  const {
    weightTime = 0.4,
    weightDistance = 0.2,
    weightWait = 0.25,
    weightPower = 0.1,
    weightCongestion = 0.05,
  } = preferences;

  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((route) => {
      const totalWait = (route.stations || []).reduce(
        (sum, s) => sum + (s.predictedWaitMinutes || 0),
        0
      );
      const avgPowerKw = (route.stations || []).length
        ? (route.stations || []).reduce((sum, s) => sum + (s.powerKw || 0), 0) /
          (route.stations || []).length
        : 0;
      const maxCongestion = (route.stations || []).reduce(
        (max, s) => Math.max(max, s.congestionProbability || 0),
        0
      );

      // lower is better
      const timeScore = route.estimatedDriveMinutes || 0;
      const distanceScore = route.totalDistanceKm || 0;
      const waitScore = totalWait;
      const congestionScore = maxCongestion * 100;
      const powerScore = avgPowerKw ? 100 / avgPowerKw : 100; // prefer higher power

      const composite =
        weightTime * timeScore +
        weightDistance * distanceScore +
        weightWait * waitScore +
        weightCongestion * congestionScore +
        weightPower * powerScore;

      return {
        ...route,
        score: Number(composite.toFixed(2)),
      };
    })
    .sort((a, b) => a.score - b.score); // lower score = better
}
