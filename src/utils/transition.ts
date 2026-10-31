/**
 * Shared view-transition-name for a post's title, so the card title on a list
 * morphs into the post page heading. Set as an inline style rather than with
 * transition:name, which inlines a ~180-line animation block per element.
 */
export function postTitleTransition(postId: string): string {
  const ident = [...postId]
    .map((ch) =>
      /[\w-]/.test(ch) || ch.codePointAt(0)! >= 0x80
        ? ch
        : `\\${ch.codePointAt(0)!.toString(16)} `,
    )
    .join("");
  return `view-transition-name: post-title-${ident}`;
}
