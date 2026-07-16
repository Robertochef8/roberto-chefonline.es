'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarProveedor } from '@/lib/actions/proveedores'

export function EliminarProveedorBoton({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!window.confirm(`¿Eliminar el proveedor "${nombre}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const res = await eliminarProveedor(id)
      if (res.error) {
        window.alert(res.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <button onClick={onClick} disabled={pending} className="text-xs font-semibold text-[#b23c30] disabled:opacity-60">
      {pending ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}
