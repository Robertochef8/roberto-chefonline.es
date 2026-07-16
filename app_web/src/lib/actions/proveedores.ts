'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { restauranteIdActual } from '@/lib/supabase/restaurante-actual'

export type EstadoProveedor = { error?: string; success?: boolean } | null

function datosProveedor(formData: FormData) {
  return {
    nombre: (formData.get('nombre') as string)?.trim(),
    cif_nif: (formData.get('cif_nif') as string)?.trim() || null,
    persona_contacto: (formData.get('persona_contacto') as string)?.trim() || null,
    web: (formData.get('web') as string)?.trim() || null,
    email: (formData.get('email') as string)?.trim() || null,
    direccion: (formData.get('direccion') as string)?.trim() || null,
    codigo_postal: (formData.get('codigo_postal') as string)?.trim() || null,
    poblacion: (formData.get('poblacion') as string)?.trim() || null,
    provincia: (formData.get('provincia') as string)?.trim() || null,
    isla: (formData.get('isla') as string)?.trim() || null,
    pais: (formData.get('pais') as string)?.trim() || 'España',
  }
}

export async function crearProveedor(_prev: EstadoProveedor, formData: FormData): Promise<EstadoProveedor> {
  const supabase = await createClient()
  const restauranteId = await restauranteIdActual(supabase)
  const datos = datosProveedor(formData)

  if (!datos.nombre) return { error: 'El nombre del proveedor es obligatorio.' }

  const { error } = await supabase.from('proveedores').insert({ ...datos, restaurante_id: restauranteId })
  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  return { success: true }
}

export async function actualizarProveedor(_prev: EstadoProveedor, formData: FormData): Promise<EstadoProveedor> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const datos = datosProveedor(formData)

  if (!datos.nombre) return { error: 'El nombre del proveedor es obligatorio.' }

  const { error } = await supabase
    .from('proveedores')
    .update({ ...datos, actualizado_en: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  return { success: true }
}

export async function eliminarProveedor(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  return {}
}

export async function usarPrecioProveedor(ingredienteId: string, proveedorId: string, precio: number): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ingredientes')
    .update({
      precio_actual: precio,
      proveedor_preferente: proveedorId,
      ultima_actualizacion: new Date().toISOString(),
      origen_actualizacion: 'manual',
    })
    .eq('id', ingredienteId)
  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  revalidatePath('/ingredientes')
  revalidatePath('/recetas')
  return {}
}
