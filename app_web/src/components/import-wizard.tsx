'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { ejecutarImportacionPrecios, guardarMapeoImportacion } from '@/lib/actions/importacion'
import { parseNumeroLocal, fmtE } from '@/lib/chef/format'

type Ingrediente = { id: string; codigo: string; nombre: string }
type Mapeo = { nombre: number | null; precio: number | null; codigo: number | null; referencia: number | null; unidad: number | null }
type FilaPreview = {
  nombreArchivo: string
  codigoArchivo: string
  referenciaArchivo: string
  unidadArchivo: string
  precioNuevo: number
  accion: string // 'new' | id de ingrediente | 'ignore'
}

const KEYWORDS: Record<keyof Mapeo, string[]> = {
  nombre: ['nombre', 'descrip', 'articulo', 'producto'],
  precio: ['precio', 'coste', 'importe', 'pvp'],
  codigo: ['cod. interno', 'codigo interno', 'ing-'],
  referencia: ['ref', 'sku', 'codigo', 'cod'],
  unidad: ['unidad', 'ud', 'formato'],
}

function adivinar(headers: string[], campo: keyof Mapeo): number | null {
  const idx = headers.findIndex((h) => KEYWORDS[campo].some((k) => h?.toLowerCase().includes(k)))
  return idx >= 0 ? idx : null
}

const campoLabel = 'block text-[11px] font-semibold uppercase tracking-wide text-[#6e6a5c]'
const campoInput = 'mt-1 w-full rounded-lg border border-[#e2dac8] bg-[#faf7ef] px-2 py-1.5 text-sm'

