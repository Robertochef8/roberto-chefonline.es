import { createClient } from '@/lib/supabase/server'
import { AjustesForm } from '@/components/ajustes-form'

export default async function AjustesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membresia } = await supabase
    .from('usuarios_restaurante')
    .select('restaurante_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const { data: restaurante } = await supabase
    .from('restaurantes')
    .select('id, nombre, lugar, zona, impuesto, fc_objetivo')
    .eq('id', membresia!.restaurante_id)
    .single()

  return (
    <div>
      <h1 className="text-lg font-bold text-[#2b2a25]">Ajustes</h1>
      <div className="mt-5">
        <AjustesForm restaurante={restaurante!} />
      </div>
    </div>
  )
}
