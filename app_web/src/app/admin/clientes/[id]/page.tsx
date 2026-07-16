import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditarClienteForm } from '@/components/admin/editar-cliente-form'
import { NuevoUsuarioModal } from '@/components/admin/nuevo-usuario-modal'
import { CambiarEstadoClienteBotones, CambiarEstadoUsuarioBoton } from '@/components/admin/cambiar-estado-botones'
import { ESTADO_CLIENTE_PILL } from '@/lib/chef/estado-cliente'
import { relativo } from '@/lib/chef/format'

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: restaurante } = await supabase.from('restaurantes').select('*').eq('id', id).maybeSingle()
  if (!restaurante) notFound()

  const { data: usuarios } = await supabase
    .from('usuarios_restaurante')
    .select('id, nombre, apellidos, email, cargo, telefono, estado, rol, ultimo_acceso, creado_en')
    .eq('restaurante_id', id)
    .order('creado_en')

  const [{ count: nPlatos }, { count: nIngredientes }, { count: nProveedores }] = await Promise.all([
    supabase.from('platos').select('id', { count: 'exact', head: true }).eq('restaurante_id', id),
    supabase.from('ingredientes').select('id', { count: 'exact', head: true }).eq('restaurante_id', id),
    supabase.from('proveedores').select('id', { count: 'exact', head: true }).eq('restaurante_id', id),
  ])

  const ultimoAcceso = (usuarios ?? [])
    .map((u) => u.ultimo_acceso)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/admin" className="text-sm font-semibold text-[#1e3a5f]">
        ← Clientes
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#2b2a25]">{restaurante.nombre}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_CLIENTE_PILL[restaurante.estado]}`}>{restaurante.estado}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-[#f1ede0] p-3 text-center">
          <p className="text-[10px] text-[#6e6a5c]">recetas</p>
          <p className="text-lg font-bold text-[#2b2a25]">{nPlatos ?? 0}</p>
        </div>
        <div className="rounded-lg bg-[#f1ede0] p-3 text-center">
          <p className="text-[10px] text-[#6e6a5c]">ingredientes</p>
          <p className="text-lg font-bold text-[#2b2a25]">{nIngredientes ?? 0}</p>
        </div>
        <div className="rounded-lg bg-[#f1ede0] p-3 text-center">
          <p className="text-[10px] text-[#6e6a5c]">proveedores</p>
          <p className="text-lg font-bold text-[#2b2a25]">{nProveedores ?? 0}</p>
        </div>
        <div className="rounded-lg bg-[#f1ede0] p-3 text-center">
          <p className="text-[10px] text-[#6e6a5c]">food cost obj.</p>
          <p className="text-lg font-bold text-[#2b2a25]">{restaurante.fc_objetivo}%</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-[#6e6a5c]">
        Alta: {relativo(restaurante.creado_en)} · Último acceso: {ultimoAcceso ? relativo(ultimoAcceso) : 'nunca'}
      </p>

      <div className="mt-4">
        <CambiarEstadoClienteBotones id={restaurante.id} estadoActual={restaurante.estado} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-[#2b2a25]">Editar cliente</h2>
      <div className="mt-3">
        <EditarClienteForm restaurante={restaurante} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#2b2a25]">Usuarios</h2>
        <NuevoUsuarioModal restauranteId={restaurante.id} />
      </div>
      <div className="mt-3 divide-y divide-[#e2dac8] rounded-lg border border-[#e2dac8] bg-[#faf7ef]">
        {(usuarios ?? []).map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#2b2a25]">
                {u.nombre} {u.apellidos}
              </p>
              <p className="text-xs text-[#6e6a5c]">
                {u.email} · {u.cargo || 'sin cargo'} · rol {u.rol}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ESTADO_CLIENTE_PILL[u.estado]}`}>{u.estado}</span>
              <CambiarEstadoUsuarioBoton id={u.id} restauranteId={restaurante.id} estadoActual={u.estado} />
            </div>
          </div>
        ))}
        {(usuarios ?? []).length === 0 && <p className="px-4 py-3 text-sm text-[#6e6a5c]">Este cliente todavía no tiene usuarios.</p>}
      </div>
    </main>
  )
}
