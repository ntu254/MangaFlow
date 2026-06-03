import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { env } from "../config/env.config.js";
import { connectDatabase, disconnectDatabase } from "../infrastructure/database/index.js";
import { UserModel } from "../modules/user/user.model.js";
import { TaskRateModel } from "../modules/payroll/payroll.model.js";
import { taskTypes } from "../modules/task/task.model.js";

async function seed() {
  console.log("Starting seed script...");
  await connectDatabase();

  try {
    // 1. Create/Update Admin User
    const adminEmail = "admin@mangaflow.local";
    const adminPassword = "Admin@123456";
    const saltRounds = env.bcryptSaltRounds || 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    console.log(`Checking for existing admin user: ${adminEmail}`);
    let admin = await UserModel.findOne({ email: adminEmail });

    if (admin) {
      console.log("Admin user already exists. Updating password hash...");
      admin.passwordHash = passwordHash;
      admin.fullName = "System Admin";
      admin.systemRole = "ADMIN";
      admin.status = "ACTIVE";
      await admin.save();
    } else {
      console.log("Creating new Admin user...");
      admin = new UserModel({
        email: adminEmail,
        passwordHash,
        fullName: "System Admin",
        systemRole: "ADMIN",
        status: "ACTIVE"
      });
      await admin.save();
    }
    console.log(`Admin user successfully seeded. ID: ${admin._id}`);

    // 2. Create Default Task Rates
    console.log("Seeding default task rates...");
    const defaultRates: Record<string, number> = {
      BACKGROUND: 150,
      INKING: 100,
      SCREENTONE: 80,
      CLEANUP: 50,
      EFFECT: 60,
      OTHER: 40
    };

    for (const taskType of taskTypes) {
      const rateAmount = defaultRates[taskType] || 50;
      
      // Look for an existing active rate for this taskType
      const existingRate = await TaskRateModel.findOne({ taskType, isActive: true });
      if (existingRate) {
        console.log(`Active rate for ${taskType} already exists (${existingRate.rate} ${existingRate.currency}). Skipping...`);
      } else {
        console.log(`Creating active rate for ${taskType}: ${rateAmount} VND`);
        const rateDoc = new TaskRateModel({
          taskType,
          rate: rateAmount,
          currency: "VND",
          isActive: true
        });
        await rateDoc.save();
      }
    }

    console.log("Database successfully seeded!");
  } catch (error) {
    console.error("Error during seeding database:", error);
  } finally {
    await disconnectDatabase();
    console.log("Database disconnected.");
  }
}

seed().catch(err => {
  console.error("Unhandled seed error:", err);
  process.exit(1);
});
