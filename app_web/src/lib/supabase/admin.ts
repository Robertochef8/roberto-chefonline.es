import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Cliente con la clave service_role: SALTA TODA LA RLS. Solo se usa dentro de
// Server Actions que ya hayan verificado is_super_admin() con el cliente
// normal (ver requireSuperAdmin() en lib/actions/admin-clientes.ts). El
// import 'server-only' de arriba hace que el build falle si esto se importa
// alguna vez desde un Client Component.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
