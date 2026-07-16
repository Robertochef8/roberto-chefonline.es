import type { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// El restaurante del usuario autenticado — se deriva server-side en cada
// Server Action en vez de confiar en un id enviado por el cliente (aunque
// las políticas RLS ya impedirían que afecte a otro tenant de todos modos).
export async function restauranteIdActual(supabase: SupabaseServerClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data } = await supabase
    .from('usuarios_restaurante')
    .select('restaurante_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()
  return data?.restaurante_id as string
}
