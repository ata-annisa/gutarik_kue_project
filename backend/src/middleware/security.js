import helmet from "helmet";
import { env } from "../config/env.js";
import { audit } from "../config/logger.js";

// This service only returns JSON, so the CSP can deny everything.
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "no-referrer" },
  crossOriginResourcePolicy: { policy: "same-site" },
  // HSTS is meaningless over plain http://localhost, so only send it in production.
  hsts: env.isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
});

// API responses can contain personal data. Never let a browser or proxy cache them.
export function noStore(_req, res, next) {
  res.setHeader("Cache-Control", "no-store");
  next();
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defense in depth next to SameSite=Strict: a browser always sends Origin on cross-origin
// state-changing requests, so reject any whose Origin is not our frontend.
export function originGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin && origin !== env.CORS_ORIGIN) {
    audit("CSRF_BLOCKED", req, { origin, reason: "ORIGIN_MISMATCH" });
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
