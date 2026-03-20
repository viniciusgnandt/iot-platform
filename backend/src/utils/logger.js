// src/utils/logger.js
// Simple structured logger

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.NODE_ENV === 'production' ? 1 : 3;

const format = (level, message, meta) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
};

export const logger = {
  error: (msg, meta) => levels.error <= currentLevel && console.error(format('error', msg, meta)),
  warn:  (msg, meta) => levels.warn  <= currentLevel && console.warn(format('warn', msg, meta)),
  info:  (msg, meta) => levels.info  <= currentLevel && console.log(format('info', msg, meta)),
  debug: (msg, meta) => levels.debug <= currentLevel && console.log(format('debug', msg, meta)),
};
