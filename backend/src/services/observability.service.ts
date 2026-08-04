/**
 * In-process metrics module. Sprint 3.1 / OBS-001 — surface the
 * observable signals that the codebase needs to alert on:
 *
 *   - workflow conflict (optimistic version mismatch)
 *   - failed outbox events (status moves to FAILED/DEAD_LETTER)
 *   - stuck voting sessions (status = OPEN without progress for > 24h)
 *
 * The module is intentionally simple: store the counts in-process and
 * expose `/api/metrics` for once-prometheus, once-now dashboards. Values
 * are best-effort; this is not a replacement for a tracing stack.
 */

type Metric = {
  name: string;
  help: string;
  count: number;
  lastValue?: number;
  lastValueAt?: Date;
};

const metrics: Record<string, Metric> = {
  workflow_conflict_total: {
    name: "workflow_conflict_total",
    help: "Number of times a workflow transaction aborted due to optimistic version mismatch.",
    count: 0,
  },
  outbox_failed_total: {
    name: "outbox_failed_total",
    help: "Number of outbox events that moved to FAILED or DEAD_LETTER status.",
    count: 0,
  },
  voting_stuck_total: {
    name: "voting_stuck_total",
    help: "Number of voting sessions observed as OPEN beyond the staleness window.",
    count: 0,
  },
  ledger_rewrites_total: {
    name: "ledger_rewrites_total",
    help: "Number of times the earning ledger flipped an EARN to CONFIRMED/PAID.",
    count: 0,
  },
};

export function incMetric(name: keyof typeof metrics, by = 1) {
  const metric = metrics[name];
  if (!metric) return;
  metric.count += by;
}

export function setMetricGauge(name: keyof typeof metrics, value: number) {
  const metric = metrics[name];
  if (!metric) return;
  metric.lastValue = value;
  metric.lastValueAt = new Date();
}

export function getMetrics(): Metric[] {
  return Object.values(metrics).map((m) => ({ ...m }));
}

export function getMetricsAsText(): string {
  return Object.values(metrics)
    .map((m) => {
      const lines = [`# HELP ${m.help}`, `# TYPE ${m.name} counter`, `${m.name} ${m.count}`];
      if (m.lastValue !== undefined) {
        lines.push(`${m.name}_last ${m.lastValue}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}