import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env.js";
import { id } from "../domain/ids.js";

type PresignUploadInput = {
  fileName: string;
  contentType?: string;
  folder?: string;
};

function hasR2Config() {
  return Boolean(
    env.R2_ENDPOINT &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET,
  );
}

export function isR2Configured() {
  return hasR2Config();
}

function publicUrlForKey(key: string) {
  const base = env.R2_PUBLIC_URL.replace(/\/+$/, "");
  return base ? `${base}/${encodeURI(key)}` : undefined;
}

function safeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

function buildKey(input: PresignUploadInput) {
  const folder = input.folder?.replace(/^\/+|\/+$/g, "") || "uploads";
  return `${folder}/${id("file")}-${safeFileName(input.fileName || "upload.bin")}`;
}

function r2Client() {
  return new S3Client({
    region: env.R2_REGION,
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function presignR2Upload(input: PresignUploadInput) {
  const key = buildKey(input);
  const publicUrl = publicUrlForKey(key);

  if (!hasR2Config()) {
    const metadataUrl = `metadata://r2/${key}`;
    return {
      key,
      uploadUrl: metadataUrl,
      downloadUrl: publicUrl ?? metadataUrl,
      publicUrl,
      method: "PUT" as const,
      headers: input.contentType ? { "content-type": input.contentType } : {},
      persistent: false,
      storage: "metadata-only" as const,
    };
  }

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: input.contentType || "application/octet-stream",
  });
  const client = r2Client();
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  const downloadUrl =
    publicUrl ??
    (await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
      }),
      { expiresIn: 900 },
    ));

  return {
    key,
    uploadUrl,
    downloadUrl,
    publicUrl,
    method: "PUT" as const,
    headers: input.contentType ? { "content-type": input.contentType } : {},
    persistent: true,
    storage: "r2" as const,
  };
}

export async function presignR2Download(key: string) {
  const publicUrl = publicUrlForKey(key);

  if (!hasR2Config()) {
    const metadataUrl = `metadata://r2/${key}`;
    return {
      key,
      downloadUrl: publicUrl ?? metadataUrl,
      publicUrl,
      persistent: false,
      storage: "metadata-only" as const,
    };
  }

  if (publicUrl) {
    return {
      key,
      downloadUrl: publicUrl,
      publicUrl,
      persistent: true,
      storage: "r2" as const,
    };
  }

  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });
  const downloadUrl = await getSignedUrl(r2Client(), command, { expiresIn: 900 });
  return {
    key,
    downloadUrl,
    persistent: true,
    storage: "r2" as const,
  };
}

export async function readR2Object(key: string) {
  if (!hasR2Config()) {
    throw new Error("R2 is not configured.");
  }
  const output = await r2Client().send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
    }),
  );
  if (!output.Body) {
    throw new Error("R2 object has no body.");
  }
  const bytes = await output.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function putR2Object(input: { key: string; bytes: Buffer; contentType: string }) {
  if (!hasR2Config()) {
    throw new Error("R2 is not configured.");
  }
  await r2Client().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: input.key,
      Body: input.bytes,
      ContentType: input.contentType,
    }),
  );
}
