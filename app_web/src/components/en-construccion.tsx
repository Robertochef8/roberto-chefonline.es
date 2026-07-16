export function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div>
      <h1 className="text-lg font-bold text-[#2b2a25]">{titulo}</h1>
      <p className="mt-4 rounded-lg bg-[#f1ede0] px-4 py-3 text-sm text-[#6e6a5c]">
        Esta pantalla todavía no está migrada del prototipo — llega en una sesión futura.
      </p>
    </div>
  )
}
