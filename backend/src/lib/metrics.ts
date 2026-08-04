/**
 * Sprint 3.8 (OBS-001) — minimal in-process metric registry. We avoid the
 * `prom-client` dependency for the studio pipeline because we only need
 * monotonic counters surfaced to the /api/ops/metrics endpoint. Each metric
 * is incremented from inside workflow-support and outbox-runner services so
 * dashboards can alert on sustained spike in workflow conflicts.
 *
 * Sprint 3.8 (OBS-001) keeps registry state module-local so tests can reset
 * between runs with `resetMetrics()`.
 */

const counters = new Map<string, number>();
const labels = new Map<string, Record<string, string>>();

export function incMetric(name: string, by = 1, label?: Record<string, string>) {
  counters.set(name, (counters.get(name) ?? 0) + by);
  if (label) labels.set(name, label);
}

export function getMetric(name: string): number {
  return counters.get(name) ?? 0;
}

export function resetMetrics() {
  counters.clear();
  labels.clear();
}

export interface MetricReportRow {
  name: string;
  value: number;
  labels?: Record<string, string>;
}

export function snapshot(): MetricReportRow[] {
  return Array.from(counters.entries()).map(([name, value]) => ({
    name,
    value,
    labels: labels.get(name),
  }));
}

export const WORKFLOW_CONFLICT = "workflow.conflict";
export const OUTBOX_FAILED = "outbox.failed";
export const VOTING_STUCK = "voting.stuck";
export const TASK_NO_TERMINAL = "task.no_terminal";
