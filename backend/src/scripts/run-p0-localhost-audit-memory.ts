import { MongoMemoryReplSet } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { connectMongo, disconnectMongo } from "../db/connection.js";
import { ensureSeedDatabase } from "../seed.js";

const port = Number(process.env.P0_AUDIT_MEMORY_PORT ?? 3106);
const host = process.env.P0_AUDIT_MEMORY_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;

process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
process.env.PORT = String(port);
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "p0-audit-access-secret";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "p0-audit-refresh-secret";
process.env.P0_AUDIT_BASE_URL = process.env.P0_AUDIT_BASE_URL ?? baseUrl;

const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, storageEngine: "wiredTiger" },
});

let server: ReturnType<ReturnType<typeof createApp>["listen"]> | undefined;

try {
  process.env.MONGO_URI = replSet.getUri();
  await connectMongo(process.env.MONGO_URI);
  await ensureSeedDatabase();

  const app = createApp();
  server = await new Promise((resolve) => {
    const listener = app.listen(port, host, () => resolve(listener));
  });

  const auditModule = await import("./p0-localhost-audit.js");
  await auditModule.auditCompletion;
} finally {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server!.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
  await disconnectMongo().catch(() => undefined);
  await replSet.stop();
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
