import { z } from "zod";

export const AnalyticsQuerySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
  timezone: z.string().default("UTC"),
});

export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;
