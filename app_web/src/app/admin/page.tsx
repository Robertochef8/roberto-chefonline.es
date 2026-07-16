import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ESTADO_CLIENTE_PILL } from '@/lib/chef/estado-cliente'

const POR_PAGINA = 10

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; pagina?: string }>
}) {
  const { q = '', estado = '', pagina = '1' } = await searchParams
  const paginaActual = Math.max(1, Number(pagina) || 1)
  const supabase = await createClient()

  let query = supabase.from('restaurantes').select('id, nombre, lugar, tipo_negocio, estado, creado_en', { count: 'exact' })
  if (q) query = query.ilike('nombre', `%${q}%`)
  if (estado) query = query.eq('estado', estado)

  const desde = (paginaActual - 1) * POR_PAGINA
  const { data: restaurantes, count } = await query.order('nombre').range(desde, desde + POR_PAGINA - 1)

  const total = count ?? 0
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  function hrefPagina(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (estado) params.set('estado', estado)
    params.set('pagina', String(p))
    return `/admin?${params.toString()}`
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#2b2a25]">Panel Super Admin</h1>
        <Link href="/admin/clientes/nuevo" className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-[#faf7ef]">
          + Nuevo cliente
        </Link>
      </div>
      <p className="mt-1 text-sm text-[#6e6a5c]">Clientes y Usuarios — gestión de todos los restaurantes (tenants) de Chef Online.</p>

      <form className="mt-4 flex flex-wrap gap-2" action="/admin">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre…"
          className="flex-1 rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm"
        />
        <select name="estado" defaultValue={estado} className="rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="suspendida">Suspendida</option>
          <option value="desactivada">Desactivada</option>
        </select>
        <button type="submit" className="rounded-lg border border-[#e2dac8] px-4 py-2 text-sm font-semibold text-[#2b2a25]">
          Filtrar
        </button>
      </form>

      <ul className="mt-4 divide-y divide-[#e2dac8] rounded-lg border border-[#e2dac8] bg-[#faf7ef]">
        {(restaurantes ?? []).map((r) => (
          <li key={r.id}>
            <Link href={`/admin/clientes/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f1ede0]">
              <div>
                <p className="text-sm font-semibold text-[#2b2a25]">{r.nombre}</p>
                <p className="text-xs text-[#6e6a5c]">
                  {r.lugar} · {r.tipo_negocio}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_CLIENTE_PILL[r.estado]}`}>{r.estado}</span>
            </Link>
          </li>
        ))}
        {(restaurantes ?? []).length === 0 && <li className="px-4 py-3 text-sm text-[#6e6a5c]">No hay clientes que coincidan con la búsqueda.</li>}
      </ul>

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href={hrefPagina(paginaActual - 1)}
            aria-disabled={paginaActual <= 1}
            className={`rounded-lg border border-[#e2dac8] px-3 py-1.5 ${paginaActual <= 1 ? 'pointer-events-none opacity-40' : ''}`}
          >
            ← Anterior
          </Link>
          <span className="text-[#6e6a5c]">
            Página {paginaActual} de {totalPaginas} ({total} clientes)
          </span>
          <Link
            href={hrefPagina(paginaActual + 1)}
            aria-disabled={paginaActual >= totalPaginas}
            className={`rounded-lg border border-[#e2dac8] px-3 py-1.5 ${paginaActual >= totalPaginas ? 'pointer-events-none opacity-40' : ''}`}
          >
            Siguiente →
          </Link>
        </div>
      )}
    </main>
  )
}
