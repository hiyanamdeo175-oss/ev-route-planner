import mongoose from "mongoose";

const SlotPredictionSchema = new mongoose.Schema(
  {
    station: { type: mongoose.Schema.Types.ObjectId, ref: "ChargingStation", required: true },
    timeBucketStart: { type: Date, required: true },
    predictedAvailablePorts: { type: Number, required: true },
    predictedWaitMinutes: { type: Number, required: true },
    congestionProbability: { type: Number, min: 0, max: 1, required: true },
    modelVersion: { type: String, default: "v0.1-heuristic" },
  },
  { timestamps: true }
);

export const SlotPrediction = mongoose.model("SlotPrediction", SlotPredictionSchema);
