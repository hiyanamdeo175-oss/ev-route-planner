import mongoose from "mongoose";

const TripLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "EVVehicle" },
    startLocation: {
      lat: Number,
      lng: Number,
    },
    endLocation: {
      lat: Number,
      lng: Number,
    },
    distanceKm: { type: Number, required: true },
    energyKWh: { type: Number },
    avgSpeedKmph: { type: Number },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const TripLog = mongoose.model("TripLog", TripLogSchema);
