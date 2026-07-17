-- ImobBoutique — schema completo. Rode este script no SQL Editor de um projeto
-- Supabase NOVO e SEPARADO (não reaproveite o projeto da Stegion-LOW: os dados
-- de imóveis/carteira institucional não podem se misturar com dados de vendas).

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- 1. institutions (Carteira de Clientes)
create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in
    ('fii','fip','varejo','academia','farmacia','incorporadora','parceiro')),
  notes text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_institutions_updated_at before update on public.institutions
  for each row execute function set_updated_at();
create index if not exists idx_institutions_name on public.institutions (lower(name));
alter table public.institutions enable row level security;
create policy "authenticated_full_access" on public.institutions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2. institution_contacts (1:N — múltiplos contatos por cliente)
create table if not exists public.institution_contacts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  role_title text default '',
  email text default '',
  phone text default '',
  is_primary boolean not null default false,
  notes text default '',
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_institution_contacts_institution_id on public.institution_contacts (institution_id);
alter table public.institution_contacts enable row level security;
create policy "authenticated_full_access" on public.institution_contacts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 3. demands (Demandas) — pertence a exatamente uma instituição
create table if not exists public.demands (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  asset_type text not null check (asset_type in
    ('galpao','laje_corporativa','escritorio','terreno','varejo','industrial','hotel','outro')),
  min_abl numeric(12,2),
  budget_min numeric(14,2),
  budget_max numeric(14,2),
  cap_rate numeric(5,2),
  region text default '',
  status text not null default 'aberta' check (status in ('aberta','em_atendimento','atendida','cancelada')),
  notes text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint chk_demands_budget_range check (budget_min is null or budget_max is null or budget_min <= budget_max)
);
create trigger trg_demands_updated_at before update on public.demands
  for each row execute function set_updated_at();
create index if not exists idx_demands_institution_id on public.demands (institution_id);
create index if not exists idx_demands_status on public.demands (status);
alter table public.demands enable row level security;
create policy "authenticated_full_access" on public.demands for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 4. assets (Cadastro de Ativos)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in
    ('galpao','laje_corporativa','escritorio','terreno','varejo','industrial','hotel','outro')),
  address text not null,
  area_m2 numeric(12,2),
  price numeric(14,2),
  cap_rate numeric(5,2),
  owner_name text default '',
  drive_link text default '',
  status text not null default 'disponivel' check (status in
    ('disponivel','em_negociacao','reservado','indisponivel')),
  notes text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_assets_updated_at before update on public.assets
  for each row execute function set_updated_at();
create index if not exists idx_assets_type on public.assets (type);
create index if not exists idx_assets_status on public.assets (status);
alter table public.assets enable row level security;
create policy "authenticated_full_access" on public.assets for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 5. pipeline_stages — colunas do Kanban
create table if not exists public.pipeline_stages (
  key text primary key,
  label text not null,
  color text not null default 'slate',
  sort_order integer not null,
  is_closed_won boolean not null default false,
  is_closed_lost boolean not null default false
);
alter table public.pipeline_stages enable row level security;
create policy "authenticated_full_access" on public.pipeline_stages for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
insert into public.pipeline_stages (key, label, color, sort_order, is_closed_won, is_closed_lost) values
  ('prospeccao',   'Prospecção',         'slate',   1, false, false),
  ('qualificacao', 'Qualificação',       'indigo',  2, false, false),
  ('proposta',     'Proposta Enviada',   'amber',   3, false, false),
  ('negociacao',   'Negociação',         'blue',    4, false, false),
  ('ganho',        'Fechamento Ganho',   'emerald', 5, true,  false),
  ('perdido',      'Fechamento Perdido', 'red',     6, false, true)
on conflict (key) do nothing;

-- 6. deals (Pipeline de Negociação)
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  demand_id uuid not null references public.demands(id) on delete restrict,
  contact_id uuid references public.institution_contacts(id) on delete set null,
  stage_key text not null default 'prospeccao' references public.pipeline_stages(key) on delete restrict,
  board_position integer not null default 0,
  value numeric(14,2) default 0,
  probability integer default 50 check (probability between 0 and 100),
  expected_close_date date,
  drive_link text default '',
  notes text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_deals_updated_at before update on public.deals
  for each row execute function set_updated_at();
create index if not exists idx_deals_institution_id on public.deals (institution_id);
create index if not exists idx_deals_demand_id on public.deals (demand_id);
create index if not exists idx_deals_contact_id on public.deals (contact_id);
create index if not exists idx_deals_stage_key on public.deals (stage_key, board_position);
alter table public.deals enable row level security;
create policy "authenticated_full_access" on public.deals for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 7. deal_assets — M:N deal <-> asset
create table if not exists public.deal_assets (
  deal_id uuid not null references public.deals(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (deal_id, asset_id)
);
create index if not exists idx_deal_assets_asset_id on public.deal_assets (asset_id);
alter table public.deal_assets enable row level security;
create policy "authenticated_full_access" on public.deal_assets for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 8. deal_calendar_events — ponteiro leve para o evento real do Google Calendar
create table if not exists public.deal_calendar_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  google_event_id text not null,
  title_snapshot text default '',
  start_snapshot timestamptz,
  html_link text default '',
  hangout_link text default '',
  created_at timestamptz not null default timezone('utc', now()),
  unique (deal_id, google_event_id)
);
create index if not exists idx_deal_calendar_events_deal_id on public.deal_calendar_events (deal_id);
alter table public.deal_calendar_events enable row level security;
create policy "authenticated_full_access" on public.deal_calendar_events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
