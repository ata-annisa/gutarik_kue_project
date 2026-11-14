import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { SESSION_COOKIE, verifySession, clearSession } from "../utils/session.js";

const reject = (res, message = "Authentication required") =>
  res.status(401).json({ error: message });

/**
 * Proves who the caller is. The role is NEVER read from the token: the user row is loaded
 * on every request, so a role change or a deactivation takes effect immediately.
 */
export async function authenticate(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return reject(res);

  let payload;
  try {
    payload = verifySession(token);
  } catch (err) {
    audit("AUTH_TOKEN_INVALID", req, { reason: err.name }); // JsonWebTokenError / TokenExpiredError
    clearSession(res);
    return reject(res);
  }

  const user =
    typeof payload.sub === "string"
      ? await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, name: true, email: true, role: true, isActive: true, tokenVersion: true },
        })
      : null;

  const reason = !user
    ? "USER_NOT_FOUND"
    : !user.isActive
      ? "ACCOUNT_DISABLED"
      : user.tokenVersion !== payload.tv
        ? "TOKEN_REVOKED"
        : null;

  if (reason) {
    audit("AUTH_TOKEN_INVALID", req, { userId: payload.sub, jti: payload.jti, reason });
    clearSession(res);
    return reject(res);
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
}
