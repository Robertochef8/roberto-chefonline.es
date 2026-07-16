import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlatoImagen } from '@/components/plato-imagen'
import { EscandalloEditor } from '@/components/escandallo-editor'
import { CosteDirectoCard } from '@/components/coste-directo-card'
import { FoodCostMargenCard } from '@/components/food-cost-margen-card'
import { FichaTecnicaForm } from '@/components/ficha-tecnica-form'
import { PlatoAcciones } from '@/components/plato-acciones'
import { ESTADO_TXT, ESTADO_PILL, ALERGENOS_UI, agregarAlergenosPlato } from '@/lib/chef/alergenos'

export default async function PlatoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: plato } = await supabase
    .from('platos')
    .select('*, categoria:categorias_carta(nombre)')
    .eq('id', id)
    .maybeSingle()

  if (!plato) notFound()

  const { data: calcRaw } = await supabase.rpc('calcular_plato', { p_plato_id: id }).single()
  const calc = calcRaw as unknown as {
    coste_ingredientes: number
    extras: number
    packaging: number
    coste_directo: number
    coste_racion: number
    pvp: number
    pvp_base: number
    food_cost_pct: number
    margen: number
    margen_pct: number
    pvp_recomendado: number
    diagnostico: string
  }

  const { data: lineasRaw } = await supabase
    .from('plato_ingrediente')
    .select('id, cantidad, ingrediente:ingredientes(id, nombre, unidad, precio_actual, merma_pct)')
    .eq('plato_id', id)
    .order('orden')

  const lineas = (lineasRaw ?? []) as unknown as {
    id: string
    cantidad: number
    ingrediente: { id: string; nombre: string; unidad: string; precio_actual: number; merma_pct: number }
  }[]

  const { data: ingredientesDisponibles } = await supabase.from('ingredientes').select('id, nombre').order('nombre')

  const ingredienteIds = lineas.map((l) => l.ingrediente.id)
  const { data: alergenoFilas } = ingredienteIds.length
    ? await supabase
        .from('ingrediente_alergeno')
        .select('estado, alergeno:alergenos(codigo, nombre)')
        .in('ingrediente_id', ingredienteIds)
    : { data: [] }

  const alergenosAgregados = agregarAlergenosPlato(
    (alergenoFilas ?? []) as unknown as { estado: string; alergeno: { codigo: string; nombre: string } }[]
  )

  const { data: membresia } = await supabase
    .from('usuarios_restaurante')
    .select('restaurante:restaurantes(fc_objetivo, zona)')
    .eq('restaurante_id', plato.restaurante_id)
    .limit(1)
    .maybeSingle()
  const restaurante = membresia?.restaurante as unknown as { fc_objetivo: number; zona: string } | null

  let imagenUrl: string | null = null
  if (plato.imagen_url) {
    const { data: signed } = await supabase.storage.from('platos').createSignedUrl(plato.imagen_url, 3600)
    imagenUrl = signed?.signedUrl ?? null
  }

  return (
    <div>
      <Link href="/recetas" className="text-sm font-semibold text-[#1e3a5f] print:hidden">
        ← Recetas
      </Link>

      <p className="mt-2 text-xs text-[#6e6a5c]">
        {(plato.categoria as unknown as { nombre: string } | null)?.nombre || 'Sin categoría'} · {plato.raciones}{' '}
        ración(es) · zona {restaurante?.zona === 'canarias' ? 'Canarias' : 'Península'}
      </p>
      <h1 className="mt-1 text-lg font-bold text-[#2b2a25]">{plato.nombre}</h1>

      <div className="mt-4">
        <PlatoImagen platoId={plato.id} nombre={plato.nombre} imagenUrl={imagenUrl} />
      </div>

      <div className="mt-4">
        <FoodCostMargenCard platoId={plato.id} calc={calc} fcObjetivo={restaurante?.fc_objetivo ?? 30} />
      </div>

      <h2 className="mt-6 text-sm font-semibold text-[#2b2a25]">Escandallo</h2>
      <div className="mt-2">
        <EscandalloEditor platoId={plato.id} lineas={lineas} ingredientesDisponibles={ingredientesDisponibles ?? []} />
      </div>

      <div className="mt-4">
        <CosteDirectoCard plato={plato} calc={calc} />
      </div>

      <h2 className="mt-6 text-sm font-semibold text-[#2b2a25]">Alérgenos (14 obligatorios UE)</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#e2dac8] bg-[#faf7ef] p-3">
        {ALERGENOS_UI.map(([codigo, nombre]) => {
          const declarado = alergenosAgregados.get(codigo)
          const estado = declarado?.estado
          return (
            <div key={codigo} className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#2b2a25]">{nombre}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${estado ? ESTADO_PILL[estado] : 'bg-[#f1ede0] text-[#6e6a5c]'}`}
              >
                {estado ? ESTADO_TXT[estado] : 'No contiene'}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-xs italic text-[#8a8474]">
        Validar siempre con información real de proveedor y etiquetado de producto antes de publicar la carta.
      </p>

      <div className="mt-6">
        <FichaTecnicaForm plato={plato} />
      </div>

      <PlatoAcciones platoId={plato.id} nombre={plato.nombre} />
    </div>
  )
}
