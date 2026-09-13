import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CalendarEventsQuerySchema } from "@/server/validators/calendar";
import { getCalendarEvents } from "@/server/repositories/calendar-repository";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required to access calendar events." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const parseResult = CalendarEventsQuerySchema.safeParse({ start, end });
  if (!parseResult.success) {
    return NextResponse.json(
      {
        error: "Invalid date range parameters.",
        details: parseResult.error.format(),
      },
      { status: 400 }
    );
  }

  try {
    const events = await getCalendarEvents(
      session.user.id,
      parseResult.data.start,
      parseResult.data.end
    );

    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to load calendar events:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching calendar events." },
      { status: 500 }
    );
  }
}
