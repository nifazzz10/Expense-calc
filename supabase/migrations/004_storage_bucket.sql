-- Drop the NOT NULL constraint on storage_path — PDFs are parsed locally, not stored
ALTER TABLE public.statements ALTER COLUMN storage_path DROP NOT NULL;
