/**
 * Date and Timezone Utilities for LearnTrack
 * Ensures deterministic handling of calendar dates (YYYY-MM-DD) across client and server.
 */

export function formatDateToISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    throw new Error(`Invalid ISO date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error(`Invalid ISO date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }

  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }

  return date;
}

export function getTodayISO(timezone = "UTC"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    // Fallback to UTC if timezone is invalid
    const now = new Date();
    return formatDateToISO(now);
  }
}

export function getRelativeDateISO(baseDateStr: string, offsetDays: number): string {
  const date = parseISODate(baseDateStr);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatDateToISO(date);
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseISODate(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function isToday(dateStr: string, timezone = "UTC"): boolean {
  return dateStr === getTodayISO(timezone);
}
