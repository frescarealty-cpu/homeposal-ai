export type ProposalsExportFormat = "csv" | "tsv" | "json" | "xlsx" | "xls";

export type ExportColumn<Row> = {
  key: keyof Row;
  label: string;
};

function formatTimestampForFilename(d: Date) {
  return d.toISOString().replace(/[:.]/g, "-");
}

function toCellString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "string") return v;
  return String(v);
}

function needsQuotes(s: string, delimiter: string) {
  return s.includes('"') || s.includes("\n") || s.includes("\r") || s.includes(delimiter);
}

function csvEscape(s: string, delimiter: string) {
  const str = s ?? "";
  if (!needsQuotes(str, delimiter)) return str;
  return `"${str.replaceAll('"', '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportRowsToSpreadsheet<Row extends Record<string, unknown>>({
  rows,
  columns,
  format,
  filenameBase,
}: {
  rows: Row[];
  columns: ExportColumn<Row>[];
  format: ProposalsExportFormat;
  filenameBase: string;
}) {
  const timestamp = formatTimestampForFilename(new Date());

  if (format === "json") {
    const json = JSON.stringify(rows, null, 2);
    downloadBlob(new Blob([json], { type: "application/json" }), `${filenameBase}-${timestamp}.json`);
    return;
  }

  if (format === "csv" || format === "tsv") {
    const delimiter = format === "csv" ? "," : "\t";
    const header = columns.map((c) => csvEscape(c.label, delimiter)).join(delimiter);

    const body = rows
      .map((r) => columns.map((c) => csvEscape(toCellString(r[c.key]), delimiter)).join(delimiter))
      .join("\n");

    const content = `${header}\n${body}\n`;
    const mime = format === "csv" ? "text/csv;charset=utf-8" : "text/tab-separated-values;charset=utf-8";
    downloadBlob(new Blob([content], { type: mime }), `${filenameBase}-${timestamp}.${format}`);
    return;
  }

  // XLSX / XLS via `xlsx` (browser-friendly: we download a blob created from an ArrayBuffer)
  const XLSX = await import("xlsx");

  const sheetRows = rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const c of columns) out[c.label] = r[c.key];
    return out;
  });

  const headerLabels = columns.map((c) => c.label);
  const ws = XLSX.utils.json_to_sheet(sheetRows, { header: headerLabels });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Proposals");

  const bookType = format; // 'xlsx' or 'xls'
  const arrayBuffer = XLSX.write(wb, { bookType, type: "array" }) as ArrayBuffer;

  const mime =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/vnd.ms-excel";

  downloadBlob(new Blob([arrayBuffer], { type: mime }), `${filenameBase}-${timestamp}.${format}`);
}

