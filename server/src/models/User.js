import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    phone: { type: String },
    passwordHash: { type: String }, // if you add local auth later
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
