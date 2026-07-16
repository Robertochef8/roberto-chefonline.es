\echo '=== ADMIN: ver ingredientes ==='
set myapp.uid = 'c0000000-0000-0000-0000-000000000001';
select count(*) from ingredientes;
\echo '=== ADMIN: guardar un ingrediente nuevo ==='
insert into ingredientes (restaurante_id, codigo, nombre, unidad, precio_actual, merma_pct)
values ('11111111-1111-1111-1111-111111111111','ING-TEST-ADMIN','Test admin','kg',1,0);

\echo '=== CLIENTE 1: ver ingredientes (deberia ver todos) ==='
set myapp.uid = 'c0000000-0000-0000-0000-000000000002';
select count(*) from ingredientes;
\echo '=== CLIENTE 1: guardar ingrediente (deberia FUNCIONAR, tiene permiso) ==='
insert into ingredientes (restaurante_id, codigo, nombre, unidad, precio_actual, merma_pct)
values ('11111111-1111-1111-1111-111111111111','ING-TEST-C1','Test cliente1','kg',1,0);
\echo '=== CLIENTE 1: ver proveedores (deberia ver 0, sin permiso concedido) ==='
select count(*) from proveedores;
\echo '=== CLIENTE 1: intentar guardar proveedor (deberia fallar / insertar 0 filas) ==='
insert into proveedores (restaurante_id, nombre) values ('11111111-1111-1111-1111-111111111111','Proveedor intruso');

\echo '=== CLIENTE 2: ver platos (deberia ver los 5) ==='
set myapp.uid = 'c0000000-0000-0000-0000-000000000003';
select count(*) from platos;
\echo '=== CLIENTE 2: intentar guardar un plato nuevo (NO deberia poder) ==='
insert into platos (restaurante_id, codigo, nombre, raciones, pvp)
values ('11111111-1111-1111-1111-111111111111','PL-INTRUSO','Plato intruso',1,10);
