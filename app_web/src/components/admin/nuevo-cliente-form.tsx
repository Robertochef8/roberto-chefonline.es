'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearCliente } from '@/lib/actions/admin-clientes'

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

export function NuevoClienteForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(crearCliente, null)
  const [zona, setZona] = useState('peninsula')
  const [impuesto, setImpuesto] = useState(10)

  useEffect(() => {
    if (state?.success && state.restauranteId) {
      router.push(`/admin/clientes/${state.restauranteId}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  function onZonaChange(v: string) {
    setZona(v)
    setImpuesto(v === 'canarias' ? 7 : 10)
  }

  return (
    <form action={formAction} className="space-y-6">
      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">Datos de acceso</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={campoLabel}>Correo electrónico *</label>
            <input name="email" type="email" required className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Usuario</label>
            <input name="usuario_usuario" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Contraseña inicial *</label>
            <input name="password" type="text" required minLength={8} className={campoInput} />
          </div>
        </div>
        <p className="mt-1 text-xs text-[#6e6a5c]">Mínimo 8 caracteres, con al menos una letra y un número.</p>
      </section>

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">Primer usuario</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Nombre *</label>
            <input name="usuario_nombre" required className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Apellidos</label>
            <input name="usuario_apellidos" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Cargo</label>
            <input name="usuario_cargo" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Teléfono</label>
            <input name="usuario_telefono" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Rol</label>
            <select name="rol" defaultValue="admin" className={campoInput}>
              <option value="admin">Administrador (acceso total a su restaurante)</option>
              <option value="cliente">Cliente (permisos por apartado)</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-[#2b2a25]">Datos del restaurante</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={campoLabel}>Nombre del restaurante *</label>
            <input name="nombre" required className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Localidad</label>
            <input name="lugar" placeholder="ej. Guía de Isora, Tenerife" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>CIF/NIF</label>
            <input name="cif_nif" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Dirección</label>
            <input name="direccion" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Código postal</label>
            <input name="codigo_postal" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Población</label>
            <input name="poblacion" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Provincia</label>
            <input name="provincia" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Isla</label>
            <input name="isla" placeholder="vacío si es Península" className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>País</label>
            <input name="pais" defaultValue="España" className={campoInput} />
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
            <select name="tipo_negocio" defaultValue="restaurante" className={campoInput}>
              {TIPOS_NEGOCIO.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={campoLabel}>Food cost objetivo (%)</label>
            <input name="fc_objetivo" type="number" min={10} max={60} defaultValue={30} className={campoInput} />
          </div>
          <div>
            <label className={campoLabel}>Estado de la cuenta</label>
            <select name="estado" defaultValue="activa" className={campoInput}>
              <option value="activa">Activa</option>
              <option value="suspendida">Suspendida</option>
              <option value="desactivada">Desactivada</option>
            </select>
          </div>
        </div>
      </section>

      {state?.error && <div className="rounded-lg bg-[#f3ded9] px-3 py-2 text-sm text-[#b23c30]">✕ {state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#1e3a5f] py-3 text-sm font-bold text-[#faf7ef] disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? 'Creando…' : 'Crear cliente'}
      </button>
    </form>
  )
}
