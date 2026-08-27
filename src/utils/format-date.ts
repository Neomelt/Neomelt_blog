/**
 * Local-time "YYYY-MM-DD HH:mm".
 *
 * Deliberately not Intl.DateTimeFormat: these listings sort and align by
 * this string, so a locale-dependent format would break column alignment
 * and the tabular-nums treatment the archive rows rely on.
 */
export function formatDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
