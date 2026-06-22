import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Load environmental variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const R2_ENDPOINT = process.env.R2_ENDPOINT ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "mangaflow";
const R2_REGION = process.env.R2_REGION ?? "auto";

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 credentials in .env file.");
  process.exit(1);
}

const s3 = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Import the pathBuilder from the service
import { pathBuilder } from "../src/modules/chapter/file.service.js";

// Sample files to use
const ASSETS_DIR = path.resolve(__dirname, "../../client/src/shared/assets");
const SAMPLE_IMAGE_PATH = path.join(ASSETS_DIR, "cover-berserk.jpg");

async function uploadSample(r2Key: string, filePath: string, contentType: string) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );
    console.log(`  ✓ Uploaded to: ${r2Key}`);
  } catch (err) {
    console.error(`  ✗ Failed to upload ${r2Key}:`, err);
  }
}

async function main() {
  if (!fs.existsSync(SAMPLE_IMAGE_PATH)) {
    console.error(`Sample image not found at: ${SAMPLE_IMAGE_PATH}`);
    process.exit(1);
  }

  console.log("Starting upload of sample files to Cloudflare R2...");
  console.log(`Bucket: ${R2_BUCKET}`);
  console.log(`Endpoint: ${R2_ENDPOINT}\n`);

  const mockSeriesId = "series_sample_999";
  const mockChapterId = "chapter_sample_777";
  const mockPageId = "page_sample_555";
  const mockTaskId = "task_sample_333";
  const mockSubmissionId = "submission_sample_111";

  // Build the dictionary of paths
  const samples = [
    {
      name: "Series Cover",
      key: pathBuilder.seriesCover(mockSeriesId, 1, "cover-sample.jpg"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/jpeg",
    },
    {
      name: "Series Manuscript",
      key: pathBuilder.seriesManuscript(mockSeriesId, 1, "manuscript-sample.pdf"),
      file: SAMPLE_IMAGE_PATH, // Using the image as a dummy file for pdf
      type: "application/pdf",
    },
    {
      name: "Chapter Cover",
      key: pathBuilder.chapterCover(mockSeriesId, mockChapterId, 1, "chapter-cover.jpg"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/jpeg",
    },
    {
      name: "Chapter Manuscript",
      key: pathBuilder.chapterManuscript(mockSeriesId, mockChapterId, 1, "chapter-manuscript.pdf"),
      file: SAMPLE_IMAGE_PATH,
      type: "application/pdf",
    },
    {
      name: "Page Original",
      key: pathBuilder.pageOriginal(mockSeriesId, mockChapterId, mockPageId, 1, "page-original.jpg"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/jpeg",
    },
    {
      name: "Page Working",
      key: pathBuilder.pageWorking(mockSeriesId, mockChapterId, mockPageId, 1, "page-working.jpg"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/jpeg",
    },
    {
      name: "Page Thumbnail",
      key: pathBuilder.pageThumbnail(mockSeriesId, mockChapterId, mockPageId, 1, "page-thumb.jpg"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/jpeg",
    },
    {
      name: "Page AI Segmentation",
      key: pathBuilder.pageAiSegmentation(mockSeriesId, mockChapterId, mockPageId, 1, "segmentation.json"),
      file: SAMPLE_IMAGE_PATH, // using as dummy
      type: "application/json",
    },
    {
      name: "Page AI Mask",
      key: pathBuilder.pageAiMask(mockSeriesId, mockChapterId, mockPageId, 1, "mask.png"),
      file: SAMPLE_IMAGE_PATH, // using as dummy
      type: "image/png",
    },
    {
      name: "Page Task Submission",
      key: pathBuilder.pageTaskSubmission(mockSeriesId, mockChapterId, mockPageId, mockTaskId, mockSubmissionId, 1, "submission.png"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/png",
    },
    {
      name: "Page Final",
      key: pathBuilder.pageFinal(mockSeriesId, mockChapterId, mockPageId, 1, "page-final.jpg"),
      file: SAMPLE_IMAGE_PATH,
      type: "image/jpeg",
    },
    {
      name: "Export Preview",
      key: pathBuilder.exportPreview(mockSeriesId, mockChapterId, 1, "export-preview.zip"),
      file: SAMPLE_IMAGE_PATH,
      type: "application/zip",
    },
    {
      name: "Export Final",
      key: pathBuilder.exportFinal(mockSeriesId, mockChapterId, 1, "export-final.zip"),
      file: SAMPLE_IMAGE_PATH,
      type: "application/zip",
    },
  ];

  for (const sample of samples) {
    console.log(`Uploading ${sample.name}...`);
    await uploadSample(sample.key, sample.file, sample.type);
  }

  console.log("\nAll sample files have been successfully uploaded to Cloudflare R2!");
  console.log("You can now open your Cloudflare R2 dashboard to inspect the folder structure.");
}

main().catch((err) => {
  console.error("Execution failed:", err);
  process.exit(1);
});
