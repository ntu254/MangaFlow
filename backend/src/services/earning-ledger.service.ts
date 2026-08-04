import { EarningLedgerEntryModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import { runWorkflowTransaction } from "./workflow-support.service.js";
import type { ClientSession } from "mongoose";

export type EarningEntryType = "EARN" | "REVERSE" | "ADJUST" | "CONFIRM" | "PAY";

export interface EarningLedgerEntryInput {
  entryType: EarningEntryType;
  assistantId: string;
  seriesId?: string;
  chapterId?: string;
  taskId?: string;
  submissionId?: string;
  // Sprint 3.1 / EARN-001 — the sourceKey encodes the domain event that
  // produced the entry, e.g. `TASK_APPROVAL:<taskId>:<submissionId>` or
  // `TASK_REVERSAL:<taskId>:<submissionId>`. The unique index on this
  // field makes the entry idempotent against replays.
  sourceKey: string;
  amount: number;
  currency?: string;
  reason?: string;
  reverseOfKey?: string;
  actorId?: string;
}

export interface EarningLedgerSummary {
  totalEarned: number;
  totalReversed: number;
  totalAdjusted: number;
  totalPaid: number;
  netConfirmed: number;
  netPending: number;
  currency: string;
}

/**
 * Append a new entry to the earning ledger. Re-issuing the same
 * sourceKey is a no-op — the existing entry is returned instead of
 * creating a duplicate.
 */
export async function appendEarningEntry(
  input: EarningLedgerEntryInput,
): Promise<{ entry: any; created: boolean }> {
  const existing = await EarningLedgerEntryModel.findOne({ sourceKey: input.sourceKey }).lean();
  if (existing) {
    return { entry: existing, created: false };
  }

  const entry = await runWorkflowTransaction(async (session: ClientSession) => {
    // Sprint 3.1 / EARN-001 — confirm/pay entries flip the underlying
    // EARN's status so subsequent reads can answer balance queries
    // without scanning the entry chain.
    if (input.entryType === "CONFIRM" && input.taskId && input.submissionId) {
      await EarningLedgerEntryModel.updateOne(
        {
          entryType: "EARN",
          taskId: input.taskId,
          submissionId: input.submissionId,
        },
        { $set: { status: "CONFIRMED", updatedAt: nowIso() } },
        session ? { session } : undefined,
      );
    }
    if (input.entryType === "PAY" && input.taskId && input.submissionId) {
      await EarningLedgerEntryModel.updateOne(
        {
          entryType: "EARN",
          taskId: input.taskId,
          submissionId: input.submissionId,
        },
        { $set: { status: "PAID", updatedAt: nowIso() } },
        session ? { session } : undefined,
      );
    }

    const doc = await EarningLedgerEntryModel.create(
      [
        {
          id: id("ern-ledger"),
          entryType: input.entryType,
          // EARN starts as PENDING, CONFIRM/PAY transitions later.
          status:
            input.entryType === "EARN"
              ? "PENDING"
              : input.entryType === "REVERSE"
                ? "REVERSED"
                : input.entryType === "ADJUST"
                  ? "ADJUSTED"
                  : input.entryType === "CONFIRM"
                    ? "CONFIRMED"
                    : "PAID",
          assistantId: input.assistantId,
          seriesId: input.seriesId,
          chapterId: input.chapterId,
          taskId: input.taskId,
          submissionId: input.submissionId,
          sourceKey: input.sourceKey,
          amount: input.amount,
          currency: input.currency ?? "VND",
          reason: input.reason,
          reverseOfKey: input.reverseOfKey,
          approvedById: input.entryType === "CONFIRM" ? input.actorId : undefined,
          approvedAt:
            input.entryType === "CONFIRM" || input.entryType === "PAY"
              ? new Date()
              : undefined,
          paidById: input.entryType === "PAY" ? input.actorId : undefined,
          paidAt: input.entryType === "PAY" ? new Date() : undefined,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
      ],
      session ? { session } : undefined,
    );
    return doc[0];
  });

  return { entry, created: true };
}

/**
 * Reverse a previously issued EARN entry. The reversal references the
 * original `sourceKey` via `reverseOfKey` so the audit trail points
 * back to the source event.
 */
export async function reverseEarningEntry(
  sourceKey: string,
  actorId: string,
  reason: string,
): Promise<{ entry: any; created: boolean }> {
  const original = await EarningLedgerEntryModel.findOne({ sourceKey }).lean();
  if (!original) {
    throw new AppError(404, "Earning entry not found.", "EARNING_ENTRY_NOT_FOUND");
  }
  const reverseKey = `TASK_REVERSAL:${original.taskId ?? original.id}:${original.submissionId ?? original.id}`;
  return appendEarningEntry({
    entryType: "REVERSE",
    assistantId: original.assistantId,
    seriesId: original.seriesId,
    chapterId: original.chapterId,
    taskId: original.taskId,
    submissionId: original.submissionId,
    sourceKey: reverseKey,
    amount: -original.amount,
    currency: original.currency,
    reason,
    reverseOfKey: sourceKey,
    actorId,
  });
}

/**
 * Calculate the running balance for an assistant by replaying the ledger.
 * Status flows through PENDING → CONFIRMED → PAID, with REVERSE and
 * ADJUST side-entries that subtract or modify the running total.
 */
export async function summarizeEarningLedger(
  assistantId: string,
  period?: string,
): Promise<EarningLedgerSummary> {
  const filter: Record<string, unknown> = { assistantId };
  if (period) filter.period = period;
  const entries = await EarningLedgerEntryModel.find(filter).lean();

  const summary: EarningLedgerSummary = {
    totalEarned: 0,
    totalReversed: 0,
    totalAdjusted: 0,
    totalPaid: 0,
    netConfirmed: 0,
    netPending: 0,
    currency: entries[0]?.currency ?? "VND",
  };

  for (const entry of entries as any[]) {
    if (entry.entryType === "EARN") {
      summary.totalEarned += entry.amount;
      if (entry.status === "CONFIRMED" || entry.status === "PAID") {
        summary.netConfirmed += entry.amount;
      } else {
        summary.netPending += entry.amount;
      }
    } else if (entry.entryType === "CONFIRM") {
      // CONFIRM is a status transition, not a separate amount. Reflect
      // the move from PENDING to CONFIRMED by moving the entry's worth
      // into the netConfirmed bucket when the underlying EARN is still
      // active.
      const earn = entries.find(
        (e: any) =>
          e.entryType === "EARN" &&
          e.taskId === entry.taskId &&
          e.submissionId === entry.submissionId &&
          e.status === "PENDING",
      );
      if (earn) {
        summary.netPending -= earn.amount;
        summary.netConfirmed += earn.amount;
      }
    } else if (entry.entryType === "PAY") {
      summary.totalPaid += entry.amount;
    } else if (entry.entryType === "REVERSE") {
      summary.totalReversed += Math.abs(entry.amount);
      summary.netConfirmed -= Math.abs(entry.amount);
    } else if (entry.entryType === "ADJUST") {
      summary.totalAdjusted += entry.amount;
      summary.netConfirmed += entry.amount;
    }
  }
  return summary;
}

export const EARNING_LEDGER_ENTRY_TYPES: EarningEntryType[] = [
  "EARN",
  "REVERSE",
  "ADJUST",
  "CONFIRM",
  "PAY",
];