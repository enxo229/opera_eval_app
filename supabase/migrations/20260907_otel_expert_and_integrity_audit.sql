-- Migration: Soporte oficial para track otel_expert, auditoría anti-fraude y tipos de prueba dinámicos

-- 1. Campo profile_track en selection_processes
ALTER TABLE public.selection_processes 
  ADD COLUMN IF NOT EXISTS profile_track text DEFAULT 'general';

-- 2. Contador de bypass de pegado en evaluations
ALTER TABLE public.evaluations 
  ADD COLUMN IF NOT EXISTS bypass_paste_count integer DEFAULT 0;

-- 3. Soporte para decimales en raw_score de dimension_scores (escalas normalizadas)
ALTER TABLE public.dimension_scores 
  ALTER COLUMN raw_score TYPE numeric(5,2);

-- 4. Actualización del constraint de tipos de prueba en dynamic_tests
ALTER TABLE public.dynamic_tests 
  DROP CONSTRAINT IF EXISTS dynamic_tests_test_type_check;

ALTER TABLE public.dynamic_tests 
  ADD CONSTRAINT dynamic_tests_test_type_check 
  CHECK (test_type IN (
    'A4_CASE', 'B1_CASE', 'B1_TICKET', 'IA_CHAT', 
    'TERMINAL_A1', 'TERMINAL_A3', 'TERMINAL_A4', 
    'QUESTIONS_A1', 'QUESTIONS_A2', 'QUESTIONS_A3', 'QUESTIONS_A4', 
    'QUESTIONS_B1', 'QUESTIONS_B2', 'QUESTIONS_C', 
    'PROMPT_IA2', 'TAB_SWITCH_EVENT', 'SECURITY_AUDIT'
  ));

-- 5. Columna ai_likelihood para almacenar probabilidad de IA (0-100%)
ALTER TABLE public.dynamic_tests 
  ADD COLUMN IF NOT EXISTS ai_likelihood integer;
