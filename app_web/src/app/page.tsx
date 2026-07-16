import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const FEATURES = [
  'Crea tu ficha técnica y calcula el coste exacto por ingrediente.',
  'Recibe alertas cuando un proveedor sube precios y afecta tu margen.',
  'Exporta la ficha técnica en PDF lista para cocina o auditoría.',
]

// '/' es la única página que decide el destino según sesión/rol (evita
// repetir la consulta is_super_admin() en cada request dentro del proxy).
// Con sesión: redirige a /admin o /inicio. Sin sesión: portada pública.
export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: esSuperAdmin } = await supabase.rpc('is_super_admin')
    redirect(esSuperAdmin ? '/admin' : '/inicio')
  }

  return (
    <main className="flex min-h-screen items-start justify-center p-6 sm:p-10">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#faf7ef] shadow-sm">
        <div className="relative h-64 w-full">
          <Image src="/hero-chef.jpg" alt="Chef Online" fill priority className="object-cover object-[center_10%]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#faf7ef] to-transparent" />
        </div>

        <div className="px-7 pb-8 text-center">
          <div className="mx-auto -mt-2 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dbe4ee]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="1.8">
              <path d="M6 10c0-2.8 2.2-5 5-5 .6 0 1.1.1 1.6.3C13.2 4.5 14.5 4 16 4c2.8 0 5 2.2 5 5 0 1-.3 1.9-.8 2.6.5.6.8 1.5.8 2.4 0 2.2-1.8 4-4 4H6c-2.2 0-4-1.8-4-4 0-1.5.8-2.8 2-3.4Z" />
              <path d="M7 18v2M12 18v2M17 18v2" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-[#2b2a25]">Chef Online</h1>
          <p className="mt-1 text-sm font-semibold text-[#1e3a5f]">Agentes de IA para restaurantes</p>
          <p className="mt-4 text-sm leading-relaxed text-[#6e6a5c]">
            Calcula el food cost real de cada plato, controla los precios de tus proveedores y descubre en
            segundos qué recetas están perdiendo rentabilidad. Todo desde el móvil.
          </p>

          <div className="mt-6 space-y-2.5 text-left">
            {FEATURES.map((texto, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-[#2b2a25]">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#dbe4ee] text-xs font-bold text-[#1e3a5f]">
                  {i + 1}
                </span>
                {texto}
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="mt-7 block w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-bold text-[#faf7ef]"
          >
            Entrar
          </Link>
        </div>
      </div>
    </main>
  )
}
