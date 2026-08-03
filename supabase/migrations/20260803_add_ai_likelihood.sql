-- Migration: Add ai_likelihood to dynamic_tests table
ALTER TABLE public.dynamic_tests ADD COLUMN IF NOT EXISTS ai_likelihood integer;
