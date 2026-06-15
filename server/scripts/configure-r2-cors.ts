import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3"
import { config } from "../src/shared/utils/env.js"

const origins = Array.from(
  new Set([
    config.clientUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    ...(process.env.R2_CORS_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
)

const s3 = new S3Client({
  region: config.r2Region,
  endpoint: config.r2Endpoint,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
})

try {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: config.r2Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedOrigins: origins,
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  )
} catch (error) {
  const code = error instanceof Error && "Code" in error ? String(error.Code) : undefined
  if (code === "NoSuchBucket") {
    throw new Error(
      [
        `R2 bucket "${config.r2Bucket}" was not found for endpoint ${config.r2Endpoint}.`,
        "Check that R2_BUCKET exactly matches the Cloudflare bucket name and that the access key belongs to the same account with bucket admin permission.",
      ].join(" "),
      { cause: error },
    )
  }
  throw error
}

console.log(`Updated R2 CORS for bucket "${config.r2Bucket}"`)
console.log(`Allowed origins: ${origins.join(", ")}`)
