import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongo(uri = env.MONGO_URI) {
  if (!uri) {
    throw new Error("MONGO_URI is required to start the backend outside tests.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5_000,
  });
}

export async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
