-- ============================================
-- MASCOTAS CRM — FIX RLS
-- Reemplazar políticas que causan recursión
-- infinita con función security definer
-- ============================================

-- 1. Función helper (evita recursión RLS)
create or replace function public.es_admin()
returns boolean language sql security definer stable
as $$ select exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin') $$;

-- 2. Eliminar políticas viejas
drop policy if exists "usuarios_select_admin" on public.usuarios;
drop policy if exists "pedidos_select_admin" on public.pedidos;
drop policy if exists "pedidos_insert_admin" on public.pedidos;
drop policy if exists "pedidos_update_admin" on public.pedidos;
drop policy if exists "items_select_admin" on public.items_pedido;
drop policy if exists "items_insert_admin" on public.items_pedido;
drop policy if exists "items_update_admin" on public.items_pedido;
drop policy if exists "pedidos_update_operario" on public.pedidos;
drop policy if exists "items_update_operario" on public.items_pedido;

-- 3. Nuevas políticas de admin (usan es_admin())
create policy "usuarios_select_admin" on public.usuarios for select using (public.es_admin());
create policy "pedidos_select_admin" on public.pedidos for select using (public.es_admin());
create policy "pedidos_insert_admin" on public.pedidos for insert with check (public.es_admin());
create policy "pedidos_update_admin" on public.pedidos for update using (public.es_admin());
create policy "items_select_admin" on public.items_pedido for select using (public.es_admin());
create policy "items_insert_admin" on public.items_pedido for insert with check (public.es_admin());
create policy "items_update_admin" on public.items_pedido for update using (public.es_admin());

-- 4. Políticas de operario
create policy "pedidos_update_operario"
  on public.pedidos for update
  using (operario_id = auth.uid())
  with check (operario_id = auth.uid());

create policy "items_update_operario"
  on public.items_pedido for update
  using (exists (select 1 from public.pedidos where pedidos.id = items_pedido.pedido_id and pedidos.operario_id = auth.uid()));
