import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  const uri = mongoUri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ev_route_planner";

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    maxPoolSize: 10,
  });

  // basic connection logging
  mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error", err);
  });

  return mongoose.connection;
}
