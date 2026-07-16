'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { subirImagenPlato, quitarImagenPlato } from '@/lib/actions/platos'

export function PlatoImagen({ platoId, nombre, imagenUrl }: { platoId: string; nombre: string; imagenUrl: string | null }) {
  const router = useRouter()
  const [zoom, setZoom] = useState(false)
  const [modal, setModal] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const iniciales = nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function subir(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await subirImagenPlato(platoId, formData)
      if (res.error) {
        setError(res.error)
        return
      }
      setModal(false)
      router.refresh()
    })
  }

  function quitar() {
    startTransition(async () => {
      await quitarImagenPlato(platoId)
      setModal(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="relative h-56 w-full overflow-hidden rounded-xl bg-[#dbe4ee] print:hidden">
        {imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagenUrl} alt={nombre} onClick={() => setZoom(true)} className="h-full w-full cursor-zoom-in object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-bold text-[#1e3a5f]">{iniciales}</div>
        )}
        <button
          onClick={() => setModal(true)}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#faf7ef] text-[#1e3a5f] shadow"
          aria-label="Cambiar imagen del plato"
          title="Cambiar imagen del plato"
        >
          ✎
        </button>
      </div>

      {zoom && imagenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagenUrl} alt={nombre} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#faf7ef] p-6 shadow-lg">
            <h2 className="mb-4 text-base font-bold text-[#2b2a25]">Imagen del plato</h2>
            <form action={subir} className="space-y-3">
              <input type="file" name="archivo" accept="image/*" className="text-sm" />
              {error && <p className="text-sm text-[#b23c30]">✕ {error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-[#1e3a5f] py-2 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
              >
                {pending ? 'Subiendo…' : 'Subir foto'}
              </button>
            </form>
            {imagenUrl && (
              <button
                onClick={quitar}
                disabled={pending}
                className="mt-2 w-full rounded-lg border border-[#e2dac8] py-2 text-sm font-semibold text-[#b23c30] disabled:opacity-60"
              >
                Quitar foto
              </button>
            )}
            <button onClick={() => setModal(false)} className="mt-2 w-full text-xs text-[#6e6a5c]">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
