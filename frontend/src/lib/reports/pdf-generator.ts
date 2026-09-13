import {
  AnalyticsReportData,
  CalendarActivityReportData,
  CompleteReportData,
  FocusTimeReportData,
  LearningLogReportData,
  LearningProgressReportData,
  MasteryReportData,
  MoneyReportData,
  ReportType,
  RevisionReportData,
} from "./report-types";

/**
 * Escapes characters for PDF literal strings enclosed in parentheses.
 * Replaces backslash and unbalanced parentheses.
 */
function escapePdf(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  const str = String(text);
  // Replace non-ascii or problematic characters with safe equivalents
  const sanitized = str
    .replace(/[^\x20-\x7E]/g, (char) => {
      // Map some common unicode characters
      if (char === "—" || char === "–") return "-";
      if (char === "\u201C" || char === "\u201D" || char === '"') return '"';
      if (char === "\u2018" || char === "\u2019" || char === "'") return "'";
      if (char === "•") return "*";
      if (char === "…") return "...";
      return " ";
    })
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
  return sanitized;
}

interface TableColumn {
  header: string;
  width: number;
  align?: "left" | "center" | "right";
}

/**
 * Native PDF Document Builder (PDF 1.4 compliant, zero dependencies)
 */
class PdfDocument {
  private pages: string[][] = [];
  private currentPageStreams: string[] = [];
  private currentY: number = 780;
  private readonly pageWidth: number = 595.28; // A4 pt
  private readonly pageHeight: number = 841.89; // A4 pt
  private readonly margin: number = 40;
  private readonly contentWidth: number = 515.28; // 595.28 - 80

  private title: string = "";
  private reportPeriod: string = "";
  private userName: string = "";

  constructor(title: string, reportPeriod: string, userName: string) {
    this.title = title;
    this.reportPeriod = reportPeriod;
    this.userName = userName;
    this.addNewPage();
  }

  public get PageCount(): number {
    return this.pages.length;
  }

  public get CurrentY(): number {
    return this.currentY;
  }

  public addNewPage(): void {
    if (this.currentPageStreams.length > 0) {
      this.pages.push([...this.currentPageStreams]);
      this.currentPageStreams = [];
    }
    this.currentY = this.pageHeight - this.margin - 50; // Leave room for top banner
  }

  public checkPageBreak(requiredHeight: number, onNewPage?: () => void): void {
    if (this.currentY - requiredHeight < this.margin + 30) {
      this.addNewPage();
      if (onNewPage) onNewPage();
    }
  }

  // --- Vector & Drawing Primitives ---

