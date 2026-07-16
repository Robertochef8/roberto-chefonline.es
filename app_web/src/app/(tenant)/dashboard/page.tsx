import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fmt, fmtE } from '@/lib/chef/format'
import { DIAG_PILL } from '@/lib/chef/diagnostico'

type PlatoResumen = {
  id: string
  nombre: string
  coste_racion: number
  pvp: number
  pvp_base: number
  food_cost_pct: number
  diagnostico: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: platos } = await supabase
    .from('vista_platos_resumen')
    .select('id, nombre, coste_racion, pvp, pvp_base, food_cost_pct, diagnostico')
    .order('food_cost_pct', { ascending: false })

  const lista = (platos ?? []) as PlatoResumen[]
  const fcMedio = lista.length ? lista.reduce((s, p) => s + p.food_cost_pct, 0) / lista.length : 0
  const conAlerta = lista.filter((p) => p.diagnostico !== 'rentable')
  const aRevisar = lista.slice(0, 4)

  // Alerta real de subida de precio: compara el precio actual de cada
  // ingrediente contra el precio que tenía antes de su primer cambio
  // registrado en los últimos 7 días (historial_precios_ingrediente se
  // rellena al importar precios de proveedor — todavía no habrá filas aquí
  // hasta que exista esa pantalla).
  const sieteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: historial } = await supabase
    .from('historial_precios_ingrediente')
    .select('ingrediente_id, precio_anterior, fecha, ingrediente:ingredientes(nombre, precio_actual)')
    .gte('fecha', sieteDiasAtras)
    .order('fecha', { ascending: true })

  const primeraPorIngrediente = new Map<string, { nombre: string; precioAnterior: number; precioActual: number }>()
  for (const h of (historial ?? []) as unknown as {
    ingrediente_id: string
    precio_anterior: number | null
    ingrediente: { nombre: string; precio_actual: number }
  }[]) {
    if (!primeraPorIngrediente.has(h.ingrediente_id) && h.precio_anterior) {
      primeraPorIngrediente.set(h.ingrediente_id, {
        nombre: h.ingrediente.nombre,
        precioAnterior: h.precio_anterior,
        precioActual: h.ingrediente.precio_actual,
      })
    }
  }
  const alertasPrecio = Array.from(primeraPorIngrediente.values())
    .map((x) => ({ ...x, variacion: ((x.precioActual - x.precioAnterior) / x.precioAnterior) * 100 }))
    .filter((x) => x.variacion >= 5)

  return (
    <div>
      <h1 className="text-lg font-bold text-[#2b2a25]">Dashboard</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f1ede0] p-4">
          <p className="text-xs text-[#6e6a5c]">food cost medio</p>
          <p className="mt-1 text-2xl font-bold text-[#2b2a25]">{fmt(fcMedio)}%</p>
        </div>
        <div className="rounded-xl bg-[#f1ede0] p-4">
          <p className="text-xs text-[#6e6a5c]">platos con alerta</p>
          <p className={`mt-1 text-2xl font-bold ${conAlerta.length ? 'text-[#b23c30]' : 'text-[#2b2a25]'}`}>{conAlerta.length}</p>
        </div>
      </div>

      {alertasPrecio.map((a) => (
        <div key={a.nombre} className="mt-3 rounded-lg bg-[#f6e9d2] px-3 py-2 text-sm text-[#9a5f0b]">
          ⚠ subida del {fmt(a.variacion)}% en {a.nombre} esta semana
        </div>
      ))}

      <h2 className="mt-6 text-sm font-semibold text-[#2b2a25]">platos a revisar</h2>
      <div className="mt-2 space-y-2">
        {aRevisar.map((p) => (
          <Link
            key={p.id}
            href={`/recetas/${p.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-3 hover:border-[#1e3a5f]"
          >
            <span className="text-sm font-medium text-[#2b2a25]">{p.nombre}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${DIAG_PILL[p.diagnostico]}`}>{fmt(p.food_cost_pct)}% fc</span>
          </Link>
        ))}
        {aRevisar.length === 0 && <p className="text-sm text-[#6e6a5c]">Todavía no hay platos en la carta.</p>}
      </div>

      <h2 className="mt-6 text-sm font-semibold text-[#2b2a25]">margen bruto por ración (sin IGIC/IVA)</h2>
      <div className="mt-2 space-y-2">
        {lista.map((p) => {
          const margen = p.pvp_base - p.coste_racion
          return (
            <Link
              key={p.id}
              href={`/recetas/${p.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-3 hover:border-[#1e3a5f]"
            >
              <div>
                <p className="text-sm font-semibold text-[#2b2a25]">{p.nombre}</p>
                <p className="text-xs text-[#6e6a5c]">
                  coste {fmtE(p.coste_racion)} · pvp {fmtE(p.pvp)}
                </p>
              </div>
              <span className={`text-sm font-bold ${margen >= 0 ? 'text-[#1f6f8b]' : 'text-[#b23c30]'}`}>{fmtE(margen)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
