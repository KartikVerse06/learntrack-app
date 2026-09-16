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
const allowedOrigins = [
  "https://learntrack-six.vercel.app",
  ...config.frontendUrl.filter((u) => u && u !== "*"),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAllowedOrigins = allowedOrigins.map((u) => u.replace(/\/$/, ""));

      const isAllowed =
        normalizedAllowedOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith(".vercel.app") ||
        (config.nodeEnv === "development" &&
          (normalizedOrigin.startsWith("http://localhost:") ||
            normalizedOrigin.startsWith("http://127.0.0.1:")));

      if (isAllowed) {
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

// Root Endpoint
app.get("/", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "LearnTrack Backend API is running",
  });
});

// Health Check Endpoint (Required by Render)
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (err: any) {
    console.error("[Health Check Error] Database query failed:", err?.message || err);
    return res.status(200).json({
      status: "ok",
      database: "disconnected",
      error: err?.message || "Database connection failure",
    });
  }
});

// Mount V1 API Routes
app.use("/api/v1", apiRoutes);

// Centralized Error Handler
app.use(errorHandler);

// Start server if this file is run directly
if (process.env.NODE_ENV !== "test") {
  const PORT = Number(process.env.PORT) || config.port;
  const HOST = "0.0.0.0";

  const server = app.listen(PORT, HOST, () => {
    console.log(
      `🚀 LearnTrack Backend API Server running on http://${HOST}:${PORT} (${config.nodeEnv})`
    );
    console.log(`📡 Health endpoint: http://${HOST}:${PORT}/health`);
    console.log(`🔗 API Base: http://${HOST}:${PORT}/api/v1`);
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
