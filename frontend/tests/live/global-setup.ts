import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const E2E_DATABASE_NAME = "mangaflow_e2e";
const DEFAULT_E2E_MONGO_URI = `mongodb://127.0.0.1:27017/${E2E_DATABASE_NAME}`;
// Resolve from this file (frontend/tests/live/global-setup.ts) instead of the
// process cwd, which is the frontend directory when Playwright is invoked from
// there: ../.. -> frontend, ../../.. -> repo root, then /backend.
const BACKEND_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../backend",
);

export default function globalSetup() {
  const mongoUri = process.env.E2E_MONGO_URI ?? DEFAULT_E2E_MONGO_URI;
  const databaseName = new URL(mongoUri).pathname.replace(/^\/+/, "");
  const npmCli = process.env.npm_execpath;

  if (databaseName !== E2E_DATABASE_NAME) {
    throw new Error(
      `Refusing to reset Mongo database "${databaseName}". Live E2E may only reset "${E2E_DATABASE_NAME}".`,
    );
  }
  if (!npmCli) {
    throw new Error("npm_execpath is required to reset the live E2E fixture.");
  }

  execFileSync(process.execPath, [path.resolve(npmCli), "run", "seed", "--", "--reset"], {
    cwd: BACKEND_DIR,
    env: { ...process.env, MONGO_URI: mongoUri },
    stdio: "inherit",
  });
}
