import React, { useEffect, useState } from "react";
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
} from "../services/aiApi";

function AIMetricsDashboard() {
  const [accuracy, setAccuracy] = useState(null);
  const [history, setHistory] = useState([]);
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [acc, hist, usageData] = await Promise.all([
          getPredictionAccuracy(),
          getPredictionHistory(null, 80),
          getUsagePatterns(),
        ]);
        setAccuracy(acc);
        setHistory(hist);
        setUsage(usageData);
      } catch (err) {
        console.error("Failed to load AI metrics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, color: "#e5e7eb" }}>Loading AI metrics…</div>
    );
  }

  const accuracyValue = accuracy?.accuracy ?? 0;
  const totalPredictions = accuracy?.totalPredictions ?? 0;
  const avgError = accuracy?.averageError ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#f9fafb",
              marginBottom: 4,
            }}
          >
            AI Metrics
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            Monitor how the prediction models are performing over time.
          </p>
        </div>
      </motion.div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Total predictions"
          value={totalPredictions}
          accent="linear-gradient(135deg,#38bdf8,#22c55e)"
        />
        <MetricCard
          label="Accuracy"
          value={`${accuracyValue.toFixed(1)}%`}
          accent="linear-gradient(135deg,#22c55e,#16a34a)"
        />
        <MetricCard
          label="Average error"
          value={avgError.toFixed(2)}
          accent="linear-gradient(135deg,#f97316,#facc15)"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          background: "rgba(15,23,42,0.95)",
          borderRadius: 18,
          padding: 20,
          border: "1px solid rgba(148,163,184,0.4)",
          boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
        }}
      >
        <h2 style={{ color: "#e5e7eb", marginBottom: 12, fontSize: 16 }}>
          Usage patterns by hour
        </h2>
        <div style={{ width: "100%", height: 260 }}>
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
        </div>
      </motion.div>

      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            background: "rgba(15,23,42,0.95)",
            borderRadius: 18,
            padding: 20,
            border: "1px solid rgba(148,163,184,0.4)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
          }}
        >
          <h2 style={{ color: "#e5e7eb", marginBottom: 12, fontSize: 16 }}>
            Prediction history
          </h2>
          <div style={{ width: "100%", height: 260 }}>
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
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      style={{
        background: "rgba(15,23,42,0.95)",
        borderRadius: 18,
        padding: 18,
        border: "1px solid rgba(148,163,184,0.45)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accent,
          opacity: 0.08,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 4 }}>
          {label}
        </p>
        <p
          style={{
            color: "#f9fafb",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

export default AIMetricsDashboard;
