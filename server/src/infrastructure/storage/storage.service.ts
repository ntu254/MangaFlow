import { 
  PutObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand, 
  CopyObjectCommand, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl as s3GetSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs";
import path from "node:path";
import { env } from "../../config/env.config.js";
import { s3Client } from "./s3.client.js";

export class StorageService {
  private useLocalFallback: boolean;
  private uploadDir: string;

  constructor() {
    this.useLocalFallback = !s3Client;
    this.uploadDir = path.join(process.cwd(), "uploads");
    if (this.useLocalFallback) {
      console.warn("StorageService: S3 client not initialized. Falling back to local filesystem storage.");
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
    }
  }

  private getLocalPath(key: string): string {
    return path.join(this.uploadDir, key);
  }

  async uploadFile(key: string, body: Buffer, mimeType: string): Promise<string> {
    if (this.useLocalFallback) {
      const localPath = this.getLocalPath(key);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, body);
      return `http://localhost:${env.port}/uploads/${key}`;
    }

    try {
      await s3Client!.send(
        new PutObjectCommand({
          Bucket: env.s3Bucket,
          Key: key,
          Body: body,
          ContentType: mimeType,
        })
      );
      return key;
    } catch (error: any) {
      console.error(`S3 Upload failed for key ${key}: ${error.message}. Switching to local filesystem fallback.`);
      const localPath = this.getLocalPath(key);
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, body);
      return `http://localhost:${env.port}/uploads/${key}`;
    }
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useLocalFallback || key.startsWith("http://") || key.startsWith("https://")) {
      const cleanKey = this.extractKeyFromUrl(key);
      const localPath = this.getLocalPath(cleanKey);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      return;
    }

    try {
      await s3Client!.send(
        new DeleteObjectCommand({
          Bucket: env.s3Bucket,
          Key: key,
        })
      );
    } catch (error: any) {
      console.error(`S3 Delete failed for key ${key}: ${error.message}`);
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 900): Promise<string> {
    if (this.useLocalFallback || key.startsWith("http://") || key.startsWith("https://")) {
      return key;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: env.s3Bucket,
        Key: key,
      });
      return await s3GetSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
    } catch (error: any) {
      console.error(`S3 Signed URL generation failed for key ${key}: ${error.message}. Returning key.`);
      return key;
    }
  }

  async fileExists(key: string): Promise<boolean> {
    if (this.useLocalFallback || key.startsWith("http://") || key.startsWith("https://")) {
      const cleanKey = this.extractKeyFromUrl(key);
      return fs.existsSync(this.getLocalPath(cleanKey));
    }

    try {
      await s3Client!.send(
        new HeadObjectCommand({
          Bucket: env.s3Bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      return false;
    }
  }

  async copyFile(sourceKey: string, destKey: string): Promise<void> {
    if (this.useLocalFallback || sourceKey.startsWith("http://") || sourceKey.startsWith("https://")) {
      const cleanSrcKey = this.extractKeyFromUrl(sourceKey);
      const cleanDestKey = this.extractKeyFromUrl(destKey);
      const srcPath = this.getLocalPath(cleanSrcKey);
      const destPath = this.getLocalPath(cleanDestKey);
      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
      }
      return;
    }

    try {
      await s3Client!.send(
        new CopyObjectCommand({
          Bucket: env.s3Bucket,
          CopySource: encodeURIComponent(`${env.s3Bucket}/${sourceKey}`),
          Key: destKey,
        })
      );
    } catch (error: any) {
      console.error(`S3 Copy failed from ${sourceKey} to ${destKey}: ${error.message}`);
    }
  }

  private extractKeyFromUrl(urlOrKey: string): string {
    if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
      const prefix = `/uploads/`;
      const idx = urlOrKey.indexOf(prefix);
      if (idx !== -1) {
        return urlOrKey.substring(idx + prefix.length);
      }
    }
    return urlOrKey;
  }
}

export const storageService = new StorageService();
