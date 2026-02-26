export const KEY_WIDTH = 80
export const KEY_GAP = 8
export const PADDING = 32
export const COUNTER_WIDTH = 80

const MIN_WIDTH = 200

export const KEY_HEIGHT = 80
export const COUNTER_HEIGHT = 28

export function contentWidth(keyCount: number, sideCounter: boolean = false): number {
  const keysWidth = keyCount > 0 ? KEY_WIDTH * keyCount + KEY_GAP * (keyCount - 1) : 0
  const counterExtra = sideCounter ? COUNTER_WIDTH : 0
  return Math.max(MIN_WIDTH, keysWidth + counterExtra + PADDING)
}

export function noCanvasHeight(hasBottomCounter: boolean): number {
  return KEY_HEIGHT + (hasBottomCounter ? COUNTER_HEIGHT : 0) + PADDING
}
