'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { restauranteIdActual } from '@/lib/supabase/restaurante-actual'

export type EstadoIngrediente = { error?: string; success?: boolean } | null

export async function actualizarPrecioMerma(
  id: string,
  campo: 'precio_actual' | 'merma_pct',
  valor: number
): Promise<{ error?: string }> {
  if (!Number.isFinite(valor) || valor < 0) return { error: 'Valor no válido' }

  const supabase = await createClient()
  const patch: Record<string, unknown> = { [campo]: valor }
  if (campo === 'precio_actual') {
    patch.ultima_actualizacion = new Date().toISOString()
    patch.origen_actualizacion = 'manual'
  }

  const { error } = await supabase.from('ingredientes').update(patch).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/ingredientes')
  revalidatePath('/recetas')
  return {}
}

export async function crearIngrediente(_prev: EstadoIngrediente, formData: FormData): Promise<EstadoIngrediente> {
  const supabase = await createClient()
  const restauranteId = await restauranteIdActual(supabase)

  const nombre = (formData.get('nombre') as string)?.trim()
  const unidad = formData.get('unidad') as string
  const precio = Number(formData.get('precio'))
  const merma = Number(formData.get('merma'))

  if (!nombre) return { error: 'El nombre es obligatorio.' }
  if (!Number.isFinite(precio) || precio < 0) return { error: 'El precio de compra no es válido.' }
  if (!Number.isFinite(merma) || merma < 0 || merma > 90) return { error: 'La merma debe estar entre 0 y 90.' }

  const { data: codigo, error: codigoError } = await supabase.rpc('siguiente_codigo_ingrediente', {
    p_restaurante_id: restauranteId,
  })
  if (codigoError) return { error: codigoError.message }

  const { data: nuevo, error } = await supabase
    .from('ingredientes')
    .insert({
      restaurante_id: restauranteId,
      codigo,
      nombre,
      unidad,
      precio_actual: precio,
      merma_pct: merma,
      origen_actualizacion: 'manual',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const { data: alergenos } = await supabase.from('alergenos').select('id, codigo')
  const filas = (alergenos ?? [])
    .map((a) => ({ alergeno_id: a.id, estado: formData.get(`alergeno_${a.codigo}`) as string }))
    .filter((f) => f.estado && f.estado !== 'no_contiene')
    .map((f) => ({ ingrediente_id: nuevo.id, alergeno_id: f.alergeno_id, estado: f.estado }))

  if (filas.length) {
    const { error: alergenoError } = await supabase.from('ingrediente_alergeno').insert(filas)
    if (alergenoError) return { error: alergenoError.message }
  }

  revalidatePath('/ingredientes')
  return { success: true }
}
