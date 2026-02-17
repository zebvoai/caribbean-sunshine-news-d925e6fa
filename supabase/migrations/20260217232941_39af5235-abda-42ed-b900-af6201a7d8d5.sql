
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'reporter');
CREATE TYPE public.publication_status AS ENUM ('draft', 'published', 'scheduled');
CREATE TYPE public.social_platform AS ENUM ('instagram', 'twitter', 'youtube', 'tiktok', 'spotify', 'facebook');

-- ============================================================
-- USER ROLES TABLE (separate from profiles — security best practice)
-- ============================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: current user has role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- Can create/edit content = admin or editor or reporter
CREATE OR REPLACE FUNCTION public.can_create_content()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor', 'reporter')
  )
$$;

-- Can publish = admin or editor only
CREATE OR REPLACE FUNCTION public.can_publish()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AUTHORS TABLE (linked to auth.users)
-- ============================================================
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role app_role NOT NULL DEFAULT 'reporter',
  avatar_url text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors are viewable by authenticated users"
  ON public.authors FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authors can update own profile"
  ON public.authors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all authors"
  ON public.authors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage categories"
  ON public.categories FOR ALL
  USING (public.can_publish());

-- Seed default categories
INSERT INTO public.categories (name, slug) VALUES
  ('Caribbean', 'caribbean'),
  ('Dominica', 'dominica'),
  ('Entertainment', 'entertainment'),
  ('News', 'news'),
  ('Politics', 'politics'),
  ('Sports', 'sports'),
  ('Weather', 'weather');

-- ============================================================
-- ARTICLES TABLE
-- ============================================================
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_image_alt text,
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  primary_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_breaking boolean NOT NULL DEFAULT false,
  publication_status publication_status NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Published articles are publicly readable
CREATE POLICY "Published articles are publicly readable"
  ON public.articles FOR SELECT
  USING (publication_status = 'published');

-- Authenticated content creators can view all articles
CREATE POLICY "Content creators can view all articles"
  ON public.articles FOR SELECT TO authenticated
  USING (public.can_create_content());

-- Content creators can insert articles
CREATE POLICY "Content creators can create articles"
  ON public.articles FOR INSERT TO authenticated
  WITH CHECK (public.can_create_content());

-- Authors can update their own articles; admins/editors can update all
CREATE POLICY "Authors can update own articles"
  ON public.articles FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR public.can_publish()
  );

-- Only admins can delete
CREATE POLICY "Admins can delete articles"
  ON public.articles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ARTICLE CATEGORIES (many-to-many)
-- ============================================================
CREATE TABLE public.article_categories (
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (article_id, category_id)
);

ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Article categories are publicly readable"
  ON public.article_categories FOR SELECT USING (true);

CREATE POLICY "Content creators can manage article categories"
  ON public.article_categories FOR ALL TO authenticated
  USING (public.can_create_content());

-- ============================================================
-- SOCIAL EMBEDS TABLE
-- ============================================================
CREATE TABLE public.social_embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  platform social_platform NOT NULL,
  embed_url text,
  embed_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_embeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social embeds are publicly readable"
  ON public.social_embeds FOR SELECT USING (true);

CREATE POLICY "Content creators can manage social embeds"
  ON public.social_embeds FOR ALL TO authenticated
  USING (public.can_create_content());

-- ============================================================
-- STORAGE: article-images bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

CREATE POLICY "Article images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'article-images' AND public.can_create_content());

CREATE POLICY "Authenticated users can update article images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'article-images' AND public.can_create_content());

CREATE POLICY "Admins can delete article images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'article-images' AND public.can_publish());
