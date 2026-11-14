import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { audit } from "../config/logger.js";
import { env } from "../config/env.js";

function makeLimiter({ name, windowMs, limit, message, key, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests, // only failed attempts count toward the limit
    standardHeaders: true, // RateLimit-* headers
    legacyHeaders: false,
    keyGenerator: key ?? ((req) => ipKeyGenerator(req.ip)),
    handler: (req, res) => {
      audit("RATE_LIMIT_EXCEEDED", req, {
        limiter: name,
        resetTime: req.rateLimit?.resetTime?.toISOString?.(),
      });
      res.status(429).json({ error: message });
    },
  });
}

const normalizedEmail = (req) =>
  String(req.body?.email ?? "").trim().toLowerCase().slice(0, 254);

/** Baseline for every /api route. */
export const apiLimiter = makeLimiter({
  name: "api",
  windowMs: 60 * 1000,
  limit: env.API_RATE_LIMIT_PER_MIN,
  message: "Too many requests, slow down.",
});

/** Stops mass account creation from one address. */
export const registerLimiter = makeLimiter({
  name: "register",
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many registrations from this address. Try again later.",
});

/** Credential stuffing: one address trying many different accounts. */
export const loginIpLimiter = makeLimiter({
  name: "login-ip",
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts. Try again in 15 minutes.",
});

/**
 * Brute force: one address hammering one account.
 * Keyed by IP + email (not email alone) so a stranger cannot lock the real owner
 * out of their account just by spamming wrong passwords for it.
 */
export const loginAccountLimiter = makeLimiter({
  name: "login-account",
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  key: (req) => `${ipKeyGenerator(req.ip)}|${normalizedEmail(req)}`,
  message: "Too many failed login attempts. Try again in 15 minutes.",
});

/** Checkout creates orders and moves stock, so it gets its own per-account budget. */
export const checkoutLimiter = makeLimiter({
  name: "checkout",
  windowMs: 10 * 60 * 1000,
  limit: 10,
  key: (req) => (req.user?.id ? `user:${req.user.id}` : ipKeyGenerator(req.ip)),
  message: "Too many checkout attempts. Try again in a few minutes.",
});
