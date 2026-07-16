'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/inicio', title: 'Inicio', d: 'M3 11 12 3l9 8|M5 10v10h14V10' },
  { href: '/dashboard', title: 'Dashboard', d: 'M3 3h7v9H3z|M14 3h7v5h-7z|M14 12h7v9h-7z|M3 16h7v5H3z', rect: true },
  { href: '/recetas', title: 'Recetas', d: 'M6 3h9a3 3 0 0 1 3 3v15H8a2 2 0 0 1-2-2V3Z|M6 17h12' },
  { href: '/ingredientes', title: 'Ingredientes', d: 'M12 21c-4-1-7-5-7-9a7 7 0 0 1 14 0c0 4-3 8-7 9Z|M12 12V7' },
  { href: '/proveedores', title: 'Proveedores', d: 'M2 8h12v8H2z|M14 11h4l3 3v2h-7z', circles: true },
  { href: '/informes', title: 'Informes', d: 'M4 20V10M12 20V4M20 20v-7' },
  { href: '/ajustes', title: 'Ajustes', d: 'gear' },
]

function Icon({ item }: { item: (typeof ITEMS)[number] }) {
  if (item.d === 'gear') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9c.2.7.8 1.2 1.5 1.3h.1a2 2 0 1 1 0 4h-.1c-.7.1-1.3.6-1.5 1.3Z" />
      </svg>
    )
  }
  if (item.rect) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    )
  }
  if (item.circles) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="8" width="12" height="8" rx="1" />
        <path d="M14 11h4l3 3v2h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      {item.d.split('|').map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  )
}

export function TenantNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-around gap-1 border-t border-[#e2dac8] bg-[#2b2a25] px-2 py-2 sm:hidden print:hidden">
      {ITEMS.map((item) => {
        const activo = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${activo ? 'bg-[#1e3a5f] text-[#faf7ef]' : 'text-[#cfcabc]'}`}
          >
            <Icon item={item} />
          </Link>
        )
      })}
    </nav>
  )
}

export function TenantSidebar() {
  const pathname = usePathname()

  return (
    <nav className="hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-[#e2dac8] bg-[#2b2a25] py-4 sm:flex print:hidden">
      {ITEMS.map((item) => {
        const activo = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${activo ? 'bg-[#1e3a5f] text-[#faf7ef]' : 'text-[#cfcabc]'}`}
          >
            <Icon item={item} />
          </Link>
        )
      })}
    </nav>
  )
}
