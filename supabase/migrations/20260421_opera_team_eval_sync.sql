-- ==========================================================
-- MIGRATION: Opera Team Eval Synchronization
-- Date: 2026-08-21
-- Adds tab_switch_count, TAB_SWITCH_EVENT test_type,
-- check constraint support for dimension D/IA, and performance indexes.
-- ==========================================================

-- 1. EVALUATIONS: Add tab_switch_count
alter table public.evaluations 
add column if not exists tab_switch_count int default 0;

-- 2. DIMENSION_SCORES: Update check constraint to allow 'A', 'B', 'C', 'IA', 'D'
alter table public.dimension_scores 
drop constraint if exists dimension_scores_dimension_check;

alter table public.dimension_scores 
add constraint dimension_scores_dimension_check check (dimension in ('A', 'B', 'C', 'IA', 'D'));

-- 3. DYNAMIC_TESTS: Update check constraint to include TAB_SWITCH_EVENT
alter table public.dynamic_tests 
drop constraint if exists dynamic_tests_test_type_check;

alter table public.dynamic_tests 
add constraint dynamic_tests_test_type_check check (
  test_type in (
    'A4_CASE', 
    'B1_CASE', 
    'B1_TICKET', 
    'IA_CHAT', 
    'TERMINAL_A1', 
    'TERMINAL_A3', 
    'TERMINAL_A4', 
    'QUESTIONS_A1', 
    'QUESTIONS_A2', 
    'QUESTIONS_A3', 
    'QUESTIONS_A4', 
    'QUESTIONS_B1', 
    'PROMPT_IA2', 
    'TAB_SWITCH_EVENT'
  )
);

-- 4. PERFORMANCE INDEXES
create index if not exists idx_selection_processes_candidate_email on public.selection_processes(candidate_email);
create index if not exists idx_evaluations_candidate_id on public.evaluations(candidate_id);
create index if not exists idx_evaluations_selection_process_id on public.evaluations(selection_process_id);
create index if not exists idx_dimension_scores_eval_id on public.dimension_scores(evaluation_id);
create index if not exists idx_dynamic_tests_eval_id on public.dynamic_tests(evaluation_id);
create index if not exists idx_dynamic_tests_test_type on public.dynamic_tests(test_type);
