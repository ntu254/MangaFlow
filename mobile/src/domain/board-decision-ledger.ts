import type { IconName } from "@/design/icons"
import type { Tone } from "@/domain/workflow"
import { formatWorkflowTimestamp } from "@/domain/timestamp"
import type { BoardDecisionHistoryRow } from "@/services/board-mobile-data-source"

// Board-only presentation model: an immutable governance record. It is never
// used for Editor activity, which describes personal work (see editor-activity).

export interface BoardLedgerEntry {
  id: string
  title: string
  /** Governance record class, e.g. "Voting session". */
  recordType: string
  /** Audit outcome for the record, e.g. "Tied round". */
  outcome: string
  /** Re-vote lineage where the backend supplied a prior session. */
  lineage: string | null
  recordedAt: string | null
  timeLabel: string
  tone: Tone
  icon: IconName
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  Proposal: "Proposal decision",
  Session: "Voting session",
  "At-risk": "At-risk decision",
}

const OUTCOME_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FINALIZED: "Finalized",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  CANCEL: "Cancellation decision",
  TIED: "Tied round",
  TIE_BREAK: "Historical tie-break record",
  TIE_BREAK_REQUIRED: "Historical tie-break record",
  NO_QUORUM: "No quorum",
  CONTINUE: "Continue",
  WARNING: "Warning issued",
  REQUEST_IMPROVEMENT_PLAN: "Improvement plan requested",
  AT_RISK: "At-risk signal",
  AT_RISK_SIGNAL: "At-risk signal",
  DECIDED: "Decision recorded",
}

export function ledgerTone(status: string): Tone {
  if (status === "APPROVED" || status === "FINALIZED" || status === "CONTINUE") return "success"
  if (status === "REJECTED" || status === "CANCELLED" || status === "CANCEL") return "danger"
  if (
    status === "TIED" ||
    status === "TIE_BREAK" ||
    status === "TIE_BREAK_REQUIRED" ||
    status === "NO_QUORUM" ||
    status === "WARNING" ||
    status === "AT_RISK" ||
    status === "AT_RISK_SIGNAL"
  ) {
    return "warning"
  }
  return "primary"
}

export function ledgerIcon(status: string): IconName {
  if (status === "TIED" || status === "TIE_BREAK" || status === "TIE_BREAK_REQUIRED") {
    return "scale-balance"
  }
  const tone = ledgerTone(status)
  if (tone === "danger" || tone === "warning") return "alert-triangle"
  if (tone === "success") return "check-circle"
  return "shield-check"
}

export function ledgerOutcome(status: string): string {
  return OUTCOME_LABELS[status] ?? status.replace(/_/g, " ")
}

export function ledgerLineage(metadata?: Record<string, unknown>): string | null {
  const prior = metadata?.reVoteOfSessionId
  return typeof prior === "string" && prior ? `Re-vote of ${prior}` : null
}

export function isReVoteRecord(entry: { outcome: string; lineage: string | null }): boolean {
  return entry.lineage !== null || entry.outcome === "Tied round"
}

export function partitionBoardLedger(entries: BoardLedgerEntry[]) {
  const votingRounds = entries.filter((entry) =>
    entry.recordType === "Voting session" && entry.outcome !== "Finalized" && entry.outcome !== "Closed" && entry.outcome !== "Cancelled",
  )
  const votingIds = new Set(votingRounds.map((entry) => entry.id))
  return { votingRounds, governanceOutcomes: entries.filter((entry) => !votingIds.has(entry.id)) }
}

export function groupBoardLedger(entries: BoardLedgerEntry[]) {
  const { votingRounds, governanceOutcomes } = partitionBoardLedger(entries)
  const proposalDecisions = governanceOutcomes.filter((entry) => entry.recordType === "Proposal decision")
  const sessionOutcomes = governanceOutcomes.filter((entry) => entry.recordType === "Voting session")
  const governanceRecords = governanceOutcomes.filter(
    (entry) => entry.recordType !== "Proposal decision" && entry.recordType !== "Voting session",
  )
  return [
    { id: "votes", title: "Voting rounds", items: votingRounds, tag: "Vote" },
    { id: "proposals", title: "Proposal decisions", items: proposalDecisions, tag: "Decision" },
    { id: "sessions", title: "Session outcomes", items: sessionOutcomes, tag: "Decision" },
    { id: "governance", title: "Governance records", items: governanceRecords, tag: "Governance" },
  ].filter((group) => group.items.length)
}

export function toBoardLedgerEntry(row: BoardDecisionHistoryRow): BoardLedgerEntry {
  return {
    id: row.id,
    title: row.title,
    recordType: RECORD_TYPE_LABELS[row.type] ?? row.type,
    outcome: ledgerOutcome(row.status),
    lineage: ledgerLineage(row.metadata),
    recordedAt: row.date,
    timeLabel: formatWorkflowTimestamp(row.date),
    tone: ledgerTone(row.status),
    icon: ledgerIcon(row.status),
  }
}

export function toBoardLedgerEntries(rows: BoardDecisionHistoryRow[]): BoardLedgerEntry[] {
  return rows.map(toBoardLedgerEntry)
}
