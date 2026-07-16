-- ============================================================
-- CHEF ONLINE · Endurecer calcular_plato(): fallar alto en vez de
-- propagar NULL en silencio
-- ============================================================
-- Antes: si "select ... into v_plato/v_restaurante" no encontraba fila (p.ej.
-- por un problema de RLS o de integridad referencial), plpgsql dejaba esas
-- variables con TODOS los campos en NULL sin avisar. Eso se propagaba a
-- pvp_base/margen/pvp_recomendado como NULL, y el frontend (fmt() en
-- src/lib/chef/format.ts) reventaba al intentar formatearlos — un fallo
-- silencioso en la base de datos que acababa como un crash confuso en la UI.
--
-- Ahora: si no se encuentra el plato o su restaurante, se lanza una
-- excepción clara con el id implicado, en vez de devolver NULLs. El frontend
-- ya no depende de esto para no crashear (fmt() ya trata null/undefined como
-- 0), pero así un problema real de integridad se ve como error explícito en
-- los logs en vez de esconderse como "0,00 €" sin explicación.
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
  if not found then
    raise exception 'calcular_plato: no existe el plato % (o RLS impide verlo)', p_plato_id;
  end if;

  select * into v_restaurante from restaurantes where id = v_plato.restaurante_id;
  if not found then
    raise exception 'calcular_plato: no se encontró el restaurante % del plato % (posible problema de RLS o de integridad referencial)',
      v_plato.restaurante_id, p_plato_id;
  end if;

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
