'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type EstadoAjustes = { error?: string; success?: boolean } | null

export async function guardarAjustes(_prevState: EstadoAjustes, formData: FormData): Promise<EstadoAjustes> {
  const supabase = await createClient()

  const restauranteId = formData.get('restaurante_id') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const lugar = (formData.get('lugar') as string)?.trim()
  const zona = formData.get('zona') as string
  const impuesto = Number(formData.get('impuesto'))
  const fcObjetivo = Number(formData.get('fc_objetivo'))

  if (!nombre) return { error: 'El nombre del restaurante no puede estar vacío.' }
  if (!Number.isFinite(impuesto) || impuesto < 0 || impuesto > 25) return { error: 'El tipo impositivo debe estar entre 0 y 25.' }
  if (!Number.isFinite(fcObjetivo) || fcObjetivo < 10 || fcObjetivo > 60) return { error: 'El food cost objetivo debe estar entre 10 y 60.' }

  // La RLS de "guardar ajustes restaurante" (tiene_permiso(id,'ajustes', true))
  // ya impide que esto afecte a un restaurante que no sea el propio, aunque
  // restauranteId viniera manipulado.
  const { error } = await supabase
    .from('restaurantes')
    .update({ nombre, lugar, zona, impuesto, fc_objetivo: fcObjetivo })
    .eq('id', restauranteId)

  if (error) return { error: error.message }

  revalidatePath('/ajustes')
  return { success: true }
}
