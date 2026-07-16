import { createClient } from '@/lib/supabase/server'
import { ProveedorFormModal } from '@/components/proveedor-form-modal'
import { EliminarProveedorBoton } from '@/components/eliminar-proveedor-boton'
import { UsarPrecioBoton } from '@/components/usar-precio-boton'
import { ImportWizard } from '@/components/import-wizard'
import { fmtE, relativo } from '@/lib/chef/format'

export default async function ProveedoresPage() {
  const supabase = await createClient()

  const { data: proveedores } = await supabase
    .from('proveedores')
    .select('id, nombre, cif_nif, persona_contacto, web, email, direccion, codigo_postal, poblacion, provincia, isla, pais')
    .order('nombre')

  const { data: ingredientes } = await supabase
    .from('ingredientes')
    .select(
      'id, codigo, nombre, unidad, proveedor_preferente, ingrediente_proveedor(precio, referencia_proveedor, fecha_actualizacion, proveedor:proveedores(id, nombre))'
    )
    .order('nombre')

  const ingredientesConPrecios = (ingredientes ?? []).filter((i) => (i.ingrediente_proveedor as unknown[])?.length)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-[#2b2a25]">Proveedores</h1>
        <div className="flex gap-2">
          <ImportWizard
            proveedores={(proveedores ?? []).map((p) => ({ id: p.id, nombre: p.nombre }))}
            ingredientes={(ingredientes ?? []).map((i) => ({ id: i.id, codigo: i.codigo, nombre: i.nombre }))}
          />
          <ProveedorFormModal
            triggerLabel="+ Nuevo proveedor"
            triggerClassName="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-[#faf7ef]"
          />
        </div>
      </div>

      <p className="mt-1 text-sm text-[#6e6a5c]">directorio de proveedores</p>

      <div className="mt-3 divide-y divide-[#e2dac8] rounded-lg border border-[#e2dac8] bg-[#faf7ef]">
        {(proveedores ?? []).map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#2b2a25]">{p.nombre}</p>
              <p className="text-xs text-[#6e6a5c]">
                {p.cif_nif || 'sin CIF/NIF'}
                {p.poblacion ? ` · ${p.poblacion}` : ''}
                {p.isla ? ` (${p.isla})` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ProveedorFormModal
                proveedor={p}
                triggerLabel="Editar"
                triggerClassName="rounded-lg border border-[#e2dac8] px-3 py-1.5 text-xs font-semibold text-[#2b2a25]"
              />
              <EliminarProveedorBoton id={p.id} nombre={p.nombre} />
            </div>
          </div>
        ))}
        {(proveedores ?? []).length === 0 && (
          <p className="px-4 py-3 text-sm text-[#6e6a5c]">Todavía no hay proveedores. Crea el primero con el botón de arriba.</p>
        )}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-[#2b2a25]">Comparador de precios por ingrediente</h2>
      <p className="mt-1 text-xs text-[#6e6a5c]">
        Estos precios se rellenan al importar un listado de un proveedor (botón "⇪ Importar precios" de arriba).
      </p>

      <div className="mt-3 space-y-3">
        {ingredientesConPrecios.map((ing) => {
          const ofertas = [
            ...(ing.ingrediente_proveedor as unknown as {
              precio: number
              referencia_proveedor: string | null
              fecha_actualizacion: string
              proveedor: { id: string; nombre: string }
            }[]),
          ].sort((a, b) => a.precio - b.precio)
          return (
            <div key={ing.id} className="rounded-lg border border-[#e2dac8] bg-[#faf7ef] p-3">
              <p className="text-sm font-semibold text-[#2b2a25]">
                {ing.nombre} <span className="text-xs font-normal text-[#6e6a5c]">({ing.unidad})</span>
              </p>
              <div className="mt-2 space-y-1.5">
                {ofertas.map((o, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-medium text-[#2b2a25]">{o.proveedor.nombre}</span>
                      {ing.proveedor_preferente === o.proveedor.id && (
                        <span className="ml-2 rounded-full bg-[#dbe9ee] px-2 py-0.5 text-[10px] font-semibold text-[#1f6f8b]">
                          preferente
                        </span>
                      )}
                      <span className="ml-2 text-xs text-[#6e6a5c]">{relativo(o.fecha_actualizacion)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#2b2a25]">{fmtE(o.precio)}</span>
                      <UsarPrecioBoton ingredienteId={ing.id} proveedorId={o.proveedor.id} precio={o.precio} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
