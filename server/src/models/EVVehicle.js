import mongoose from "mongoose";

const EVVehicleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    registrationNumber: { type: String, required: true }, // RC info
    batteryCapacityKWh: { type: Number, required: true },
    nominalRangeKm: { type: Number },
    batteryAgeMonths: { type: Number, default: 0 },
    odometerKm: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const EVVehicle = mongoose.model("EVVehicle", EVVehicleSchema);
