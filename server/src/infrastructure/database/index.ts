import mongoose from "mongoose";
import { env } from "../../config/env.config.js";

export async function connectDatabase() {
  if (!env.mongodbUri) {
    console.warn("MONGODB_URI is not set; database connection skipped.");
    return;
  }

  await mongoose.connect(env.mongodbUri);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
