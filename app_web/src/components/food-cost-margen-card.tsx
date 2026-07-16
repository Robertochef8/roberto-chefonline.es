'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sugerirPvpOptimo } from '@/lib/actions/platos'
import { fmt, fmtE } from '@/lib/chef/format'
import { DIAG_PILL, DIAG_TEXTO, DIAG_ICONO } from '@/lib/chef/diagnostico'

type Calc = {
  pvp_base: number
  food_cost_pct: number
  margen: number
  margen_pct: number
  pvp_recomendado: number
  diagnostico: string
}

export function FoodCostMargenCard({ platoId, calc, fcObjetivo }: { platoId: string; calc: Calc; fcObjetivo: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function aplicarSugerido() {
    startTransition(async () => {
      const res = await sugerirPvpOptimo(platoId)
      if (!res.error) router.refresh()
    })
  }

  const explicacion =
    calc.diagnostico === 'rentable'
      ? `Food cost del ${fmt(calc.food_cost_pct)}%, dentro del objetivo del ${fmt(fcObjetivo)}%.`
      : calc.diagnostico === 'revisar'
        ? `Food cost del ${fmt(calc.food_cost_pct)}% frente al objetivo del ${fmt(fcObjetivo)}%. Revisa el margen.`
        : `No rentable. Food cost del ${fmt(calc.food_cost_pct)}% frente al objetivo del ${fmt(fcObjetivo)}%. Sube el PVP hacia ${fmtE(calc.pvp_recomendado)} o rediseña el plato.`

  return (
    <div>
      <div className={`flex items-start gap-2 rounded-xl p-3 text-sm font-semibold ${DIAG_PILL[calc.diagnostico]}`}>
        <span>{DIAG_ICONO[calc.diagnostico]}</span>
        <span>
          {DIAG_TEXTO[calc.diagnostico]}
          <span className="mt-0.5 block text-xs font-normal">{explicacion}</span>
        </span>
      </div>

      <div className="mt-3 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-4">
        <p className="text-sm font-semibold text-[#2b2a25]">Food cost y margen (PVP sin impuesto)</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#f1ede0] p-2 text-center">
            <p className="text-[10px] text-[#6e6a5c]">pvp sin IGIC/IVA</p>
            <p className="text-sm font-bold text-[#2b2a25]">{fmtE(calc.pvp_base)}</p>
          </div>
          <div className="rounded-lg bg-[#f1ede0] p-2 text-center">
            <p className="text-[10px] text-[#6e6a5c]">margen bruto</p>
            <p className="text-sm font-bold text-[#2b2a25]">{fmtE(calc.margen)}</p>
          </div>
          <div className="rounded-lg bg-[#f1ede0] p-2 text-center">
            <p className="text-[10px] text-[#6e6a5c]">margen %</p>
            <p className="text-sm font-bold text-[#2b2a25]">{fmt(calc.margen_pct)}%</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-[#6e6a5c]">PVP recomendado para food cost del {fmt(fcObjetivo)}%</span>
          <span className="font-semibold text-[#2b2a25]">{fmtE(calc.pvp_recomendado)}</span>
        </div>

        <button
          onClick={aplicarSugerido}
          disabled={pending}
          className="mt-3 w-full rounded-lg border border-[#1e3a5f] py-2 text-sm font-semibold text-[#1e3a5f] disabled:opacity-60"
        >
          {pending ? 'Aplicando…' : `Sugerir PVP óptimo → ${fmtE(calc.pvp_recomendado)}`}
        </button>
      </div>
    </div>
  )
}
