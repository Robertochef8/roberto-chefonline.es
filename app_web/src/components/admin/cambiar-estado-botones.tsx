'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cambiarEstadoCliente, cambiarEstadoUsuario } from '@/lib/actions/admin-clientes'

const ESTADOS_CLIENTE = ['activa', 'suspendida', 'desactivada']
const ESTADOS_USUARIO = ['activo', 'suspendido', 'desactivado']

export function CambiarEstadoClienteBotones({ id, estadoActual }: { id: string; estadoActual: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function cambiar(estado: string) {
    startTransition(async () => {
      const res = await cambiarEstadoCliente(id, estado)
      if (res.error) window.alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ESTADOS_CLIENTE.map((e) => (
        <button
          key={e}
          onClick={() => cambiar(e)}
          disabled={pending || e === estadoActual}
          className="rounded-lg border border-[#e2dac8] px-3 py-1.5 text-xs font-semibold text-[#2b2a25] disabled:opacity-40"
        >
          Marcar {e}
        </button>
      ))}
    </div>
  )
}

export function CambiarEstadoUsuarioBoton({
  id,
  restauranteId,
  estadoActual,
}: {
  id: string
  restauranteId: string
  estadoActual: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function ciclar() {
    const idx = ESTADOS_USUARIO.indexOf(estadoActual)
    const siguiente = ESTADOS_USUARIO[(idx + 1) % ESTADOS_USUARIO.length]
    startTransition(async () => {
      const res = await cambiarEstadoUsuario(id, restauranteId, siguiente)
      if (res.error) window.alert(res.error)
      else router.refresh()
    })
  }

  return (
    <button onClick={ciclar} disabled={pending} className="text-xs font-semibold text-[#1e3a5f] disabled:opacity-60">
      cambiar estado
    </button>
  )
}
