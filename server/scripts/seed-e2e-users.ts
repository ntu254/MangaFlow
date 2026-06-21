import mongoose from "mongoose";
import { User } from "../src/modules/auth/auth.model.js";
import { hashPassword } from "../src/modules/auth/auth.service.js";
import { config } from "../src/shared/utils/env.js";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");

  const users = [
    { name: "Mangaka User", email: "mangaka@mangaflow.local", role: "MANGAKA" },
    { name: "Editor User", email: "editor@mangaflow.local", role: "EDITOR" },
    { name: "Assistant User", email: "assistant@mangaflow.local", role: "ASSISTANT" },
    { name: "Board User", email: "board@mangaflow.local", role: "BOARD" },
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`User already exists: ${u.email}`);
      continue;
    }

    // Set password same as email for local test compatibility
    const passwordHash = await hashPassword(u.email);
    await User.create({
      email: u.email,
      passwordHash,
      name: u.name,
      role: u.role,
      isActive: true,
    });
    console.log(`Created user: ${u.email}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
