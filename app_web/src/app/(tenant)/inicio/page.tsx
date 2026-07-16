import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const TILES = [
  { href: '/dashboard', titulo: 'Dashboard', desc: 'food cost medio, alertas y platos a revisar' },
  { href: '/recetas', titulo: 'Recetas y escandallos', desc: 'crea fichas técnicas y calcula el coste por plato' },
  { href: '/ingredientes', titulo: 'Ingredientes', desc: 'tabla editable de costes por unidad' },
  { href: '/proveedores', titulo: 'Proveedores', desc: 'compara precios y fechas de actualización' },
  { href: '/informes', titulo: 'Informes', desc: 'food cost y márgenes de toda la carta' },
  { href: '/ajustes', titulo: 'Ajustes', desc: 'zona fiscal (IGIC/IVA) y food cost objetivo' },
]

export default async function InicioTenantPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: membresia } = await supabase
    .from('usuarios_restaurante')
    .select('nombre')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  return (
    <div>
      <h1 className="text-lg font-bold text-[#2b2a25]">hola, {membresia?.nombre || user?.email}</h1>
      <p className="mt-1 text-sm text-[#6e6a5c]">elige un apartado para continuar</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl border border-[#e2dac8] bg-[#f1ede0] p-4 hover:border-[#1e3a5f]"
          >
            <p className="text-sm font-semibold text-[#2b2a25]">{t.titulo}</p>
            <p className="mt-1 text-xs text-[#6e6a5c]">{t.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/informes"
          className="flex-1 rounded-lg bg-[#f6e9d2] py-2.5 text-center text-sm font-semibold text-[#9a5f0b]"
        >
          Ver informe carta
        </Link>
        <Link
          href="/recetas"
          className="flex-1 rounded-lg bg-[#1e3a5f] py-2.5 text-center text-sm font-semibold text-[#faf7ef]"
        >
          Calcular un plato
        </Link>
        <Link
          href="/proveedores"
          className="flex-1 rounded-lg bg-[#dbe9ee] py-2.5 text-center text-sm font-semibold text-[#1f6f8b]"
        >
          Actualizar precios
        </Link>
      </div>
    </div>
  )
}
