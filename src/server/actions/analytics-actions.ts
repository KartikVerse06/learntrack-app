"use server";

import { requireAuth } from "@/lib/session";
import { getFullAnalyticsPayload } from "@/server/repositories/analytics-repository";
import { AnalyticsQuerySchema } from "@/server/validators/analytics";
import type { ActionResult } from "@/types";
import type { AnalyticsPayloadDTO, AnalyticsDateRange } from "@/lib/analytics/analytics-types";

/**
 * Server Action: Fetches comprehensive analytics for the authenticated user.
 * Zero-Trust Tenant Boundary: Extracts verified userId from server-side session.
 */
export async function getAnalyticsDataAction(
  range: AnalyticsDateRange = "30d",
  timezone = "UTC"
): Promise<ActionResult<AnalyticsPayloadDTO>> {
  try {
    const session = await requireAuth();
    if (!session || !session.userId) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be signed in to view learning analytics.",
        },
      };
    }

    const validated = AnalyticsQuerySchema.safeParse({ range, timezone });
    if (!validated.success) {
      const firstIssue = validated.error.issues[0];
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message || "Invalid analytics query parameters.",
        },
      };
    }

    const payload = await getFullAnalyticsPayload(
      session.userId,
      validated.data.range as AnalyticsDateRange,
      validated.data.timezone
    );

    return {
      success: true,
      data: payload,
    };
  } catch (error) {
    if (
      (error instanceof Error && error.name === "UnauthorizedError") ||
      (error instanceof Error && error.message.includes("Authentication required"))
    ) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to load analytics data.",
      },
    };
  }
}
