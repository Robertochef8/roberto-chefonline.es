'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearUsuarioCliente } from '@/lib/actions/admin-clientes'

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

function Formulario({ restauranteId, onCreado }: { restauranteId: string; onCreado: () => void }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(crearUsuarioCliente, null)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onCreado()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="restaurante_id" value={restauranteId} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={campoLabel}>Correo electrónico *</label>
          <input name="email" type="email" required className={campoInput} />
        </div>
        <div className="col-span-2">
          <label className={campoLabel}>Contraseña inicial *</label>
          <input name="password" type="text" required minLength={8} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Nombre *</label>
          <input name="nombre" required className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Apellidos</label>
          <input name="apellidos" className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Usuario</label>
          <input name="usuario" className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Cargo</label>
          <input name="cargo" className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Teléfono</label>
          <input name="telefono" className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Rol</label>
          <select name="rol" defaultValue="cliente" className={campoInput}>
            <option value="admin">Administrador</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
      </div>

      {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}

      <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60">
        {pending ? 'Creando…' : 'Crear usuario'}
      </button>
    </form>
  )
}

export function NuevoUsuarioModal({ restauranteId }: { restauranteId: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button onClick={() => setAbierto(true)} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-[#faf7ef]">
        + Añadir usuario
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setAbierto(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#faf7ef] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2b2a25]">Nuevo usuario</h2>
              <button onClick={() => setAbierto(false)} className="text-[#6e6a5c]" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <Formulario restauranteId={restauranteId} onCreado={() => setAbierto(false)} />
          </div>
        </div>
      )}
    </>
  )
}
