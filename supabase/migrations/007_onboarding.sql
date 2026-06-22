-- Add onboarding tracking to user profiles
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
