import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../../shared/utils/env.js";
import { v4 as uuidv4 } from "uuid";
const s3 = new S3Client({
    region: config.r2Region,
    endpoint: config.r2Endpoint,
    credentials: {
        accessKeyId: config.r2AccessKeyId,
        secretAccessKey: config.r2SecretAccessKey,
    },
});
function buildR2Key(fileAssetId, originalName) {
    const ext = originalName.split(".").pop()?.toLowerCase() || "bin";
    return `uploads/${fileAssetId}.${ext}`;
}
export async function createPresignedUploadUrl(originalName, contentType, expiresIn = 3600) {
    const fileAssetId = uuidv4();
    const r2Key = buildR2Key(fileAssetId, originalName);
    const command = new PutObjectCommand({
        Bucket: config.r2Bucket,
        Key: r2Key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    return {
        uploadUrl,
        fileAssetId,
        r2Key,
        expiresIn,
    };
}
export async function createPresignedDownloadUrl(r2Key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: config.r2Bucket,
        Key: r2Key,
    });
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn });
    return { downloadUrl, expiresIn };
}
export async function deleteFileAsset(r2Key) {
    const command = new DeleteObjectCommand({
        Bucket: config.r2Bucket,
        Key: r2Key,
    });
    await s3.send(command);
}
export async function getFileBuffer(r2Key) {
    const command = new GetObjectCommand({
        Bucket: config.r2Bucket,
        Key: r2Key,
    });
    const response = await s3.send(command);
    if (!response.Body) {
        throw new Error("S3 object body is empty");
    }
    const arrayBuffer = await response.Body.transformToByteArray();
    return Buffer.from(arrayBuffer);
}
export async function uploadBuffer(buffer, originalName, contentType) {
    const fileAssetId = uuidv4();
    const r2Key = buildR2Key(fileAssetId, originalName);
    const size = buffer.length;
    const command = new PutObjectCommand({
        Bucket: config.r2Bucket,
        Key: r2Key,
        Body: buffer,
        ContentType: contentType,
    });
    await s3.send(command);
    return { fileAssetId, r2Key, size };
}
export function validateFileType(mimeType, allowedTypes) {
    return allowedTypes.includes(mimeType);
}
export function validateFileSize(size, maxSizeMB) {
    return size <= maxSizeMB * 1024 * 1024;
}
//# sourceMappingURL=file.service.js.map