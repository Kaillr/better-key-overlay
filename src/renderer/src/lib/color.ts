interface HSLA {
  h: number
  s: number
  l: number
  a: number
}

export function parseHsla(color: string): HSLA {
  const match = color.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*,?\s*([\d.]*)\s*\)/
  )
  if (!match) return { h: 0, s: 100, l: 50, a: 1 }
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
    a: match[4] !== '' ? parseFloat(match[4]) : 1,
  }
}

export function lerpColor(startStr: string, endStr: string, t: number): string {
  const s = parseHsla(startStr)
  const e = parseHsla(endStr)
  const h = s.h + (e.h - s.h) * t
  const sat = s.s + (e.s - s.s) * t
  const l = s.l + (e.l - s.l) * t
  const a = s.a + (e.a - s.a) * t
  return `hsla(${h}, ${sat}%, ${l}%, ${a})`
}
