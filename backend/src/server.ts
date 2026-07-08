import "dotenv/config";
import { env } from "./config/env.js";
import { connectMongo } from "./db/connection.js";
import { createApp } from "./app.js";
import { ensureSeedDatabase } from "./seed.js";
import { logger } from "./lib/logger.js";

await connectMongo();
const seedResult = await ensureSeedDatabase();
logger.info("seed_check_complete", seedResult);

const app = createApp();
app.listen(env.PORT, () => {
  logger.info("server_started", { port: env.PORT, nodeEnv: env.NODE_ENV });
});
