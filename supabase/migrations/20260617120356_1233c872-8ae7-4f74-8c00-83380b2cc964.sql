CREATE TABLE public.image_backups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_url text NOT NULL,
  backup_url text NOT NULL,
  backup_path text NOT NULL,
  context text,
  original_filename text,
  content_type text,
  size_bytes bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_image_backups_primary_url ON public.image_backups (primary_url);
CREATE INDEX idx_image_backups_created_at ON public.image_backups (created_at DESC);

GRANT SELECT, INSERT ON public.image_backups TO authenticated;
GRANT ALL ON public.image_backups TO service_role;

ALTER TABLE public.image_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and editors can view backups"
ON public.image_backups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Content creators can insert backups"
ON public.image_backups
FOR INSERT
TO authenticated
WITH CHECK (public.can_create_content());