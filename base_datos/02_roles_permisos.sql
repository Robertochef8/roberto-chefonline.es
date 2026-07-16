-- ============================================================
-- CHEF ONLINE · Roles y permisos granulares (admin / cliente)
-- Extiende chef_online_esquema_completo_supabase.sql
-- ============================================================
-- Modelo: "cliente" NO es un permiso fijo en el código — es un rol cuyo
-- acceso real (qué apartados ve y si puede guardar en cada uno) se
-- configura por usuario en usuario_seccion_permiso. "Cliente 1" y
-- "cliente 2" del enunciado son dos USUARIOS con ese rol, cada uno con
-- su propia combinación de permisos (no dos roles distintos).
-- "admin" tiene siempre acceso total y se salta esta tabla.
-- ============================================================

-- ============================================================
-- 1) ROLES
-- ============================================================
create table roles (
  id     smallint primary key,
  codigo text not null unique check (codigo in ('admin','cliente')),
  nombre text not null
);
insert into roles (id, codigo, nombre) values
  (1,'admin','Administrador'), (2,'cliente','Cliente')
on conflict (id) do nothing;

-- ============================================================
-- 2) APARTADOS DE LA APP (para gating de menú + permisos de datos)
-- ============================================================
create table secciones_app (
  id     smallint primary key,
  codigo text not null unique,
  nombre text not null,
  orden  smallint not null
);
insert into secciones_app (id, codigo, nombre, orden) values
  (1,'dashboard','Dashboard',1),
  (2,'recetas','Recetas y escandallos',2),
  (3,'ingredientes','Ingredientes',3),
  (4,'proveedores','Proveedores',4),
  (5,'informes','Informes',5),
  (6,'ajustes','Ajustes',6)
on conflict (id) do nothing;

-- ============================================================
-- 3) usuarios_restaurante.rol pasa a apoyarse en "roles" (antes era
--    owner/manager/staff, un eje distinto de "quién puede guardar qué").
--    Si ya tenías datos con esos valores, mapea owner/manager -> 'admin'
--    y staff -> 'cliente' antes de aplicar el constraint nuevo.
-- ============================================================
alter table usuarios_restaurante drop constraint if exists usuarios_restaurante_rol_check;
alter table usuarios_restaurante
  add constraint usuarios_restaurante_rol_fkey foreign key (rol) references roles(codigo);

-- ============================================================
-- 4) PERMISOS GRANULARES POR USUARIO Y APARTADO
-- ============================================================
create table usuario_seccion_permiso (
  id                     uuid primary key default gen_random_uuid(),
  usuario_restaurante_id uuid not null references usuarios_restaurante(id) on delete cascade,
  seccion_id             smallint not null references secciones_app(id),
  puede_ver              boolean not null default true,
  puede_guardar          boolean not null default false,  -- ⬅ "cliente 2 no puede guardar" se modela aquí
  unique (usuario_restaurante_id, seccion_id)
);

create index idx_usp_usuario on usuario_seccion_permiso(usuario_restaurante_id);

-- ============================================================
-- 5) FUNCIÓN DE COMPROBACIÓN (usada por las políticas RLS)
--    admin -> siempre true. cliente -> requiere fila explícita en
--    usuario_seccion_permiso con puede_ver (y puede_guardar si se pide).
-- ============================================================
create or replace function tiene_permiso(p_restaurante_id uuid, p_seccion_codigo text, p_para_guardar boolean default false)
returns boolean language sql stable as $$
  select exists (
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
-- 6) POLÍTICAS RLS por apartado (sustituyen a las genéricas "mis_restaurantes()"
--    de las tablas que pertenecen a un apartado con control de guardado)
-- ============================================================

-- --- Ingredientes (apartado 'ingredientes') ---
drop policy if exists "acceso por restaurante" on ingredientes;
create policy "ver ingredientes" on ingredientes for select using (tiene_permiso(restaurante_id,'ingredientes'));
create policy "guardar ingredientes" on ingredientes for insert with check (tiene_permiso(restaurante_id,'ingredientes', true));
create policy "actualizar ingredientes" on ingredientes for update using (tiene_permiso(restaurante_id,'ingredientes', true));
create policy "borrar ingredientes" on ingredientes for delete using (tiene_permiso(restaurante_id,'ingredientes', true));

-- Tablas satélite de ingredientes heredan el mismo apartado
drop policy if exists "acceso via ingrediente" on ingrediente_alergeno;
create policy "ver ingrediente_alergeno" on ingrediente_alergeno for select using (
  ingrediente_id in (select id from ingredientes));
create policy "guardar ingrediente_alergeno" on ingrediente_alergeno for all using (
  ingrediente_id in (select id from ingredientes i where tiene_permiso(i.restaurante_id,'ingredientes', true)));

drop policy if exists "acceso via ingrediente" on ingrediente_proveedor;
create policy "ver ingrediente_proveedor" on ingrediente_proveedor for select using (
  ingrediente_id in (select id from ingredientes));
create policy "guardar ingrediente_proveedor" on ingrediente_proveedor for all using (
  ingrediente_id in (select id from ingredientes i where tiene_permiso(i.restaurante_id,'ingredientes', true)));

drop policy if exists "acceso via ingrediente" on historial_precios_ingrediente;
create policy "ver historial_precios" on historial_precios_ingrediente for select using (
  ingrediente_id in (select id from ingredientes));
