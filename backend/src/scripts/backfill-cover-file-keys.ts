import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });

const mongoUri =
  process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/mangaflow";
const dryRun = process.argv.includes("--dry-run");

function decodePath(pathname: string) {
  try {
    return decodeURIComponent(pathname.replace(/^\/+/, ""));
  } catch {
    return "";
  }
}

export function extractCoverFileKey(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (value.startsWith("metadata://r2/")) {
    const key = value.slice("metadata://r2/".length);
    return key.startsWith("covers/") ? key : undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return undefined;
  }

  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (publicBase && value.startsWith(`${publicBase}/`)) {
    const key = decodePath(value.slice(publicBase.length));
    return key.startsWith("covers/") ? key : undefined;
  }

  const endpoint = process.env.R2_ENDPOINT;
  if (!endpoint || !parsed.searchParams.has("X-Amz-Signature")) return undefined;

  let endpointHost: string;
  try {
    endpointHost = new URL(endpoint).host;
  } catch {
    return undefined;
  }
  if (parsed.host !== endpointHost) return undefined;

  const bucket = process.env.R2_BUCKET?.replace(/^\/+|\/+$/g, "");
  let key = decodePath(parsed.pathname);
  if (bucket && key.startsWith(`${bucket}/`)) key = key.slice(bucket.length + 1);
  return key.startsWith("covers/") ? key : undefined;
}

async function backfillCollection(name: "proposals" | "series") {
  const collection = mongoose.connection.db!.collection(name);
  const rows = await collection
    .find(
      {
        $or: [{ coverFileKey: { $exists: false } }, { coverFileKey: null }, { coverFileKey: "" }],
        coverUrl: { $type: "string", $ne: "" },
      },
      { projection: { id: 1, coverUrl: 1 } },
    )
    .toArray();

  const updates = rows.flatMap((row) => {
    const key = extractCoverFileKey(row.coverUrl);
    return key
      ? [
          {
            updateOne: {
              filter: {
                _id: row._id,
                $or: [
                  { coverFileKey: { $exists: false } },
                  { coverFileKey: null },
                  { coverFileKey: "" },
                ],
              },
              update: { $set: { coverFileKey: key } },
            },
          },
        ]
      : [];
  });
  const unresolved = rows.filter((row) => !extractCoverFileKey(row.coverUrl));

  if (!dryRun && updates.length > 0) await collection.bulkWrite(updates);
  console.log(
    `${name}: candidates=${rows.length}, ${dryRun ? "wouldUpdate" : "updated"}=${updates.length}, unresolved=${unresolved.length}`,
  );
  if (unresolved.length > 0) {
    console.log(`  unresolved ids: ${unresolved.map((row) => row.id ?? row._id).join(", ")}`);
  }
}

async function run() {
  console.log(`${dryRun ? "[dry-run] " : ""}Backfilling durable cover file keys`);
  await mongoose.connect(mongoUri);
  try {
    await backfillCollection("proposals");
    await backfillCollection("series");
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
