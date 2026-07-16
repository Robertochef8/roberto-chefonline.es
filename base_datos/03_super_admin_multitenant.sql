-- ============================================================
-- CHEF ONLINE · Super Admin global + cimientos multi-tenant ampliado
-- Extiende 01_esquema_completo.sql y 02_roles_permisos.sql (aplicar en ese orden)
-- ============================================================
-- Modelo: el "admin"/"cliente" de 02_roles_permisos.sql sigue gobernando el
-- acceso POR RESTAURANTE (sin tocar esa tabla ni sus políticas). El Super
-- Admin es una capa global por encima, exclusiva de un único usuario
-- (roberto@chefonline.es, sembrado aparte vía Admin API — nunca por SQL
-- directo en auth.users). Se propaga como bypass dentro de tiene_permiso(),
-- así que ninguna política de ingredientes/proveedores/platos/plato_ingrediente
-- necesita reescribirse: todas ya llaman a esa función.
-- ============================================================

-- ============================================================
-- 1) SUPER ADMIN GLOBAL
-- ============================================================
create table super_admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz default now()
);

alter table super_admins enable row level security;
-- Nadie lee esta tabla directamente desde el cliente; solo vía is_super_admin().
create policy "sin acceso directo" on super_admins for select using (false);

create or replace function is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from super_admins where user_id = auth.uid());
$$;

-- ============================================================
-- 2) BYPASS PROPAGADO: se reescribe solo tiene_permiso(), no las políticas
--    que ya la usan (ingredientes, proveedores, platos, plato_ingrediente,
--    restaurantes vía "ver restaurante"/"guardar ajustes restaurante").
-- ============================================================
create or replace function tiene_permiso(p_restaurante_id uuid, p_seccion_codigo text, p_para_guardar boolean default false)
returns boolean language sql stable as $$
  select is_super_admin() or exists (
    select 1
    from usuarios_restaurante ur
    join roles r on r.codigo = ur.rol
    left join secciones_app sa on sa.codigo = p_seccion_codigo
    left join usuario_seccion_permiso usp
      on usp.usuario_restaurante_id = ur.id and usp.seccion_id = sa.id
    where ur.user_id = auth.uid()
      and ur.restaurante_id = p_restaurante_id
      and (
        r.codigo = 'admin'
        or (usp.puede_ver and (not p_para_guardar or usp.puede_guardar))
      )
  );
$$;

-- ============================================================
-- 3) Única política que NO pasa por tiene_permiso(): reescribir para el bypass
-- ============================================================
drop policy if exists "acceso membresias propias" on usuarios_restaurante;
create policy "ver membresias" on usuarios_restaurante for select
  using (user_id = auth.uid() or is_super_admin());

-- ============================================================
-- 4) EXTENSIÓN DE "restaurantes": datos fiscales/negocio/estado
--    (zona/impuesto ya cubren "zona fiscal"; fc_objetivo ya cubre
--    "Food Cost objetivo" — no se duplican esas columnas)
-- ============================================================
alter table restaurantes
  add column if not exists cif_nif       text,
  add column if not exists direccion     text,
  add column if not exists codigo_postal text,
  add column if not exists poblacion     text,
  add column if not exists provincia     text,
  add column if not exists isla          text,
  add column if not exists pais          text default 'España',
  add column if not exists tipo_negocio  text default 'restaurante',
  add column if not exists estado        text not null default 'activa'
    check (estado in ('activa','suspendida','desactivada'));

-- ============================================================
-- 5) EXTENSIÓN DE "usuarios_restaurante": persona + acceso
-- ============================================================
alter table usuarios_restaurante
  add column if not exists nombre                text,
  add column if not exists apellidos             text,
  add column if not exists email                 text,
  add column if not exists usuario               text,
  add column if not exists cargo                 text,
  add column if not exists telefono              text,
  add column if not exists estado                text not null default 'activo'
    check (estado in ('activo','suspendido','desactivado')),
  add column if not exists ultimo_acceso          timestamptz,
  add column if not exists debe_cambiar_password  boolean not null default false;

-- ============================================================
-- 6) AUDITORÍA BÁSICA (solo evento de login en esta fase; el diseño ya
--    admite más tipos de evento sin migrar de nuevo)
-- ============================================================
create table audit_log (
  id             uuid primary key default gen_random_uuid(),
  actor_user_id  uuid references auth.users(id) on delete set null,
  restaurante_id uuid references restaurantes(id) on delete set null,
  evento         text not null,
  detalle        jsonb,
  creado_en      timestamptz not null default now()
);

create index idx_audit_log_actor on audit_log(actor_user_id, creado_en desc);
create index idx_audit_log_restaurante on audit_log(restaurante_id, creado_en desc);

alter table audit_log enable row level security;
create policy "ver auditoria propio tenant o super admin" on audit_log for select
  using (restaurante_id in (select mis_restaurantes()) or is_super_admin());

-- Sin política de INSERT directa: un usuario autenticado NO puede insertar
-- filas de auditoría a mano (podría falsificar el registro). Todo insert
-- pasa por esta función, que fija actor_user_id = auth.uid() ella misma.
create or replace function log_evento(p_restaurante_id uuid, p_evento text, p_detalle jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log(actor_user_id, restaurante_id, evento, detalle)
  values (auth.uid(), p_restaurante_id, p_evento, p_detalle);
end; $$;

grant execute on function log_evento(uuid,text,jsonb) to authenticated;

-- ============================================================
-- NOTAS DE DISEÑO
-- ============================================================
-- · El Super Admin (roberto@chefonline.es) se crea con
--   app_web/scripts/seed-super-admin.mjs (Admin API), nunca insertando en
--   auth.users por SQL. Tras crearlo, su UUID se inserta en super_admins.
-- · Fuera de alcance de esta migración (se añadirá cuando se construya cada
--   funcionalidad): CRUD de clientes/usuarios, reset de contraseña iniciado
--   por el admin, registro de intentos fallidos/bloqueo temporal, políticas
--   de INSERT/DELETE en "restaurantes" (la creación de tenants la hará un
--   Route Handler de Next.js con la service_role key, no RLS de cliente).
