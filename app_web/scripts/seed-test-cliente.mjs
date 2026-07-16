// Uso: node scripts/seed-test-cliente.mjs
//
// Crea un restaurante y un usuario "cliente" DE PRUEBA para poder probar el
// flujo completo (login -> home del tenant, aislado por RLS) antes de
// construir el CRUD real de "Clientes y Usuarios" del Super Admin.
//
// Requiere que base_datos/01, 02 y 03_*.sql ya estén aplicadas.
// La service_role key nunca se escribe aquí ni se pega en el chat: se lee de
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en app_web/.env.local (ignorado
// por git), o se pide por stdin si no están definidas.

import { createClient } from '@supabase/supabase-js'
import { createInterface } from 'node:readline/promises'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RESTAURANTE_DEMO = {
  nombre: 'La Tasca del Puerto',
  lugar: 'Guía de Isora, Tenerife',
  zona: 'canarias',
  impuesto: 7,
  fc_objetivo: 30,
  cif_nif: 'B00000000',
  direccion: 'Calle del Puerto, 12',
  codigo_postal: '38680',
  poblacion: 'Guía de Isora',
  provincia: 'Santa Cruz de Tenerife',
  isla: 'Tenerife',
  pais: 'España',
  tipo_negocio: 'restaurante',
  estado: 'activa',
}

const CLIENTE_DEMO = {
  email: 'cliente@latascadelpuerto.com',
  password: 'Cliente123#Demo',
  nombre: 'Marta',
  apellidos: 'Cliente Demo',
  cargo: 'Encargada',
  telefono: '600000000',
}

function cargarEnvLocal() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
  if (!existsSync(envPath)) return
  for (const linea of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linea)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

async function pedir(pregunta) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const respuesta = await rl.question(pregunta)
  rl.close()
  return respuesta.trim()
}

async function main() {
  cargarEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || (await pedir('Supabase URL: '))
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || (await pedir('Service role key (no se mostrará en logs): '))

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1) Restaurante de prueba (reutiliza el existente si ya se sembró antes)
  let restauranteId
  const { data: existente } = await supabase
    .from('restaurantes')
    .select('id')
    .eq('nombre', RESTAURANTE_DEMO.nombre)
    .maybeSingle()

  if (existente) {
    restauranteId = existente.id
    console.log(`Restaurante "${RESTAURANTE_DEMO.nombre}" ya existía (${restauranteId}), lo reutilizo.`)
  } else {
    const { data: nuevo, error: restError } = await supabase
      .from('restaurantes')
      .insert(RESTAURANTE_DEMO)
      .select('id')
      .single()
    if (restError) throw new Error(`No se pudo crear el restaurante: ${restError.message}`)
    restauranteId = nuevo.id
    console.log(`Restaurante "${RESTAURANTE_DEMO.nombre}" creado (${restauranteId}).`)
  }

  // 2) Usuario cliente vía Admin API (nunca por SQL directo en auth.users)
  console.log(`Creando usuario ${CLIENTE_DEMO.email}...`)
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: CLIENTE_DEMO.email,
    password: CLIENTE_DEMO.password,
    email_confirm: true,
    user_metadata: { nombre: CLIENTE_DEMO.nombre, rol_global: 'cliente' },
  })
  if (userError) throw new Error(`No se pudo crear el usuario: ${userError.message}`)

  // 3) Membresía en el restaurante (rol 'cliente' de 02_roles_permisos.sql)
  const { data: membresia, error: membresiaError } = await supabase
    .from('usuarios_restaurante')
    .insert({
      user_id: userData.user.id,
      restaurante_id: restauranteId,
      rol: 'cliente',
      nombre: CLIENTE_DEMO.nombre,
      apellidos: CLIENTE_DEMO.apellidos,
      email: CLIENTE_DEMO.email,
      cargo: CLIENTE_DEMO.cargo,
      telefono: CLIENTE_DEMO.telefono,
      estado: 'activo',
    })
    .select('id')
    .single()
  if (membresiaError) throw new Error(`Usuario creado (${userData.user.id}) pero falló la membresía: ${membresiaError.message}`)

  // 4) Permisos por apartado (demo: acceso completo de ver+guardar en todo,
  //    para probar el flujo end-to-end; ajustar aquí para simular un cliente
  //    con permisos más restringidos, como en el ejemplo comentado de
  //    02_roles_permisos.sql)
  const { data: secciones, error: seccionesError } = await supabase.from('secciones_app').select('id')
  if (seccionesError) throw new Error(`No se pudieron leer las secciones: ${seccionesError.message}`)

  const permisos = secciones.map((s) => ({
    usuario_restaurante_id: membresia.id,
    seccion_id: s.id,
    puede_ver: true,
    puede_guardar: true,
  }))
  const { error: permisosError } = await supabase.from('usuario_seccion_permiso').insert(permisos)
  if (permisosError) throw new Error(`Membresía creada pero fallaron los permisos: ${permisosError.message}`)

  console.log('Cliente de prueba sembrado correctamente.')
  console.log(`  Email: ${CLIENTE_DEMO.email}`)
  console.log(`  Contraseña: ${CLIENTE_DEMO.password}`)
  console.log(`  Restaurante: ${RESTAURANTE_DEMO.nombre} (${restauranteId})`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
