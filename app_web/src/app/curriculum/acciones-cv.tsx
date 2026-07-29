'use client'

import { useState } from 'react'

export function AccionesCv() {
  const [copiado, setCopiado] = useState(false)

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      const el = document.createElement('input')
      el.value = window.location.href
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="print:hidden mb-6 flex justify-center gap-3">
      <button
        onClick={copiarEnlace}
        className="rounded-lg border-2 border-[#1e3a5f] px-5 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-colors"
      >
        {copiado ? '✓ Enlace copiado' : '⎘ Compartir enlace'}
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-bold text-white hover:bg-[#2a4a7f] transition-colors"
      >
        ↓ Descargar PDF
      </button>
    </div>
  )
}
