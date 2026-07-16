import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/lib/actions/auth'
import { TenantNav, TenantSidebar } from '@/components/tenant-nav'

// Guard de defensa en profundidad para todo el grupo de rutas del tenant:
// el proxy ya filtra por sesión, pero esta capa vuelve a verificarlo cerca
// de los datos (patrón recomendado por Next.js para Layouts + auth).
export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membresia } = await supabase
    .from('usuarios_restaurante')
    .select('nombre, restaurante:restaurantes(nombre, lugar)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const restaurante = membresia?.restaurante as unknown as { nombre: string; lugar: string } | null
  const nombreUsuario = membresia?.nombre || user.email || ''
  const iniciales = nombreUsuario
    .split(' ')
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-[#e5decb] sm:flex-row">
      <TenantSidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#e2dac8] bg-[#faf7ef] px-5 py-3 print:hidden">
          <div>
            <p className="text-sm font-semibold text-[#2b2a25]">{restaurante?.nombre}</p>
            <p className="text-xs text-[#6e6a5c]">{restaurante?.lugar}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbe4ee] text-xs font-bold text-[#1e3a5f]"
            >
              {iniciales}
            </button>
          </form>
        </header>

        <main className="flex-1 overflow-y-auto p-5">{children}</main>

        <TenantNav />
      </div>
    </div>
  )
}
