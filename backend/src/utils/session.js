import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "gk_session";
const ISSUER = "gutarik-kue-api";
const AUDIENCE = "gutarik-kue-web";

const cookieBase = {
  httpOnly: true, // not readable from JavaScript, so XSS cannot steal the token
  sameSite: "strict", // not sent on cross-site requests, first line of CSRF defense
  secure: env.isProd, // HTTPS only in production (localhost dev runs over http)
  path: "/api",
};

/** Sign a short-lived JWT and set it as an httpOnly cookie. Returns the token id (jti) for logging. */
export function issueSession(res, user) {
  const jti = randomUUID();
  const token = jwt.sign({ tv: user.tokenVersion }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: user.id,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: env.JWT_EXPIRES_SECONDS,
    jwtid: jti,
  });
  res.cookie(SESSION_COOKIE, token, { ...cookieBase, maxAge: env.JWT_EXPIRES_SECONDS * 1000 });
  return jti;
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, cookieBase);
}

/** Verify signature, expiry, issuer and audience. The algorithm is pinned to block alg=none / key confusion. */
export function verifySession(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}
