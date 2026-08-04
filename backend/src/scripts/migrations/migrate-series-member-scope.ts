/**
 * Sprint 2 — MEM-002 — SeriesMember scope migration.
 *
 * Goal
 * ----
 * The legacy SeriesMember.scope field stored free-text values such as
 *   "Full chapter"
 *   "Backgrounds only"
 *   "Lineart & Inking"
 * These were ambiguous: the same field was used to describe both access
 * scope (which pages a member can read) and specialisation (the kind of
 * work they do). The schema now carries two canonical enum columns:
 *   accessScope:      "FULL_SERIES" | "CHAPTER_ONLY" | "TASK_ONLY"
 *   specialization:   "BACKGROUND" | "LINE_ART" | "INKING" | "COLORING"
 *                     | "LETTERING" | "GENERAL"
 *
 * This migration walks every SeriesMember that still has `scope` but is
 * missing one of the canonical columns, applies the mapping defined below,
 * and reports any value that cannot be mapped with certainty so a human can
 * decide instead of silently dropping information.
 *
 * Run with: tsx src/scripts/migrations/migrate-series-member-scope.ts
 *
 * Mapping table
 * -------------
 *   "Full chapter"      → accessScope: "CHAPTER_ONLY"
 *   "Task only"         → accessScope: "TASK_ONLY"
 *   "Backgrounds only"  → specialization: "BACKGROUND"
 *   "Lineart & Inking"  → specialization: "LINE_ART"  (the most common
 *                         intent; "INKING" gets picked if the row also
 *                         carries other ink hints — none today)
 *   "Coloring"          → specialization: "COLORING"
 *   "Lettering"         → specialization: "LETTERING"
 *
 * Unmappable values are written to `migration-report.json` next to the
 * script; the row is left untouched so a human can decide.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { SeriesMemberModel } from "../../db/models.js";
import {
  ASSISTANT_ACCESS_SCOPES,
  ASSISTANT_SPECIALIZATIONS,
} from "../../db/models.js";

const SCOPE_MAP: Record<string, "accessScope" | "specialization", string> = {
  "full chapter": "accessScope:CHAPTER_ONLY",
  "chapter only": "accessScope:CHAPTER_ONLY",
  "task only": "accessScope:TASK_ONLY",
  "task": "accessScope:TASK_ONLY",
  "backgrounds only": "specialization:BACKGROUND",
  "backgrounds": "specialization:BACKGROUND",
  "lineart & inking": "specialization:LINE_ART",
  "lineart": "specialization:LINE_ART",
  "inking": "specialization:INKING",
  "coloring": "specialization:COLOR",
  "color": "specialization:COLOR",
  "lettering": "specialization:LETTERING",
  "general": "specialization:GENERAL",
};

const VALID_ACCESS_SCOPES = new Set<string>(ASSISTANT_ACCESS_SCOPES);
const VALID_SPECIALIZATIONS = new Set<string>(ASSISTANT_SPECIALIZATIONS);

type MigrationResult = {
  scanned: number;
  updated: number;
  alreadyCanonical: number;
  unmappable: Array<{ id: string; seriesId: string; userId: string; scope: string; reason: string }>;
};

function classify(scope: string): { field: "accessScope" | "specialization"; value: string } | null {
  const trimmed = scope.trim().toLowerCase();
  if (!trimmed) return null;
  const mapped = SCOPE_MAP[trimmed];
  if (!mapped) return null;
  const [field, value] = mapped.split(":");
  if (field === "accessScope" && VALID_ACCESS_SCOPES.has(value)) {
    return { field: "accessScope", value };
  }
  if (field === "specialization" && VALID_SPECIALIZATIONS.has(value)) {
    return { field: "specialization", value };
  }
  return null;
}

export async function runSeriesMemberScopeMigration(opts: { writeReport?: boolean } = {}) {
  const result: MigrationResult = {
    scanned: 0,
    updated: 0,
    alreadyCanonical: 0,
    unmappable: [],
  };

  const cursor = SeriesMemberModel.find({}).lean().cursor();
  for await (const raw of cursor) {
    result.scanned += 1;
    const member = raw as any;
    const hasLegacyScope = typeof member.scope === "string" && member.scope.trim().length > 0;
    if (!hasLegacyScope) {
      if (member.accessScope || member.specialization) {
        result.alreadyCanonical += 1;
      }
      continue;
    }

    const accessScope = member.accessScope;
    const specialization = member.specialization;
    const hasAccess = accessScope && VALID_ACCESS_SCOPES.has(accessScope);
    const hasSpec = specialization && VALID_SPECIALIZATIONS.has(specialization);

    if (hasAccess && hasSpec) {
      // Already fully migrated — nothing to do, but keep the legacy column
      // for audit purposes. Future cleanup scripts will drop it.
      result.alreadyCanonical += 1;
      continue;
    }

    const classified = classify(member.scope);
    if (!classified) {
      result.unmappable.push({
        id: member.id,
        seriesId: member.seriesId,
        userId: member.userId,
        scope: member.scope,
        reason: `Scope "${member.scope}" does not match any known mapping`,
      });
      continue;
    }

    const patch: Record<string, unknown> = {};
    if (classified.field === "accessScope" && !hasAccess) {
      patch.accessScope = classified.value;
    } else if (classified.field === "specialization" && !hasSpec) {
      patch.specialization = classified.value;
    }
    if (Object.keys(patch).length === 0) {
      result.alreadyCanonical += 1;
      continue;
    }
    patch.updatedAt = new Date();
    // `member._id` may be missing on lean documents with virtual `id`; fall
    // back to the explicit `id` field when the ObjectId is unavailable.
    const filter = member._id ? { _id: member._id } : { id: member.id };
    await SeriesMemberModel.updateOne(filter, { $set: patch });
    result.updated += 1;
  }

  if (opts.writeReport !== false) {
    const reportPath = resolve(process.cwd(), "migration-report.json");
    writeFileSync(reportPath, JSON.stringify(result, null, 2));
    console.log(`Wrote report to ${reportPath}`);
  }
  return result;
}

async function main() {
  await mongoose.connect(env.MONGO_URI);
  try {
    const result = await runSeriesMemberScopeMigration();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

const isDirectInvocation = process.argv[1]?.endsWith("migrate-series-member-scope.ts");
if (isDirectInvocation) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
