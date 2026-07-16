# Chef Online — paquete de proyecto

Copiloto de food cost para restaurantes españoles y canarios. Este paquete contiene
todo lo construido hasta ahora en la conversación con Claude: el prototipo HTML,
el esquema de base de datos para Supabase (probado contra PostgreSQL real) y los
entregables generados (Excel de escandallos, fichas técnicas en Word).

## Estructura

```
chef_online/
├── prototipo_html/
│   ├── chef_online_mockups.html   ← mockup estático original (referencia visual)
│   └── chef_online_v2.html        ← prototipo funcional (el que hay que evolucionar)
├── base_datos/
│   ├── 01_esquema_completo.sql    ← aplicar primero
│   ├── 02_roles_permisos.sql      ← aplicar después (depende del anterior)
│   └── pruebas/                   ← scripts usados para validar el esquema, no son parte del producto
├── entregables/
│   ├── chef_online_escandallos.xlsx
│   └── chef_online_fichas_tecnicas.docx
└── scripts_generacion/            ← regeneran los entregables si cambian los datos
    ├── build_escandallos.py       (Python + openpyxl)
    └── build_fichas.js            (Node + docx)
```

## Estado actual

**`chef_online_v2.html`** es un prototipo 100% front-end (JS vanilla, sin build).
Todo el estado vive en memoria (`state = {...}`) y se pierde al recargar. Incluye:

- Home, Dashboard, Recetas/Escandallos, Ingredientes, Proveedores, Informes, Ajustes.
- Ficha de plato con zoom de imagen, subida de foto propia o ilustración generada
  (ya no usa fotos de stock aleatorias sin relación con el plato).
- Wizard de importación de precios por CSV/XLS/XLSX/TXT con mapeo de columnas
  flexible por proveedor (usa PapaParse + SheetJS vía CDN).
- Directorio de proveedores (CIF/NIF, contacto, web, email, dirección, CP,
  población, provincia, isla, país).
- Código autogenerado por ingrediente (`ING-00001`...) y por plato (`PL-00001`...).

**`base_datos/01_esquema_completo.sql`** — multi-tenant (`restaurantes`,
`usuarios_restaurante`), catálogo de los 14 alérgenos UE, `categorias_carta`
por restaurante, `ingredientes`/`proveedores`/`ingrediente_proveedor` con
histórico de precios, `platos`/`plato_ingrediente` (escandallo), y una función
`calcular_plato(id)` en SQL que centraliza la fórmula de food cost (coste,
margen, PVP recomendado, diagnóstico) para que el front no la duplique.

**`base_datos/02_roles_permisos.sql`** — rol `admin` (acceso total) y rol
`cliente` con permisos granulares por usuario y por apartado
(`usuario_seccion_permiso`: `puede_ver` / `puede_guardar`). Enforced con RLS
real de Postgres, no solo en el frontend.

### Validación ya hecha (no es solo teoría)
Ambos `.sql` se ejecutaron contra una instancia real de PostgreSQL 16 con datos
de prueba (los mismos 5 platos del prototipo). Se verificó que:
- `calcular_plato()` da exactamente los mismos números que el Excel y que la
  lógica JS del prototipo (food cost, margen, PVP recomendado, diagnóstico).
- No se puede borrar un ingrediente si está usado en un escandallo.
- Un usuario con rol `cliente` sin permiso en un apartado no ve ninguna fila
  de ese apartado, y si intenta guardar donde `puede_guardar=false`, Postgres
  lo bloquea con un error de RLS real (probado con un rol sin privilegios de
  superusuario, que es el escenario real de producción).

Los scripts en `base_datos/pruebas/` son justamente esos tests — no hace falta
ejecutarlos en producción, están ahí como referencia de qué se validó y cómo.

## Cómo aplicar la base de datos en Supabase

1. Crea el proyecto en Supabase (esto te da `auth.users` y `auth.uid()` reales;
   los scripts de prueba de `pruebas/` simulan esto con un stub local, pero en
   Supabase no hace falta crear nada de eso a mano).
2. En el SQL Editor de Supabase, ejecuta `01_esquema_completo.sql` completo.
3. Ejecuta `02_roles_permisos.sql`.
4. Crea al menos un usuario en Supabase Auth y una fila en `usuarios_restaurante`
   con `rol='admin'` para poder entrar y administrar el resto (ver los ejemplos
   comentados al final de `02_roles_permisos.sql`).

## Próximos pasos sugeridos para Claude Code

Esto es exactamente lo que le pediría a Claude Code a continuación, en este orden:

1. **Andamiaje Next.js + Supabase**: crear el proyecto, cliente de Supabase
   (browser + server), variables de entorno, autenticación con Supabase Auth.
2. **Migrar el estado del HTML a Supabase**: sustituir el `state = {...}` en
   memoria de `chef_online_v2.html` por llamadas reales (`select`/`insert`/
   `update`) usando las tablas de `01_esquema_completo.sql`.
3. **Gating de menú según `usuario_seccion_permiso`**: ocultar/mostrar pestañas
   del sidebar según lo que el usuario autenticado puede ver, y deshabilitar
   los botones de guardar donde `puede_guardar=false`.
4. **Conectar el wizard de importación CSV/XLS** a una API route real que haga
   upsert en `ingrediente_proveedor` + inserte en `historial_precios_ingrediente`,
   siguiendo el orden de identificación ya implementado en el prototipo:
   código interno → nombre exacto → referencia del proveedor.
5. **Subida de imágenes de plato** a Supabase Storage en vez de `data:` URLs
   en memoria.

## Alérgenos — recordatorio importante

La tabla de los 14 alérgenos UE (`Contiene` / `Puede contener trazas` /
`No contiene` / `Pendiente de validar`) es siempre orientativa. La validación
final la debe hacer el restaurante con datos reales de proveedor y etiquetado
antes de publicar la carta — nunca se debe dar por confirmada solo con esta
herramienta.
