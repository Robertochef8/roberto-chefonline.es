'use client'

import { useActionState, useState } from 'react'
import { guardarAjustes } from '@/lib/actions/ajustes'

type Restaurante = {
  id: string
  nombre: string
  lugar: string | null
  zona: string
  impuesto: number
  fc_objetivo: number
}

const PRESETS = [
  { value: '', label: '— elegir preset —' },
  { value: '28', label: 'Gastronómico (25–32%)' },
  { value: '31', label: 'Casual (28–35%)' },
  { value: '34', label: 'Menú diario (30–38%)' },
  { value: '30', label: 'Tapas / raciones (25–35%)' },
]

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

export function AjustesForm({ restaurante }: { restaurante: Restaurante }) {
  const [state, formAction, pending] = useActionState(guardarAjustes, null)
  const [zona, setZona] = useState(restaurante.zona)
  const [impuesto, setImpuesto] = useState(restaurante.impuesto)
  const [fcObjetivo, setFcObjetivo] = useState(restaurante.fc_objetivo)

  function onZonaChange(v: string) {
    setZona(v)
    setImpuesto(v === 'canarias' ? 7 : 10)
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="restaurante_id" value={restaurante.id} />

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">restaurante</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Nombre</label>
            <input name="nombre" defaultValue={restaurante.nombre} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Localidad</label>
            <input name="lugar" defaultValue={restaurante.lugar ?? ''} className={campoInput} />
          </div>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">zona fiscal</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Zona</label>
            <select name="zona" value={zona} onChange={(e) => onZonaChange(e.target.value)} className={campoInput}>
              <option value="canarias">Canarias — IGIC</option>
              <option value="peninsula">Península y Baleares — IVA</option>
            </select>
          </div>
          <div>
            <label className={campoLabel}>Tipo impositivo (%)</label>
            <input
              type="number"
              name="impuesto"
              min={0}
              max={25}
              step={0.5}
              value={impuesto}
              onChange={(e) => setImpuesto(Number(e.target.value))}
              className={campoInput}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6e6a5c]">
          El food cost se calcula sobre el PVP sin impuestos. En Canarias el IGIC de hostelería es el 7%; en
          península el IVA es el 10%.
        </p>
      </section>

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">food cost objetivo</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Objetivo (%)</label>
            <input
              type="number"
              name="fc_objetivo"
              min={10}
              max={60}
              step={1}
              value={fcObjetivo}
              onChange={(e) => setFcObjetivo(Number(e.target.value))}
              className={campoInput}
            />
          </div>
          <div>
            <label className={campoLabel}>Preset por tipo de negocio</label>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) setFcObjetivo(Number(e.target.value))
              }}
              className={campoInput}
            >
              {PRESETS.map((p) => (
                <option key={p.label} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6e6a5c]">
          Los rangos son orientativos, no una norma absoluta. El objetivo depende de tu estructura de costes
          indirectos (personal, local, suministros…).
        </p>
      </section>

      {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}
      {state?.success && <div className="rounded-lg bg-[#dbe9ee] px-3 py-2 text-sm text-[#1f6f8b]">Cambios guardados.</div>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
