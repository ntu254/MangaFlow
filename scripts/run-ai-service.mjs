import { spawn } from "node:child_process"
import { setTimeout as sleep } from "node:timers/promises"

const healthUrl = "http://127.0.0.1:8000/"

async function isAiServiceRunning() {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1500) })
    return response.ok
  } catch {
    return false
  }
}

if (await isAiServiceRunning()) {
  console.log(`AI service already running at ${healthUrl}`)
  process.on("SIGINT", () => process.exit(0))
  process.on("SIGTERM", () => process.exit(0))
  while (true) await sleep(60_000)
}

const child = spawn(
  ".\\.venv\\Scripts\\python.exe",
  ["-m", "uvicorn", "app.main:app", "--reload", "--host", "localhost", "--port", "8000"],
  {
    cwd: "ai-service",
    shell: true,
    stdio: "inherit",
  },
)

process.on("SIGINT", () => child.kill("SIGINT"))
process.on("SIGTERM", () => child.kill("SIGTERM"))

child.on("exit", (code) => {
  process.exit(code ?? 0)
})
