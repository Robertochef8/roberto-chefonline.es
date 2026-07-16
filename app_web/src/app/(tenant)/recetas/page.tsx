import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NuevoPlatoModal } from '@/components/nuevo-plato-modal'
import { fmtE, fmt } from '@/lib/chef/format'
import { DIAG_PILL } from '@/lib/chef/diagnostico'

export default async function RecetasPage() {
  const supabase = await createClient()

  const { data: platos } = await supabase
    .from('vista_platos_resumen')
    .select('*')
    .order('food_cost_pct', { ascending: false })

  const { data: categorias } = await supabase.from('categorias_carta').select('id, nombre').order('orden')

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#2b2a25]">Recetas y escandallos</h1>
          <p className="mt-1 text-sm text-[#6e6a5c]">{platos?.length ?? 0} platos en carta · toca un plato para ver su escandallo</p>
        </div>
        <NuevoPlatoModal categorias={categorias ?? []} />
      </div>

      <div className="mt-4 space-y-2">
        {(platos ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/recetas/${p.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-3 hover:border-[#1e3a5f]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dbe4ee] text-xs font-bold text-[#1e3a5f]">
                {p.nombre
                  .split(' ')
                  .map((w: string) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2b2a25]">{p.nombre}</p>
                <p className="text-xs text-[#6e6a5c]">
                  {p.categoria || 'Sin categoría'} · coste {fmtE(p.coste_racion)} · pvp {fmtE(p.pvp)}
                </p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${DIAG_PILL[p.diagnostico]}`}>
              {fmt(p.food_cost_pct)}% fc
            </span>
          </Link>
        ))}
        {(platos ?? []).length === 0 && (
          <p className="rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-4 text-sm text-[#6e6a5c]">
            Todavía no hay platos en la carta. Crea el primero con el botón de arriba.
          </p>
        )}
      </div>
    </div>
  )
}
