import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { requestContext } from "./middleware/requestContext.js";
import { securityHeaders, noStore, originGuard } from "./middleware/security.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", env.TRUST_PROXY); // exact hop count, never `true`
  app.disable("x-powered-by");

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type"],
    })
  );
  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  // Liveness + database check. Registered before the limiter so Docker healthchecks never count.
  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", db: "up", time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "degraded", db: "down" });
    }
  });

  app.use("/api", noStore, apiLimiter, originGuard, routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
