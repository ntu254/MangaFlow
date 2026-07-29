import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../lib/http.js";
import { deleteR2Object, presignR2Download, putR2Object, readR2Object } from "./r2.service.js";

const TOKEN_TTL_SECONDS = 10 * 60;
const LOCAL_STORAGE_ROOT = path.resolve(process.cwd(), ".mangaflow-storage");

type TokenPayload = {
  key: string;
  exp: number;
  contentType?: string;
  fileName?: string;
};

function secret() {
  return env.JWT_ACCESS_SECRET || "dev-access-secret-change-me";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createFileAccessToken(payload: Omit<TokenPayload, "exp">, ttlSeconds = TOKEN_TTL_SECONDS) {
  const encodedPayload = base64Url(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  );
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyFileAccessToken(token: string): TokenPayload {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    throw new AppError(401, "Invalid file token.", "INVALID_FILE_TOKEN");
  }

  const expected = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new AppError(401, "Invalid file token.", "INVALID_FILE_TOKEN");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as TokenPayload;
  if (!payload.key || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(401, "Expired file token.", "EXPIRED_FILE_TOKEN");
  }
  return payload;
}

function safeLocalPath(key: string) {
  const normalized = path.normalize(key).replace(/^(\.\.[/\\])+/, "");
  const resolved = path.resolve(LOCAL_STORAGE_ROOT, normalized);
  if (!resolved.startsWith(LOCAL_STORAGE_ROOT)) {
    throw new AppError(400, "Invalid file key.", "INVALID_FILE_KEY");
  }
  return resolved;
}

export async function putLocalObject(key: string, bytes: Buffer) {
  const target = safeLocalPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

export async function deleteLocalObject(key: string) {
  await unlink(safeLocalPath(key)).catch((error: any) => {
    if (error?.code !== "ENOENT") throw error;
  });
}

export async function readLocalObject(key: string) {
  try {
    return await readFile(safeLocalPath(key));
  } catch {
    throw new AppError(404, "File object is not available.", "FILE_NOT_AVAILABLE");
  }
}

export function createDisplayUrl(key: string, fileName?: string) {
  const token = createFileAccessToken({ key, fileName });
  return {
    key,
    url: `/api/files/display/${token}`,
    expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString(),
  };
}

export function createLocalUploadUrl(key: string, contentType?: string, fileName?: string) {
  const token = createFileAccessToken({ key, contentType, fileName });
  return `/api/files/local-upload/${token}`;
}

export async function readStoredObject(key: string, fallbackUrl?: string) {
  if (process.env.VITEST) {
    return readLocalObject(key);
  }
  if (key.startsWith("local/") || !env.R2_BUCKET) {
    return readLocalObject(key);
  }

  try {
    return await readR2Object(key);
  } catch (error) {
    if (!fallbackUrl || fallbackUrl.startsWith("metadata://")) throw error;
    const response = await fetch(fallbackUrl);
    if (!response.ok) {
      throw new AppError(response.status, "File object is not available.", "FILE_NOT_AVAILABLE");
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

export async function persistGeneratedObject(input: {
  key: string;
  bytes: Buffer;
  contentType: string;
}) {
  if (env.R2_BUCKET && !process.env.VITEST) {
    await putR2Object(input);
    const signed = await presignR2Download(input.key);
    return signed.downloadUrl;
  }

  await putLocalObject(input.key, input.bytes);
  return createDisplayUrl(input.key).url;
}

export async function deleteStoredObject(key: string) {
  if (env.R2_BUCKET && !process.env.VITEST) {
    await deleteR2Object(key);
    return;
  }
  await deleteLocalObject(key);
}
