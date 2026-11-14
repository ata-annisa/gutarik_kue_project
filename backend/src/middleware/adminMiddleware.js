import { authenticate } from "./authenticate.js";
import { authorize } from "./authorize.js";
import { Role } from "../generated/prisma/enums.ts";

/**
 * Admin-only gate = the two existing checks, in order:
 *   1. authenticate: verifies the JWT from the httpOnly session cookie, loads the user from the
 *      database and requires that it exists, isActive === true and the tokenVersion still matches.
 *      Failure -> 401 (and AUTH_TOKEN_INVALID in security-audit.log).
 *   2. authorize(ADMIN): requires role === ADMIN, read from the database row, never from the token.
 *      Failure -> 403 (and RBAC_DENIED in security-audit.log).
 *
 * It is composed from them on purpose: one place verifies tokens, so the admin routes cannot
 * drift away from the rules every other route follows.
 */
export const requireAdmin = [authenticate, authorize(Role.ADMIN)];
