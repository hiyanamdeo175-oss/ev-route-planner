import mongoose from "mongoose";

const ServicePredictionSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "EVVehicle", required: true },
    nextServiceDate: { type: Date, required: true },
    predictedBatteryHealth: { type: Number, min: 0, max: 1, required: true },
    rangeDegradationPercent: { type: Number, min: 0, max: 100, required: true },
    alerts: [{ type: String }],
    modelVersion: { type: String, default: "v0.1-heuristic" },
  },
  { timestamps: true }
);

export const ServicePrediction = mongoose.model("ServicePrediction", ServicePredictionSchema);
