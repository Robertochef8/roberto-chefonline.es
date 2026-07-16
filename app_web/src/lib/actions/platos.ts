'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { restauranteIdActual } from '@/lib/supabase/restaurante-actual'

export type EstadoPlato = { error?: string; success?: boolean; platoId?: string } | null

const CAMPOS_PLATO_NUMERICOS = ['extras_pct', 'packaging', 'raciones', 'pvp'] as const
type CampoPlatoNumerico = (typeof CAMPOS_PLATO_NUMERICOS)[number]

const CAMPOS_FICHA = ['elaboracion', 'conservacion', 'temperatura_servicio', 'vida_util', 'notas'] as const
type CampoFicha = (typeof CAMPOS_FICHA)[number]

function revalidarPlato(id: string) {
  revalidatePath('/recetas')
  revalidatePath(`/recetas/${id}`)
  revalidatePath('/dashboard')
  revalidatePath('/informes')
}

export async function crearPlato(_prev: EstadoPlato, formData: FormData): Promise<EstadoPlato> {
  const supabase = await createClient()
  const restauranteId = await restauranteIdActual(supabase)

  const nombre = (formData.get('nombre') as string)?.trim()
  const categoriaId = (formData.get('categoria_id') as string) || null
  const raciones = Number(formData.get('raciones')) || 1
  const pvp = Number(formData.get('pvp')) || 0

  if (!nombre) return { error: 'El nombre del plato es obligatorio.' }

  const { data: codigo, error: codigoError } = await supabase.rpc('siguiente_codigo_plato', {
    p_restaurante_id: restauranteId,
  })
  if (codigoError) return { error: codigoError.message }

  const { data: nuevo, error } = await supabase
    .from('platos')
    .insert({
      restaurante_id: restauranteId,
      codigo,
      nombre,
      categoria_id: categoriaId,
      raciones,
      pvp,
      extras_pct: 5,
      packaging: 0,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/recetas')
  return { success: true, platoId: nuevo.id }
}

export async function actualizarPlatoCampo(id: string, campo: CampoPlatoNumerico, valor: number): Promise<{ error?: string }> {
  if (!CAMPOS_PLATO_NUMERICOS.includes(campo)) return { error: 'Campo no válido' }
  if (!Number.isFinite(valor) || valor < 0) return { error: 'Valor no válido' }
  if (campo === 'raciones' && valor < 1) return { error: 'Las raciones deben ser al menos 1' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('platos')
    .update({ [campo]: valor, actualizado_en: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidarPlato(id)
  return {}
}

export async function actualizarFichaTecnica(id: string, campo: CampoFicha, valor: string): Promise<{ error?: string }> {
  if (!CAMPOS_FICHA.includes(campo)) return { error: 'Campo no válido' }

  const supabase = await createClient()
  const { error } = await supabase.from('platos').update({ [campo]: valor }).eq('id', id)
  if (error) return { error: error.message }

  revalidarPlato(id)
  return {}
}

export async function sugerirPvpOptimo(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: calc, error: calcError } = await supabase.rpc('calcular_plato', { p_plato_id: id }).single()
  if (calcError) return { error: calcError.message }

  const { error } = await supabase
    .from('platos')
    .update({ pvp: (calc as { pvp_recomendado: number }).pvp_recomendado })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidarPlato(id)
  return {}
}

export async function eliminarPlato(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: plato } = await supabase.from('platos').select('imagen_url').eq('id', id).maybeSingle()
  if (plato?.imagen_url) {
    await supabase.storage.from('platos').remove([plato.imagen_url])
  }

  const { error } = await supabase.from('platos').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/recetas')
  revalidatePath('/dashboard')
  revalidatePath('/informes')
  return {}
}

// ---------- Líneas del escandallo ----------

export async function agregarLinea(platoId: string, ingredienteId: string, cantidad: number): Promise<{ error?: string }> {
  if (!ingredienteId) return { error: 'Elige un ingrediente.' }
  if (!Number.isFinite(cantidad) || cantidad <= 0) return { error: 'La cantidad debe ser mayor que 0.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('plato_ingrediente')
    .insert({ plato_id: platoId, ingrediente_id: ingredienteId, cantidad })
  if (error) return { error: error.message }

  revalidarPlato(platoId)
  return {}
}

export async function actualizarCantidadLinea(lineaId: string, platoId: string, cantidad: number): Promise<{ error?: string }> {
  if (!Number.isFinite(cantidad) || cantidad < 0) return { error: 'Cantidad no válida' }

  const supabase = await createClient()
  const { error } = await supabase.from('plato_ingrediente').update({ cantidad }).eq('id', lineaId)
  if (error) return { error: error.message }

  revalidarPlato(platoId)
  return {}
}

export async function eliminarLinea(lineaId: string, platoId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('plato_ingrediente').delete().eq('id', lineaId)
  if (error) return { error: error.message }

  revalidarPlato(platoId)
  return {}
}

// ---------- Imagen del plato (Supabase Storage) ----------

export async function subirImagenPlato(platoId: string, formData: FormData): Promise<{ error?: string; path?: string }> {
  const archivo = formData.get('archivo') as File | null
  if (!archivo || archivo.size === 0) return { error: 'Selecciona una imagen.' }

  const supabase = await createClient()
  const restauranteId = await restauranteIdActual(supabase)
  const extension = archivo.name.split('.').pop() || 'jpg'
  const path = `${restauranteId}/${platoId}/foto.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('platos')
    .upload(path, archivo, { upsert: true, contentType: archivo.type })
  if (uploadError) return { error: uploadError.message }

  const { error } = await supabase.from('platos').update({ imagen_url: path }).eq('id', platoId)
  if (error) return { error: error.message }

  revalidarPlato(platoId)
  return { path }
}

export async function quitarImagenPlato(platoId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: plato } = await supabase.from('platos').select('imagen_url').eq('id', platoId).maybeSingle()
  if (plato?.imagen_url) {
    await supabase.storage.from('platos').remove([plato.imagen_url])
  }

  const { error } = await supabase.from('platos').update({ imagen_url: null }).eq('id', platoId)
  if (error) return { error: error.message }

  revalidarPlato(platoId)
  return {}
}
