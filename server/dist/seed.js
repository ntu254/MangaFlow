import mongoose from "mongoose";
import { seedAdminFromEnv } from "./infrastructure/seed/seedAdmin.js";
import { config } from "./shared/utils/env.js";
async function seed() {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB for seeding");
    await seedAdminFromEnv();
    await mongoose.disconnect();
}
seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map