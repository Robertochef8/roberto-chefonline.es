'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError('Credenciales incorrectas. Revisa el correo y la contraseña. Si no los recuerdas, contacta con tu administrador.')
      setLoading(false)
      return
    }

    await supabase.rpc('log_evento', { p_restaurante_id: null, p_evento: 'login', p_detalle: null })

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm rounded-2xl bg-[#faf7ef] p-8 shadow-sm">
        <h1 className="text-xl font-bold text-[#2b2a25]">Chef Online</h1>
        <p className="mt-1 text-sm font-semibold text-[#1e3a5f]">Agentes de IA para restaurantes</p>

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
          <div>
            <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]">
              Contraseña
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

          {error && (
            <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-sm">
            <Link href="/login/recuperar" className="text-[#1e3a5f] underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
