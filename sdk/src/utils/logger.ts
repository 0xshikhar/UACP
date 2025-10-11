/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

/**
 * Simple logger utility
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;
  private enableTimestamp: boolean;
  private enableColors: boolean;

  constructor(config: LoggerConfig = { level: 'info' }) {
    this.level = this.parseLevel(config.level);
    this.prefix = config.prefix || 'UACP';
    this.enableTimestamp = config.enableTimestamp ?? true;
    this.enableColors = config.enableColors ?? true;
  }

  private parseLevel(level: string): LogLevel {
    const levels: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
    };
    return levels[level] ?? LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = this.enableTimestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = `[${this.prefix}]`;
    const levelStr = `[${level.toUpperCase()}]`;
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';

    return `${timestamp} ${prefix} ${levelStr} ${message}${dataStr}`;
  }

  private colorize(text: string, color: string): string {
    if (!this.enableColors) return text;

    const colors: Record<string, string> = {
      reset: '\x1b[0m',
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    };

    return `${colors[color] || colors.reset}${text}${colors.reset}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.colorize(this.formatMessage('debug', message, data), 'debug'));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.colorize(this.formatMessage('info', message, data), 'info'));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.colorize(this.formatMessage('warn', message, data), 'warn'));
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (this.level <= LogLevel.ERROR) {
      const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.error(this.colorize(this.formatMessage('error', message, errorData), 'error'));
    }
  }

  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.level = this.parseLevel(level);
  }
}

// Default logger instance
export const logger = new Logger({ level: 'info' });
