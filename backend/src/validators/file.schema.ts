import { z } from "zod";

/**
 * Auth-002 — presign-download is a privileged endpoint that returns a
 * short-lived R2 signed URL. Without a resource context the server would
 * have to brute-force search every owner collection to decide whether the
 * caller is allowed to read a file. That breaks the principle of "never
 * trust the client to declare its own permissions".
 *
 * The contract:
 *   - `key` is the raw R2 key being presigned (required).
 *   - `resourceType` + `resourceId` are required when the file is owned by
 *     a domain entity (PAGE / CHAPTER / SERIES / PROPOSAL / MATERIAL /
 *     SUBMISSION). The server resolves ownership from those two fields
 *     and reuses the same authorization path as the GET endpoint for that
 *     entity.
 *   - When `resourceType` is omitted the server falls back to the legacy
 *     `assertFileKeyVisible` brute-force search — kept for backwards
 *     compatibility with the existing UI but flagged in the API contract.
 */
export const FILE_RESOURCE_TYPES = [
  "PAGE",
  "CHAPTER",
  "SERIES",
  "PROPOSAL",
  "MATERIAL",
  "SUBMISSION",
] as const;

export type FileResourceType = (typeof FILE_RESOURCE_TYPES)[number];

export const presignDownloadSchema = z
  .object({
    key: z.string().min(1),
    resourceType: z.enum(FILE_RESOURCE_TYPES).optional(),
    resourceId: z.string().min(1).optional(),
    fileName: z.string().optional(),
  })
  .strict();

export const displayUrlSchema = presignDownloadSchema;
