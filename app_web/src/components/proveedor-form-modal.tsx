'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearProveedor, actualizarProveedor } from '@/lib/actions/proveedores'

type Proveedor = {
  id: string
  nombre: string
  cif_nif: string | null
  persona_contacto: string | null
  web: string | null
  email: string | null
  direccion: string | null
  codigo_postal: string | null
  poblacion: string | null
  provincia: string | null
  isla: string | null
  pais: string | null
}

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

function FormularioProveedor({ proveedor, onGuardado }: { proveedor?: Proveedor; onGuardado: () => void }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(proveedor ? actualizarProveedor : crearProveedor, null)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onGuardado()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return (
    <form action={formAction} className="space-y-3">
      {proveedor && <input type="hidden" name="id" value={proveedor.id} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={campoLabel}>CIF/NIF</label>
          <input name="cif_nif" defaultValue={proveedor?.cif_nif ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Nombre proveedor *</label>
          <input name="nombre" required defaultValue={proveedor?.nombre ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Persona de contacto</label>
          <input name="persona_contacto" defaultValue={proveedor?.persona_contacto ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Web</label>
          <input name="web" defaultValue={proveedor?.web ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Correo electrónico</label>
          <input name="email" type="email" defaultValue={proveedor?.email ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Dirección</label>
          <input name="direccion" defaultValue={proveedor?.direccion ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Código postal</label>
          <input name="codigo_postal" defaultValue={proveedor?.codigo_postal ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Población</label>
          <input name="poblacion" defaultValue={proveedor?.poblacion ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Provincia</label>
          <input name="provincia" defaultValue={proveedor?.provincia ?? ''} className={campoInput} />
        </div>
        <div>
          <label className={campoLabel}>Isla</label>
          <input name="isla" defaultValue={proveedor?.isla ?? ''} placeholder="vacío si es Península" className={campoInput} />
        </div>
        <div className="col-span-2">
          <label className={campoLabel}>País</label>
          <input name="pais" defaultValue={proveedor?.pais ?? 'España'} className={campoInput} />
        </div>
      </div>

      {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
      >
        {pending ? 'Guardando…' : proveedor ? 'Guardar cambios' : 'Crear proveedor'}
      </button>
    </form>
  )
}

export function ProveedorFormModal({
  proveedor,
  triggerLabel,
  triggerClassName,
}: {
  proveedor?: Proveedor
  triggerLabel: string
  triggerClassName: string
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button onClick={() => setAbierto(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setAbierto(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#faf7ef] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2b2a25]">{proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <button onClick={() => setAbierto(false)} className="text-[#6e6a5c]" aria-label="Cerrar">
                ✕
              </button>
            </div>
            <FormularioProveedor proveedor={proveedor} onGuardado={() => setAbierto(false)} />
          </div>
        </div>
      )}
    </>
  )
}
