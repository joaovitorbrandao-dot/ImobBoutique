-- Migração para bancos que já rodaram o schema.sql original.
-- Rode isso uma vez no SQL Editor do seu projeto Supabase.

-- institutions: troca o campo livre "segment" por "type" com valores fixos
alter table public.institutions drop column if exists segment;
alter table public.institutions add column if not exists type text;
alter table public.institutions drop constraint if exists chk_institutions_type;
alter table public.institutions add constraint chk_institutions_type check (type in
  ('fii','fip','varejo','academia','farmacia','incorporadora','parceiro'));

-- demands: adiciona ABL mínimo e cap rate
alter table public.demands add column if not exists min_abl numeric(12,2);
alter table public.demands add column if not exists cap_rate numeric(5,2);
