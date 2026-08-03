import { StudioRegionModel } from "../db/models.js";
import { nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import type { ClientSession } from "mongoose";

/**
 * Region lock is deliberately hidden behind this module. `taskId` identifies
 * the task assigned to a region; `activeTaskId`/`lockedByTaskId` identify the
 * task that currently owns the lock. Releasing a lock must never leave the
 * latter stale, otherwise the region becomes permanently unclaimable.
 */
export async function releaseRegionForTask(
  regionId: string | undefined,
  taskId: string,
  nextStatus = "CONFIRMED",
  session?: ClientSession,
) {
  if (!regionId) return null;
  const query = StudioRegionModel.updateOne(
    {
      id: regionId,
      $or: [{ activeTaskId: taskId }, { lockedByTaskId: taskId }],
    },
    {
      $set: {
        activeTaskId: null,
        lockedByTaskId: null,
        lockedAt: null,
        lockStatus: "UNLOCKED",
        status: nextStatus,
        updatedAt: nowIso(),
      },
    },
    session ? { session } : undefined,
  );
  return query;
}

export async function lockRegionForTask(
  regionId: string | undefined,
  taskId: string,
  session?: ClientSession,
) {
  if (!regionId) return null;
  const result = await StudioRegionModel.updateOne(
    {
      id: regionId,
      $and: [
        {
          $or: [
            { activeTaskId: null },
            { activeTaskId: taskId },
            { activeTaskId: { $exists: false } },
          ],
        },
        {
          $or: [
            { lockedByTaskId: null },
            { lockedByTaskId: taskId },
            { lockedByTaskId: { $exists: false } },
          ],
        },
      ],
    },
    {
      $set: {
        activeTaskId: taskId,
        lockedByTaskId: taskId,
        lockedAt: new Date(),
        lockStatus: "LOCKED",
        status: "IN_PROGRESS",
        updatedAt: nowIso(),
      },
    },
    session ? { session } : undefined,
  );
  if (result.modifiedCount !== 1) {
    throw new AppError(409, "Region is already locked by another task.", "REGION_LOCKED");
  }
  return result;
}
