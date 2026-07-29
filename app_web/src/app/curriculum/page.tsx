import type { Metadata } from 'next'
import { AccionesCv } from './acciones-cv'
import { FotoCv } from './foto-cv'

export const metadata: Metadata = {
  title: 'Currículum Vitae · Roberto Michael Rodríguez Rodríguez',
  description: '2º Jefe de Cocina · Chef Especialista con más de 25 años de experiencia en cocina de hotel de alta categoría.',
}

const EXPERIENCIA = [
  { años: '2022 – 2025', cargo: '2º Jefe de Cocina', empresa: 'Hotel Hovima Costa Adeje', detalle: 'Ref: Freddy Dendl (Jefe de Cocina)' },
  { años: '2019 – 2022', cargo: 'Jefe de Partida', empresa: 'Hotel Isla Bonita', detalle: null },
  { años: '2018 – 2019', cargo: 'Jefe de Partida', empresa: 'Hotel Barceló Royal Hideaway', detalle: null },
  { años: '2016 – 2017', cargo: 'Jefe de Partida', empresa: 'Hotel Meliá Jardines del Teide', detalle: null },
  { años: '2015 – 2016', cargo: 'Jefe de Partida', empresa: 'Hotel Meliá Palacio de Isora', detalle: null },
  { años: '2014 – 2015', cargo: 'Jefe de Partida', empresa: 'Hotel Ecológico San Blas', detalle: 'Chef: José Marín' },
  { años: '2010 – 2014', cargo: 'Jefe de Partida', empresa: 'Hotel Meliá Jardines del Teide', detalle: null },
  { años: '2007 – 2010', cargo: 'Cocinero de Cocina Internacional', empresa: 'Hotel Isabel Family', detalle: null },
  { años: '2006 – 2007', cargo: 'Cocinero de Cocina Internacional', empresa: 'Apart-Hotel Panorámica "Columbus"', detalle: null },
  { años: '2004 – 2006', cargo: 'Cocinero', empresa: 'Restaurante Marisquería El Pescador', detalle: 'Tarragona' },
  { años: '1999 – 2004', cargo: 'Maestro Pastero', empresa: 'Milán', detalle: 'Elaboración de pastas, pizzas y salsas caseras' },
]

const ESPECIALIDADES = [
  'Cocina Italiana', 'Pizza Napolitana', 'Bufet Creativo',
  'Cocina Internacional', 'Pastelería & Pastas', 'IA Aplicada',
]

const s = {
  navy: '#1e3a5f',
  gold: '#d4a843',
  cream: '#f5f0e8',
  textDark: '#2b2a25',
  textMid: '#3a3830',
  textLight: '#6e6a5c',
  border: '#e2dac8',
  sans: 'Arial, Helvetica, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
} as const

function SectionTitle({ titulo }: { titulo: string }) {
  return (
    <h2 style={{
      margin: '0 0 8px',
      fontSize: '9.5px',
      fontWeight: 'bold',
      letterSpacing: '0.16em',
      color: s.navy,
      textTransform: 'uppercase' as const,
      borderBottom: `1.5px solid ${s.gold}`,
      paddingBottom: '4px',
      fontFamily: s.sans,
    }}>{titulo}</h2>
  )
}

function LeftSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '18px' }}>
      <SectionTitle titulo={titulo} />
      {children}
    </section>
  )
}

function RightSection({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '20px' }}>
      <SectionTitle titulo={titulo} />
      {children}
    </section>
  )
}

function DataItem({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <p style={{ margin: 0, fontSize: '9px', fontWeight: 'bold', color: s.textLight, textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontFamily: s.sans }}>{label}</p>
      <p style={{ margin: '2px 0 0', color: s.textDark, fontSize: '11px', fontFamily: s.sans }}>{valor}</p>
    </div>
  )
}

function EduItem({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <p style={{ margin: 0, fontWeight: 'bold', color: s.textDark, fontSize: '11px', fontFamily: s.sans }}>{titulo}</p>
      <p style={{ margin: '2px 0 0', fontSize: '10px', color: s.textLight, fontStyle: 'italic', fontFamily: s.sans }}>{sub}</p>
    </div>
  )
}

function Pill({ texto, variante = 'navy' }: { texto: string; variante?: 'navy' | 'gold' }) {
  return (
    <span style={{
      backgroundColor: variante === 'gold' ? s.gold : s.navy,
      color: 'white',
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '10px',
      fontWeight: 'bold',
      fontFamily: s.sans,
      display: 'inline-block',
    }}>{texto}</span>
  )
}