create policy "guardar historial_precios" on historial_precios_ingrediente for insert with check (
  ingrediente_id in (select id from ingredientes i where tiene_permiso(i.restaurante_id,'ingredientes', true)));

-- --- Proveedores (apartado 'proveedores') ---
drop policy if exists "acceso por restaurante" on proveedores;
create policy "ver proveedores" on proveedores for select using (tiene_permiso(restaurante_id,'proveedores'));
create policy "guardar proveedores" on proveedores for insert with check (tiene_permiso(restaurante_id,'proveedores', true));
create policy "actualizar proveedores" on proveedores for update using (tiene_permiso(restaurante_id,'proveedores', true));
create policy "borrar proveedores" on proveedores for delete using (tiene_permiso(restaurante_id,'proveedores', true));

drop policy if exists "acceso via proveedor" on proveedor_import_mapping;
create policy "ver mapeo_import" on proveedor_import_mapping for select using (
  proveedor_id in (select id from proveedores));
create policy "guardar mapeo_import" on proveedor_import_mapping for all using (
  proveedor_id in (select id from proveedores p where tiene_permiso(p.restaurante_id,'proveedores', true)));

-- --- Recetas / escandallos (apartado 'recetas') ---
drop policy if exists "acceso por restaurante" on platos;
create policy "ver platos" on platos for select using (tiene_permiso(restaurante_id,'recetas'));
create policy "guardar platos" on platos for insert with check (tiene_permiso(restaurante_id,'recetas', true));
create policy "actualizar platos" on platos for update using (tiene_permiso(restaurante_id,'recetas', true));
create policy "borrar platos" on platos for delete using (tiene_permiso(restaurante_id,'recetas', true));

drop policy if exists "acceso via plato" on plato_ingrediente;
create policy "ver escandallo" on plato_ingrediente for select using (
  plato_id in (select id from platos));
create policy "guardar escandallo" on plato_ingrediente for all using (
  plato_id in (select id from platos p where tiene_permiso(p.restaurante_id,'recetas', true)));

-- --- Ajustes del restaurante (apartado 'ajustes') ---
drop policy if exists "acceso restaurante propio" on restaurantes;
create policy "ver restaurante" on restaurantes for select using (tiene_permiso(id,'ajustes') or tiene_permiso(id,'dashboard'));
create policy "guardar ajustes restaurante" on restaurantes for update using (tiene_permiso(id,'ajustes', true));

-- ============================================================
-- 7) RLS en las tablas nuevas
-- ============================================================
alter table roles enable row level security;
alter table secciones_app enable row level security;
alter table usuario_seccion_permiso enable row level security;
create policy "roles visibles a autenticados" on roles for select using (true);
create policy "secciones visibles a autenticados" on secciones_app for select using (true);
create policy "ver mis permisos" on usuario_seccion_permiso for select using (
  usuario_restaurante_id in (select id from usuarios_restaurante where user_id = auth.uid())
  or exists (select 1 from usuarios_restaurante ur join roles r on r.codigo = ur.rol
             where ur.user_id = auth.uid() and r.codigo = 'admin'));

-- ============================================================
-- 8) EJEMPLO DE SIEMBRA — sustituye los UUID de ejemplo por los
--    auth.users.id reales de cada persona en Supabase Auth
-- ============================================================
-- Admin (acceso total, no necesita filas en usuario_seccion_permiso)
-- insert into usuarios_restaurante (user_id, restaurante_id, rol)
--   values ('<uuid_admin>', '<restaurante_id>', 'admin');

-- Cliente 1: ve y GUARDA en Recetas e Ingredientes; solo ve (no guarda) Informes
-- with u as (
--   insert into usuarios_restaurante (user_id, restaurante_id, rol)
--   values ('<uuid_cliente1>', '<restaurante_id>', 'cliente') returning id
-- )
-- insert into usuario_seccion_permiso (usuario_restaurante_id, seccion_id, puede_ver, puede_guardar)
-- select u.id, sa.id, true, (sa.codigo in ('recetas','ingredientes'))
-- from u, secciones_app sa where sa.codigo in ('recetas','ingredientes','informes');

-- Cliente 2: solo lectura (ve Recetas e Informes, pero NUNCA puede guardar en nada)
-- with u as (
--   insert into usuarios_restaurante (user_id, restaurante_id, rol)
--   values ('<uuid_cliente2>', '<restaurante_id>', 'cliente') returning id
-- )
-- insert into usuario_seccion_permiso (usuario_restaurante_id, seccion_id, puede_ver, puede_guardar)
-- select u.id, sa.id, true, false
-- from u, secciones_app sa where sa.codigo in ('recetas','informes');

-- ============================================================
-- NOTAS
-- ============================================================
-- · Deniega por defecto: si un usuario 'cliente' no tiene fila en
--   usuario_seccion_permiso para un apartado, no ve absolutamente nada
--   de ese apartado (ni siquiera con SELECT).
-- · "puede_guardar" cubre INSERT/UPDATE/DELETE. Se puede conceder
--   puede_ver=true y puede_guardar=false para un apartado de solo lectura
--   (es justo el caso de "cliente 2 no puede guardar ficheros").
-- · Dashboard/Informes no tienen tablas propias — leen de platos/ingredientes,
--   así que su control de acceso real ya viene dado por los permisos de esos
--   dos apartados; secciones_app los incluye sobre todo para poder ocultar o
--   mostrar esas pestañas en el menú del frontend.
