'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (resetError) {
      setError('No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.')
      return
    }
    setEnviado(true)
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm rounded-2xl bg-[#faf7ef] p-8 shadow-sm">
        <h1 className="text-xl font-bold text-[#2b2a25]">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-[#6e6a5c]">
          Introduce tu correo y te enviaremos un enlace de un solo uso para crear una nueva contraseña.
        </p>

        {enviado ? (
          <div className="mt-6 rounded-lg bg-[#dbe9ee] px-3 py-3 text-sm text-[#1f6f8b]">
            Si ese correo existe en Chef Online, recibirás un email con las instrucciones en unos minutos.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@restaurante.com"
                className="mt-1 w-full rounded-lg border border-[#e2dac8] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-[#1e3a5f] underline">
            Volver al login
          </Link>
        </p>
      </div>
    </main>
  )
}