  public drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    options: {
      fillColor?: [number, number, number]; // 0-1 range
      strokeColor?: [number, number, number];
      lineWidth?: number;
    } = {}
  ): void {
    let op = "q\n";
    if (options.lineWidth) {
      op += `${options.lineWidth} w\n`;
    }
    if (options.fillColor) {
      const [r, g, b] = options.fillColor;
      op += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n`;
    }
    if (options.strokeColor) {
      const [r, g, b] = options.strokeColor;
      op += `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG\n`;
    }
    op += `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re\n`;
    if (options.fillColor && options.strokeColor) {
      op += "B\n";
    } else if (options.fillColor) {
      op += "f\n";
    } else if (options.strokeColor) {
      op += "S\n";
    }
    op += "Q\n";
    this.currentPageStreams.push(op);
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      color?: [number, number, number];
      width?: number;
    } = {}
  ): void {
    const [r, g, b] = options.color || [0.8, 0.8, 0.85];
    const w = options.width || 0.75;
    this.currentPageStreams.push(
      `q ${w} w ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q\n`
    );
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    options: {
      font?: "F1" | "F2"; // F1 = Regular, F2 = Bold
      size?: number;
      color?: [number, number, number];
      align?: "left" | "center" | "right";
      maxWidth?: number;
    } = {}
  ): void {
    const font = options.font || "F1";
    const size = options.size || 10;
    const [r, g, b] = options.color || [0.1, 0.15, 0.2];
    const align = options.align || "left";

    let cleanText = escapePdf(text);
    const approxCharWidth = size * (font === "F2" ? 0.6 : 0.52);

    if (options.maxWidth && cleanText.length * approxCharWidth > options.maxWidth) {
      const maxChars = Math.max(3, Math.floor(options.maxWidth / approxCharWidth) - 2);
      cleanText = cleanText.substring(0, maxChars) + "..";
    }

    let startX = x;
    const textWidth = cleanText.length * approxCharWidth;
    if (align === "center") {
      startX = x - textWidth / 2;
    } else if (align === "right") {
      startX = x - textWidth;
    }

    this.currentPageStreams.push(
      `BT /${font} ${size} Tf ${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg 1 0 0 1 ${startX.toFixed(2)} ${y.toFixed(2)} Tm (${cleanText}) Tj ET\n`
    );
  }

  // --- High-Level UI Components ---

  public addHeaderBanner(): void {
    // Top banner bar
    this.drawRect(0, this.pageHeight - 28, this.pageWidth, 28, {
      fillColor: [0.08, 0.12, 0.2], // Deep Navy
    });
    this.drawText(
      "LearnTrack  |  Deliberate Learning & Spaced Revision System",
      this.margin,
      this.pageHeight - 18,
      { font: "F2", size: 9, color: [0.95, 0.96, 0.98] }
    );
    this.drawText(
      new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      this.pageWidth - this.margin,
      this.pageHeight - 18,
      { font: "F1", size: 8, color: [0.75, 0.8, 0.88], align: "right" }
    );
  }

  public addFooter(pageNum: number, totalPages: number): void {
    this.drawLine(
      this.margin,
      this.margin - 8,
      this.pageWidth - this.margin,
      this.margin - 8,
      { color: [0.85, 0.88, 0.92], width: 0.5 }
    );
    this.drawText(
      "Confidential & Proprietary  •  Generated by LearnTrack",
      this.margin,
      this.margin - 20,
      { font: "F1", size: 8, color: [0.45, 0.5, 0.58] }
    );
    this.drawText(
      `Page ${pageNum} of ${totalPages}`,
      this.pageWidth - this.margin,
      this.margin - 20,
      { font: "F1", size: 8, color: [0.45, 0.5, 0.58], align: "right" }
    );
  }

  public addReportHero(title: string, subtitle?: string): void {
    this.checkPageBreak(70);
    // Background accent card
    this.drawRect(this.margin, this.currentY - 56, this.contentWidth, 56, {
      fillColor: [0.96, 0.97, 1.0], // Indigo tint
      strokeColor: [0.82, 0.86, 0.98],
      lineWidth: 1,
    });
    // Left decorative colored stripe
    this.drawRect(this.margin, this.currentY - 56, 4, 56, {
      fillColor: [0.31, 0.27, 0.9], // Indigo primary
    });

    this.drawText(title, this.margin + 16, this.currentY - 22, {
      font: "F2",
      size: 16,
      color: [0.08, 0.12, 0.25],
    });

    const metaLine = `Period: ${this.reportPeriod}   •   Learner: ${this.userName}${
      subtitle ? `   •   ${subtitle}` : ""
    }`;
    this.drawText(metaLine, this.margin + 16, this.currentY - 42, {
      font: "F1",
      size: 9,
      color: [0.35, 0.4, 0.5],
    });

    this.currentY -= 72;
  }

  public addSectionHeading(title: string): void {
    this.checkPageBreak(35);
    this.drawText(title, this.margin, this.currentY, {
      font: "F2",
      size: 12,
      color: [0.08, 0.12, 0.22],
    });
    this.drawLine(this.margin, this.currentY - 5, this.pageWidth - this.margin, this.currentY - 5, {
      color: [0.8, 0.84, 0.9],
      width: 1,
    });
    this.currentY -= 20;
  }

  public addStatCards(
    cards: Array<{ label: string; value: string | number; color?: [number, number, number] }>
  ): void {
    this.checkPageBreak(55);
    const count = cards.length;
    const gap = 10;
    const cardWidth = (this.contentWidth - (count - 1) * gap) / count;
    const cardHeight = 46;

    cards.forEach((card, idx) => {
      const x = this.margin + idx * (cardWidth + gap);
      const y = this.currentY - cardHeight;

      // Card Box
      this.drawRect(x, y, cardWidth, cardHeight, {
        fillColor: [0.98, 0.985, 0.995],
        strokeColor: [0.88, 0.9, 0.94],
        lineWidth: 0.75,
      });

      // Top colored highlight
      this.drawRect(x, y + cardHeight - 2, cardWidth, 2, {
        fillColor: card.color || [0.31, 0.27, 0.9],
      });

      // Value
      this.drawText(String(card.value), x + 10, y + 20, {
        font: "F2",
        size: 15,
        color: [0.08, 0.12, 0.22],
      });

      // Label
      this.drawText(card.label.toUpperCase(), x + 10, y + 8, {
        font: "F2",
        size: 7,
        color: [0.45, 0.5, 0.6],
        maxWidth: cardWidth - 20,
      });
    });

    this.currentY -= cardHeight + 16;
  }

  public addTable(columns: TableColumn[], rows: (string | number | null | undefined)[][]): void {
    const rowHeight = 20;
    const headerHeight = 22;

    const renderHeader = () => {
      // Header background
      this.drawRect(this.margin, this.currentY - headerHeight, this.contentWidth, headerHeight, {
        fillColor: [0.12, 0.16, 0.25], // Slate 800
      });

      let currentX = this.margin;
      columns.forEach((col) => {
        let textX = currentX + 6;
        if (col.align === "center") textX = currentX + col.width / 2;
        if (col.align === "right") textX = currentX + col.width - 6;

        this.drawText(col.header.toUpperCase(), textX, this.currentY - 15, {
          font: "F2",
          size: 7.5,
          color: [0.95, 0.97, 1.0],
          align: col.align,
          maxWidth: col.width - 10,
        });
        currentX += col.width;
      });
      this.currentY -= headerHeight;
    };

    renderHeader();

    rows.forEach((row, rowIdx) => {
      this.checkPageBreak(rowHeight, () => {
        renderHeader();
      });

      // Alternating row background
      const isAlt = rowIdx % 2 === 1;
      this.drawRect(this.margin, this.currentY - rowHeight, this.contentWidth, rowHeight, {
        fillColor: isAlt ? [0.97, 0.98, 0.99] : [1.0, 1.0, 1.0],
        strokeColor: [0.9, 0.92, 0.95],
        lineWidth: 0.5,
      });

      let currentX = this.margin;
      columns.forEach((col, colIdx) => {
        const val = row[colIdx];
        let textX = currentX + 6;
        if (col.align === "center") textX = currentX + col.width / 2;
        if (col.align === "right") textX = currentX + col.width - 6;

        this.drawText(String(val ?? "-"), textX, this.currentY - 14, {
          font: "F1",
          size: 8,
          color: [0.15, 0.2, 0.28],
          align: col.align,
          maxWidth: col.width - 10,
        });
        currentX += col.width;
      });

      this.currentY -= rowHeight;
    });

    this.currentY -= 12; // Gap after table
  }

  public addNoticeBox(title: string, lines: string[]): void {
    const boxHeight = 24 + lines.length * 14;
    this.checkPageBreak(boxHeight + 10);

    this.drawRect(this.margin, this.currentY - boxHeight, this.contentWidth, boxHeight, {
      fillColor: [0.98, 0.99, 1.0],
      strokeColor: [0.85, 0.88, 0.95],
      lineWidth: 0.75,
    });

    this.drawText(title, this.margin + 12, this.currentY - 16, {
      font: "F2",
      size: 9,
      color: [0.18, 0.25, 0.45],
    });

    lines.forEach((line, i) => {
      this.drawText(line, this.margin + 12, this.currentY - 32 - i * 14, {
        font: "F1",
        size: 8,
        color: [0.3, 0.35, 0.45],
        maxWidth: this.contentWidth - 24,
      });
    });

    this.currentY -= boxHeight + 14;
  }

  // --- Output Compilation ---

  public buildPdf(): Buffer {
    // Flush active page
    if (this.currentPageStreams.length > 0) {
      this.pages.push([...this.currentPageStreams]);
      this.currentPageStreams = [];
    }

    const totalPages = this.pages.length;

    // Apply header & footer decoration to every page
    this.pages.forEach((pageStream, idx) => {
      const pageNum = idx + 1;
      // Header banner
      pageStream.unshift(
        `q 0.08 0.12 0.2 rg 0 ${(this.pageHeight - 28).toFixed(2)} ${this.pageWidth.toFixed(2)} 28 re f Q\n` +
          `BT /F2 9 Tf 0.95 0.96 0.98 rg 1 0 0 1 ${this.margin} ${(this.pageHeight - 18).toFixed(2)} Tm (LearnTrack  |  Deliberate Learning & Spaced Revision System) Tj ET\n` +
          `BT /F1 8 Tf 0.75 0.8 0.88 rg 1 0 0 1 ${(this.pageWidth - this.margin - 70).toFixed(2)} ${(this.pageHeight - 18).toFixed(2)} Tm (${escapePdf(new Date().toISOString().split("T")[0])}) Tj ET\n`
      );
      // Footer
      pageStream.push(
        `q 0.5 w 0.85 0.88 0.92 RG ${this.margin} ${(this.margin - 8).toFixed(2)} m ${(this.pageWidth - this.margin).toFixed(2)} ${(this.margin - 8).toFixed(2)} l S Q\n` +
          `BT /F1 8 Tf 0.45 0.5 0.58 rg 1 0 0 1 ${this.margin} ${(this.margin - 20).toFixed(2)} Tm (Confidential & Proprietary  •  Generated for ${escapePdf(this.userName)}) Tj ET\n` +
          `BT /F1 8 Tf 0.45 0.5 0.58 rg 1 0 0 1 ${(this.pageWidth - this.margin - 55).toFixed(2)} ${(this.margin - 20).toFixed(2)} Tm (Page ${pageNum} of ${totalPages}) Tj ET\n`
      );
    });

    const objects: string[] = [];
    // 1: Catalog
    // 2: Pages
    // 3: Font F1 (Helvetica)
    // 4: Font F2 (Helvetica-Bold)
    // Pages: 5, 7, 9, ...
    // Contents: 6, 8, 10, ...

    objects.push(""); // 0 index dummy
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");

    const pageObjIds: number[] = [];
    let nextObjId = 5;
    for (let i = 0; i < totalPages; i++) {
      pageObjIds.push(nextObjId);
      nextObjId += 2;
    }

    objects.push(
      `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${totalPages} >>`
    );
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

    this.pages.forEach((pageStream, i) => {
      const pageId = pageObjIds[i];
      const contentId = pageId + 1;
      const streamContent = pageStream.join("");
      const streamBuffer = Buffer.from(streamContent, "utf-8");

      // Page Object
      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] ` +
        `/Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`;

      // Content Stream Object
      objects[contentId] =
        `<< /Length ${streamBuffer.length} >>\nstream\n` +
        streamContent +
        `\nendstream`;
    });

    // Write PDF format with Xref table
    let body = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const xrefOffsets: number[] = [0];

    for (let i = 1; i < objects.length; i++) {
      xrefOffsets.push(Buffer.byteLength(body, "utf-8"));
      body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(body, "utf-8");
    body += `xref\n0 ${objects.length}\n0000000000 65535 f \r\n`;

    for (let i = 1; i < objects.length; i++) {
      const offsetStr = String(xrefOffsets[i]).padStart(10, "0");
      body += `${offsetStr} 00000 n \r\n`;
    }

    body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
    return Buffer.from(body, "utf-8");
  }
}

