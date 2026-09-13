import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { reportQuerySchema } from "@/lib/reports/report-types";
import { fetchReportData } from "@/server/repositories/report-repository";
import { generateCsvForReport } from "@/lib/reports/csv-generator";
import { generateJsonForReport } from "@/lib/reports/json-generator";
import { generatePdfForReport } from "@/lib/reports/pdf-generator";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to download reports." }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const rawParams = {
      type: searchParams.get("type"),
      format: searchParams.get("format"),
      range: searchParams.get("range") || "30d",
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
    };

    const parsed = reportQuerySchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report query parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { type, format, range, from, to, categoryId } = parsed.data;

    // Fetch report data strictly filtered by authenticated user's ID
    const reportData = await fetchReportData(session.user.id, type, range, from, to, categoryId);

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `learntrack-${type}-${timestamp}.${format}`;

    if (format === "csv") {
      const csvString = generateCsvForReport(type, reportData);
      return new Response(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    if (format === "json") {
      const jsonString = generateJsonForReport(type, reportData);
      return new Response(jsonString, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    if (format === "pdf") {
      const pdfBuffer = generatePdfForReport(type, reportData);
      return new Response(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return NextResponse.json({ error: "Unsupported export format" }, { status: 400 });
  } catch (error) {
    console.error("[Report Download Handler Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating your report." },
      { status: 500 }
    );
  }
}
