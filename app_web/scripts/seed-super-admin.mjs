// Uso: node scripts/seed-super-admin.mjs
//
// Crea el Super Admin (roberto@chefonline.es) vía la Admin API de Supabase
// e inserta su UUID en la tabla super_admins (ver
// base_datos/03_super_admin_multitenant.sql, que debe estar ya aplicada).
//
// La service_role key NUNCA se escribe aquí ni se pega en el chat: se lee de
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en app_web/.env.local (ignorado
// por git), o se pide por stdin si no están definidas.

import { createClient } from '@supabase/supabase-js'
import { createInterface } from 'node:readline/promises'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SUPER_ADMIN_EMAIL = 'roberto@chefonline.es'
const SUPER_ADMIN_PASSWORD = 'Roberto888#M12'

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

  console.log(`Creando usuario ${SUPER_ADMIN_EMAIL}...`)
  const { data, error } = await supabase.auth.admin.createUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre: 'Roberto', rol_global: 'super_admin' },
  })

  if (error) {
    throw new Error(`No se pudo crear el usuario: ${error.message}`)
  }

  const { error: insErr } = await supabase.from('super_admins').insert({ user_id: data.user.id })
  if (insErr) {
    throw new Error(`Usuario creado (${data.user.id}) pero falló el insert en super_admins: ${insErr.message}`)
  }

  console.log(`Super admin creado y sembrado correctamente. user_id=${data.user.id}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