// ==========================================
// Specialized PDF Generators for each type
// ==========================================

export function generateLearningProgressPdf(data: LearningProgressReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Learning Progress & Execution Dossier",
    `Tasks: ${data.summary.totalTasks}  •  Completed: ${data.summary.completedTasks}`
  );

  doc.addSectionHeading("Performance Indicators");
  doc.addStatCards([
    { label: "Total Tasks", value: data.summary.totalTasks, color: [0.3, 0.4, 0.8] },
    { label: "Active", value: data.summary.activeTasks, color: [0.9, 0.6, 0.1] },
    { label: "Completed", value: data.summary.completedTasks, color: [0.1, 0.7, 0.4] },
    { label: "Completion Rate", value: `${data.summary.completionPercentage}%`, color: [0.5, 0.2, 0.8] },
    { label: "Focus Hours", value: (data.summary.totalFocusMinutes / 60).toFixed(1) + "h", color: [0.2, 0.6, 0.7] },
  ]);

  if (data.categories.length > 0) {
    doc.addSectionHeading("Category Distribution");
    doc.addTable(
      [
        { header: "Category", width: 215, align: "left" },
        { header: "Tasks", width: 100, align: "center" },
        { header: "Completed", width: 100, align: "center" },
        { header: "Focus Time", width: 100, align: "right" },
      ],
      data.categories.map((c) => [c.name, c.taskCount, c.completedCount, `${c.focusMinutes} min`])
    );
  }

  doc.addSectionHeading("Learning Task Catalog");
  if (data.tasks.length === 0) {
    doc.addNoticeBox("No Tasks Found", ["No learning tasks found matching the selected period and criteria."]);
  } else {
    doc.addTable(
      [
        { header: "Topic Title", width: 195, align: "left" },
        { header: "Category", width: 90, align: "left" },
        { header: "Priority", width: 60, align: "center" },
        { header: "Status", width: 70, align: "center" },
        { header: "Sessions", width: 50, align: "center" },
        { header: "Focus (min)", width: 50, align: "right" },
      ],
      data.tasks.slice(0, 45).map((t) => [
        t.title,
        t.categoryName,
        t.priority,
        t.status,
        `${t.completedSessions}/${t.estimatedSessions}`,
        t.totalFocusMinutes,
      ])
    );
  }

  return doc.buildPdf();
}

