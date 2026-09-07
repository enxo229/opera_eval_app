-- ==========================================================
-- MIGRATION: Teams Catalog & Normalization
-- Date: 2026-08-23
-- Creates public.teams table with RLS and official teams seed.
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Teams are viewable by everyone'
  ) THEN
    CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'teams' AND policyname = 'Evaluators can manage teams'
  ) THEN
    CREATE POLICY "Evaluators can manage teams" ON public.teams FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'evaluator'
      )
    );
  END IF;
END $$;
