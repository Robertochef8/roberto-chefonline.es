import { createClient } from '@/lib/supabase/server'
import { IngredientesTabla } from '@/components/ingredientes-tabla'
import { NuevoIngredienteModal } from '@/components/nuevo-ingrediente-modal'

export default async function IngredientesPage() {
  const supabase = await createClient()

  const { data: ingredientes } = await supabase
    .from('ingredientes')
    .select(
      'id, codigo, nombre, unidad, precio_actual, merma_pct, ultima_actualizacion, origen_actualizacion, ingrediente_alergeno(estado, alergeno:alergenos(nombre))'
    )
    .order('nombre')

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#2b2a25]">Ingredientes</h1>
          <p className="mt-1 text-sm text-[#6e6a5c]">
            tabla editable · precio ÷ (1−merma) = coste útil · los cambios recalculan toda la carta
          </p>
        </div>
        <NuevoIngredienteModal />
      </div>

      <div className="mt-5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <IngredientesTabla ingredientes={(ingredientes ?? []) as any} />
      </div>

      <p className="mt-4 text-xs text-[#6e6a5c]">
        Los precios en Canarias pueden incluir sobrecostes logísticos insulares. Introduce siempre el precio real
        de compra a proveedor.
      </p>
    </div>
  )
}