export function generateFocusTimePdf(data: FocusTimeReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Focus Time & Deep Work Analysis",
    `Total Time: ${data.summary.totalFocusHours}  •  Sessions: ${data.summary.totalSessions}`
  );

  doc.addSectionHeading("Key Focus Metrics");
  doc.addStatCards([
    { label: "Total Focus Hours", value: data.summary.totalFocusHours, color: [0.31, 0.27, 0.9] },
    { label: "Completed Blocks", value: data.summary.completedSessions, color: [0.1, 0.7, 0.4] },
    { label: "Interrupted", value: data.summary.interruptedSessions, color: [0.85, 0.3, 0.3] },
    { label: "Avg Session", value: `${data.summary.averageSessionMinutes} min`, color: [0.9, 0.5, 0.1] },
    { label: "Completion Rate", value: `${data.summary.completionRate}%`, color: [0.2, 0.6, 0.7] },
  ]);

  if (data.categoryBreakdown.length > 0) {
    doc.addSectionHeading("Focus Time by Category");
    doc.addTable(
      [
        { header: "Category Name", width: 275, align: "left" },
        { header: "Focus Minutes", width: 120, align: "center" },
        { header: "Share of Total", width: 120, align: "right" },
      ],
      data.categoryBreakdown.map((c) => [c.name, `${c.focusMinutes} min`, `${c.percentage}%`])
    );
  }

  if (data.dailyFocus.length > 0) {
    doc.addSectionHeading("Daily Focus Log");
    doc.addTable(
      [
        { header: "Date", width: 155, align: "left" },
        { header: "Day", width: 120, align: "left" },
        { header: "Focus Minutes", width: 120, align: "center" },
        { header: "Sessions Recorded", width: 120, align: "right" },
      ],
      data.dailyFocus.map((d) => [d.date, d.dayLabel, `${d.focusMinutes} min`, d.sessionCount])
    );
  }

  if (data.topicBreakdown.length > 0) {
    doc.addSectionHeading("Top Topics by Focus Time");
    doc.addTable(
      [
        { header: "Topic Title", width: 235, align: "left" },
        { header: "Category", width: 120, align: "left" },
        { header: "Focus Minutes", width: 80, align: "center" },
        { header: "Sessions", width: 80, align: "right" },
      ],
      data.topicBreakdown.slice(0, 30).map((t) => [t.title, t.categoryName, `${t.focusMinutes} min`, t.sessionCount])
    );
  }

  return doc.buildPdf();
}

