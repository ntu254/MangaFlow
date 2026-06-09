import { User } from "../../modules/auth/auth.model.js"
import { hashPassword } from "../../modules/auth/auth.service.js"
import { config } from "../../shared/utils/env.js"

export async function seedAdminFromEnv(): Promise<void> {
  const { email, password, fullName } = config.adminSeed

  if (!email || !password) {
    if (config.isProduction) {
      console.log("Admin seed skipped: ADMIN_EMAIL/ADMIN_PASSWORD not configured.")
    } else {
      console.log("Admin seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create a development admin.")
    }
    return
  }

  const adminExists = await User.findOne({ email })
  if (adminExists) {
    console.log("Admin seed skipped: admin user already exists.")
    return
  }

  const passwordHash = await hashPassword(password)
  await User.create({
    email,
    passwordHash,
    name: fullName,
    role: "ADMIN",
    isActive: true,
  })

  console.log(`Admin seeded from env: ${email}`)
}