export default function CurriculumPage() {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hidden { display: none !important; }
          body { margin: 0; padding: 0; background: white; }
        }
        @media screen {
          .print-hidden { display: flex; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', backgroundColor: '#ddd9ce', padding: '24px 16px' }} className="print:bg-transparent print:p-0">

        {/* Botones de acción */}
        <div className="print:hidden">
          <AccionesCv />
        </div>

        {/* DOCUMENTO CV */}
        <div style={{
          maxWidth: '794px',
          margin: '0 auto',
          backgroundColor: 'white',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          fontFamily: s.sans,
        }} className="print:max-w-none print:shadow-none">

          {/* ── CABECERA ── */}
          <header style={{ backgroundColor: s.navy, padding: '28px 32px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', lineHeight: 1.2, fontFamily: s.serif }}>
                  Roberto Michael Rodríguez Rodríguez
                </h1>
                <p style={{ margin: '8px 0 0', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.2em', color: s.gold, textTransform: 'uppercase', fontFamily: s.sans }}>
                  2º Jefe de Cocina · Chef Especialista
                </p>
                <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '4px 22px', fontSize: '11px', color: '#a8c0d6', fontFamily: s.sans }}>
                  <span>☎ 603 136 802</span>
                  <span>⌂ C/ La Era 8, BJ8 — Guía de Isora</span>
                  <span>✉ 0123456.rr40@gmail.com</span>
                  <span>◈ DNI: 42289943-G</span>
                </div>
              </div>
              <FotoCv />
            </div>
          </header>

          {/* ── CUERPO ── */}
          <div style={{ display: 'flex' }}>

            {/* Columna izquierda */}
            <aside style={{
              width: '220px',
              flexShrink: 0,
              backgroundColor: s.cream,
              padding: '24px 20px',
              fontSize: '11px',
            }}>
              <LeftSection titulo="Datos Personales">
                <DataItem label="Fecha de Nacimiento" valor="30 de julio de 1979" />
                <DataItem label="Nacionalidad" valor="Español" />
                <DataItem label="Permiso de Conducción" valor="Clase B" />
                <DataItem label="Disponibilidad" valor="Horario total" />
              </LeftSection>

              <LeftSection titulo="Formación Académica">
                <EduItem titulo="Máster en Inteligencia Artificial" sub="En curso (actualmente)" />
                <EduItem titulo="Ingeniería de Prompts" sub="Especialista en IA aplicada a gestión" />
                <EduItem titulo="Bachillerato" sub="Estudios completados" />
              </LeftSection>

              <LeftSection titulo="Formación Complementaria">
                <EduItem titulo="Manipulador de Alimentos" sub="Ayto. de Guía de Isora · 2016" />
                <EduItem titulo="Informática" sub="Microsoft Word & Excel" />
              </LeftSection>

              <LeftSection titulo="Idiomas">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <Pill texto="Español · Nativo" />
                  <Pill texto="Inglés" variante="gold" />
                </div>
              </LeftSection>

              <LeftSection titulo="Especialidades">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {ESPECIALIDADES.map(e => <Pill key={e} texto={e} />)}
                </div>
              </LeftSection>
            </aside>

            {/* Columna derecha */}
            <main style={{ flex: 1, padding: '24px 28px', backgroundColor: 'white', fontSize: '11px' }}>

              <RightSection titulo="Perfil Profesional">
                <p style={{
                  margin: 0, color: s.textMid, lineHeight: 1.75,
                  borderLeft: `3px solid ${s.gold}`, paddingLeft: '12px',
                }}>
                  Profesional resolutivo, empático y habituado al trabajo en equipo por objetivos.
                  Más de 25 años de experiencia en cocina de hotel de alta categoría, con especialidad
                  en bufet creativo, cocina italiana y pizza napolitana. Capaz de detectar sinergias y
                  aplicar herramientas de Inteligencia Artificial y gestión para optimizar procesos y
                  mecanismos de trabajo.
                </p>
              </RightSection>

              <RightSection titulo="Experiencia Laboral">
                <div>
                  {EXPERIENCIA.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < EXPERIENCIA.length - 1 ? '14px' : 0 }}>
                      {/* Timeline dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: s.gold, marginTop: '5px', flexShrink: 0 }} />
                        {i < EXPERIENCIA.length - 1 && (
                          <div style={{ width: '1px', flexGrow: 1, backgroundColor: s.border, marginTop: '3px' }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ paddingBottom: '4px' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: s.textLight, fontWeight: 'bold' }}>{exp.años}</p>
                        <p style={{ margin: '2px 0 0', fontWeight: 'bold', color: s.textDark }}>{exp.cargo}</p>
                        <p style={{ margin: '1px 0 0', color: s.navy }}>{exp.empresa}</p>
                        {exp.detalle && (
                          <p style={{ margin: '1px 0 0', fontSize: '10px', color: s.textLight, fontStyle: 'italic' }}>{exp.detalle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </RightSection>

              <RightSection titulo="Objetivo Profesional">
                <p style={{ margin: 0, color: s.textMid, lineHeight: 1.75 }}>
                  Desarrollar al máximo mis capacidades para lograr beneficios para la entidad y
                  crecimiento propio, aportando mi experiencia en cocina de alto rendimiento y mi
                  formación en Inteligencia Artificial para modernizar y optimizar procesos de gestión
                  culinaria.
                </p>
              </RightSection>
            </main>
          </div>

          {/* ── PIE ── */}
          <footer style={{
            backgroundColor: s.navy,
            padding: '10px 32px',
            textAlign: 'center',
            fontSize: '9px',
            color: '#a8c0d6',
            fontFamily: s.sans,
          }}>
            Autorizo el tratamiento de mis datos personales conforme al RGPD (UE) 2016/679 · Julio 2026
          </footer>
        </div>
      </div>
    </>
  )
}
