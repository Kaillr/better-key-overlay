export const KEY_WIDTH = 80
export const KEY_GAP = 8
export const PADDING = 32

const MIN_WIDTH = 200

export function contentWidth(keyCount: number): number {
  if (keyCount === 0) return MIN_WIDTH
  return Math.max(MIN_WIDTH, KEY_WIDTH * keyCount + KEY_GAP * (keyCount - 1) + PADDING)
}
