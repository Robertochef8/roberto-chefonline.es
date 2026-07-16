'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarFichaTecnica } from '@/lib/actions/platos'

type Plato = {
  id: string
  elaboracion: string | null
  conservacion: string | null
  temperatura_servicio: string | null
  vida_util: string | null
  notas: string | null
}

const CAMPOS = [
  ['elaboracion', 'Elaboración'],
  ['conservacion', 'Conservación'],
  ['temperatura_servicio', 'Temperatura de servicio'],
  ['vida_util', 'Vida útil'],
  ['notas', 'Observaciones'],
] as const

export function FichaTecnicaForm({ plato }: { plato: Plato }) {
  const router = useRouter()
  const [valores, setValores] = useState({
    elaboracion: plato.elaboracion ?? '',
    conservacion: plato.conservacion ?? '',
    temperatura_servicio: plato.temperatura_servicio ?? '',
    vida_util: plato.vida_util ?? '',
    notas: plato.notas ?? '',
  })
  const [pending, startTransition] = useTransition()

  function guardar(campo: keyof typeof valores, original: string | null) {
    if (valores[campo] === (original ?? '')) return
    startTransition(async () => {
      await actualizarFichaTecnica(plato.id, campo, valores[campo])
      router.refresh()
    })
  }

  return (
    <div id="ficha-tecnica" className="space-y-3 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-4">
      <p className="text-sm font-semibold text-[#2b2a25]">Ficha técnica</p>
      {CAMPOS.map(([campo, etiqueta]) => (
        <div key={campo}>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]">{etiqueta}</label>
          <textarea
            value={valores[campo]}
            onChange={(e) => setValores((v) => ({ ...v, [campo]: e.target.value }))}
            onBlur={() => guardar(campo, plato[campo])}
            disabled={pending}
            rows={2}
            className="mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]"
          />
        </div>
      ))}
    </div>
  )
}
