-- ============================================================
-- CHEF ONLINE · Esquema Supabase completo (PostgreSQL)
-- Multi-tenant: restaurantes · categorías de carta · alérgenos ·
-- ingredientes · proveedores · platos/escandallos · cálculo de food cost
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- 0) AUTENTICACIÓN Y MULTI-TENANT
-- ============================================================
create table restaurantes (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  lugar          text,                 -- población / comarca, ej. "Guía de Isora, Tenerife"
  zona           text not null default 'peninsula' check (zona in ('canarias','peninsula')),
  impuesto       numeric(5,2) not null default 10, -- IGIC 7% (Canarias) / IVA 10% (Península) por defecto
  fc_objetivo    numeric(5,2) not null default 30, -- food cost objetivo (%)
  creado_en      timestamptz default now()
);

-- Relación usuario de Supabase Auth ⇄ restaurante(s) a los que tiene acceso
create table usuarios_restaurante (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  restaurante_id uuid not null references restaurantes(id) on delete cascade,
  rol            text not null default 'staff' check (rol in ('owner','manager','staff')),
  creado_en      timestamptz default now(),
  unique (user_id, restaurante_id)
);

create index idx_usuarios_restaurante_user on usuarios_restaurante(user_id);

-- Helper para las políticas RLS: restaurantes a los que pertenece el usuario autenticado
create or replace function mis_restaurantes()
returns setof uuid language sql stable as $$
  select restaurante_id from usuarios_restaurante where user_id = auth.uid();
$$;

-- ============================================================
-- 1) CATEGORÍAS DE CARTA (Entrante/Principal/Postre/Bebida... personalizable por restaurante)
-- ============================================================
create table categorias_carta (
  id             uuid primary key default gen_random_uuid(),
  restaurante_id uuid not null references restaurantes(id) on delete cascade,
  nombre         text not null,
  orden          int not null default 0,
  unique (restaurante_id, nombre)
);

-- ============================================================
-- 2) ALÉRGENOS (catálogo fijo UE 1169/2011 — global, no depende de restaurante)
-- ============================================================
create table alergenos (
  id      smallint primary key,
  codigo  text not null unique,     -- 'gluten', 'crustaceos', ...
  nombre  text not null             -- 'Cereales con gluten', 'Crustáceos', ...
);

insert into alergenos (id, codigo, nombre) values
  (1,'gluten','Cereales con gluten'), (2,'crustaceos','Crustáceos'), (3,'huevos','Huevos'),
  (4,'pescado','Pescado'), (5,'cacahuetes','Cacahuetes'), (6,'soja','Soja'),
  (7,'leche','Leche y lactosa'), (8,'frutos_cascara','Frutos de cáscara'), (9,'apio','Apio'),
  (10,'mostaza','Mostaza'), (11,'sesamo','Sésamo'), (12,'sulfitos','Sulfitos'),
  (13,'altramuces','Altramuces'), (14,'moluscos','Moluscos')
on conflict (id) do nothing;

-- ============================================================
-- 3) PROVEEDORES (directorio de empresas)
-- ============================================================
create table proveedores (
  id                uuid primary key default gen_random_uuid(),
  restaurante_id    uuid not null references restaurantes(id) on delete cascade,
  cif_nif           text,
  nombre            text not null,
  persona_contacto  text,
  web               text,
  email             text,
  direccion         text,
  codigo_postal     text,
  poblacion         text,
  provincia         text,
  isla              text,
  pais              text default 'España',
  activo            boolean default true,
  creado_en         timestamptz default now(),
  actualizado_en    timestamptz default now()
);

create index idx_proveedores_restaurante on proveedores(restaurante_id);
create unique index uq_proveedores_cif on proveedores(restaurante_id, cif_nif) where cif_nif is not null and cif_nif <> '';

