
-- Drop existing insert policy and recreate to also allow anon (unauthenticated) uploads
-- since admin panel may not require auth yet
DROP POLICY IF EXISTS "Authenticated users can upload article images" ON storage.objects;

CREATE POLICY "Anyone can upload article images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'article-images');
