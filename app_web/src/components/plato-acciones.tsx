'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { eliminarPlato } from '@/lib/actions/platos'

export function PlatoAcciones({ platoId, nombre }: { platoId: string; nombre: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function eliminar() {
    if (!window.confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const res = await eliminarPlato(platoId)
      if (res.error) {
        window.alert(res.error)
        return
      }
      router.push('/recetas')
    })
  }

  return (
    <div className="mt-4 flex gap-2 print:hidden">
      <button
        onClick={() => window.print()}
        className="flex-1 rounded-lg border border-[#1e3a5f] py-2.5 text-sm font-semibold text-[#1e3a5f]"
      >
        Exportar ficha técnica PDF
      </button>
      <button
        onClick={eliminar}
        disabled={pending}
        className="flex-1 rounded-lg border border-[#b23c30] py-2.5 text-sm font-semibold text-[#b23c30] disabled:opacity-60"
      >
        {pending ? 'Eliminando…' : 'Eliminar plato'}
      </button>
    </div>
  )
}
