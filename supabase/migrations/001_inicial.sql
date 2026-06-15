-- ============================================
-- MASCOTAS CRM — Migración inicial
-- ============================================

-- 1. TABLA: usuarios
create table public.usuarios (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text not null unique,
  nombre    text not null,
  rol       text not null check (rol in ('operario', 'admin')),
  activo    boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.usuarios enable row level security;

-- 2. TABLA: pedidos
create table public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  crm_ref          text not null,
  estado           text not null default 'pendiente'
                     check (estado in ('pendiente', 'en_progreso', 'completado')),
  operario_id      uuid references public.usuarios(id) on delete set null,
  creado_por       uuid references public.usuarios(id) on delete set null,
  creado_en        timestamptz not null default now(),
  iniciado_en      timestamptz,
  finalizado_en    timestamptz,
  tiempo_total_seg integer not null default 0,
  total_skus       integer not null default 0,
  peso_total_kg    numeric(10,2) not null default 0
);

alter table public.pedidos enable row level security;

-- 3. TABLA: items_pedido
create table public.items_pedido (
  id                  uuid primary key default gen_random_uuid(),
  pedido_id           uuid not null references public.pedidos(id) on delete cascade,
  sku                 text not null,
  descripcion         text not null,
  cantidad_esperada   numeric(10,2) not null,
  cantidad_confirmada numeric(10,2),
  peso_kg             numeric(10,2) not null default 0,
  estado              text not null default 'pendiente'
                        check (estado in ('pendiente', 'confirmado', 'con_diferencia')),
  observaciones       text not null default '',
  confirmado_en       timestamptz,
  orden               integer not null default 0
);

alter table public.items_pedido enable row level security;

-- ============================================
-- RLS POLICIES
-- ============================================

-- USUARIOS: solo lectura para usuarios autenticados
create policy "usuarios_select_own"
  on public.usuarios for select
  using (auth.uid() = id);

create policy "usuarios_select_admin"
  on public.usuarios for select
  using (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

-- PEDIDOS: operario ve/edita solo los propios, admin todo
create policy "pedidos_select_operario"
  on public.pedidos for select
  using (operario_id = auth.uid());

create policy "pedidos_select_admin"
  on public.pedidos for select
  using (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

create policy "pedidos_insert_admin"
  on public.pedidos for insert
  with check (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

create policy "pedidos_update_operario"
  on public.pedidos for update
  using (operario_id = auth.uid())
  with check (operario_id = auth.uid());

create policy "pedidos_update_admin"
  on public.pedidos for update
  using (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

-- ITEMS: heredan permisos del pedido padre
create policy "items_select_operario"
  on public.items_pedido for select
  using (exists (
    select 1 from public.pedidos
    where pedidos.id = items_pedido.pedido_id
    and pedidos.operario_id = auth.uid()
  ));

create policy "items_select_admin"
  on public.items_pedido for select
  using (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

create policy "items_insert_admin"
  on public.items_pedido for insert
  with check (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

create policy "items_update_operario"
  on public.items_pedido for update
  using (exists (
    select 1 from public.pedidos
    where pedidos.id = items_pedido.pedido_id
    and pedidos.operario_id = auth.uid()
  ));

create policy "items_update_admin"
  on public.items_pedido for update
  using (exists (select 1 from public.usuarios where id = auth.uid() and rol = 'admin'));

-- ============================================
-- REALTIME
-- ============================================
alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.items_pedido;

-- ============================================
-- TRIGGER: crear usuario al registrarse
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'rol', 'operario')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
