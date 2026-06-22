import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};

export function formatCurrency(
  amount: number,
  opts?: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    noDecimals?: boolean;
  },
) {
  const { currency = "USD", locale = "en-US", minimumFractionDigits, maximumFractionDigits, noDecimals } = opts ?? {};

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : minimumFractionDigits,
    maximumFractionDigits: noDecimals ? 0 : maximumFractionDigits,
  };

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

/**
 * Safely parses a date string, replacing space with "T" to ensure ISO compliance for Safari.
 */
export function parseSafeDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  let formatted = dateInput.trim();
  // Replace first space with T if it looks like a PocketBase date (e.g. "2026-06-22 14:00:00")
  if (formatted.includes(" ") && !formatted.includes("T")) {
    formatted = formatted.replace(" ", "T");
  }
  const date = new Date(formatted);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date into local time format "YYYY-MM-DDTHH:mm" for datetime-local inputs.
 */
export function getLocalDatetimeString(dateInput: string | Date | null | undefined): string {
  const date = parseSafeDate(dateInput);
  if (!date) return "";

  // Convert to local time string format for datetime-local (YYYY-MM-DDTHH:mm)
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in ms
  const localDate = new Date(date.getTime() - tzOffset);
  return localDate.toISOString().slice(0, 16);
}
