/**
 * Simple structured logger for the server resilience layer.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.message}${ctx}`;
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      context,
    };
    // eslint-disable-next-line no-console
    console.debug(formatEntry(entry));
  },

  info(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context,
    };
    console.info(formatEntry(entry));
  },

  warn(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context,
    };
    console.warn(formatEntry(entry));
  },

  error(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      context,
    };
    console.error(formatEntry(entry));
  },
};
