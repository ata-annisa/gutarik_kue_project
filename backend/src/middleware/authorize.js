import { Role } from "../generated/prisma/enums.ts";
import { audit } from "../config/logger.js";

const VALID_ROLES = new Set(Object.values(Role));

/**
 * RBAC gate. Must run after `authenticate`.
 *
 *   router.get("/users", authenticate, authorize(Role.ADMIN), listUsers)
 *   router.post("/products", authenticate, authorize(Role.SELLER, Role.ADMIN), createProduct)
 *
 * Design rules:
 *  - Default deny: a role that is not listed is rejected. There is no implicit hierarchy,
 *    so every route states exactly who may call it.
 *  - Fail closed at startup: an empty or misspelled role list throws when the route is
 *    declared, instead of silently locking out (or opening up) an endpoint.
 *  - Every rejection is written to security-audit.log.
 */
export function authorize(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error("authorize() needs at least one role");
  }
  for (const r of allowedRoles) {
    if (!VALID_ROLES.has(r)) throw new Error(`authorize(): unknown role "${r}"`);
  }
  const allowed = new Set(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      // Wiring bug (authorize used without authenticate). Deny rather than guess.
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowed.has(req.user.role)) {
      audit("RBAC_DENIED", req, {
        reason: "ROLE_NOT_ALLOWED",
        role: req.user.role,
        requiredRoles: allowedRoles,
      });
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
