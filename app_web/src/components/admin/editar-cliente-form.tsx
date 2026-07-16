'use client'

import { useActionState, useState } from 'react'
import { actualizarCliente } from '@/lib/actions/admin-clientes'

type Restaurante = {
  id: string
  nombre: string
  lugar: string | null
  cif_nif: string | null
  direccion: string | null
  codigo_postal: string | null
  poblacion: string | null
  provincia: string | null
  isla: string | null
  pais: string | null
  zona: string
  impuesto: number
  tipo_negocio: string
  fc_objetivo: number
  estado: string
}

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]'

const TIPOS_NEGOCIO = [
  ['restaurante', 'Restaurante'],
  ['bar', 'Bar'],
  ['cafeteria', 'Cafetería'],
  ['hotel', 'Hotel'],
  ['catering', 'Catering'],
  ['food_truck', 'Food Truck'],
  ['pasteleria', 'Pastelería'],
  ['otro', 'Otro'],
]

export function EditarClienteForm({ restaurante }: { restaurante: Restaurante }) {
  const [state, formAction, pending] = useActionState(actualizarCliente, null)
  const [zona, setZona] = useState(restaurante.zona)
  const [impuesto, setImpuesto] = useState(restaurante.impuesto)

  function onZonaChange(v: string) {
    setZona(v)
    setImpuesto(v === 'canarias' ? 7 : 10)
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={restaurante.id} />

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">Datos del restaurante</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Nombre *</label>
            <input name="nombre" required defaultValue={restaurante.nombre} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Localidad</label>
            <input name="lugar" defaultValue={restaurante.lugar ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>CIF/NIF</label>
            <input name="cif_nif" defaultValue={restaurante.cif_nif ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Dirección</label>
            <input name="direccion" defaultValue={restaurante.direccion ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Código postal</label>
            <input name="codigo_postal" defaultValue={restaurante.codigo_postal ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Población</label>
            <input name="poblacion" defaultValue={restaurante.poblacion ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Provincia</label>
            <input name="provincia" defaultValue={restaurante.provincia ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Isla</label>
            <input name="isla" defaultValue={restaurante.isla ?? ''} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>País</label>
            <input name="pais" defaultValue={restaurante.pais ?? 'España'} className={campoInput} />
          </div>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">Zona fiscal</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Zona</label>
            <select name="zona" value={zona} onChange={(e) => onZonaChange(e.target.value)} className={campoInput}>
              <option value="peninsula">Península y Baleares — IVA</option>
              <option value="canarias">Canarias — IGIC</option>
            </select>
          </div>
          <div>
            <label className={campoLabel}>Tipo impositivo (%)</label>
            <input
              name="impuesto"
              type="number"
              min={0}
              max={25}
              step={0.5}
              value={impuesto}
              onChange={(e) => setImpuesto(Number(e.target.value))}
              className={campoInput}
            />
          </div>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">Negocio y objetivo económico</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={campoLabel}>Tipo de negocio</label>
            <select name="tipo_negocio" defaultValue={restaurante.tipo_negocio} className={campoInput}>
              {TIPOS_NEGOCIO.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={campoLabel}>Food cost objetivo (%)</label>
            <input name="fc_objetivo" type="number" min={10} max={60} defaultValue={restaurante.fc_objetivo} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Estado de la cuenta</label>
            <select name="estado" defaultValue={restaurante.estado} className={campoInput}>
              <option value="activa">Activa</option>
              <option value="suspendida">Suspendida</option>
              <option value="desactivada">Desactivada</option>
            </select>
          </div>
        </div>
      </section>

      {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}
      {state?.success && <div className="rounded-lg bg-[#dbe9ee] px-3 py-2 text-sm text-[#1f6f8b]">Cambios guardados.</div>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}
