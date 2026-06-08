import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import mongoose from "mongoose"
import { config } from "./shared/utils/env.js"
import authRoutes from "./modules/auth/auth.routes.js"
import seriesRoutes from "./modules/series/series.routes.js"
import boardRoutes from "./modules/board/board.routes.js"
import manuscriptRoutes from "./modules/manuscript/manuscript.routes.js"
import chapterRoutes from "./modules/chapter/chapter.routes.js"
import fileRoutes from "./modules/chapter/file.routes.js"
import taskRoutes from "./modules/task/task.routes.js"
import submissionRoutes from "./modules/submission/submission.routes.js"
import commentRoutes from "./modules/comment/comment.routes.js"
import payrollRoutes from "./modules/payroll/payroll.routes.js"
import { errorHandler } from "./shared/middleware/errorHandler.js"

const app = express()

app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "MangaFlow API is running" })
})

app.use("/api/auth", authRoutes)
app.use("/api/series", seriesRoutes)
app.use("/api/board", boardRoutes)
app.use("/api/manuscripts", manuscriptRoutes)
app.use("/api/chapters", chapterRoutes)
app.use("/api/files", fileRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api", submissionRoutes)
app.use("/api/comments", commentRoutes)
app.use("/api/payroll", payrollRoutes)

app.use(errorHandler)

async function start() {
  try {
    await mongoose.connect(config.mongoUri)
    console.log("Connected to MongoDB")

    const { User } = await import("./modules/auth/auth.model.js")
    const { hashPassword } = await import("./modules/auth/auth.service.js")

    const adminEmail = "admin@mangaflow.studio"
    const adminExists = await User.findOne({ email: adminEmail })
    if (!adminExists) {
      const passwordHash = await hashPassword("Admin@123456")
      await User.create({
        email: adminEmail,
        passwordHash,
        name: "System Admin",
        role: "ADMIN",
        isActive: true,
      })
      console.log("Admin seeded:", adminEmail)
    }
  } catch (err) {
    console.warn("MongoDB not available, running without database:", (err as Error).message)
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

start()

export default app
