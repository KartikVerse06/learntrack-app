import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/index.js";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.js";
import { prisma } from "./lib/db.js";

export const app = express();

// Trust proxy for Render / Vercel reverse proxy headers
app.set("trust proxy", 1);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const isAllowed = config.frontendUrl.some(
        (allowed) => origin === allowed || allowed === "*" || origin.endsWith(".vercel.app")
      );

      if (isAllowed || config.nodeEnv === "development") {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(cookieParser());
app.use(express.json());

// Health Check Endpoint (Required by Render)
app.get("/health", async (_req, res) => {
  try {
    // Quick DB connectivity check
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(503).json({
      status: "degraded",
      database: "disconnected",
      timestamp: new Date().toISOString(),
      error: config.nodeEnv === "development" ? err.message : undefined,
    });
  }
});

// Mount V1 API Routes
app.use("/api/v1", apiRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Start server if this file is run directly
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(config.port, () => {
    console.log(
      `🚀 LearnTrack Backend API Server running on port ${config.port} (${config.nodeEnv})`
    );
    console.log(`📡 Health endpoint: http://localhost:${config.port}/health`);
    console.log(`🔗 API Base: http://localhost:${config.port}/api/v1`);
  });

  const shutdown = async () => {
    console.log("Shutting down LearnTrack Backend API server gracefully...");
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Database connection closed. Exiting process.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
