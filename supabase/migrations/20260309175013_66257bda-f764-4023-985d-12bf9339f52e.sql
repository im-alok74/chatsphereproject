ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_message text DEFAULT '' NOT NULL;