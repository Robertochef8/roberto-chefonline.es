'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearIngrediente } from '@/lib/actions/ingredientes'
import { ALERGENOS_UI } from '@/lib/chef/alergenos'

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

function FormularioNuevoIngrediente({ onCreado }: { onCreado: () => void }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(crearIngrediente, null)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onCreado()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={campoLabel}>Nombre</label>
          <input name="nombre" required autoFocus className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Unidad de compra</label>
          <select name="unidad" defaultValue="kg" className={campoInput}>
            <option value="kg">kg</option>
            <option value="l">l</option>
            <option value="ud">ud</option>
          </select>
        </div>
        <div>
          <label className={campoLabel}>Precio compra (€)</label>
          <input name="precio" type="number" step="0.01" min={0} defaultValue={0} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Merma estimada (%)</label>
          <input name="merma" type="number" step="1" min={0} max={90} defaultValue={0} className={campoInput} />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[#2b2a25]">Alérgenos</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ALERGENOS_UI.map(([codigo, nombre]) => (
            <div key={codigo}>
              <label className="block text-xs text-[#6e6a5c]">{nombre}</label>
              <select name={`alergeno_${codigo}`} defaultValue="no_contiene" className="mt-0.5 w-full rounded border border-[#e2dac8] bg-[#faf7ef] px-2 py-1 text-xs">
                <option value="no_contiene">No contiene</option>
                <option value="contiene">Contiene</option>
                <option value="trazas">Puede contener trazas</option>
                <option value="pendiente">Pendiente de validar</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
      >
        {pending ? 'Creando…' : 'Crear ingrediente'}
      </button>
    </form>
  )
}

export function NuevoIngredienteModal() {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-[#faf7ef]"
      >
        + Nuevo ingrediente
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setAbierto(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#faf7ef] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2b2a25]">Nuevo ingrediente</h2>
              <button onClick={() => setAbierto(false)} className="text-[#6e6a5c]" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <FormularioNuevoIngrediente onCreado={() => setAbierto(false)} />
          </div>
        </div>
      )}
    </>
  )
}
