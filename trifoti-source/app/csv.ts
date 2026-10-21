export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  // Quoting alone does not stop Excel from evaluating a cell as a formula.
  const safeText = /^[\s\uFEFF]*[=+@-]/u.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}
