import mongoose from "mongoose"
import { User } from "./modules/auth/auth.model.js"
import { hashPassword } from "./modules/auth/auth.service.js"
import { config } from "./shared/utils/env.js"

async function seed() {
  await mongoose.connect(config.mongoUri)
  console.log("Connected to MongoDB for seeding")

  const adminEmail = "admin@mangaflow.studio"
  const existing = await User.findOne({ email: adminEmail })
  if (existing) {
    console.log("Admin user already exists, skipping seed")
    await mongoose.disconnect()
    return
  }

  const passwordHash = await hashPassword("Admin@123456")
  await User.create({
    email: adminEmail,
    passwordHash,
    name: "System Admin",
    role: "ADMIN",
    isActive: true,
  })

  console.log("Admin user created: admin@mangaflow.studio / Admin@123456")
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
