// Mapeo de estilos para el diagnostico que devuelve calcular_plato() en SQL
// ('rentable' | 'revisar' | 'no_rentable').
export const DIAG_PILL: Record<string, string> = {
  rentable: 'bg-[#dbe9ee] text-[#1f6f8b]',
  revisar: 'bg-[#f6e9d2] text-[#9a5f0b]',
  no_rentable: 'bg-[#f3ded9] text-[#b23c30]',
}

export const DIAG_TEXTO: Record<string, string> = {
  rentable: 'Rentable',
  revisar: 'Revisar',
  no_rentable: 'No rentable',
}

export const DIAG_ICONO: Record<string, string> = {
  rentable: '✓',
  revisar: '!',
  no_rentable: '✕',
}
