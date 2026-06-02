import { createApp } from "./app.js";
import { env } from "./config/env.config.js";
import { connectDatabase } from "./infrastructure/database/index.js";

await connectDatabase();

const app = createApp();

app.listen(env.port, () => {
  console.log(`MangaFlow API listening on port ${env.port}`);
});
