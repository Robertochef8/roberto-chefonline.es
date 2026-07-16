import Link from 'next/link'
import { NuevoClienteForm } from '@/components/admin/nuevo-cliente-form'

export default function NuevoClientePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/admin" className="text-sm font-semibold text-[#1e3a5f]">
        ← Clientes
      </Link>
      <h1 className="mt-2 text-lg font-bold text-[#2b2a25]">Nuevo cliente</h1>
      <div className="mt-4">
        <NuevoClienteForm />
      </div>
    </main>
  )
}
