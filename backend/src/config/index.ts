import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "mysql://root:@localhost:3306/learntrack",
  authSecret: process.env.AUTH_SECRET || process.env.JWT_SECRET || "learn-track-development-auth-secret-32-chars-minimum",
  frontendUrl: (process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((u) => u.trim()),
};
