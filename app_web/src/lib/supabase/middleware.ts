import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// '/' es pública porque muestra la portada de marketing a los visitantes sin
// sesión; page.tsx decide internamente si redirige (usuario con sesión) o
// muestra la portada (sin sesión).
const RUTAS_PUBLICAS = ['/', '/login', '/login/recuperar', '/reset-password', '/curriculum']

function esRutaPublica(pathname: string) {
  return RUTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

// Se llama desde proxy.ts en cada request. Solo hace el chequeo barato
// (¿hay sesión válida?) — la decisión de a qué home ir (super admin vs
// tenant) se resuelve una sola vez, en un Server Component, no aquí.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() valida el token contra el servidor de Auth de Supabase
  // (no basta con leer la cookie sin revalidar, ver docs de @supabase/ssr).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const esPublica = esRutaPublica(pathname)

  if (!user && !esPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
