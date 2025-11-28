import React, { useContext, useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import BoltIcon from "@mui/icons-material/Bolt";
import { EVContext } from "./EVContext";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  getPredictionAccuracy,
  getPredictionHistory,
  getUsagePatterns,
  recordActualOutcome,
} from "../services/aiApi";

function TripStats() {
  const { tripHistory, totalDistance, avgEfficiency } = useContext(EVContext);

  const theme = useTheme();

  const [accuracy, setAccuracy] = useState(null);
  const [history, setHistory] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [timeRange, setTimeRange] = useState("week");
  const [actualId, setActualId] = useState("");
  const [actualValue, setActualValue] = useState("");
  const [savingActual, setSavingActual] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics(currentRange) {
      try {
        const [acc, hist, usageData] = await Promise.all([
          getPredictionAccuracy(undefined, currentRange),
          getPredictionHistory(undefined, currentRange, 80),
          getUsagePatterns(currentRange),
        ]);
        if (cancelled) return;
        setAccuracy(acc);
        setHistory(hist);
        setUsage(usageData);
      } catch (err) {
        console.error("Failed to load AI metrics", err);
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    }

    loadMetrics(timeRange);
    return () => {
      cancelled = true;
    };
  }, [timeRange]);

  const stats = [
    {
      title: "Total Trips",
      value: tripHistory.length,
      icon: <DirectionsCarIcon fontSize="large" color="primary" />,
    },
    {
      title: "Total Distance",
      value: `${totalDistance.toFixed(1)} km`,
      icon: <SpeedIcon fontSize="large" color="success" />,
    },
    {
      title: "Avg Efficiency",
      value: `${avgEfficiency.toFixed(2)} km/kWh`,
      icon: <BoltIcon fontSize="large" color="warning" />,
    },
  ];

  const accuracyValue = accuracy?.accuracy ?? 0;
  const totalPredictions = accuracy?.totalPredictions ?? 0;
  const avgError = accuracy?.averageError ?? 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: 3,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
            Trip statistics & AI insights
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, opacity: 0.7 }}>
            How your EV has performed over time and how the AI is predicting usage.
          </Typography>
          <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Time range:
              </Typography>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.5)",
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#020617" : "#f9fafb",
                  color:
                    theme.palette.mode === "dark" ? "#e5e7eb" : "#0f172a",
                  fontSize: 12,
                }}
              >
                <option value="day">Last 24h</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All</option>
              </select>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((s, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
                  p: 1.5,
                  bgcolor: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  {s.icon}
                  <Typography variant="subtitle1" mt={1} sx={{ opacity: 0.85 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" mt={0.5}>
                    {s.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {tripHistory.length > 0 && (
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
              bgcolor: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.4)",
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                Recent trips
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  m: 0,
                  p: 0,
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                {tripHistory
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((t) => (
                    <li key={t.id}>
                      <span>{t.date} • </span>
                      <span>{t.distance} km</span>
                      {t.efficiency && <span> • {t.efficiency} km/kWh</span>}
                    </li>
                  ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* AI metrics section */}
        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
            >
              AI prediction metrics
            </Typography>
          </motion.div>

          {/* Simple form to record actual outcome */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              alignItems: "center",
              mb: 1,
              fontSize: 12,
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Record actual result (optional):
            </Typography>
            <input
              type="number"
              placeholder="Prediction ID"
              value={actualId}
              onChange={(e) => setActualId(e.target.value)}
              style={{
                width: 90,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                fontSize: 12,
              }}
            />
            <input
              type="number"
              placeholder="Actual value"
              value={actualValue}
              onChange={(e) => setActualValue(e.target.value)}
              style={{
                width: 110,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                fontSize: 12,
              }}
            />
            <button
              type="button"
              disabled={savingActual || !actualId || !actualValue}
              onClick={async () => {
                try {
                  setSavingActual(true);
                  await recordActualOutcome(Number(actualId), Number(actualValue));
                  // refresh metrics after updating
                  setTimeRange((r) => r); // trigger effect
                  setActualId("");
                  setActualValue("");
                } catch (err) {
                  console.error("Failed to record actual outcome", err);
                } finally {
                  setSavingActual(false);
                }
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.7)",
                background:
                  "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(59,130,246,0.3))",
                color: "#e5e7eb",
                fontSize: 12,
                cursor: savingActual ? "default" : "pointer",
                opacity: savingActual ? 0.7 : 1,
              }}
            >
              {savingActual ? "Saving..." : "Save actual"}
            </button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Total predictions"
                value={totalPredictions}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Accuracy"
                value={`${accuracyValue.toFixed(1)}%`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MetricCard
                label="Average error"
                value={avgError.toFixed(2)}
              />
            </Grid>
          </Grid>

          {/* Usage patterns chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
                bgcolor: "rgba(15,23,42,0.9)",
                border: "1px solid rgba(148,163,184,0.4)",
                mb: 2,
              }}
            >
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  Usage patterns by hour
                </Typography>
                <Box sx={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={usage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                      />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#020617",
                          border: "1px solid rgba(148,163,184,0.5)",
                          borderRadius: 10,
                          color: "#e5e7eb",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="avgOccupancy"
                        fill="#22c55e"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prediction history chart */}
          {history.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
              >
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
                    bgcolor: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.4)",
                    mb: 2,
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                      Prediction history
                    </Typography>
                    <Box sx={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer>
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis
                            dataKey="timestamp"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            tickFormatter={(v) =>
                              new Date(v).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            }
                          />
                          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#020617",
                              border: "1px solid rgba(148,163,184,0.5)",
                              borderRadius: 10,
                              color: "#e5e7eb",
                              fontSize: 12,
                            }}
                            labelFormatter={(v) => new Date(v).toLocaleString()}
                          />
                          <Legend
                            wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="predictedValue"
                            name="Predicted"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="actualValue"
                            name="Actual"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Compact table view with IDs for quick actual entry */}
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
                  bgcolor: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                <CardContent>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 1, fontSize: 13 }}
                  >
                    Recent predictions (for quick ID lookup)
                  </Typography>
                  <Box
                    component="table"
                    sx={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>ID</th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>
                          Type
                        </th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>
                          Pred
                        </th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>
                          Actual
                        </th>
                        <th style={{ textAlign: "left", padding: "4px 6px" }}>
                          Error
                        </th>
                        <th style={{ textAlign: "right", padding: "4px 6px" }}>
                          
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history
                        .slice(-10)
                        .reverse()
                        .map((h) => (
                          <tr key={h.id}>
                            <td style={{ padding: "3px 6px" }}>{h.id}</td>
                            <td style={{ padding: "3px 6px", textTransform: "capitalize" }}>
                              {h.type}
                            </td>
                            <td style={{ padding: "3px 6px" }}>
                              {h.predictedValue ?? "-"}
                            </td>
                            <td style={{ padding: "3px 6px" }}>
                              {h.actualValue ?? "-"}
                            </td>
                            <td style={{ padding: "3px 6px" }}>
                              {h.errorValue != null
                                ? h.errorValue.toFixed(2)
                                : "-"}
                            </td>
                            <td style={{ padding: "3px 6px", textAlign: "right" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setActualId(String(h.id));
                                  if (h.actualValue != null) {
                                    setActualValue(String(h.actualValue));
                                  } else if (h.predictedValue != null) {
                                    setActualValue(String(h.predictedValue));
                                  }
                                }}
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  border: "1px solid rgba(148,163,184,0.6)",
                                  backgroundColor: "transparent",
                                  color: "#e5e7eb",
                                  fontSize: 11,
                                  cursor: "pointer",
                                }}
                              >
                                Use
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </Box>
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function MetricCard({ label, value }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
        bgcolor: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(148,163,184,0.4)",
      }}
    >
      <CardContent>
        <Typography
          variant="body2"
          sx={{ fontSize: 12, opacity: 0.75, mb: 0.5 }}
        >
          {label}
        </Typography>
        <Typography variant="h6" fontWeight="bold">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default TripStats;
