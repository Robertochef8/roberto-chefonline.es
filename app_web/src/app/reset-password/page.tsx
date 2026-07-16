'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber caducado — solicita uno nuevo desde "¿Olvidaste tu contraseña?".')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm rounded-2xl bg-[#faf7ef] p-8 shadow-sm">
        <h1 className="text-xl font-bold text-[#2b2a25]">Crear nueva contraseña</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e2dac8] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]"
            />
          </div>
          <div>
            <label htmlFor="confirmar" className="block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]">
              Confirmar contraseña
            </label>
            <input
              id="confirmar"
              type="password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
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
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </main>
  )
}
