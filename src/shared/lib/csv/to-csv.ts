type Cell = string | number | null;

// A text cell starting with one of these runs as a formula in a spreadsheet
// (CSV injection; OWASP lists tab and carriage return too).
const FORMULA = /^[=+\-@\t\r]/;

function cell(value: Cell): string {
  if (value === null) return '';
  if (typeof value === 'number') return String(value);
  const text = FORMULA.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * RFC 4180 CSV: CRLF lines, quoted where needed, numbers without any locale
 * so every spreadsheet reads them. A BOM tells Excel the text is UTF-8.
 */
export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(cell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}
