/**
 * Strip non-digits and return numeric value for dollar inputs (whole dollars).
 */
export function parseDollarInput(value: string): number {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

/**
 * Format a dollar input string with commas as the user types (e.g. "1234567" -> "1,234,567").
 * Pass raw input; strips non-digits then formats. Returns "" for empty.
 */
export function formatDollarDisplay(value: string): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits === "") return "";
  const num = parseInt(digits, 10);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
