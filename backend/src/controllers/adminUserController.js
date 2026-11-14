import { prisma } from "../config/prisma.js";
import { audit } from "../config/logger.js";
import { Role } from "../generated/prisma/enums.ts";
import { ActionError, handle, parse } from "../utils/http.js";
import {
  listUsersQuery,
  userIdParams,
  roleBody,
  statusBody,
} from "../validators/admin.validators.js";

// The only fields that ever leave this API. passwordHash and tokenVersion are never selected.
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

const MAX_TX_ATTEMPTS = 3;

const BLOCKED = "ADMIN_ACTION_BLOCKED";

function assertNotSelf(req, targetId, requested) {
  if (targetId === req.user.id) {
    throw new ActionError(409, "You cannot change your own role or status", {
      reason: "SELF_MODIFICATION",
      auditEvent: BLOCKED,
      meta: { targetUserId: targetId, requested },
    });
  }
}

const isSerializationFailure = (err) =>
  err?.code === "P2034" || err?.meta?.code === "40001" || /could not serialize|deadlock/i.test(err?.message ?? "");

// Would this change take an active administrator out of the pool of active administrators?
const removesAdminAccess = (before, data) =>
  before.role === Role.ADMIN &&
  before.isActive &&
  ((data.role !== undefined && data.role !== Role.ADMIN) || data.isActive === false);

/**
 * Load the target, let `decide(target)` return the change (or null for "nothing to do"),
 * refuse to remove the last active ADMIN, then apply it, all in one SERIALIZABLE transaction.
 *
 * Why serializable: with plain READ COMMITTED, two admins demoting each other at the same
 * instant would each see "another admin still exists" and both succeed, leaving zero admins.
 * Serializable makes PostgreSQL abort one of them, and we retry it against the new state.
 */
async function mutateUser(targetId, decide, requested) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const before = await tx.user.findUnique({ where: { id: targetId }, select: USER_SELECT });
          if (!before) throw new ActionError(404, "User not found", { reason: "USER_NOT_FOUND" });

          const change = decide(before);
          if (!change) return { user: before, before, changed: false };

          if (removesAdminAccess(before, change.data)) {
            const otherActiveAdmins = await tx.user.count({
              where: { role: Role.ADMIN, isActive: true, id: { not: targetId } },
            });
            if (otherActiveAdmins === 0) {
              throw new ActionError(409, "Cannot remove the last active administrator", {
                reason: "LAST_ADMIN",
                auditEvent: BLOCKED,
                meta: { targetUserId: targetId, requested },
              });
            }
          }

          const user = await tx.user.update({ where: { id: targetId }, data: change.data, select: USER_SELECT });
          return { user, before, changed: true };
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err) {
      if (!isSerializationFailure(err)) throw err;
      if (attempt >= MAX_TX_ATTEMPTS) {
        throw new ActionError(409, "The user was modified concurrently, please retry", {
          reason: "CONCURRENT_UPDATE",
          auditEvent: BLOCKED,
          meta: { targetUserId: targetId, requested },
        });
      }
    }
  }
}

// GET /api/admin/users?page=1&limit=50
export const getUsers = handle(async (req, res) => {
  const { page, limit } = parse(listUsersQuery, req.query);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: USER_SELECT,
      // id as tie-breaker keeps pages stable when several users share a createdAt.
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count(),
  ]);

  res.json({ users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// PATCH /api/admin/users/:id/role   body: { "role": "ADMIN" | "SELLER" | "CUSTOMER" }
export const updateUserRole = handle(async (req, res) => {
  const { id } = parse(userIdParams, req.params);
  const { role } = parse(roleBody, req.body);
  assertNotSelf(req, id, role);

  const { user, before, changed } = await mutateUser(
    id,
    (target) =>
      target.role === role
        ? null // already has this role: no write, and the user's sessions are left alone
        : { data: { role, tokenVersion: { increment: 1 } } }, // revoke every JWT issued under the old role
    role
  );

  if (changed) {
    audit("USER_ROLE_CHANGED", req, {
      targetUserId: id,
      targetEmail: user.email,
      fromRole: before.role,
      toRole: user.role,
    });
  }
  res.json({ user, changed });
});

// PATCH /api/admin/users/:id/status   body: { "isActive": true | false }
export const updateUserStatus = handle(async (req, res) => {
  const { id } = parse(userIdParams, req.params);
  const { isActive } = parse(statusBody, req.body);
  assertNotSelf(req, id, isActive);

  const { user, before, changed } = await mutateUser(
    id,
    (target) => {
      if (target.isActive === isActive) return null;
      // Deactivation also revokes tokens, so they cannot come back to life if the account is re-enabled.
      return { data: isActive ? { isActive } : { isActive, tokenVersion: { increment: 1 } } };
    },
    isActive
  );

  if (changed) {
    audit("USER_STATUS_CHANGED", req, {
      targetUserId: id,
      targetEmail: user.email,
      fromActive: before.isActive,
      toActive: user.isActive,
    });
  }
  res.json({ user, changed });
});
