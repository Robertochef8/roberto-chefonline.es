'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarPrecioMerma } from '@/lib/actions/ingredientes'
import { fmtE, relativo, costeUtil } from '@/lib/chef/format'
import { ESTADO_TXT, ESTADO_PILL } from '@/lib/chef/alergenos'

type Alergeno = { estado: string; alergeno: { nombre: string } }
type Ingrediente = {
  id: string
  codigo: string
  nombre: string
  unidad: string
  precio_actual: number
  merma_pct: number
  ultima_actualizacion: string
  origen_actualizacion: string
  ingrediente_alergeno: Alergeno[]
}

function FilaIngrediente({ ing }: { ing: Ingrediente }) {
  const router = useRouter()
  const [precio, setPrecio] = useState(String(ing.precio_actual))
  const [merma, setMerma] = useState(String(ing.merma_pct))
  const [pending, startTransition] = useTransition()

  function guardar(campo: 'precio_actual' | 'merma_pct', valor: string, original: number) {
    const num = Number(valor.replace(',', '.'))
    if (!Number.isFinite(num) || num === original) return
    startTransition(async () => {
      const res = await actualizarPrecioMerma(ing.id, campo, num)
      if (!res.error) router.refresh()
    })
  }

  return (
    <tr className="border-b border-[#e2dac8]">
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6e6a5c]">{ing.codigo}</td>
      <td className="px-3 py-2 text-sm font-medium text-[#2b2a25]">{ing.nombre}</td>
      <td className="px-3 py-2 text-sm text-[#6e6a5c]">{ing.unidad}</td>
      <td className="px-3 py-2">
        <input
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          onBlur={(e) => guardar('precio_actual', e.target.value, ing.precio_actual)}
          disabled={pending}
          className="w-20 rounded border border-[#e2dac8] bg-[#faf7ef] px-2 py-1 text-sm"
        />
        <span className="ml-1 text-xs text-[#6e6a5c]">€</span>
      </td>
      <td className="px-3 py-2">
        <input
          value={merma}
          onChange={(e) => setMerma(e.target.value)}
          onBlur={(e) => guardar('merma_pct', e.target.value, ing.merma_pct)}
          disabled={pending}
          className="w-16 rounded border border-[#e2dac8] bg-[#faf7ef] px-2 py-1 text-sm"
        />
        <span className="ml-1 text-xs text-[#6e6a5c]">%</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-[#2b2a25]">
        {fmtE(costeUtil(ing.precio_actual, ing.merma_pct))}/{ing.unidad}
      </td>
      <td className="px-3 py-2">
        {ing.ingrediente_alergeno.length ? (
          <div className="flex flex-wrap gap-1">
            {ing.ingrediente_alergeno.map((a, i) => (
              <span
                key={i}
                title={ESTADO_TXT[a.estado]}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADO_PILL[a.estado]}`}
              >
                {a.alergeno.nombre}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-[#6e6a5c]">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6e6a5c]">
        {relativo(ing.ultima_actualizacion)}
        {ing.origen_actualizacion === 'importacion_csv' && (
          <span className="ml-1 rounded-full bg-[#dbe9ee] px-2 py-0.5 text-[10px] font-semibold text-[#1f6f8b]">
            archivo
          </span>
        )}
      </td>
    </tr>
  )
}

export function IngredientesTabla({ ingredientes }: { ingredientes: Ingrediente[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e2dac8]">
      <table className="w-full min-w-[720px] border-collapse bg-[#faf7ef] text-left">
        <thead>
          <tr className="bg-[#1e3a5f] text-[#faf7ef]">
            <th className="px-3 py-2 text-xs font-semibold">Código</th>
            <th className="px-3 py-2 text-xs font-semibold">Ingrediente</th>
            <th className="px-3 py-2 text-xs font-semibold">Unidad</th>
            <th className="px-3 py-2 text-xs font-semibold">Precio compra</th>
            <th className="px-3 py-2 text-xs font-semibold">Merma</th>
            <th className="px-3 py-2 text-xs font-semibold">Coste útil</th>
            <th className="px-3 py-2 text-xs font-semibold">Alérgenos declarados</th>
            <th className="px-3 py-2 text-xs font-semibold">Actualizado</th>
          </tr>
        </thead>
        <tbody>
          {ingredientes.map((ing) => (
            <FilaIngrediente key={ing.id} ing={ing} />
          ))}
        </tbody>
      </table>
      {ingredientes.length === 0 && (
        <p className="p-4 text-sm text-[#6e6a5c]">Todavía no hay ingredientes. Crea el primero con el botón de arriba.</p>
      )}
    </div>
  )
}
