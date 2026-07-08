import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectMongo(uri = env.MONGO_URI) {
  if (!uri) {
    throw new Error("MONGO_URI is required to start the backend outside tests.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
