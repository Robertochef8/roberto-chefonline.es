'use client'

import { useState } from 'react'

const BORDE: React.CSSProperties = {
  width: '84px',
  height: '100px',
  flexShrink: 0,
  border: '2px solid #d4a843',
  borderRadius: '6px',
}

export function FotoCv() {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div style={{ ...BORDE, backgroundColor: '#2a4a7f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px', fontFamily: 'Georgia, serif' }}>RR</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/foto-cv.jpg"
      alt="Roberto Michael Rodríguez Rodríguez"
      onError={() => setError(true)}
      style={{ ...BORDE, objectFit: 'cover', objectPosition: 'top center' }}
    />
  )
}
