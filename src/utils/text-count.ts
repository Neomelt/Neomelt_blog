/**
 * Count the units shown by the site's "字数" statistic.
 *
 * Han characters count one each. Latin words count one each. Punctuation,
 * numbers, whitespace, URLs, Markdown syntax, and media/code payloads do not
 * count.
 */
export function countTextUnits(value: string): number {
  const withoutUrls = value.replace(/https?:\/\/\S+/giu, " ");
  const han = withoutUrls.match(/\p{Script=Han}/gu)?.length ?? 0;
  const latinWords =
    withoutUrls.match(/[A-Za-z]+(?:[-'’][A-Za-z]+)*/g)?.length ?? 0;
  return han + latinWords;
}

/**
 * Strip Markdown constructs that are not readable prose before counting.
 * This intentionally stays local and deterministic instead of counting the
 * generated page, which would require rendering every article in the widget.
 */
export function countMarkdownText(value: string): number {
  const prose = value
    // Fenced and indented code blocks.
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/^(?: {4}|\t).*(?:\n|$)/gm, " ")
    // Media embeds and Markdown images are not prose.
    .replace(/@\[(?:video|youtube|bilibili)\]\([^\n]*\)/giu, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    // Keep link text but discard its destination.
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    // Inline code, HTML tags, and the remaining Markdown markers.
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/[\\*_~>#|]/g, " ");
  return countTextUnits(prose);
}
