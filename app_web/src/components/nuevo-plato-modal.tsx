'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearPlato } from '@/lib/actions/platos'

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

export function NuevoPlatoModal({ categorias }: { categorias: { id: string; nombre: string }[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState(crearPlato, null)

  useEffect(() => {
    if (state?.success && state.platoId) {
      router.push(`/recetas/${state.platoId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <>
      <button onClick={() => setAbierto(true)} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-[#faf7ef]">
        + Nuevo plato
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setAbierto(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#faf7ef] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2b2a25]">Nuevo plato</h2>
              <button onClick={() => setAbierto(false)} className="text-[#6e6a5c]" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form action={formAction} className="space-y-3">
              <div>
                <label className={campoLabel}>Nombre</label>
                <input name="nombre" required autoFocus className={campoInput} />
              </div>
              <div>
                <label className={campoLabel}>Categoría</label>
                <select name="categoria_id" defaultValue="" className={campoInput}>
                  <option value="">— sin categoría —</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={campoLabel}>Raciones</label>
                  <input name="raciones" type="number" min={1} defaultValue={1} className={campoInput} />
                </div>
                <div>
                  <label className={campoLabel}>PVP carta (€)</label>
                  <input name="pvp" type="number" step="0.01" min={0} defaultValue={0} className={campoInput} />
                </div>
              </div>

              {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
              >
                {pending ? 'Creando…' : 'Crear plato'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
