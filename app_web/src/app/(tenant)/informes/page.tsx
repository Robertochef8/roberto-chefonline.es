import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { restauranteIdActual } from '@/lib/supabase/restaurante-actual'
import { fmt, fmtE } from '@/lib/chef/format'
import { DIAG_PILL, DIAG_TEXTO } from '@/lib/chef/diagnostico'

const BAR_COLOR: Record<string, string> = {
  rentable: '#1f6f8b',
  revisar: '#9a5f0b',
  no_rentable: '#b23c30',
}

export default async function InformesPage() {
  const supabase = await createClient()
  const restauranteId = await restauranteIdActual(supabase)

  const { data: restaurante } = await supabase.from('restaurantes').select('fc_objetivo').eq('id', restauranteId).single()
  const fcObjetivo = restaurante?.fc_objetivo ?? 30

  const { data: platos } = await supabase
    .from('vista_platos_resumen')
    .select('id, nombre, coste_racion, pvp_recomendado, food_cost_pct, diagnostico')
    .order('food_cost_pct', { ascending: false })

  const lista = platos ?? []
  const fueraObjetivo = lista.filter((p) => p.diagnostico !== 'rentable')
  const maxValor = Math.max(50, ...lista.map((p) => p.food_cost_pct)) * 1.1
  const posicionObjetivo = (fcObjetivo / maxValor) * 100

  return (
    <div>
      <h1 className="text-lg font-bold text-[#2b2a25]">Informes</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#f1ede0] p-4">
          <p className="text-xs text-[#6e6a5c]">food cost objetivo</p>
          <p className="mt-1 text-2xl font-bold text-[#1f6f8b]">{fmt(fcObjetivo)}%</p>
        </div>
        <div className="rounded-xl bg-[#f1ede0] p-4">
          <p className="text-xs text-[#6e6a5c]">platos fuera objetivo</p>
          <p className={`mt-1 text-2xl font-bold ${fueraObjetivo.length ? 'text-[#b23c30]' : 'text-[#1f6f8b]'}`}>
            {fueraObjetivo.length}
          </p>
        </div>
      </div>

      <h2 className="mt-6 text-sm font-semibold text-[#2b2a25]">
        food cost por plato <span className="font-normal text-[#6e6a5c]">(línea oscura = objetivo {fmt(fcObjetivo)}%)</span>
      </h2>
      <div className="mt-3 space-y-2">
        {lista.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="w-32 shrink-0 truncate text-xs text-[#2b2a25]">{p.nombre}</span>
            <div className="relative h-4 flex-1 rounded bg-[#f1ede0]">
              <div
                className="h-4 rounded"
                style={{ width: `${(p.food_cost_pct / maxValor) * 100}%`, background: BAR_COLOR[p.diagnostico] }}
              />
              <div className="absolute inset-y-0 w-px bg-[#2b2a25]/35" style={{ left: `${posicionObjetivo}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right text-xs font-semibold" style={{ color: BAR_COLOR[p.diagnostico] }}>
              {fmt(p.food_cost_pct)}%
            </span>
          </div>
        ))}
        {lista.length === 0 && <p className="text-sm text-[#6e6a5c]">Todavía no hay platos en la carta.</p>}
      </div>

      <h2 className="mt-6 text-sm font-semibold text-[#2b2a25]">rentabilidad</h2>
      <div className="mt-2 space-y-2">
        {lista.map((p) => (
          <Link
            key={p.id}
            href={`/recetas/${p.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-3 hover:border-[#1e3a5f]"
          >
            <div>
              <p className="text-sm font-semibold text-[#2b2a25]">{p.nombre}</p>
              <p className="text-xs text-[#6e6a5c]">
                coste {fmtE(p.coste_racion)} · pvp rec. {fmtE(p.pvp_recomendado)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${DIAG_PILL[p.diagnostico]}`}>
              {DIAG_TEXTO[p.diagnostico]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
