import { config } from '../config';

// Simple logger using console with levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[config.logLevel];

function formatMessage(level: LogLevel, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  
  if (config.logPretty) {
    const emoji = {
      debug: '🔍',
      info: '✨',
      warn: '⚠️',
      error: '❌',
    };
    return `${emoji[level]} [${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }
  
  return JSON.stringify({ timestamp, level, message, ...meta });
}

export const logger = {
  debug(message: string, meta?: any) {
    if (currentLevel <= levels.debug) {
      console.debug(formatMessage('debug', message, meta));
    }
  },
  
  info(message: string, meta?: any) {
    if (currentLevel <= levels.info) {
      console.info(formatMessage('info', message, meta));
    }
  },
  
  warn(message: string, meta?: any) {
    if (currentLevel <= levels.warn) {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  
  error(message: string, meta?: any) {
    if (currentLevel <= levels.error) {
      console.error(formatMessage('error', message, meta));
    }
  },
};
