import { env } from "../config/env.js";

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Payload too large" });

  console.error(
    JSON.stringify({
      level: "error",
      requestId: req.id,
      name: err.name,
      message: err.message,
      stack: env.isProd ? undefined : err.stack,
    })
  );
  // The client gets an id to quote, never the error details.
  res.status(500).json({ error: "Internal server error", requestId: req.id });
}
