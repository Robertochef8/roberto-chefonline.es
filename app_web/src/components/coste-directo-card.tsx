'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarPlatoCampo } from '@/lib/actions/platos'
import { fmt, fmtE } from '@/lib/chef/format'

type Plato = { id: string; extras_pct: number; packaging: number; raciones: number; pvp: number }
type Calc = { coste_racion: number; pvp: number; food_cost_pct: number }

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

export function CosteDirectoCard({ plato, calc }: { plato: Plato; calc: Calc }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [extras, setExtras] = useState(String(plato.extras_pct))
  const [packaging, setPackaging] = useState(String(plato.packaging))
  const [raciones, setRaciones] = useState(String(plato.raciones))
  const [pvp, setPvp] = useState(String(plato.pvp))

  function guardar(campo: 'extras_pct' | 'packaging' | 'raciones' | 'pvp', valor: string, original: number) {
    const num = Number(valor.replace(',', '.'))
    if (!Number.isFinite(num) || num === original) return
    startTransition(async () => {
      const res = await actualizarPlatoCampo(plato.id, campo, num)
      if (!res.error) router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-4">
      <p className="text-sm font-semibold text-[#2b2a25]">Coste directo</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className={campoLabel}>Condimentos y varios (%)</label>
          <input
            value={extras}
            onChange={(e) => setExtras(e.target.value)}
            onBlur={(e) => guardar('extras_pct', e.target.value, plato.extras_pct)}
            disabled={pending}
            className={campoInput}
          />
        </div>
        <div>
          <label className={campoLabel}>Packaging (€)</label>
          <input
            value={packaging}
            onChange={(e) => setPackaging(e.target.value)}
            onBlur={(e) => guardar('packaging', e.target.value, plato.packaging)}
            disabled={pending}
            className={campoInput}
          />
        </div>
        <div>
          <label className={campoLabel}>Raciones</label>
          <input
            value={raciones}
            onChange={(e) => setRaciones(e.target.value)}
            onBlur={(e) => guardar('raciones', e.target.value, plato.raciones)}
            disabled={pending}
            className={campoInput}
          />
        </div>
        <div>
          <label className={campoLabel}>PVP carta (con IGIC/IVA)</label>
          <input
            value={pvp}
            onChange={(e) => setPvp(e.target.value)}
            onBlur={(e) => guardar('pvp', e.target.value, plato.pvp)}
            disabled={pending}
            className={campoInput}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#f1ede0] p-2 text-center">
          <p className="text-[10px] text-[#6e6a5c]">coste</p>
          <p className="text-sm font-bold text-[#2b2a25]">{fmtE(calc.coste_racion)}</p>
        </div>
        <div className="rounded-lg bg-[#f1ede0] p-2 text-center">
          <p className="text-[10px] text-[#6e6a5c]">pvp</p>
          <p className="text-sm font-bold text-[#2b2a25]">{fmtE(calc.pvp)}</p>
        </div>
        <div className="rounded-lg bg-[#f1ede0] p-2 text-center">
          <p className="text-[10px] text-[#6e6a5c]">food cost</p>
          <p className="text-sm font-bold text-[#b23c30]">{fmt(calc.food_cost_pct)}%</p>
        </div>
      </div>
    </div>
  )
}
