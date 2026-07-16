insert into auth.users (id) values
  ('c0000000-0000-0000-0000-000000000001'), -- admin
  ('c0000000-0000-0000-0000-000000000002'), -- cliente 1
  ('c0000000-0000-0000-0000-000000000003'); -- cliente 2

insert into usuarios_restaurante (id, user_id, restaurante_id, rol) values
  ('d0000000-0000-0000-0000-000000000001','c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','admin'),
  ('d0000000-0000-0000-0000-000000000002','c0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','cliente'),
  ('d0000000-0000-0000-0000-000000000003','c0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','cliente');

-- Cliente 1: ve y GUARDA en Recetas e Ingredientes; solo ve Informes (sin guardar, aunque no tiene tabla propia)
insert into usuario_seccion_permiso (usuario_restaurante_id, seccion_id, puede_ver, puede_guardar)
select 'd0000000-0000-0000-0000-000000000002', sa.id, true, (sa.codigo in ('recetas','ingredientes'))
from secciones_app sa where sa.codigo in ('recetas','ingredientes','informes');

-- Cliente 2: solo lectura de Recetas e Informes, nunca puede guardar
insert into usuario_seccion_permiso (usuario_restaurante_id, seccion_id, puede_ver, puede_guardar)
select 'd0000000-0000-0000-0000-000000000003', sa.id, true, false
from secciones_app sa where sa.codigo in ('recetas','informes');
