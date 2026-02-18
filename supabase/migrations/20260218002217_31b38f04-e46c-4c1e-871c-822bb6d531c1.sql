
-- Allow anon users to insert and update articles (temporary until auth is added)
-- Drop the existing restrictive insert policy and replace with one that allows anon
DROP POLICY IF EXISTS "Content creators can create articles" ON public.articles;
CREATE POLICY "Anyone can create articles"
ON public.articles
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon to update articles (needed for publish without session)
DROP POLICY IF EXISTS "Authors can update own articles" ON public.articles;
CREATE POLICY "Anyone can update articles"
ON public.articles
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
