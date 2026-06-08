/**
 * Estimate reading time in minutes from a post's raw body.
 *
 * Tuned for CJK-heavy content (~400 characters per minute) and never returns
 * less than 1 minute. Single source of truth used by the post page and all
 * post listings so the same article always shows a consistent reading time.
 */
export function estimateReadingTime(content: string): number {
  return Math.max(1, Math.ceil((content || "").length / 400));
}
