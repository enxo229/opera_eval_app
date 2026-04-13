-- Clean up legal consent redundancy from profiles (moved to evaluations)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS legal_consent_tc,
DROP COLUMN IF EXISTS legal_consent_data,
DROP COLUMN IF EXISTS legal_accepted_at;

-- Add check constraint for national_id_type in profiles
-- Ensure no invalid data exists first (optional: update invalid to null or Pasaporte)
UPDATE public.profiles 
SET national_id_type = 'Pasaporte' 
WHERE national_id_type NOT IN ('CC', 'CE', 'TI', 'PPT', 'PEP', 'Pasaporte')
AND national_id_type IS NOT NULL;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_national_id_type_check 
CHECK (national_id_type IN ('CC', 'CE', 'TI', 'PPT', 'PEP', 'Pasaporte'));
