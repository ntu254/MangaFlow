/**
 * seed-assets.ts
 *
 * Uploads static cover/news images from client/src/shared/assets to R2
 * under the `seeds/` prefix, then prints a JSON mapping of filename → r2Key
 * that can be used as public asset references in seed data.
 *
 * Usage:
 *   cd server
 *   npx tsx scripts/seed-assets.ts
 *
 * The script is idempotent: it checks HEAD before uploading, so re-running
 * skips files that are already present in the bucket.
 */

import { PutObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3"
import * as fs from "fs"
import * as path from "path"
import * as url from "url"
import dotenv from "dotenv"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, "../.env") })

// ── R2 config ─────────────────────────────────────────────────────────────────
const R2_ENDPOINT = process.env.R2_ENDPOINT ?? ""
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? ""
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? ""
const R2_BUCKET = process.env.R2_BUCKET ?? "mangaflow"
const R2_REGION = process.env.R2_REGION ?? "auto"
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 credentials. Make sure R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY are set in .env")
  process.exit(1)
}

const s3 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

// ── Assets directory ──────────────────────────────────────────────────────────
const ASSETS_DIR = path.resolve(__dirname, "../../client/src/shared/assets")

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch (err: any) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false
    throw err
  }
}

async function uploadFile(filePath: string, r2Key: string, mimeType: string): Promise<void> {
  const body = fs.readFileSync(filePath)
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: body,
      ContentType: mimeType,
    }),
  )
}

function publicUrl(r2Key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${r2Key}`
  }
  // Fallback: use endpoint-based URL (works when bucket has public access)
  return `${R2_ENDPOINT.replace(/\/$/, "")}/${R2_BUCKET}/${r2Key}`
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`Assets directory not found: ${ASSETS_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(ASSETS_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase()
    return ext in MIME
  })

  if (files.length === 0) {
    console.log("No image files found in assets directory.")
    process.exit(0)
  }

  console.log(`Found ${files.length} image(s) in ${ASSETS_DIR}\n`)

  const mapping: Record<string, { r2Key: string; url: string }> = {}

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const mimeType = MIME[ext]
    const r2Key = `seeds/${file}`
    const filePath = path.join(ASSETS_DIR, file)

    const exists = await objectExists(r2Key)
    if (exists) {
      console.log(`  ✓ already exists — skipping: ${r2Key}`)
    } else {
      await uploadFile(filePath, r2Key, mimeType)
      console.log(`  ↑ uploaded: ${r2Key}`)
    }

    mapping[file] = {
      r2Key,
      url: publicUrl(r2Key),
    }
  }

  console.log("\n── Asset mapping ────────────────────────────────────────────────")
  console.log(JSON.stringify(mapping, null, 2))

  // Also write the mapping to a file for use in other seed scripts
  const outPath = path.resolve(__dirname, "../src/infrastructure/seed/asset-map.json")
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2) + "\n")
  console.log(`\nMapping written to: ${outPath}`)
}

main().catch((err) => {
  console.error("seed-assets failed:", err)
  process.exit(1)
})
