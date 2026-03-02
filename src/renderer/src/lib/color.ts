function parseHex(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255
  return [r, g, b, a]
}

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab, aa] = parseHex(a)
  const [br, bg, bb, ba] = parseHex(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  const al = Math.round(aa + (ba - aa) * t)
  return `rgba(${r},${g},${bl},${al / 255})`
}

export function hexToRgba(hex: string): string {
  const [r, g, b, a] = parseHex(hex)
  return `rgba(${r},${g},${b},${a / 255})`
}