-- ============================================================
-- 4) INGREDIENTES (catálogo maestro del restaurante)
-- ============================================================
create table ingredientes (
  id                    uuid primary key default gen_random_uuid(),
  restaurante_id        uuid not null references restaurantes(id) on delete cascade,
  codigo                text not null,             -- ING-00001, autogenerado
  nombre                text not null,
  unidad                text not null default 'kg' check (unidad in ('kg','l','ud')),
  precio_actual         numeric(10,4) not null default 0,
  merma_pct             numeric(5,2) not null default 0,
  proveedor_preferente  uuid references proveedores(id) on delete set null,
  ultima_actualizacion  timestamptz not null default now(),
  origen_actualizacion  text not null default 'manual' check (origen_actualizacion in ('manual','importacion_csv')),
  creado_en             timestamptz default now(),
  unique (restaurante_id, codigo)
);

create index idx_ingredientes_restaurante on ingredientes(restaurante_id);
create index idx_ingredientes_nombre on ingredientes(restaurante_id, lower(nombre));

create or replace function siguiente_codigo_ingrediente(p_restaurante_id uuid)
returns text language plpgsql as $$
declare v_max int;
begin
  select coalesce(max(cast(substring(codigo from 'ING-(\d+)') as int)),0) into v_max
    from ingredientes where restaurante_id = p_restaurante_id;
  return 'ING-'||lpad((v_max+1)::text,5,'0');
end; $$;

-- Alérgenos declarados por ingrediente (solo se guardan estados relevantes;
-- la ausencia de fila equivale a "No contiene")
create table ingrediente_alergeno (
  ingrediente_id uuid not null references ingredientes(id) on delete cascade,
  alergeno_id    smallint not null references alergenos(id),
  estado         text not null check (estado in ('contiene','trazas','pendiente')),
  primary key (ingrediente_id, alergeno_id)
);

-- ============================================================
-- 5) INGREDIENTE ⇄ PROVEEDOR (precio propio de cada proveedor)
-- ============================================================
create table ingrediente_proveedor (
  id                   uuid primary key default gen_random_uuid(),
  ingrediente_id       uuid not null references ingredientes(id) on delete cascade,
  proveedor_id         uuid not null references proveedores(id) on delete cascade,
  referencia_proveedor text,
  precio               numeric(10,4) not null,
  fecha_actualizacion  timestamptz not null default now(),
  unique (ingrediente_id, proveedor_id)
);

create index idx_ingprov_ingrediente on ingrediente_proveedor(ingrediente_id);
create index idx_ingprov_proveedor on ingrediente_proveedor(proveedor_id);

-- ============================================================
-- 6) HISTÓRICO DE PRECIOS (auditoría)
-- ============================================================
create table historial_precios_ingrediente (
  id              uuid primary key default gen_random_uuid(),
  ingrediente_id  uuid not null references ingredientes(id) on delete cascade,
  proveedor_id    uuid references proveedores(id) on delete set null,
  precio_anterior numeric(10,4),
  precio_nuevo    numeric(10,4) not null,
  fecha           timestamptz not null default now(),
  origen          text not null default 'manual' check (origen in ('manual','importacion_csv'))
);

create index idx_historial_ingrediente on historial_precios_ingrediente(ingrediente_id, fecha desc);

-- ============================================================
-- 7) MAPEO DE COLUMNAS GUARDADO POR PROVEEDOR (importación CSV/XLS/TXT)
-- ============================================================
create table proveedor_import_mapping (
  id                   uuid primary key default gen_random_uuid(),
  proveedor_id         uuid not null references proveedores(id) on delete cascade,
  columna_nombre       int,
  columna_precio       int,
  columna_codigo       int,
  columna_referencia   int,
  columna_unidad       int,
  delimitador          text default ',',
  fila_encabezado      int default 1,
  actualizado_en       timestamptz default now(),
  unique (proveedor_id)
);

