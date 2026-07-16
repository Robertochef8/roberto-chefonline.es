'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { agregarLinea, actualizarCantidadLinea, eliminarLinea } from '@/lib/actions/platos'
import { fmtE, costeUtil } from '@/lib/chef/format'

type Ingrediente = { id: string; nombre: string; unidad: string; precio_actual: number; merma_pct: number }
type Linea = { id: string; cantidad: number; ingrediente: Ingrediente }

function lineCost(cantidad: number, ing: Ingrediente) {
  const cant = ing.unidad === 'ud' ? cantidad : cantidad / 1000
  return cant * costeUtil(ing.precio_actual, ing.merma_pct)
}

function FilaLinea({ platoId, linea }: { platoId: string; linea: Linea }) {
  const router = useRouter()
  const [cantidad, setCantidad] = useState(String(linea.cantidad))
  const [pending, startTransition] = useTransition()

  function guardar() {
    const num = Number(cantidad.replace(',', '.'))
    if (!Number.isFinite(num) || num === linea.cantidad) return
    startTransition(async () => {
      const res = await actualizarCantidadLinea(linea.id, platoId, num)
      if (!res.error) router.refresh()
    })
  }

  function borrar() {
    startTransition(async () => {
      const res = await eliminarLinea(linea.id, platoId)
      if (!res.error) router.refresh()
    })
  }

  const unidadEtiqueta = linea.ingrediente.unidad === 'ud' ? 'ud' : 'g/ml'

  return (
    <tr className="border-b border-[#e2dac8]">
      <td className="px-3 py-2 text-sm text-[#2b2a25]">{linea.ingrediente.nombre}</td>
      <td className="px-3 py-2">
        <input
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          onBlur={guardar}
          disabled={pending}
          className="w-20 rounded border border-[#e2dac8] bg-[#faf7ef] px-2 py-1 text-sm"
        />
        <span className="ml-1 text-xs text-[#6e6a5c]">{unidadEtiqueta}</span>
      </td>
      <td className="px-3 py-2 text-xs text-[#6e6a5c]">{linea.ingrediente.merma_pct}%</td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-[#6e6a5c]">
        {fmtE(costeUtil(linea.ingrediente.precio_actual, linea.ingrediente.merma_pct))}/{linea.ingrediente.unidad}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm font-semibold text-[#2b2a25]">
        {fmtE(lineCost(Number(cantidad) || 0, linea.ingrediente))}
      </td>
      <td className="px-3 py-2">
        <button onClick={borrar} disabled={pending} className="text-xs font-semibold text-[#b23c30]">
          ✕
        </button>
      </td>
    </tr>
  )
}

export function EscandalloEditor({
  platoId,
  lineas,
  ingredientesDisponibles,
}: {
  platoId: string
  lineas: Linea[]
  ingredientesDisponibles: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [ingredienteId, setIngredienteId] = useState('')
  const [cantidadNueva, setCantidadNueva] = useState('50')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const idsUsados = new Set(lineas.map((l) => l.ingrediente.id))
  const opciones = ingredientesDisponibles.filter((i) => !idsUsados.has(i.id))

  function anadir() {
    setError(null)
    const num = Number(cantidadNueva.replace(',', '.'))
    startTransition(async () => {
      const res = await agregarLinea(platoId, ingredienteId, num)
      if (res.error) {
        setError(res.error)
        return
      }
      setIngredienteId('')
      setCantidadNueva('50')
      router.refresh()
    })
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-[#e2dac8]">
        <table className="w-full min-w-[560px] border-collapse bg-[#faf7ef] text-left">
          <thead>
            <tr className="bg-[#1e3a5f] text-[#faf7ef]">
              <th className="px-3 py-2 text-xs font-semibold">Ingrediente</th>
              <th className="px-3 py-2 text-xs font-semibold">Cant. neta</th>
              <th className="px-3 py-2 text-xs font-semibold">Merma</th>
              <th className="px-3 py-2 text-xs font-semibold">Coste útil</th>
              <th className="px-3 py-2 text-xs font-semibold">Coste</th>
              <th className="px-3 py-2 text-xs font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <FilaLinea key={l.id} platoId={platoId} linea={l} />
            ))}
          </tbody>
        </table>
        {lineas.length === 0 && <p className="p-3 text-sm text-[#6e6a5c]">Este plato todavía no tiene ingredientes.</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <select
          value={ingredienteId}
          onChange={(e) => setIngredienteId(e.target.value)}
          className="rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm"
        >
          <option value="">— elegir ingrediente —</option>
          {opciones.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={cantidadNueva}
          onChange={(e) => setCantidadNueva(e.target.value)}
          className="w-24 rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm"
        />
        <button
          onClick={anadir}
          disabled={pending || !ingredienteId}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-[#faf7ef] disabled:opacity-60"
        >
          + Añadir ingrediente
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[#b23c30]">✕ {error}</p>}
    </div>
  )
}
