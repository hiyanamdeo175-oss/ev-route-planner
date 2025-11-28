import express from "express";
import { predictSlotAvailability } from "../services/slotPredictionService.js";
import { predictEnergyAndService } from "../services/energyServicePrediction.js";
import { scoreRouteCandidates } from "../services/routeOptimizationService.js";
import {
  addPrediction,
  getAccuracy,
  getHistory,
  getUsagePatterns,
  setActual,
} from "../services/predictionHistoryService.js";

const router = express.Router();

// GET /api/predict/history
router.get("/history", (req, res) => {
  try {
    const { stationId, limit, timeRange } = req.query;
    const data = getHistory({
      stationId: stationId || undefined,
      limit: limit ? Number(limit) : 100,
      timeRange: timeRange || "week",
    });
    res.json(data);
  } catch (err) {
    console.error("/history error", err);
    res.status(500).json({ error: "Failed to load prediction history" });
  }
});

// POST /api/predict/actual
router.post("/actual", (req, res) => {
  try {
    const { id, actualValue } = req.body || {};
    const numericId = Number(id);
    const numericActual =
      typeof actualValue === "number" ? actualValue : Number(actualValue);

    if (!numericId || Number.isNaN(numericActual)) {
      return res
        .status(400)
        .json({ error: "id and numeric actualValue are required" });
    }

    const updated = setActual({ id: numericId, actualValue: numericActual });
    if (!updated) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("/actual error", err);
    res.status(500).json({ error: "Failed to record actual outcome" });
  }
});

// GET /api/predict/accuracy
router.get("/accuracy", (req, res) => {
  try {
    const { stationId, timeRange } = req.query;
    const stats = getAccuracy({
      stationId: stationId || undefined,
      timeRange: timeRange || "week",
    });
    res.json(stats);
  } catch (err) {
    console.error("/accuracy error", err);
    res.status(500).json({ error: "Failed to load prediction accuracy" });
  }
});

// GET /api/predict/usage-patterns
router.get("/usage-patterns", (req, res) => {
  try {
    const { timeRange } = req.query;
    const data = getUsagePatterns({ timeRange: timeRange || "week" });
    res.json(data);
  } catch (err) {
    console.error("/usage-patterns error", err);
    res.status(500).json({ error: "Failed to load usage patterns" });
  }
});

// POST /api/predict/slot
router.post("/slot", async (req, res) => {
  try {
    const {
      stationId,
      portsTotal,
      portsBusy,
      powerKw,
      timeOfDay,
      dayOfWeek,
      historicalUtilization,
    } = req.body || {};

    const result = predictSlotAvailability({
      portsTotal,
      portsBusy,
      powerKw,
      timeOfDay,
      dayOfWeek,
      historicalUtilization,
    });

    addPrediction({
      stationId: stationId || null,
      type: "slot",
      predictedValue: result.predictedOccupancy ?? null,
      confidence: result.confidence ?? null,
      meta: { portsTotal, portsBusy, powerKw, timeOfDay, dayOfWeek },
    });

    res.json({ stationId, ...result });
  } catch (err) {
    console.error("/slot prediction error", err);
    res.status(500).json({ error: "Slot prediction failed" });
  }
});

// POST /api/predict/energy
router.post("/energy", async (req, res) => {
  try {
    const result = predictEnergyAndService(req.body || {});

    addPrediction({
      stationId: req.body?.stationId || null,
      type: "energy",
      predictedValue: result.predictedRemainingSoC ?? null,
      confidence: result.confidence ?? null,
      meta: req.body || {},
    });

    res.json(result);
  } catch (err) {
    console.error("/energy prediction error", err);
    res.status(500).json({ error: "Energy/service prediction failed" });
  }
});

// POST /api/predict/route
router.post("/route", async (req, res) => {
  try {
    const { candidates, preferences } = req.body || {};
    const scored = scoreRouteCandidates(candidates || [], preferences || {});

    if (scored[0]) {
      addPrediction({
        stationId: null,
        type: "route",
        predictedValue: scored[0].score ?? null,
        confidence: scored[0].confidence ?? null,
        meta: { preferences },
      });
    }

    res.json({
      bestRoute: scored[0] || null,
      routes: scored,
    });
  } catch (err) {
    console.error("/route optimization error", err);
    res.status(500).json({ error: "Route optimization failed" });
  }
});

export default router;
