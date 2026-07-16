-- ============================================================
-- CHEF ONLINE · Cimientos para migrar recetas/ingredientes/proveedores
-- Extiende 01_esquema_completo.sql, 02_roles_permisos.sql y
-- 03_super_admin_multitenant.sql (aplicar en ese orden)
-- ============================================================

-- ============================================================
-- 1) CATEGORÍAS DE CARTA POR DEFECTO AL CREAR UN RESTAURANTE
--    (el prototipo usaba 4 strings fijos; aquí siguen siendo editables por
--    restaurante vía categorias_carta, pero nunca hay que acordarse de
--    sembrarlas a mano al crear un tenant nuevo)
-- ============================================================
create or replace function sembrar_categorias_por_defecto()
returns trigger language plpgsql as $$
begin
  insert into categorias_carta (restaurante_id, nombre, orden) values
    (new.id, 'Entrante', 1),
    (new.id, 'Principal', 2),
    (new.id, 'Postre', 3),
    (new.id, 'Bebida', 4);
  return new;
end; $$;

drop trigger if exists trg_sembrar_categorias on restaurantes;
create trigger trg_sembrar_categorias after insert on restaurantes
  for each row execute function sembrar_categorias_por_defecto();

-- ============================================================
-- 2) STORAGE: bucket privado para imágenes de plato
--    Convención de ruta: {restaurante_id}/{plato_id}/{archivo}
-- ============================================================
insert into storage.buckets (id, name, public)
values ('platos', 'platos', false)
on conflict (id) do nothing;

drop policy if exists "ver imagenes propio restaurante" on storage.objects;
create policy "ver imagenes propio restaurante" on storage.objects for select
  using (bucket_id = 'platos' and (storage.foldername(name))[1]::uuid in (select mis_restaurantes()));

drop policy if exists "subir imagenes propio restaurante" on storage.objects;
create policy "subir imagenes propio restaurante" on storage.objects for insert
  with check (bucket_id = 'platos' and (storage.foldername(name))[1]::uuid in (select mis_restaurantes()));

drop policy if exists "borrar imagenes propio restaurante" on storage.objects;
create policy "borrar imagenes propio restaurante" on storage.objects for delete
  using (bucket_id = 'platos' and (storage.foldername(name))[1]::uuid in (select mis_restaurantes()));

-- ============================================================
-- 3) IMPORTACIÓN DE PRECIOS POR PROVEEDOR (CSV/XLS/XLSX/TXT)
--    Centraliza en SQL lo que el prototipo hacía repartido en varias
--    funciones JS — mismo patrón que calcular_plato(): una sola fuente de
--    verdad para el front. Corre con los privilegios del usuario que llama
--    (NO es security definer), así que sigue respetando tiene_permiso() en
--    cada insert/update de abajo — sin escalada de privilegios.
--
--    p_filas es un jsonb array; cada elemento ya viene filtrado en el
--    cliente (sin las filas marcadas "ignorar") con esta forma:
--    { "accion": "new" | "<ingrediente_id uuid>",
--      "nombre_archivo": text, "unidad_archivo": text,
--      "referencia_archivo": text, "precio_nuevo": numeric }
-- ============================================================
create or replace function importar_precios_proveedor(p_proveedor_id uuid, p_filas jsonb)
returns table(creados int, actualizados int)
language plpgsql as $$
declare
  v_restaurante_id       uuid;
  v_fila                 jsonb;
  v_ingrediente_id       uuid;
  v_precio_anterior      numeric;
  v_proveedor_preferente uuid;
  v_creados              int := 0;
  v_actualizados         int := 0;
begin
  select restaurante_id into v_restaurante_id from proveedores where id = p_proveedor_id;
  if v_restaurante_id is null then
    raise exception 'Proveedor % no encontrado', p_proveedor_id;
  end if;

  for v_fila in select * from jsonb_array_elements(p_filas)
  loop
    if v_fila->>'accion' = 'new' then
      insert into ingredientes (
        restaurante_id, codigo, nombre, unidad, precio_actual, merma_pct,
        proveedor_preferente, ultima_actualizacion, origen_actualizacion
      ) values (
        v_restaurante_id,
        siguiente_codigo_ingrediente(v_restaurante_id),
        coalesce(nullif(v_fila->>'nombre_archivo', ''), nullif(v_fila->>'referencia_archivo', ''), 'Ingrediente sin nombre'),
        coalesce(nullif(v_fila->>'unidad_archivo', ''), 'kg'),
        (v_fila->>'precio_nuevo')::numeric,
        0,
        p_proveedor_id,
        now(),
        'importacion_csv'
      )
      returning id into v_ingrediente_id;
      v_creados := v_creados + 1;
    else
      v_ingrediente_id := (v_fila->>'accion')::uuid;
      v_actualizados := v_actualizados + 1;
    end if;

    select precio into v_precio_anterior
      from ingrediente_proveedor
      where ingrediente_id = v_ingrediente_id and proveedor_id = p_proveedor_id;

    insert into ingrediente_proveedor (ingrediente_id, proveedor_id, referencia_proveedor, precio, fecha_actualizacion)
    values (v_ingrediente_id, p_proveedor_id, nullif(v_fila->>'referencia_archivo', ''), (v_fila->>'precio_nuevo')::numeric, now())
    on conflict (ingrediente_id, proveedor_id) do update
      set precio = excluded.precio,
          referencia_proveedor = excluded.referencia_proveedor,
          fecha_actualizacion = now();

    insert into historial_precios_ingrediente (ingrediente_id, proveedor_id, precio_anterior, precio_nuevo, fecha, origen)
    values (v_ingrediente_id, p_proveedor_id, v_precio_anterior, (v_fila->>'precio_nuevo')::numeric, now(), 'importacion_csv');

    -- Igual que en el prototipo: el precio "oficial" del ingrediente solo se
    -- actualiza si este proveedor es el preferente, o si el ingrediente aún
    -- no tenía ninguno asignado. En el resto de casos el precio queda solo
    -- como una oferta más de este proveedor (visible en Proveedores).
    select proveedor_preferente into v_proveedor_preferente from ingredientes where id = v_ingrediente_id;
    if v_proveedor_preferente is null or v_proveedor_preferente = p_proveedor_id then
      update ingredientes
        set precio_actual = (v_fila->>'precio_nuevo')::numeric,
            ultima_actualizacion = now(),
            origen_actualizacion = 'importacion_csv',
            proveedor_preferente = coalesce(proveedor_preferente, p_proveedor_id)
        where id = v_ingrediente_id;
    end if;
  end loop;

  return query select v_creados, v_actualizados;
end; $$;

-- ============================================================
-- NOTAS DE DISEÑO
-- ============================================================
-- · El parseo del CSV/XLS/XLSX/TXT y el mapeo de columnas siguen ocurriendo
--   en el cliente (necesitan leer el File del navegador) — solo el volcado
--   final a base de datos se centraliza aquí.
-- · proveedor_import_mapping (tabla ya creada en 01_esquema_completo.sql)
--   sigue gestionándose con un simple upsert desde el cliente; no necesita
--   una función dedicada, es una tabla de una sola fila por proveedor.
-- · El bucket "platos" es privado: las URLs de imagen deben servirse via
--   signed URL (createSignedUrl), nunca como URL pública directa.