export function ImportWizard({ proveedores, ingredientes }: { proveedores: { id: string; nombre: string }[]; ingredientes: Ingrediente[] }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso] = useState<'seleccion' | 'mapeo' | 'preview'>('seleccion')
  const [proveedorId, setProveedorId] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [filas, setFilas] = useState<string[][]>([])
  const [mapeo, setMapeo] = useState<Mapeo>({ nombre: null, precio: null, codigo: null, referencia: null, unidad: null })
  const [mapeoGuardado, setMapeoGuardado] = useState(false)
  const [filasPreview, setFilasPreview] = useState<FilaPreview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<{ creados: number; actualizados: number } | null>(null)

  function cerrarYReset() {
    setAbierto(false)
    setPaso('seleccion')
    setProveedorId('')
    setHeaders([])
    setFilas([])
    setFilasPreview([])
    setError(null)
    setResultado(null)
    setMapeoGuardado(false)
  }

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!proveedorId) {
      setError('Elige primero un proveedor.')
      e.target.value = ''
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    let filasArchivo: string[][] = []

    try {
      if (ext === 'xls' || ext === 'xlsx') {
        const buf = await file.arrayBuffer()
        const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
        const hoja = wb.Sheets[wb.SheetNames[0]]
        filasArchivo = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '' }) as string[][]
      } else {
        const texto = await file.text()
        const parsed = Papa.parse<string[]>(texto, { delimiter: '' })
        filasArchivo = parsed.data as string[][]
      }
    } catch {
      setError('No se pudo leer el archivo. Comprueba que el formato sea correcto.')
      return
    }

    filasArchivo = filasArchivo.filter((f) => Array.isArray(f) && f.some((c) => String(c ?? '').trim() !== ''))
    if (filasArchivo.length < 2) {
      setError('El archivo no tiene suficientes filas (hace falta cabecera + al menos una fila de datos).')
      return
    }

    const cabecera = filasArchivo[0].map((h) => String(h ?? ''))
    const cuerpo = filasArchivo.slice(1)
    setHeaders(cabecera)
    setFilas(cuerpo)

    const supabase = createClient()
    const { data: guardado } = await supabase
      .from('proveedor_import_mapping')
      .select('columna_nombre, columna_precio, columna_codigo, columna_referencia, columna_unidad')
      .eq('proveedor_id', proveedorId)
      .maybeSingle()

    if (guardado) {
      setMapeo({
        nombre: guardado.columna_nombre,
        precio: guardado.columna_precio,
        codigo: guardado.columna_codigo,
        referencia: guardado.columna_referencia,
        unidad: guardado.columna_unidad,
      })
      setMapeoGuardado(true)
    } else {
      setMapeo({
        nombre: adivinar(cabecera, 'nombre'),
        precio: adivinar(cabecera, 'precio'),
        codigo: adivinar(cabecera, 'codigo'),
        referencia: adivinar(cabecera, 'referencia'),
        unidad: adivinar(cabecera, 'unidad'),
      })
      setMapeoGuardado(false)
    }
    setPaso('mapeo')
  }

  function confirmarMapeo() {
    if (mapeo.nombre === null || mapeo.precio === null) {
      setError('Nombre y precio son obligatorios.')
      return
    }
    setError(null)

    const preview: FilaPreview[] = filas.map((fila) => {
      const nombreArchivo = String(fila[mapeo.nombre!] ?? '').trim()
      const codigoArchivo = mapeo.codigo !== null ? String(fila[mapeo.codigo] ?? '').trim() : ''
      const referenciaArchivo = mapeo.referencia !== null ? String(fila[mapeo.referencia] ?? '').trim() : ''
      const unidadArchivo = mapeo.unidad !== null ? String(fila[mapeo.unidad] ?? '').trim() : ''
      const precioNuevo = parseNumeroLocal(String(fila[mapeo.precio!] ?? ''))

      // Coincidencia en orden: código interno -> nombre exacto. La referencia
      // de proveedor se deja para que el usuario la vincule a mano en el
      // preview si el cruce automático no la encuentra.
      let accion = 'new'
      if (codigoArchivo) {
        const m = ingredientes.find((i) => i.codigo.toLowerCase() === codigoArchivo.toLowerCase())
        if (m) accion = m.id
      }
      if (accion === 'new' && nombreArchivo) {
        const m = ingredientes.find((i) => i.nombre.toLowerCase() === nombreArchivo.toLowerCase())
        if (m) accion = m.id
      }

      return { nombreArchivo, codigoArchivo, referenciaArchivo, unidadArchivo, precioNuevo, accion }
    })

    setFilasPreview(preview)
    setPaso('preview')
  }

  function cambiarAccionFila(idx: number, valor: string) {
    setFilasPreview((prev) => prev.map((f, i) => (i === idx ? { ...f, accion: valor } : f)))
  }

  async function ejecutar() {
    setProcesando(true)
    setError(null)

    const validas = filasPreview.filter((f) => f.accion !== 'ignore' && Number.isFinite(f.precioNuevo))
    if (!validas.length) {
      setError('No hay ninguna fila válida para importar (revisa que los precios se hayan leído bien).')
      setProcesando(false)
      return
    }

    const payload = validas.map((f) => ({
      accion: f.accion,
      nombre_archivo: f.nombreArchivo,
      unidad_archivo: f.unidadArchivo,
      referencia_archivo: f.referenciaArchivo,
      precio_nuevo: f.precioNuevo,
    }))

    const res = await ejecutarImportacionPrecios(proveedorId, payload)
    if (res.error) {
      setError(res.error)
      setProcesando(false)
      return
    }

    await guardarMapeoImportacion(proveedorId, mapeo)

    setResultado({ creados: res.creados ?? 0, actualizados: res.actualizados ?? 0 })
    setProcesando(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-[#e2dac8] px-4 py-2 text-sm font-semibold text-[#2b2a25]"
      >
        ⇪ Importar precios
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && cerrarYReset()}>
          <div className="w-full max-w-lg rounded-2xl bg-[#faf7ef] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2b2a25]">Importar precios de proveedor</h2>
              <button onClick={cerrarYReset} className="text-[#6e6a5c]" aria-label="Cerrar">
                ✕
              </button>
            </div>

            {resultado ? (
              <div>
                <div className="rounded-lg bg-[#dbe9ee] px-3 py-3 text-sm text-[#1f6f8b]">
                  Importación completada: {resultado.actualizados} actualizados, {resultado.creados} nuevos.
                </div>
                <button onClick={cerrarYReset} className="mt-4 w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef]">
                  Cerrar
                </button>
              </div>
            ) : paso === 'seleccion' ? (
              <div className="space-y-3">
                <div>
                  <label className={campoLabel}>Proveedor</label>
                  <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} className={campoInput}>
                    <option value="">— elegir proveedor —</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={campoLabel}>Archivo (.csv, .txt, .xls, .xlsx)</label>
                  <input type="file" accept=".csv,.txt,.xls,.xlsx" onChange={onArchivo} className="mt-1 w-full text-sm" />
                </div>
                {error && <p className="text-sm text-[#b23c30]">✕ {error}</p>}
                <p className="text-xs text-[#6e6a5c]">
                  El mapeo de columnas se recuerda por proveedor — la próxima vez que importes un archivo suyo, se
                  rellenará solo (ajústalo si el archivo ha cambiado).
                </p>
              </div>
            ) : paso === 'mapeo' ? (
              <div className="space-y-3">
                {mapeoGuardado && (
                  <p className="rounded-lg bg-[#f6e9d2] px-3 py-2 text-xs text-[#9a5f0b]">
                    Se ha detectado un mapeo guardado para este proveedor. Ajústalo si el archivo ha cambiado.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ['nombre', 'Nombre ingrediente *'],
                      ['precio', 'Precio *'],
                      ['codigo', 'Código interno'],
                      ['referencia', 'Referencia/SKU proveedor'],
                      ['unidad', 'Unidad'],
                    ] as [keyof Mapeo, string][]
                  ).map(([campo, etiqueta]) => (
                    <div key={campo}>
                      <label className={campoLabel}>{etiqueta}</label>
                      <select
                        value={mapeo[campo] ?? ''}
                        onChange={(e) => setMapeo((m) => ({ ...m, [campo]: e.target.value === '' ? null : Number(e.target.value) }))}
                        className={campoInput}
                      >
                        <option value="">— ninguna —</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `columna ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-[#e2dac8]">
                  <table className="w-full min-w-[420px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#1e3a5f] text-[#faf7ef]">
                        {headers.map((h, i) => (
                          <th key={i} className="px-2 py-1 font-semibold">
                            {h || `col ${i + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filas.slice(0, 5).map((f, i) => (
                        <tr key={i} className="border-b border-[#e2dac8]">
                          {headers.map((_, j) => (
                            <td key={j} className="px-2 py-1 text-[#2b2a25]">
                              {String(f[j] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {error && <p className="text-sm text-[#b23c30]">✕ {error}</p>}
                <button onClick={confirmarMapeo} className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef]">
                  Continuar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-96 overflow-y-auto rounded-lg border border-[#e2dac8]">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="sticky top-0">
                      <tr className="bg-[#1e3a5f] text-[#faf7ef]">
                        <th className="px-2 py-1 font-semibold">Detectado</th>
                        <th className="px-2 py-1 font-semibold">Precio</th>
                        <th className="px-2 py-1 font-semibold">Vincular a</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filasPreview.map((f, i) => {
                        const precioValido = Number.isFinite(f.precioNuevo)
                        return (
                          <tr key={i} className="border-b border-[#e2dac8]">
                            <td className="px-2 py-1 text-[#2b2a25]">
                              {f.nombreArchivo || f.referenciaArchivo || f.codigoArchivo || '(sin nombre)'}
                            </td>
                            <td className="px-2 py-1">
                              {precioValido ? (
                                <span className="text-[#2b2a25]">{fmtE(f.precioNuevo)}</span>
                              ) : (
                                <span className="rounded-full bg-[#f3ded9] px-2 py-0.5 font-semibold text-[#b23c30]">
                                  Precio no válido
                                </span>
                              )}
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={f.accion}
                                onChange={(e) => cambiarAccionFila(i, e.target.value)}
                                className="rounded border border-[#e2dac8] bg-[#faf7ef] px-1 py-0.5 text-xs"
                              >
                                <option value="new">Crear nuevo</option>
                                <option value="ignore">Ignorar</option>
                                {ingredientes.map((ing) => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.nombre}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {error && <p className="text-sm text-[#b23c30]">✕ {error}</p>}
                <button
                  onClick={ejecutar}
                  disabled={procesando}
                  className="w-full rounded-lg bg-[#1e3a5f] py-2.5 text-sm font-bold text-[#faf7ef] disabled:opacity-60"
                >
                  {procesando ? 'Importando…' : 'Confirmar importación'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
