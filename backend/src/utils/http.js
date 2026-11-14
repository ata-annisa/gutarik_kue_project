import { audit } from "../config/logger.js";

/** Expected, client-facing failure. Anything else is a bug and becomes a generic 500. */
export class ActionError extends Error {
  constructor(status, message, { reason, details, auditEvent, meta } = {}) {
    super(message);
    this.status = status;
    this.reason = reason;
    this.details = details;
    this.auditEvent = auditEvent; // when set, the failure is also written to security-audit.log
    this.meta = meta;
  }
}

/** Validate req.body / req.params / req.query with a zod schema, or throw a 400 with field details. */
export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw new ActionError(400, "Invalid input", {
      details: result.error.issues.map((i) => ({ field: i.path.join(".") || "(body)", message: i.message })),
    });
  }
  return result.data;
}

/** try/catch in one place: known errors get a precise response, unknown ones go to the central error handler. */
export const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (!(err instanceof ActionError)) return next(err);
    if (err.auditEvent) audit(err.auditEvent, req, { reason: err.reason, ...err.meta });
    res.status(err.status).json({ error: err.message, ...(err.details && { details: err.details }) });
  }
};

/**
 * Object level authorization (anti-IDOR). `record` is what was loaded by id, `ownerId` its owner.
 * Someone else's record gets the exact same 404 as a record that does not exist, so ids cannot be
 * probed, but the attempt is written to the audit log.
 */
export function assertOwner(req, record, ownerId, resource) {
  if (!record) throw new ActionError(404, `${resource} not found`);
  if (ownerId !== req.user.id) {
    audit("RBAC_DENIED", req, { reason: "NOT_OWNER", resource, resourceId: record.id });
    throw new ActionError(404, `${resource} not found`);
  }
}

export const isUniqueViolation = (err) => err?.code === "P2002";
export const isForeignKeyViolation = (err) => err?.code === "P2003" || err?.meta?.code === "23503";