export function generateLearningLogsPdf(data: LearningLogReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Learning Reflection & Knowledge Journal",
    `Total Logs: ${data.summary.totalLogs}  •  Average Confidence: ${data.summary.averageConfidence}/5`
  );

  doc.addSectionHeading("Reflection Synthesis");
  doc.addStatCards([
    { label: "Total Logs", value: data.summary.totalLogs, color: [0.31, 0.27, 0.9] },
    { label: "Avg Confidence", value: `${data.summary.averageConfidence} / 5`, color: [0.1, 0.7, 0.4] },
    { label: "High Confidence (4-5)", value: data.summary.highConfidenceCount, color: [0.2, 0.6, 0.7] },
    { label: "Open Doubts Flagged", value: data.summary.openDoubtsCount, color: [0.9, 0.5, 0.1] },
  ]);

  doc.addSectionHeading("Chronological Session Logs");
  if (data.logs.length === 0) {
    doc.addNoticeBox("No Logs Recorded", ["No reflective session logs found for this period."]);
  } else {
    data.logs.forEach((log) => {
      doc.checkPageBreak(50);
      doc.addTable(
        [
          { header: "Topic", width: 215, align: "left" },
          { header: "Category", width: 110, align: "left" },
          { header: "Date", width: 100, align: "center" },
          { header: "Confidence", width: 90, align: "right" },
        ],
        [[log.topicTitle, log.categoryName, log.date, `${log.confidence}/5 (${log.confidenceLabel})`]]
      );

      const reflectionLines = [
        `Learned: ${log.whatLearned}`,
        log.whatCompleted ? `Completed: ${log.whatCompleted}` : "",
        log.doubts ? `Doubts/Open Questions: ${log.doubts}` : "",
        log.notes ? `Key Notes: ${log.notes}` : "",
      ].filter(Boolean);

      doc.addNoticeBox("Key Takeaways & Doubts", reflectionLines);
    });
  }

  return doc.buildPdf();
}

export function generateRevisionsPdf(data: RevisionReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Automated 4-Stage Spaced Revision Schedule",
    `Total: ${data.summary.totalRevisions}  •  Adherence: ${data.summary.adherenceRate}%`
  );

  doc.addSectionHeading("Retention Health Indicators");
  doc.addStatCards([
    { label: "Total Revisions", value: data.summary.totalRevisions, color: [0.31, 0.27, 0.9] },
    { label: "Completed", value: data.summary.completedRevisions, color: [0.1, 0.7, 0.4] },
    { label: "Due Today", value: data.summary.dueToday, color: [0.9, 0.6, 0.1] },
    { label: "Overdue", value: data.summary.overdue, color: [0.85, 0.3, 0.3] },
    { label: "Adherence Rate", value: `${data.summary.adherenceRate}%`, color: [0.2, 0.6, 0.7] },
  ]);

  doc.addSectionHeading("Forgetting Curve Milestone Progression");
  doc.addTable(
    [
      { header: "Milestone", width: 75, align: "center" },
      { header: "Interval Offset", width: 160, align: "left" },
      { header: "Total Scheduled", width: 140, align: "center" },
      { header: "Completed", width: 140, align: "right" },
    ],
    [
      ["R1", data.milestoneProgression.r1.description, data.milestoneProgression.r1.total, data.milestoneProgression.r1.completed],
      ["R2", data.milestoneProgression.r2.description, data.milestoneProgression.r2.total, data.milestoneProgression.r2.completed],
      ["R3", data.milestoneProgression.r3.description, data.milestoneProgression.r3.total, data.milestoneProgression.r3.completed],
      ["R4", data.milestoneProgression.r4.description, data.milestoneProgression.r4.total, data.milestoneProgression.r4.completed],
    ]
  );

  doc.addSectionHeading("Revision Session Queue");
  if (data.revisions.length === 0) {
    doc.addNoticeBox("No Revisions", ["No spaced revisions scheduled in the chosen range."]);
  } else {
    doc.addTable(
      [
        { header: "Topic Title", width: 185, align: "left" },
        { header: "Milestone", width: 65, align: "center" },
        { header: "Scheduled", width: 85, align: "center" },
        { header: "Completed", width: 85, align: "center" },
        { header: "Status", width: 95, align: "right" },
      ],
      data.revisions.slice(0, 40).map((r) => [
        r.topicTitle,
        r.milestoneName,
        r.scheduledDate,
        r.completedAt || "-",
        r.isOverdue ? "OVERDUE" : r.status,
      ])
    );
  }

  return doc.buildPdf();
}

