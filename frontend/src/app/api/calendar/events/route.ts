import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";
import { getCalendarEventsApi } from "@/lib/api/calendar";

export async function GET(request: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required to access calendar events." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "start and end date parameters are required." },
        { status: 400 }
      );
    }

    const res = await getCalendarEventsApi(start, end, token);
    if (!res.success) {
      return NextResponse.json(
        res.error || { message: "Failed to fetch calendar events" },
        { status: 500 }
      );
    }

    return NextResponse.json(res.data || []);
  } catch (error) {
    console.error("Failed to load calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching calendar events." },
      { status: 500 }
    );
  }
}
