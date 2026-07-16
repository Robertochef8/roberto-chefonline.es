// Catálogo de los 14 alérgenos UE 1169/2011 (mismo orden que el prototipo y
// que la tabla "alergenos" de base_datos/01_esquema_completo.sql).
export const ALERGENOS_UI = [
  ['gluten', 'Cereales con gluten'],
  ['crustaceos', 'Crustáceos'],
  ['huevos', 'Huevos'],
  ['pescado', 'Pescado'],
  ['cacahuetes', 'Cacahuetes'],
  ['soja', 'Soja'],
  ['leche', 'Leche y lactosa'],
  ['frutos_cascara', 'Frutos de cáscara'],
  ['apio', 'Apio'],
  ['mostaza', 'Mostaza'],
  ['sesamo', 'Sésamo'],
  ['sulfitos', 'Sulfitos'],
  ['altramuces', 'Altramuces'],
  ['moluscos', 'Moluscos'],
] as const

export const ESTADO_TXT: Record<string, string> = {
  contiene: 'Contiene',
  trazas: 'Puede contener trazas',
  pendiente: 'Pendiente de validar',
}

export const ESTADO_PILL: Record<string, string> = {
  contiene: 'bg-[#f3ded9] text-[#b23c30]',
  trazas: 'bg-[#f6e9d2] text-[#9a5f0b]',
  pendiente: 'bg-[#f1ede0] text-[#6e6a5c]',
}

type FilaAlergeno = { estado: string; alergeno: { codigo: string; nombre: string } }

// Agrega los alérgenos de todos los ingredientes de un escandallo: si dos
// líneas declaran el mismo alérgeno con estados distintos, gana el más
// grave (contiene > pendiente > trazas). Mismo criterio que el prototipo.
export function agregarAlergenosPlato(filas: FilaAlergeno[]) {
  const rank: Record<string, number> = { contiene: 3, pendiente: 2, trazas: 1 }
  const map = new Map<string, { nombre: string; estado: string }>()
  for (const f of filas) {
    const actual = map.get(f.alergeno.codigo)
    if (!actual || rank[f.estado] > rank[actual.estado]) {
      map.set(f.alergeno.codigo, { nombre: f.alergeno.nombre, estado: f.estado })
    }
  }
  return map
}
