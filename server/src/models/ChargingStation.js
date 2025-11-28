import mongoose from "mongoose";

const PortSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // CCS2, Type2, CHAdeMO, etc.
    powerKw: { type: Number, required: true },
    count: { type: Number, default: 1 },
  },
  { _id: false }
);

const ChargingStationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    provider: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" }, // [lng, lat]
    },
    address: { type: String },
    city: { type: String },
    ports: [PortSchema],
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ChargingStation = mongoose.model("ChargingStation", ChargingStationSchema);