-- ============================================================
-- 8) PLATOS (recetas de la carta)
-- ============================================================
create table platos (
  id                   uuid primary key default gen_random_uuid(),
  restaurante_id       uuid not null references restaurantes(id) on delete cascade,
  codigo               text not null,              -- PL-00001, autogenerado
  nombre               text not null,
  categoria_id         uuid references categorias_carta(id) on delete set null,
  raciones             int not null default 1 check (raciones > 0),
  pvp                  numeric(10,4) not null default 0,  -- precio de venta con impuesto
  extras_pct           numeric(5,2) not null default 0,   -- condimentos/varios %
  packaging            numeric(10,4) not null default 0,
  imagen_url           text,                       -- foto subida o ilustración generada
  activo               boolean not null default true,
  elaboracion          text,
  conservacion         text,
  temperatura_servicio text,
  vida_util            text,
  notas                text,
  creado_en            timestamptz default now(),
  actualizado_en       timestamptz default now(),
  unique (restaurante_id, codigo)
);

create index idx_platos_restaurante on platos(restaurante_id);

create or replace function siguiente_codigo_plato(p_restaurante_id uuid)
returns text language plpgsql as $$
declare v_max int;
begin
  select coalesce(max(cast(substring(codigo from 'PL-(\d+)') as int)),0) into v_max
    from platos where restaurante_id = p_restaurante_id;
  return 'PL-'||lpad((v_max+1)::text,5,'0');
end; $$;

-- Líneas del escandallo: qué ingredientes y cuánta cantidad lleva cada plato
create table plato_ingrediente (
  id             uuid primary key default gen_random_uuid(),
  plato_id       uuid not null references platos(id) on delete cascade,
  ingrediente_id uuid not null references ingredientes(id) on delete restrict,
  cantidad       numeric(10,3) not null check (cantidad >= 0), -- g/ml si unidad ingrediente es kg/l; unidades si es 'ud'
  orden          int not null default 0,
  unique (plato_id, ingrediente_id)
);

create index idx_platoing_plato on plato_ingrediente(plato_id);
create index idx_platoing_ingrediente on plato_ingrediente(ingrediente_id);

-- ============================================================
-- 9) CÁLCULO DE FOOD COST (función reutilizable por API/Dashboard/Informes)
--    Replica exactamente la lógica del prototipo (calcPlato en el HTML)
-- ============================================================
create or replace function calcular_plato(p_plato_id uuid)
returns table (
  coste_ingredientes numeric, extras numeric, packaging numeric, coste_directo numeric,
  coste_racion numeric, pvp numeric, pvp_base numeric, food_cost_pct numeric,
  margen numeric, margen_pct numeric, pvp_recomendado numeric, diagnostico text
) language plpgsql stable as $$
declare
  v_plato platos%rowtype;
  v_restaurante restaurantes%rowtype;
  v_coste_ing numeric := 0;
  v_extras numeric; v_directo numeric; v_racion numeric;
  v_pvp_base numeric; v_fc numeric; v_margen numeric; v_margen_pct numeric; v_pvp_rec numeric;
  v_diag text;
begin
  select * into v_plato from platos where id = p_plato_id;
  select * into v_restaurante from restaurantes where id = v_plato.restaurante_id;

  select coalesce(sum(
    case when i.unidad = 'ud' then pi.cantidad else pi.cantidad/1000.0 end
    * (i.precio_actual / (1 - i.merma_pct/100.0))
  ), 0)
  into v_coste_ing
  from plato_ingrediente pi join ingredientes i on i.id = pi.ingrediente_id
  where pi.plato_id = p_plato_id;

  v_extras  := v_coste_ing * v_plato.extras_pct / 100.0;
  v_directo := v_coste_ing + v_extras + v_plato.packaging;
  v_racion  := v_directo / v_plato.raciones;
  v_pvp_base := v_plato.pvp / (1 + v_restaurante.impuesto/100.0);
  v_fc := case when v_pvp_base > 0 then v_racion / v_pvp_base * 100.0 else 0 end;
  v_margen := v_pvp_base - v_racion;
  v_margen_pct := case when v_pvp_base > 0 then v_margen / v_pvp_base * 100.0 else 0 end;
  v_pvp_rec := ceil((v_racion / (v_restaurante.fc_objetivo/100.0)) * (1+v_restaurante.impuesto/100.0) * 20) / 20.0;
  v_diag := case when v_fc > v_restaurante.fc_objetivo + 5 then 'no_rentable'
                 when v_fc > v_restaurante.fc_objetivo then 'revisar'
                 else 'rentable' end;

  return query select v_coste_ing, v_extras, v_plato.packaging, v_directo, v_racion,
                       v_plato.pvp, v_pvp_base, v_fc, v_margen, v_margen_pct, v_pvp_rec, v_diag;
