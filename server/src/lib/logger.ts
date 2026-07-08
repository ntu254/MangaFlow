type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("debug")) console.debug(format("debug", message, meta));
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) console.info(format("info", message, meta));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) console.warn(format("warn", message, meta));
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("error")) console.error(format("error", message, meta));
  },
};
