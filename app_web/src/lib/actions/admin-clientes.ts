'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type ResultadoAuth = { ok: true } | { ok: false; error: string }

// Toda Server Action de este archivo llama esto ANTES de tocar el cliente
// admin (service_role). Se verifica con el cliente NORMAL autenticado, nunca
// con el admin — si esto se saltara, cualquier usuario podría invocar la
// Server Action directamente (sin pasar por la UI) y tocar restaurantes ajenos.
async function requireSuperAdmin(): Promise<ResultadoAuth> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado.' }

  const { data: esSuperAdmin } = await supabase.rpc('is_super_admin')
  if (!esSuperAdmin) return { ok: false, error: 'No autorizado.' }

  return { ok: true }
}

function validarPassword(password: string): string | null {
  if (!password || password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra y un número.'
  }
  return null
}

function datosRestaurante(formData: FormData) {
  return {
    nombre: (formData.get('nombre') as string)?.trim(),
    lugar: (formData.get('lugar') as string)?.trim() || null,
    cif_nif: (formData.get('cif_nif') as string)?.trim() || null,
    direccion: (formData.get('direccion') as string)?.trim() || null,
    codigo_postal: (formData.get('codigo_postal') as string)?.trim() || null,
    poblacion: (formData.get('poblacion') as string)?.trim() || null,
    provincia: (formData.get('provincia') as string)?.trim() || null,
    isla: (formData.get('isla') as string)?.trim() || null,
    pais: (formData.get('pais') as string)?.trim() || 'España',
    zona: (formData.get('zona') as string) || 'peninsula',
    impuesto: Number(formData.get('impuesto')) || 10,
    tipo_negocio: (formData.get('tipo_negocio') as string) || 'restaurante',
    fc_objetivo: Number(formData.get('fc_objetivo')) || 30,
    estado: (formData.get('estado') as string) || 'activa',
  }
}

async function sembrarPermisosCompletos(admin: ReturnType<typeof createAdminClient>, usuarioRestauranteId: string) {
  const { data: secciones } = await admin.from('secciones_app').select('id')
  const permisos = (secciones ?? []).map((s) => ({
    usuario_restaurante_id: usuarioRestauranteId,
    seccion_id: s.id,
    puede_ver: true,
    puede_guardar: true,
  }))
  if (permisos.length) await admin.from('usuario_seccion_permiso').insert(permisos)
}

export type EstadoCliente = { error?: string; success?: boolean; restauranteId?: string } | null

export async function crearCliente(_prev: EstadoCliente, formData: FormData): Promise<EstadoCliente> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const datos = datosRestaurante(formData)
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const usuarioNombre = (formData.get('usuario_nombre') as string)?.trim()
  const usuarioApellidos = (formData.get('usuario_apellidos') as string)?.trim() || null
  const usuarioCargo = (formData.get('usuario_cargo') as string)?.trim() || null
  const usuarioTelefono = (formData.get('usuario_telefono') as string)?.trim() || null
  const usuarioUsuario = (formData.get('usuario_usuario') as string)?.trim() || null
  const rol = (formData.get('rol') as string) || 'admin'

  if (!datos.nombre) return { error: 'El nombre del restaurante es obligatorio.' }
  if (!email) return { error: 'El correo electrónico es obligatorio.' }
  if (!usuarioNombre) return { error: 'El nombre del usuario es obligatorio.' }
  const errorPassword = validarPassword(password)
  if (errorPassword) return { error: errorPassword }

  const admin = createAdminClient()

  const { data: restaurante, error: errRest } = await admin.from('restaurantes').insert(datos).select('id').single()
  if (errRest) return { error: errRest.message }

  const { data: userData, error: errUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre: usuarioNombre },
  })
  if (errUser) {
    await admin.from('restaurantes').delete().eq('id', restaurante.id)
    return { error: errUser.message }
  }

  const { data: membresia, error: errMemb } = await admin
    .from('usuarios_restaurante')
    .insert({
      user_id: userData.user.id,
      restaurante_id: restaurante.id,
      rol,
      nombre: usuarioNombre,
      apellidos: usuarioApellidos,
      email,
      usuario: usuarioUsuario,
      cargo: usuarioCargo,
      telefono: usuarioTelefono,
      estado: 'activo',
      debe_cambiar_password: true,
    })
    .select('id')
    .single()

  if (errMemb) {
    await admin.auth.admin.deleteUser(userData.user.id)
    await admin.from('restaurantes').delete().eq('id', restaurante.id)
    return { error: errMemb.message }
  }

  if (rol === 'cliente') {
    await sembrarPermisosCompletos(admin, membresia.id)
  }

  revalidatePath('/admin')
  return { success: true, restauranteId: restaurante.id }
}

export async function actualizarCliente(_prev: EstadoCliente, formData: FormData): Promise<EstadoCliente> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const id = formData.get('id') as string
  const datos = datosRestaurante(formData)
  if (!datos.nombre) return { error: 'El nombre del restaurante es obligatorio.' }

  const admin = createAdminClient()
  const { error } = await admin.from('restaurantes').update(datos).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/admin/clientes/${id}`)
  return { success: true }
}

export async function cambiarEstadoCliente(id: string, estado: string): Promise<{ error?: string }> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('restaurantes').update({ estado }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  revalidatePath(`/admin/clientes/${id}`)
  return {}
}

export type EstadoUsuario = { error?: string; success?: boolean } | null

export async function crearUsuarioCliente(_prev: EstadoUsuario, formData: FormData): Promise<EstadoUsuario> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const restauranteId = formData.get('restaurante_id') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const apellidos = (formData.get('apellidos') as string)?.trim() || null
  const cargo = (formData.get('cargo') as string)?.trim() || null
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const usuario = (formData.get('usuario') as string)?.trim() || null
  const rol = (formData.get('rol') as string) || 'cliente'

  if (!nombre) return { error: 'El nombre es obligatorio.' }
  if (!email) return { error: 'El correo electrónico es obligatorio.' }
  const errorPassword = validarPassword(password)
  if (errorPassword) return { error: errorPassword }

  const admin = createAdminClient()

  const { data: userData, error: errUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre },
  })
  if (errUser) return { error: errUser.message }

  const { data: membresia, error: errMemb } = await admin
    .from('usuarios_restaurante')
    .insert({
      user_id: userData.user.id,
      restaurante_id: restauranteId,
      rol,
      nombre,
      apellidos,
      email,
      usuario,
      cargo,
      telefono,
      estado: 'activo',
      debe_cambiar_password: true,
    })
    .select('id')
    .single()

  if (errMemb) {
    await admin.auth.admin.deleteUser(userData.user.id)
    return { error: errMemb.message }
  }

  if (rol === 'cliente') {
    await sembrarPermisosCompletos(admin, membresia.id)
  }

  revalidatePath(`/admin/clientes/${restauranteId}`)
  return { success: true }
}

export async function cambiarEstadoUsuario(id: string, restauranteId: string, estado: string): Promise<{ error?: string }> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('usuarios_restaurante').update({ estado }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(`/admin/clientes/${restauranteId}`)
  return {}
}