export function generateMasteryPdf(data: MasteryReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Topic Mastery & Full Completion Audit",
    `Mastered Topics: ${data.summary.fullyCompletedTopics}/${data.summary.totalTopics} (${data.summary.masteryPercentage}%)`
  );

  doc.addSectionHeading("Mastery Summary");
  doc.addStatCards([
    { label: "Total Topics", value: data.summary.totalTopics, color: [0.31, 0.27, 0.9] },
    { label: "Topics Learned", value: data.summary.learnedTopics, color: [0.9, 0.6, 0.1] },
    { label: "Fully Mastered", value: data.summary.fullyCompletedTopics, color: [0.1, 0.7, 0.4] },
    { label: "In Revision", value: data.summary.inRevisionTopics, color: [0.2, 0.6, 0.7] },
    { label: "Mastery Rate", value: `${data.summary.masteryPercentage}%`, color: [0.5, 0.2, 0.8] },
  ]);

  if (data.categoryMastery.length > 0) {
    doc.addSectionHeading("Mastery by Category");
    doc.addTable(
      [
        { header: "Category", width: 235, align: "left" },
        { header: "Total Topics", width: 90, align: "center" },
        { header: "Mastered", width: 90, align: "center" },
        { header: "Mastery Rate", width: 100, align: "right" },
      ],
      data.categoryMastery.map((c) => [c.name, c.totalTopics, c.masteredTopics, `${c.masteryPercentage}%`])
    );
  }

  doc.addSectionHeading("Topic Mastery Register");
  doc.addTable(
    [
      { header: "Topic Title", width: 215, align: "left" },
      { header: "Category", width: 100, align: "left" },
      { header: "Revisions", width: 80, align: "center" },
      { header: "Mastery Status", width: 120, align: "right" },
    ],
    data.masteryList.slice(0, 40).map((m) => [
      m.title,
      m.categoryName,
      `${m.revisionsCompleted} / 4`,
      m.isMastered ? "FULLY COMPLETED" : "IN PROGRESS",
    ])
  );

  return doc.buildPdf();
}

export function generateCalendarPdf(data: CalendarActivityReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Chronological Calendar & Activity Schedule",
    `Total Recorded Events: ${data.summary.totalEvents}`
  );

  doc.addSectionHeading("Activity Overview");
  doc.addStatCards([
    { label: "Total Events", value: data.summary.totalEvents, color: [0.31, 0.27, 0.9] },
    { label: "Tasks Planned", value: data.summary.tasksPlanned, color: [0.2, 0.6, 0.7] },
    { label: "Focus Sessions", value: data.summary.focusSessionsRecorded, color: [0.1, 0.7, 0.4] },
    { label: "Revisions Scheduled", value: data.summary.revisionsScheduled, color: [0.9, 0.6, 0.1] },
  ]);

  doc.addSectionHeading("Chronological Activity Feed");
  if (data.events.length === 0) {
    doc.addNoticeBox("No Events Recorded", ["No activity feed events recorded in this time interval."]);
  } else {
    doc.addTable(
      [
        { header: "Date", width: 85, align: "left" },
        { header: "Activity Type", width: 110, align: "left" },
        { header: "Event Title", width: 220, align: "left" },
        { header: "Status", width: 100, align: "right" },
      ],
      data.events.slice(0, 45).map((e) => [e.date, e.typeLabel, e.title, e.status])
    );
  }

  return doc.buildPdf();
}

export function generateAnalyticsPdf(data: AnalyticsReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Learning Analytics & Long-Term Performance",
    `Current Streak: ${data.summary.currentStreak} days  •  Best: ${data.summary.longestStreak} days`
  );

  doc.addSectionHeading("Key Analytical Indicators");
  doc.addStatCards([
    { label: "Focus Hours", value: (data.summary.totalFocusMinutes / 60).toFixed(1) + "h", color: [0.31, 0.27, 0.9] },
    { label: "Focus Sessions", value: data.summary.completedFocusSessions, color: [0.1, 0.7, 0.4] },
    { label: "Current Streak", value: `${data.summary.currentStreak} d`, color: [0.95, 0.55, 0.1] },
    { label: "Longest Streak", value: `${data.summary.longestStreak} d`, color: [0.2, 0.6, 0.7] },
    { label: "Revision Adherence", value: `${data.summary.revisionAdherenceRate}%`, color: [0.5, 0.2, 0.8] },
  ]);

  if (data.insights.length > 0) {
    doc.addSectionHeading("Algorithmic Insights & Observations");
    doc.addNoticeBox("System Observations", data.insights);
  }

  if (data.dailyTrajectory.length > 0) {
    doc.addSectionHeading("Daily Focus Trajectory");
    doc.addTable(
      [
        { header: "Date", width: 175, align: "left" },
        { header: "Focus Minutes", width: 170, align: "center" },
        { header: "Completed Sessions", width: 170, align: "right" },
      ],
      data.dailyTrajectory.map((d) => [d.date, `${d.focusMinutes} min`, d.sessions])
    );
  }

  if (data.revisionDistribution.length > 0) {
    doc.addSectionHeading("Spaced Revision Completion by Stage");
    doc.addTable(
      [
        { header: "Revision Stage", width: 175, align: "left" },
        { header: "Completed Sessions", width: 170, align: "center" },
        { header: "Total Scheduled", width: 170, align: "right" },
      ],
      data.revisionDistribution.map((r) => [`Revision ${r.revisionNumber}`, r.completed, r.scheduled])
    );
  }

  return doc.buildPdf();
}

