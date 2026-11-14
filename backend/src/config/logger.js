import fs from "node:fs";
import path from "node:path";
import winston from "winston";
import { env } from "./env.js";

fs.mkdirSync(env.LOG_DIR, { recursive: true });
const AUDIT_FILE = path.join(env.LOG_DIR, "security-audit.log");

// Closed vocabulary of security events. Anything not listed here cannot be logged,
// which keeps the log queryable (a typo can't create a new, unmonitored event name).
const EVENT_LEVELS = Object.freeze({
  // authentication
  AUTH_REGISTER_SUCCESS: "info",
  AUTH_REGISTER_FAILURE: "warn",
  AUTH_LOGIN_SUCCESS: "info",
  AUTH_LOGIN_FAILURE: "warn",
  AUTH_LOGOUT: "info",
  AUTH_TOKEN_INVALID: "warn",
  // access control and abuse
  RBAC_DENIED: "warn",
  RATE_LIMIT_EXCEEDED: "warn",
  CSRF_BLOCKED: "warn",
  ADMIN_ACTION_BLOCKED: "warn",
  // critical transactions 
  PRODUCT_CREATED: "info",
  PRODUCT_UPDATED: "info",
  PRODUCT_MODERATED: "info",
  ORDER_CREATED: "info",
  ORDER_STATUS_CHANGED: "info",
  PRODUCT_DELETED: "info",
  USER_ROLE_CHANGED: "warn",
  USER_STATUS_CHANGED: "warn",
});

const SENSITIVE_KEY = /pass|secret|token|hash|cookie|authorization/i;
const clip = (v, n) => (typeof v === "string" && v.length > n ? v.slice(0, n) : v);

// Defense in depth: even if a caller passes a secret by mistake, it never reaches the file.
function sanitize(details) {
  const out = {};
  for (const [k, v] of Object.entries(details)) {
    if (SENSITIVE_KEY.test(k)) continue;
    out[k] = clip(v, 300);
  }
  return out;
}

const securityLogger = winston.createLogger({
  level: "info",
  exitOnError: false,
  defaultMeta: { service: "gutarik-kue-backend" },
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({
      filename: AUDIT_FILE,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 10,
      tailable: true,
    }),
    ...(env.NODE_ENV === "test"
      ? []
      : [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize({ all: true }),
              winston.format.printf(
                (i) => `[audit] ${i.event} user=${i.userId ?? "-"} ip=${i.ip ?? "-"} ${i.reason ?? ""}`.trim()
              )
            ),
          }),
        ]),
  ],
});

/**
 * Write one security event as a JSON line to logs/security-audit.log.
 * @param {keyof typeof EVENT_LEVELS} event
 * @param {import("express").Request | null} req  source of ip / user / request id
 * @param {Record<string, unknown>} details       event specific fields (secrets are dropped)
 */
export function audit(event, req, details = {}) {
  const level = EVENT_LEVELS[event];
  if (!level) throw new Error(`Unknown audit event: ${event}`);
  securityLogger.log({
    level,
    message: event,
    event,
    requestId: req?.id,
    userId: req?.user?.id ?? null,
    ip: req?.ip,
    method: req?.method,
    path: req?.originalUrl?.split("?")[0],
    userAgent: clip(req?.get?.("user-agent"), 200),
    ...sanitize(details),
  });
}

export const AUDIT_FILE_PATH = AUDIT_FILE;
