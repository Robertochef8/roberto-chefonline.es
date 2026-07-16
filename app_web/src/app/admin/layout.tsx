import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Guard de defensa en profundidad: aunque el proxy ya exige sesión, aquí se
// vuelve a comprobar (cerca de los datos) que además es Super Admin. Si un
// usuario "cliente" intenta entrar a /admin directamente, se le saca.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: esSuperAdmin } = await supabase.rpc('is_super_admin')

  if (!esSuperAdmin) {
    redirect('/inicio')
  }

  return <div className="min-h-screen">{children}</div>
}