export function generateMoneyPdf(data: MoneyReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  doc.addReportHero(
    "Financial History & 50/20/20/10 Budget Report",
    `Needs ${data.formula.needsPct}% • Savings ${data.formula.savingsPct}% • Growth ${data.formula.growthPct}% • Wants ${data.formula.wantsPct}%`
  );

  if (data.currentBudget) {
    doc.addSectionHeading("Active Month Financial Distribution");
    doc.addStatCards([
      { label: "Total Income", value: `$${data.currentBudget.amount.toFixed(2)}`, color: [0.31, 0.27, 0.9] },
      { label: "Needs (50%)", value: `$${data.currentBudget.needs.toFixed(2)}`, color: [0.2, 0.6, 0.7] },
      { label: "Savings (20%)", value: `$${data.currentBudget.savings.toFixed(2)}`, color: [0.1, 0.7, 0.4] },
      { label: "Growth (20%)", value: `$${data.currentBudget.growth.toFixed(2)}`, color: [0.5, 0.2, 0.8] },
      { label: "Wants (10%)", value: `$${data.currentBudget.wants.toFixed(2)}`, color: [0.95, 0.55, 0.1] },
    ]);
  }

  doc.addSectionHeading("Monthly Income & Allocation History");
  if (data.monthlyHistory.length === 0) {
    doc.addNoticeBox("No Financial Records", ["No income or budget entries found."]);
  } else {
    doc.addTable(
      [
        { header: "Period", width: 85, align: "left" },
        { header: "Income ($)", width: 85, align: "right" },
        { header: "Needs", width: 70, align: "right" },
        { header: "Savings", width: 70, align: "right" },
        { header: "Growth", width: 70, align: "right" },
        { header: "Wants", width: 65, align: "right" },
        { header: "Net Balance", width: 70, align: "right" },
      ],
      data.monthlyHistory.map((m) => [
        m.monthLabel,
        `$${m.amount.toFixed(2)}`,
        `$${m.needs.toFixed(2)}`,
        `$${m.savings.toFixed(2)}`,
        `$${m.growth.toFixed(2)}`,
        `$${m.wants.toFixed(2)}`,
        `$${m.netBalance.toFixed(2)}`,
      ])
    );
  }

  if (data.recentExpenses.length > 0) {
    doc.addSectionHeading("Recorded Expenses & Disbursals");
    doc.addTable(
      [
        { header: "Date", width: 85, align: "left" },
        { header: "Category", width: 100, align: "left" },
        { header: "Amount ($)", width: 90, align: "right" },
        { header: "Description", width: 240, align: "left" },
      ],
      data.recentExpenses.slice(0, 30).map((exp) => [exp.date, exp.category, `$${exp.amount.toFixed(2)}`, exp.description])
    );
  }

  return doc.buildPdf();
}

