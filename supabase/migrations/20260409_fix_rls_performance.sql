-- ==========================================================
-- OPTIMIZACIÓN RLS FINAL (CONSOLIDADA E IDEMPOTENTE)
-- Fecha: 2026-04-09
-- ==========================================================

-- 1. PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert/update own profile." ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert/update own profile." ON public.profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);

-- 2. SELECTION_PROCESSES (CONSOLIDACIÓN FINAL)
DROP POLICY IF EXISTS "Evaluators can view all selection processes" ON public.selection_processes;
DROP POLICY IF EXISTS "Evaluators can insert selection processes" ON public.selection_processes;
DROP POLICY IF EXISTS "Evaluators can update selection processes" ON public.selection_processes;
DROP POLICY IF EXISTS "Candidates can view their own selection processes" ON public.selection_processes;
DROP POLICY IF EXISTS "Evaluators can view/manage selection processes" ON public.selection_processes;
DROP POLICY IF EXISTS "Evaluators and owners can view/manage selection processes" ON public.selection_processes;

CREATE POLICY "Evaluators and owners can view/manage selection processes" ON public.selection_processes FOR ALL 
USING (
  candidate_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'evaluator')
);

-- 3. EVALUATIONS
DROP POLICY IF EXISTS "Evaluators can view all evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Candidates can view their own evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Candidates can update their own evaluations (consent and timer)" ON public.evaluations;
DROP POLICY IF EXISTS "Candidates can update their own legal consent" ON public.evaluations;
DROP POLICY IF EXISTS "Evaluators can insert evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Evaluators can update evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Evaluators and owners can view/manage evaluations" ON public.evaluations;

CREATE POLICY "Evaluators and owners can view/manage evaluations" ON public.evaluations FOR ALL 
USING (
  (SELECT auth.uid()) = candidate_id 
  OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'evaluator')
);

-- 4. DIMENSION_SCORES
DROP POLICY IF EXISTS "Evaluators can view all dimension scores" ON public.dimension_scores;
DROP POLICY IF EXISTS "Candidates can view their own completed dimension scores" ON public.dimension_scores;
DROP POLICY IF EXISTS "Evaluators can insert dimension scores" ON public.dimension_scores;
DROP POLICY IF EXISTS "Evaluators can update dimension scores" ON public.dimension_scores;
DROP POLICY IF EXISTS "Evaluators and owners can view/manage dimension scores" ON public.dimension_scores;

CREATE POLICY "Evaluators and owners can view/manage dimension scores" ON public.dimension_scores FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations 
    WHERE evaluations.id = dimension_scores.evaluation_id 
    AND (
      evaluations.candidate_id = (SELECT auth.uid()) 
      OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'evaluator')
    )
  )
);

-- 5. DYNAMIC_TESTS
DROP POLICY IF EXISTS "Evaluators can view all dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Candidates can view their own dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Evaluators can insert dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Evaluators can update dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Candidates can insert their own dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Candidates can update their own dynamic tests answers" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Candidates can delete their own dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Evaluators can delete dynamic tests" ON public.dynamic_tests;
DROP POLICY IF EXISTS "Evaluators and owners can view/manage dynamic tests" ON public.dynamic_tests;

CREATE POLICY "Evaluators and owners can view/manage dynamic tests" ON public.dynamic_tests FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations 
    WHERE evaluations.id = dynamic_tests.evaluation_id 
    AND (
      evaluations.candidate_id = (SELECT auth.uid()) 
      OR 
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'evaluator')
    )
  )
);
