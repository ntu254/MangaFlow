import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { config } from "../src/shared/utils/env.js";

async function main() {
  const s3 = new S3Client({
    region: config.r2Region,
    endpoint: config.r2Endpoint,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  });

  const command = new PutBucketCorsCommand({
    Bucket: config.r2Bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  });

  try {
    await s3.send(command);
    console.log("CORS configuration successfully applied to bucket:", config.r2Bucket);
  } catch (error) {
    console.error("Error setting CORS:", error);
  }
}

main();