export function generateCompletePdf(data: CompleteReportData): Buffer {
  const doc = new PdfDocument(
    data.metadata.title,
    data.metadata.periodLabel,
    `${data.metadata.user.name} (${data.metadata.user.email})`
  );

  // Cover / Executive Hero
  doc.addReportHero(
    "Complete LearnTrack Portfolio Dossier",
    `Comprehensive Archive covering all 8 operational dimensions`
  );

  doc.addSectionHeading("Executive Macro KPIs");
  doc.addStatCards([
    { label: "Tasks", value: data.learningProgress.summary.totalTasks, color: [0.31, 0.27, 0.9] },
    { label: "Focus Hours", value: data.focusTime.summary.totalFocusHours, color: [0.2, 0.6, 0.7] },
    { label: "Reflection Logs", value: data.learningLogs.summary.totalLogs, color: [0.1, 0.7, 0.4] },
    { label: "Mastered Topics", value: data.mastery.summary.fullyCompletedTopics, color: [0.5, 0.2, 0.8] },
    { label: "Current Streak", value: `${data.analytics.summary.currentStreak} d`, color: [0.95, 0.55, 0.1] },
  ]);

  // Section 1: Learning Progress
  doc.addSectionHeading("1. Learning Progress Summary");
  doc.addTable(
    [
      { header: "Topic Title", width: 215, align: "left" },
      { header: "Category", width: 100, align: "left" },
      { header: "Priority", width: 60, align: "center" },
      { header: "Status", width: 70, align: "center" },
      { header: "Focus (min)", width: 70, align: "right" },
    ],
    data.learningProgress.tasks.slice(0, 15).map((t) => [
      t.title,
      t.categoryName,
      t.priority,
      t.status,
      t.totalFocusMinutes,
    ])
  );

  // Section 2: Focus Time
  doc.addSectionHeading("2. Focus Time & Deep Work");
  if (data.focusTime.categoryBreakdown.length > 0) {
    doc.addTable(
      [
        { header: "Category Name", width: 275, align: "left" },
        { header: "Focus Minutes", width: 120, align: "center" },
        { header: "Share of Total", width: 120, align: "right" },
      ],
      data.focusTime.categoryBreakdown.map((c) => [c.name, `${c.focusMinutes} min`, `${c.percentage}%`])
    );
  }

  // Section 3: Learning Logs
  doc.addSectionHeading("3. Learning Logs & Reflections");
  if (data.learningLogs.logs.length > 0) {
    doc.addTable(
      [
        { header: "Topic", width: 215, align: "left" },
        { header: "Category", width: 110, align: "left" },
        { header: "Date", width: 100, align: "center" },
        { header: "Confidence", width: 90, align: "right" },
      ],
      data.learningLogs.logs.slice(0, 10).map((l) => [l.topicTitle, l.categoryName, l.date, `${l.confidence}/5`])
    );
  }

  // Section 4: Revisions
  doc.addSectionHeading("4. Spaced Revisions");
  doc.addTable(
    [
      { header: "Milestone", width: 75, align: "center" },
      { header: "Interval Offset", width: 160, align: "left" },
      { header: "Total Scheduled", width: 140, align: "center" },
      { header: "Completed", width: 140, align: "right" },
    ],
    [
      ["R1", data.revisions.milestoneProgression.r1.description, data.revisions.milestoneProgression.r1.total, data.revisions.milestoneProgression.r1.completed],
      ["R2", data.revisions.milestoneProgression.r2.description, data.revisions.milestoneProgression.r2.total, data.revisions.milestoneProgression.r2.completed],
      ["R3", data.revisions.milestoneProgression.r3.description, data.revisions.milestoneProgression.r3.total, data.revisions.milestoneProgression.r3.completed],
      ["R4", data.revisions.milestoneProgression.r4.description, data.revisions.milestoneProgression.r4.total, data.revisions.milestoneProgression.r4.completed],
    ]
  );

  // Section 5: Mastery
  doc.addSectionHeading("5. Full Topic Mastery Audit");
  doc.addTable(
    [
      { header: "Topic Title", width: 235, align: "left" },
      { header: "Category", width: 110, align: "left" },
      { header: "Revisions", width: 80, align: "center" },
      { header: "Status", width: 90, align: "right" },
    ],
    data.mastery.masteryList.slice(0, 15).map((m) => [
      m.title,
      m.categoryName,
      `${m.revisionsCompleted}/4`,
      m.isMastered ? "MASTERED" : "IN_PROGRESS",
    ])
  );

  // Section 6: Financial History
  doc.addSectionHeading("6. 50/20/20/10 Financial Snapshot");
  if (data.money.monthlyHistory.length > 0) {
    doc.addTable(
      [
        { header: "Period", width: 85, align: "left" },
        { header: "Income ($)", width: 85, align: "right" },
        { header: "Needs", width: 70, align: "right" },
        { header: "Savings", width: 70, align: "right" },
        { header: "Growth", width: 70, align: "right" },
        { header: "Wants", width: 65, align: "right" },
        { header: "Net Balance", width: 70, align: "right" },
      ],
      data.money.monthlyHistory.slice(0, 6).map((m) => [
        m.monthLabel,
        `$${m.amount.toFixed(2)}`,
        `$${m.needs.toFixed(2)}`,
        `$${m.savings.toFixed(2)}`,
        `$${m.growth.toFixed(2)}`,
        `$${m.wants.toFixed(2)}`,
        `$${m.netBalance.toFixed(2)}`,
      ])
    );
  }

  return doc.buildPdf();
}

/**
 * Universal PDF Dispatcher
 */
export function generatePdfForReport(type: ReportType, data: unknown): Buffer {
  switch (type) {
    case "learning-progress":
      return generateLearningProgressPdf(data as LearningProgressReportData);
    case "focus-time":
      return generateFocusTimePdf(data as FocusTimeReportData);
    case "learning-logs":
      return generateLearningLogsPdf(data as LearningLogReportData);
    case "revisions":
      return generateRevisionsPdf(data as RevisionReportData);
    case "mastery":
      return generateMasteryPdf(data as MasteryReportData);
    case "calendar":
      return generateCalendarPdf(data as CalendarActivityReportData);
    case "analytics":
      return generateAnalyticsPdf(data as AnalyticsReportData);
    case "money":
      return generateMoneyPdf(data as MoneyReportData);
    case "complete":
      return generateCompletePdf(data as CompleteReportData);
    default:
      throw new Error(`Unsupported report type for PDF generation: ${type}`);
  }
}
