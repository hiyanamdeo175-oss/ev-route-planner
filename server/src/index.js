import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import predictionRouter from "./routes/predictionRoutes.js";
import authRouter from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ev-route-planner-backend" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/predict", predictionRouter);

// Simple rule-based assistant (no DB, no AI API)
app.post("/api/assistant/chat", (req, res) => {
  const { message, context } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const raw = context || {};
  const battery = raw.battery;
  const predictedEnergy = raw.predictedEnergy || {};
  const selectedStation = raw.selectedStation || null;
  const alerts = raw.assistantAlerts || [];

  const lines = [];

  // Alerts
  if (alerts.length) {
    lines.push("Here are the key alerts I see:");
    alerts.slice(0, 4).forEach((a) => lines.push(`- ${a}`));
  }

  // Battery interpretation
  if (typeof battery === "number") {
    if (battery <= 20) lines.push("- Your battery is low. Plan a charge soon.");
    else if (battery <= 40)
      lines.push("- Battery is moderate, be cautious on long routes.");
    else lines.push("- Battery looks comfortable for normal driving.");
  }

  // Predicted SoC at destination
  if (
    typeof predictedEnergy.predictedRemainingSoC === "number" &&
    predictedEnergy.predictedRemainingSoC < 15
  ) {
    lines.push(
      "- Your predicted remaining charge at destination is very low. Add a charging stop."
    );
  }

  // Nearest charging station
  if (selectedStation && selectedStation.name) {
    lines.push(
      `- Nearest recommended station: ${selectedStation.name}. Consider routing through it.`
    );
  }

  // Fallback
  if (!lines.length) {
    lines.push(
      "Everything looks good. Ask me about alerts, route safety, or charging stops."
    );
  }

  return res.json({ reply: lines.join("\n") });
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 Backend running WITHOUT database on port ${PORT}`);
});
