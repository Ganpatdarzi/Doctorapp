import { randomUUID } from "crypto";

const isProduction = process.env.NODE_ENV === "production";

const levels = { debug: 10, info: 20, warn: 30, error: 40 };

const colorize = (level) => {
  const colors = { debug: 36, info: 32, warn: 33, error: 31 };
  return `\x1b[${colors[level] || 0}m${level.toUpperCase()}\x1b[0m`;
};

const write = (level, message, meta) => {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length ? { ...meta } : {}),
  });
  const out = isProduction
    ? line
    : `${new Date().toISOString()} ${colorize(level)} ${message}${
        meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""
      }`;
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
};

const logger = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};

export const requestId = (req, res, next) => {
  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};

export default logger;
