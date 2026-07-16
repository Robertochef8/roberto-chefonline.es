'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { usarPrecioProveedor } from '@/lib/actions/proveedores'

export function UsarPrecioBoton({ ingredienteId, proveedorId, precio }: { ingredienteId: string; proveedorId: string; precio: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onClick() {
    startTransition(async () => {
      const res = await usarPrecioProveedor(ingredienteId, proveedorId, precio)
      if (res.error) window.alert(res.error)
      else router.refresh()
    })
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="rounded-full bg-[#dbe9ee] px-3 py-1 text-xs font-semibold text-[#1f6f8b] disabled:opacity-60"
    >
      {pending ? 'Aplicando…' : 'Usar'}
    </button>
  )
}
