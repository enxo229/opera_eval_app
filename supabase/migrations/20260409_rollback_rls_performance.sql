-- ==========================================================
-- SCRIPT DE REVERSIÓN RLS (Volver a Estado Original)
-- Fecha: 2026-04-09
-- ==========================================================

-- 1. Revertir PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert/update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Revertir SELECTION_PROCESSES
DROP POLICY IF EXISTS "Evaluators can view/manage selection processes" ON public.selection_processes;
DROP POLICY IF EXISTS "Candidates can view their own selection processes" ON public.selection_processes;

CREATE POLICY "Evaluators can view all selection processes" ON selection_processes FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Evaluators can insert selection processes" ON selection_processes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Evaluators can update selection processes" ON selection_processes FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Candidates can view their own selection processes" ON selection_processes FOR SELECT USING (candidate_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 3. Revertir EVALUATIONS
DROP POLICY IF EXISTS "Evaluators and owners can view/manage evaluations" ON public.evaluations;

CREATE POLICY "Evaluators can view all evaluations" ON evaluations FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Candidates can view their own evaluations" ON evaluations FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Candidates can update their own evaluations (consent and timer)" ON evaluations FOR UPDATE USING (auth.uid() = candidate_id);
CREATE POLICY "Evaluators can insert evaluations" ON evaluations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Evaluators can update evaluations" ON evaluations FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Candidates can update their own legal consent" ON evaluations FOR UPDATE USING (auth.uid() = candidate_id);

-- 4. Revertir DIMENSION_SCORES
DROP POLICY IF EXISTS "Evaluators and owners can view/manage dimension scores" ON public.dimension_scores;

CREATE POLICY "Evaluators can view all dimension scores" ON dimension_scores FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Candidates can view their own completed dimension scores" ON dimension_scores FOR SELECT USING (EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = dimension_scores.evaluation_id AND evaluations.candidate_id = auth.uid() AND evaluations.status = 'completed'));
CREATE POLICY "Evaluators can insert dimension scores" ON dimension_scores FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Evaluators can update dimension scores" ON dimension_scores FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));

-- 5. Revertir DYNAMIC_TESTS
DROP POLICY IF EXISTS "Evaluators and owners can view/manage dynamic tests" ON public.dynamic_tests;

CREATE POLICY "Evaluators can view all dynamic tests" ON dynamic_tests FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Candidates can view their own dynamic tests" ON dynamic_tests FOR SELECT USING (EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = dynamic_tests.evaluation_id AND evaluations.candidate_id = auth.uid()));
CREATE POLICY "Evaluators can insert dynamic tests" ON dynamic_tests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Evaluators can update dynamic tests" ON dynamic_tests FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
CREATE POLICY "Candidates can insert their own dynamic tests" ON dynamic_tests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = dynamic_tests.evaluation_id AND evaluations.candidate_id = auth.uid()));
CREATE POLICY "Candidates can update their own dynamic tests answers" ON dynamic_tests FOR UPDATE USING (EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = dynamic_tests.evaluation_id AND evaluations.candidate_id = auth.uid()));
CREATE POLICY "Candidates can delete their own dynamic tests" ON dynamic_tests FOR DELETE USING (EXISTS (SELECT 1 FROM evaluations WHERE evaluations.id = dynamic_tests.evaluation_id AND evaluations.candidate_id = auth.uid()));
CREATE POLICY "Evaluators can delete dynamic tests" ON dynamic_tests FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'evaluator'));
