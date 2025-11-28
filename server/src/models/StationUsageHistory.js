import mongoose from "mongoose";

const StationUsageHistorySchema = new mongoose.Schema(
  {
    station: { type: mongoose.Schema.Types.ObjectId, ref: "ChargingStation", required: true },
    timestamp: { type: Date, required: true },
    portsBusy: { type: Number, default: 0 },
    portsTotal: { type: Number, default: 0 },
    avgSessionMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const StationUsageHistory = mongoose.model(
  "StationUsageHistory",
  StationUsageHistorySchema
);