end; $$;

-- Vista de conveniencia: todos los platos de un restaurante con su cálculo ya resuelto
-- (Dashboard/Informes pueden hacer un simple SELECT en lugar de llamar la función por fila)
create or replace view vista_platos_resumen as
select p.id, p.restaurante_id, p.codigo, p.nombre, c.nombre as categoria, p.raciones, p.activo,
       calc.coste_racion, calc.pvp, calc.pvp_base, calc.food_cost_pct, calc.margen, calc.margen_pct,
       calc.pvp_recomendado, calc.diagnostico
from platos p
left join categorias_carta c on c.id = p.categoria_id
cross join lateral calcular_plato(p.id) as calc;

-- ============================================================
-- 10) ROW LEVEL SECURITY — aislar datos por restaurante
-- ============================================================
alter table restaurantes enable row level security;
alter table usuarios_restaurante enable row level security;
alter table categorias_carta enable row level security;
alter table proveedores enable row level security;
alter table ingredientes enable row level security;
alter table ingrediente_alergeno enable row level security;
alter table ingrediente_proveedor enable row level security;
alter table historial_precios_ingrediente enable row level security;
alter table proveedor_import_mapping enable row level security;
alter table platos enable row level security;
alter table plato_ingrediente enable row level security;

create policy "acceso restaurante propio" on restaurantes for all using (id in (select mis_restaurantes()));
create policy "acceso membresias propias" on usuarios_restaurante for select using (user_id = auth.uid());
create policy "acceso por restaurante" on categorias_carta for all using (restaurante_id in (select mis_restaurantes()));
create policy "acceso por restaurante" on proveedores for all using (restaurante_id in (select mis_restaurantes()));
create policy "acceso por restaurante" on ingredientes for all using (restaurante_id in (select mis_restaurantes()));
create policy "acceso por restaurante" on platos for all using (restaurante_id in (select mis_restaurantes()));
create policy "acceso via ingrediente" on ingrediente_alergeno for all using (
  ingrediente_id in (select id from ingredientes where restaurante_id in (select mis_restaurantes())));
create policy "acceso via ingrediente" on ingrediente_proveedor for all using (
  ingrediente_id in (select id from ingredientes where restaurante_id in (select mis_restaurantes())));
create policy "acceso via ingrediente" on historial_precios_ingrediente for all using (
  ingrediente_id in (select id from ingredientes where restaurante_id in (select mis_restaurantes())));
create policy "acceso via proveedor" on proveedor_import_mapping for all using (
  proveedor_id in (select id from proveedores where restaurante_id in (select mis_restaurantes())));
create policy "acceso via plato" on plato_ingrediente for all using (
  plato_id in (select id from platos where restaurante_id in (select mis_restaurantes())));

-- ============================================================
-- NOTAS DE DISEÑO
-- ============================================================
-- · "alergenos" es catálogo global (los 14 de la UE); "ingrediente_alergeno" es la
--   relación específica de cada restaurante. La ausencia de fila = "No contiene".
-- · categorias_carta es por restaurante (no un enum fijo) para que cada uno pueda
--   llamar "Tapas", "Menú del día", etc. sin tocar código.
-- · calcular_plato() centraliza la fórmula de food cost en un único lugar (SQL),
--   para que tanto el Dashboard, Informes como cualquier API la usen sin duplicar
--   lógica en el front. Replica exactamente calcPlato() del prototipo HTML.
-- · plato_ingrediente.ingrediente_id usa "on delete restrict": no se puede borrar
--   un ingrediente si todavía se usa en algún escandallo (evita romper platos).
