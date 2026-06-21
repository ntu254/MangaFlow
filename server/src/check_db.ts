import mongoose from "mongoose";
import { User } from "./modules/auth/auth.model.js";
import { config } from "./shared/utils/env.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");
  const users = await User.find({}).lean();
  console.log("USERS_IN_DB:", JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
