import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";
import { API_BASE_URL } from "@/lib/api/client";

export async function GET(req: NextRequest) {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to download reports." },
        { status: 401 }
      );
    }

    const { searchParams } = req.nextUrl;
    const backendUrl = `${API_BASE_URL}/api/v1/reports/download?${searchParams.toString()}`;

    const backendRes = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        errorData.error || { message: "Failed to generate report on backend" },
        { status: backendRes.status }
      );
    }

    const contentType =
      backendRes.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      backendRes.headers.get("content-disposition") ||
      'attachment; filename="report"';

    const blob = await backendRes.arrayBuffer();

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("[Report Download Route Proxy Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating your report." },
      { status: 500 }
    );
  }
}
