'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type FilaImport = {
  accion: string
  nombre_archivo: string
  unidad_archivo: string
  referencia_archivo: string
  precio_nuevo: number
}

export async function ejecutarImportacionPrecios(
  proveedorId: string,
  filas: FilaImport[]
): Promise<{ error?: string; creados?: number; actualizados?: number }> {
  if (!filas.length) return { error: 'No hay filas válidas para importar.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('importar_precios_proveedor', { p_proveedor_id: proveedorId, p_filas: filas })
    .single()
  if (error) return { error: error.message }

  revalidatePath('/proveedores')
  revalidatePath('/ingredientes')
  revalidatePath('/dashboard')
  revalidatePath('/recetas')

  const resultado = data as { creados: number; actualizados: number }
  return { creados: resultado.creados, actualizados: resultado.actualizados }
}

type Mapeo = { nombre: number | null; precio: number | null; codigo: number | null; referencia: number | null; unidad: number | null }

export async function guardarMapeoImportacion(proveedorId: string, mapeo: Mapeo): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedor_import_mapping').upsert(
    {
      proveedor_id: proveedorId,
      columna_nombre: mapeo.nombre,
      columna_precio: mapeo.precio,
      columna_codigo: mapeo.codigo,
      columna_referencia: mapeo.referencia,
      columna_unidad: mapeo.unidad,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'proveedor_id' }
  )
  if (error) return { error: error.message }
  return {}
}
