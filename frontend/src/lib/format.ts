export function fmtQty(value: number | string | undefined | null): string {
  if (value == null) return "0";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}
