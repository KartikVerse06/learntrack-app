import { apiClient, ApiResponse } from "./client";

export async function getCalendarEventsApi(
  start: string,
  end: string,
  token?: string
): Promise<ApiResponse<any[]>> {
  return apiClient<any[]>(
    `/api/v1/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { token }
  );
}
