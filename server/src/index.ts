import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import mongoose from "mongoose"
import { config } from "./shared/utils/env.js"
import authRoutes from "./modules/auth/auth.routes.js"

const app = express()

app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "MangaFlow API is running" })
})

app.use("/api/auth", authRoutes)

async function start() {
  try {
    await mongoose.connect(config.mongoUri)
    console.log("Connected to MongoDB")
  } catch (err) {
    console.warn("MongoDB not available, running without database:", (err as Error).message)
  }

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })
}

start()

export default app
