-- ============================================================
-- CHEF ONLINE · Fix: alergenos era ilegible para authenticated
-- ============================================================
-- "alergenos" es un catálogo global (los 14 de la UE 1169/2011), no depende
-- de restaurante — debe ser legible por cualquier usuario autenticado, igual
-- que "roles"/"secciones_app" en 02_roles_permisos.sql.
--
-- Se detectó que en este proyecto la tabla tenía RLS activado sin ninguna
-- política de SELECT (probablemente resto de una versión anterior del
-- esquema), lo que hacía que `select * from alergenos` devolviera 0 filas
-- para cualquier rol que no fuera el propietario/service_role, sin lanzar
-- ningún error — por eso el alta de ingredientes con alérgenos fallaba en
-- silencio (no se guardaba ningún alérgeno, pero tampoco se veía error).
-- ============================================================
alter table alergenos enable row level security;

drop policy if exists "alergenos visibles a autenticados" on alergenos;
create policy "alergenos visibles a autenticados" on alergenos for select using (true);
