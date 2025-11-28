import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import predictionRouter from "./routes/predictionRoutes.js";
import authRouter from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ev-route-planner-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/predict", predictionRouter);

// Assistant chatbot route (local rule-based helper, no external AI)
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

  // High-level interpretation of alerts
  if (alerts.length) {
    lines.push("Here are the key alerts I see:");
    alerts.slice(0, 4).forEach((a, idx) => {
      lines.push(`- ${a}`);
    });
  }

  // Battery / route safety hints
  if (typeof battery === "number") {
    if (battery <= 20) {
      lines.push("- Your current battery is low. Plan a charge soon.");
    } else if (battery <= 40) {
      lines.push("- Battery is moderate. Be careful with long routes.");
    } else {
      lines.push("- Battery level looks comfortable for normal city driving.");
    }
  }

  if (
    typeof predictedEnergy.predictedRemainingSoC === "number" &&
    predictedEnergy.predictedRemainingSoC < 15
  ) {
    lines.push(
      "- Predicted remaining charge at destination is very low. Add a charging stop on this route."
    );
  }

  // Nearest / selected station
  if (selectedStation && selectedStation.name) {
    lines.push(
      `- Nearest selected station is ${selectedStation.name}. You can route via this station if you're worried about charge.`
    );
  }

  if (!lines.length) {
    lines.push(
      "I don't see any critical issues from the current data. You can ask me about alerts, nearest station, or route safety."
    );
  }

  const reply = lines.join("\n");
  return res.json({ reply });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
