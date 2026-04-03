import { useState, useEffect } from 'react'
import { measureTextHeight, needsTruncation } from '@/lib/text-layout'
import type { LayoutResult } from '@chenglou/pretext'

interface UseTextLayoutOptions {
  text: string
  /** CSS font string, e.g. "14px Inter, sans-serif" */
  font: string
  /** Container width in px */
  width: number
  /** Line height in px */
  lineHeight: number
  /** Max lines before truncation (optional) */
  maxLines?: number
}

interface UseTextLayoutResult {
  layout: LayoutResult | null
  isTruncated: boolean
  isReady: boolean
}

/**
 * React hook for measuring text layout in destination cards.
 * Defers measurement to the client — safe for SSR.
 *
 * @example
 * const { layout, isTruncated } = useTextLayout({
 *   text: destination.description,
 *   font: '14px Inter, sans-serif',
 *   width: cardWidth,
 *   lineHeight: 20,
 *   maxLines: 3,
 * })
 */
export function useTextLayout({
  text,
  font,
  width,
  lineHeight,
  maxLines,
}: UseTextLayoutOptions): UseTextLayoutResult {
  const [result, setResult] = useState<UseTextLayoutResult>({
    layout: null,
    isTruncated: false,
    isReady: false,
  })

  useEffect(() => {
    if (!text || !font || width <= 0 || lineHeight <= 0) return

    try {
      const layoutResult = measureTextHeight(text, font, width, lineHeight)
      const isTruncated =
        maxLines !== undefined
          ? needsTruncation(text, font, width, lineHeight, maxLines)
          : false

      setResult({
        layout: layoutResult,
        isTruncated,
        isReady: true,
      })
    } catch {
      // Canvas not available (e.g. during SSR / test environment) — silently skip
      setResult({ layout: null, isTruncated: false, isReady: false })
    }
  }, [text, font, width, lineHeight, maxLines])

  return result
}
