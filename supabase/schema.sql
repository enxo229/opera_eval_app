-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text check (role in ('evaluator', 'candidate')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );


-- 2. EVALUATIONS
create table public.evaluations (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid references public.profiles(id) on delete cascade not null,
  evaluator_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'draft' check (status in ('draft', 'completed')),
  score_a numeric(5,2),
  score_b numeric(5,2),
  score_c numeric(5,2),
  score_ia numeric(5,2),
  final_score numeric(5,2),
  classification text,
  ai_insights jsonb
);

alter table public.evaluations enable row level security;

-- Policies for evaluations
-- Evaluators can see all evaluations
create policy "Evaluators can view all evaluations"
  on evaluations for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

-- Candidates can only see their own COMPLETED evaluations
create policy "Candidates can view their own completed evaluations"
  on evaluations for select
  using (
    auth.uid() = candidate_id and status = 'completed'
  );

-- Only evaluators can insert/update evaluations
create policy "Evaluators can insert evaluations"
  on evaluations for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

create policy "Evaluators can update evaluations"
  on evaluations for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
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

-- Policies for dimension_scores
create policy "Evaluators can view all dimension scores"
  on dimension_scores for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

create policy "Candidates can view their own completed dimension scores"
  on dimension_scores for select
  using (
    exists (
      select 1 from evaluations
      where evaluations.id = dimension_scores.evaluation_id
        and evaluations.candidate_id = auth.uid()
        and evaluations.status = 'completed'
    )
  );

create policy "Evaluators can insert dimension scores"
  on dimension_scores for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

create policy "Evaluators can update dimension scores"
  on dimension_scores for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );


-- 4. DYNAMIC TESTS
create table public.dynamic_tests (
  id uuid primary key default uuid_generate_v4(),
  evaluation_id uuid references public.evaluations(id) on delete cascade not null,
  test_type text check (test_type in ('A4_CASE', 'B1_TICKET', 'IA_CHAT')),
  prompt_context text,
  ai_generated_content text,
  candidate_response text
);

alter table public.dynamic_tests enable row level security;

-- Policies for dynamic_tests
create policy "Evaluators can view all dynamic tests"
  on dynamic_tests for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

-- Candidates need to be able to see their own dynamic tests (even in draft to answer them)
create policy "Candidates can view their own dynamic tests"
  on dynamic_tests for select
  using (
    exists (
      select 1 from evaluations
      where evaluations.id = dynamic_tests.evaluation_id
        and evaluations.candidate_id = auth.uid()
    )
  );

create policy "Evaluators can insert dynamic tests"
  on dynamic_tests for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

create policy "Evaluators can update dynamic tests"
  on dynamic_tests for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'evaluator'
    )
  );

-- Candidates can update dynamic tests to save their answers
create policy "Candidates can update their own dynamic tests answers"
  on dynamic_tests for update
  using (
    exists (
      select 1 from evaluations
      where evaluations.id = dynamic_tests.evaluation_id
        and evaluations.candidate_id = auth.uid()
    )
  );
