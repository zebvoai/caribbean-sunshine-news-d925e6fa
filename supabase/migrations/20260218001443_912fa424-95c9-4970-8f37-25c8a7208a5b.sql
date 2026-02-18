
-- Add view_count column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Create a security definer function to increment view count safely
-- This bypasses RLS so anyone can increment a view count on published articles
CREATE OR REPLACE FUNCTION public.increment_article_view(article_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.articles
  SET view_count = view_count + 1
  WHERE slug = article_slug
    AND publication_status = 'published';
END;
$$;

-- Grant execute to anonymous users
GRANT EXECUTE ON FUNCTION public.increment_article_view(text) TO anon, authenticated;
