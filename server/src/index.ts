import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import mongoose from "mongoose"
import fs from "fs"
import swaggerUi from "swagger-ui-express"
import { config } from "./shared/utils/env.js"
import authRoutes from "./modules/auth/auth.routes.js"
import adminRoutes from "./modules/admin/admin.routes.js"
import seriesRoutes from "./modules/series/series.routes.js"
import boardRoutes from "./modules/board/board.routes.js"
import editorRoutes from "./modules/editor/editor.routes.js"
import manuscriptRoutes from "./modules/manuscript/manuscript.routes.js"
import rankingRoutes from "./modules/ranking/ranking.routes.js"
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js"
import chapterRoutes from "./modules/chapter/chapter.routes.js"
import pageRoutes from "./modules/chapter/page.routes.js"
import fileRoutes from "./modules/chapter/file.routes.js"
import taskRoutes from "./modules/task/task.routes.js"
import taskTypeRoutes from "./modules/task/task-type.routes.js"
import submissionRoutes from "./modules/submission/submission.routes.js"
import commentRoutes from "./modules/comment/comment.routes.js"
import payrollRoutes from "./modules/payroll/payroll.routes.js"
import publicationRoutes from "./modules/publication/publication.routes.js"
import publicRoutes from "./modules/public/public.routes.js"
import auditLogRoutes from "./modules/audit-log/audit-log.routes.js"
import notificationRoutes from "./modules/notification/notification.routes.js"
import { errorHandler } from "./shared/middleware/errorHandler.js"
import { seedAdminFromEnv } from "./infrastructure/seed/seedAdmin.js"

const app = express()

// Security headers as early as possible so every response is covered.
app.use(helmet())

const allowedOrigins = new Set([
  config.clientUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
])

function isAllowedDevOrigin(origin: string) {
  if (config.isProduction) return false
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    },
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "MangaFlow API is running" })
})

// Global API rate limiter. Kept higher than route-specific limiters (e.g. login)
// so it acts as a coarse abuse guard without overriding stricter per-route limits.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
})

app.use("/api", apiLimiter)

app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/series", seriesRoutes)
app.use("/api/editor", editorRoutes)
app.use("/api/board", boardRoutes)
app.use("/api/manuscripts", manuscriptRoutes)
app.use("/api/rankings", rankingRoutes)
app.use("/api/chapters", chapterRoutes)
app.use("/api/pages", pageRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/task-types", taskTypeRoutes)
app.use("/api", submissionRoutes)
app.use("/api/comments", commentRoutes)
app.use("/api/payroll", payrollRoutes)
app.use("/api/publications", publicationRoutes)
app.use("/api/public", publicRoutes)
app.use("/api/admin/audit-logs", auditLogRoutes)
app.use("/api/notifications", notificationRoutes)

// Load Swagger document conditionally to avoid crashing if it hasn't been generated yet
try {
  const swaggerDocument = JSON.parse(fs.readFileSync(new URL("../swagger-output.json", import.meta.url), "utf-8"))
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
} catch (error) {
  console.log("Swagger UI not available. Run `npm run swagger` to generate swagger-output.json")
}

app.use(errorHandler)

async function start() {
  try {
    await mongoose.connect(config.mongoUri)
    console.log("Connected to MongoDB")
    await seedAdminFromEnv()
  } catch (err) {
    console.error("MongoDB connection failed; server will not start:", (err as Error).message)
    process.exit(1)
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

start()

export default app
