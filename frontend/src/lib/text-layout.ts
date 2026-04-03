import { prepare, layout, type LayoutResult } from '@chenglou/pretext'

/**
 * Measure text layout for destination cards.
 * Returns lineCount and height (in px).
 *
 * Note: Requires a browser canvas context — must only be called client-side.
 */
export function measureTextHeight(
  text: string,
  font: string,
  width: number,
  lineHeight: number
): LayoutResult {
  const prepared = prepare(text, font)
  return layout(prepared, width, lineHeight)
}

/**
 * Check if a block of text will overflow a given number of lines.
 *
 * Note: Requires a browser canvas context — must only be called client-side.
 */
export function needsTruncation(
  text: string,
  font: string,
  width: number,
  lineHeight: number,
  maxLines: number
): boolean {
  const prepared = prepare(text, font)
  const { lineCount } = layout(prepared, width, lineHeight)
  return lineCount > maxLines
}
