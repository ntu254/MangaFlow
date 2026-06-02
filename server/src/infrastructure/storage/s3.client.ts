import { S3Client } from "@aws-sdk/client-s3";
import { env } from "../../config/env.config.js";

let s3Client: S3Client | null = null;

if (env.s3Provider !== "local" && env.s3AccessKey && env.s3SecretKey) {
  const s3Config: any = {
    region: env.s3Region,
    credentials: {
      accessKeyId: env.s3AccessKey,
      secretAccessKey: env.s3SecretKey,
    },
    forcePathStyle: env.s3ForcePathStyle,
  };

  if (env.s3Endpoint) {
    s3Config.endpoint = env.s3Endpoint;
  }

  s3Client = new S3Client(s3Config);
}

export { s3Client };
