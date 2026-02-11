import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const LOG_DIR = join(process.cwd(), ".claude", "logs");

/**
 * Append an entry to a JSON array log file.
 * Creates the file and parent directories if they don't exist.
 */
export function appendToLog(name: string, entry: unknown): void {
  const logPath = join(LOG_DIR, `${name}.json`);
  mkdirSync(LOG_DIR, { recursive: true });
  let logData: unknown[] = [];
  if (existsSync(logPath)) {
    try {
      logData = JSON.parse(readFileSync(logPath, "utf-8"));
    } catch {
      logData = [];
    }
  }
  logData.push(entry);
  writeFileSync(logPath, JSON.stringify(logData, null, 2));
}

/**
 * Structured level-based logger that writes to a plain-text log file.
 * Format: `YYYY-MM-DD HH:MM:SS | LEVEL | name | message`
 */
export interface LevelLogger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

export function createLogger(name: string): LevelLogger {
  const logFile = join(LOG_DIR, "hooks.log");
  const env = (process.env.LOG_LEVEL ?? "DEBUG").toUpperCase();
  const minLevel = LOG_LEVELS[env as LogLevel] ?? LOG_LEVELS.DEBUG;
  const prefix = ` | ${name}`;

  mkdirSync(LOG_DIR, { recursive: true });

  const write = (level: LogLevel, message: string): void => {
    if (LOG_LEVELS[level] < minLevel) return;
    try {
      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .slice(0, 19);
      appendFileSync(logFile, `${timestamp} | ${level}${prefix} | ${message}\n`);
    } catch {
      // Fail silently
    }
  };

  return {
    debug: (msg) => write("DEBUG", msg),
    info: (msg) => write("INFO", msg),
    warn: (msg) => write("WARN", msg),
    error: (msg) => write("ERROR", msg),
  };
}
