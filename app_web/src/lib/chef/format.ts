// Puerto TS de las utilidades de formato/cálculo del prototipo
// (prototipo_html/chef_online_v2.html) — mismo comportamiento exacto.

// isFinite(null) es `true` en JS (null se coacciona a 0), así que hay que
// descartar null/undefined explícitamente ANTES de llamar a isFinite —
// si no, un valor null se cuela y revienta en .toLocaleString().
export const fmt = (n: number | null | undefined) => {
  const num = n == null || !isFinite(n) ? 0 : n
  return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const fmtE = (n: number | null | undefined) => fmt(n) + ' €'

export function relativo(fechaISO: string | null | undefined): string {
  if (!fechaISO) return '—'
  const diffDias = Math.round((Date.now() - new Date(fechaISO).getTime()) / 86400000)
  if (diffDias <= 0) return 'hoy'
  if (diffDias === 1) return 'hace 1 día'
  if (diffDias < 7) return `hace ${diffDias} días`
  const semanas = Math.round(diffDias / 7)
  if (semanas < 5) return `hace ${semanas} semana${semanas > 1 ? 's' : ''}`
  const meses = Math.round(diffDias / 30)
  return `hace ${meses} mes${meses > 1 ? 'es' : ''}`
}

export function parseNumeroLocal(v: string): number {
  if (v === undefined || v === null || v === '') return NaN
  let s = String(v).trim().replace(/[€\s]/g, '')
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.')
  else if (s.includes(',')) s = s.replace(',', '.')
  return parseFloat(s)
}

// Coste real por unidad de compra, teniendo en cuenta la merma.
export const costeUtil = (precio: number, mermaPct: number) => precio / (1 - (mermaPct || 0) / 100)
