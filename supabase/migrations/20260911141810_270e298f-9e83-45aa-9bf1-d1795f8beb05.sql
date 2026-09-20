ALTER TABLE public.production_jobs ADD COLUMN IF NOT EXISTS source_key text;
UPDATE public.production_jobs SET source_key = 'legacy:' || id::text WHERE source_key IS NULL;
ALTER TABLE public.production_jobs ALTER COLUMN source_key SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS production_jobs_source_key_idx ON public.production_jobs(source_key);
DROP INDEX IF EXISTS public.production_jobs_order_method_source_idx;