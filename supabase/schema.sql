-- ================================================
-- OTP — Schema SQL (Synced with Production DB)
-- Last verified: 2026-04-07
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Helper: Retrieve email from auth.users (exposed as RPC via PostgREST)
create or replace function public.get_user_email(user_id uuid)
returns text
language sql
security definer
set search_path = ''
as $$
  select email from auth.users where id = user_id;
$$;

-- 1. PROFILES
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text check (role in ('evaluator', 'candidate')),
  education_level text,
  national_id_type text check (national_id_type in ('CC', 'CE', 'TI', 'PPT', 'PEP', 'Pasaporte')), -- Tipo de documento
  national_id text,           -- Número de identificación nacional
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert/update own profile."
  on profiles for insert
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );



-- 1.5 SELECTION PROCESSES
create table public.selection_processes (
  id uuid primary key default uuid_generate_v4(),
  candidate_email text not null,
  candidate_national_id text,  -- Denormalized for historical search
  evaluator_id uuid references public.profiles(id) on delete set null,
  team text,
  observations text,
  status text default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz default now()
);

alter table public.selection_processes enable row level security;

-- Policies for selection_processes
create policy "Evaluators and owners can view/manage selection processes"
  on selection_processes for all
  using (
    candidate_email = (auth.jwt() ->> 'email')
    OR
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'evaluator'
    )
  );

-- 2. EVALUATIONS
create table public.evaluations (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.profiles(id) on delete set null,
  evaluator_id uuid references public.profiles(id) on delete set null,
  selection_process_id uuid references public.selection_processes(id) on delete cascade,
  status text default 'draft' check (status in ('draft', 'completed')),
  score_a numeric(5,2),
  score_b numeric(5,2),
  score_c numeric(5,2),
  score_ia numeric(5,2),
  final_score numeric(5,2),
  classification text,
  ai_insights jsonb,
  final_feedback_ai jsonb,
  completed_at timestamptz,
  legal_consent_tc boolean default false,
  legal_consent_data boolean default false,
  legal_accepted_at timestamptz,
  started_at timestamptz,
  test_duration_minutes int default 60,
  paused_at timestamptz,
  total_paused_ms bigint default 0,
  pause_count int default 0
);

alter table public.evaluations enable row level security;

-- Policies for evaluations
create policy "Evaluators and owners can view/manage evaluations"
  on evaluations for all
  using (
    (select auth.uid()) = candidate_id
    OR
    exists (
      select 1 from profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'evaluator'
    )
  );


-- 3. DIMENSION SCORES
create table public.dimension_scores (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  dimension text check (dimension in ('A', 'B', 'C', 'IA')),
  category text not null,
  raw_score integer not null,
  comments text
);

alter table public.dimension_scores enable row level security;

create policy "Evaluators and owners can view/manage dimension scores"
  on dimension_scores for all
  using (
    exists (
      select 1 from evaluations
      where evaluations.id = dimension_scores.evaluation_id
        and (evaluations.candidate_id = (select auth.uid()) OR exists (
          select 1 from profiles where profiles.id = (select auth.uid()) and profiles.role = 'evaluator'
        ))
    )
  );


-- 4. DYNAMIC TESTS
create table public.dynamic_tests (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  test_type text check (test_type in ('A4_CASE', 'B1_CASE', 'B1_TICKET', 'IA_CHAT', 'TERMINAL_A1', 'TERMINAL_A3', 'TERMINAL_A4', 'QUESTIONS_A1', 'QUESTIONS_A2', 'QUESTIONS_A3', 'QUESTIONS_A4', 'QUESTIONS_B1', 'PROMPT_IA2')),
  subcategory text,          -- e.g. 'A1.1', 'A1.2', 'A2.3' for per-subcategory questions
  prompt_context text,
  ai_generated_content text,
  candidate_response text,
  ai_score integer,          -- AI-suggested score (0-3 for dim A, etc)
  ai_justification text      -- AI explanation for the score
);

alter table public.dynamic_tests enable row level security;

-- Policies for dynamic_tests
create policy "Evaluators and owners can view/manage dynamic tests"
  on dynamic_tests for all
  using (
    exists (
      select 1 from evaluations
      where evaluations.id = dynamic_tests.evaluation_id
        and (evaluations.candidate_id = (select auth.uid()) OR exists (
          select 1 from profiles where profiles.id = (select auth.uid()) and profiles.role = 'evaluator'
        ))
    )
  );
