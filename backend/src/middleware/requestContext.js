import { randomUUID } from "node:crypto";

// Always generated server-side. A client-supplied id would let an attacker forge log correlation.
export function requestContext(req, res, next) {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}
