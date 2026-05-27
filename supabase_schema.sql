-- Table des Commentaires pour le Portfolio
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    avatar_url TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    likes UUID[] DEFAULT '{}'::UUID[] NOT NULL,
    deleted_by_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activer Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 1. Autoriser la lecture publique des commentaires pour tout le monde
DROP POLICY IF EXISTS "Lecture publique des commentaires" ON public.comments;
CREATE POLICY "Lecture publique des commentaires" 
ON public.comments FOR SELECT 
USING (true);

-- 2. Autoriser l'insertion uniquement pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Insertion pour les utilisateurs connectes" ON public.comments;
CREATE POLICY "Insertion pour les utilisateurs connectes" 
ON public.comments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Autoriser la mise à jour (pour les likes) uniquement pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Mise a jour pour les connectes" ON public.comments;
CREATE POLICY "Mise a jour pour les connectes" 
ON public.comments FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 4. Autoriser la suppression pour l'auteur du commentaire ou l'administrateur
DROP POLICY IF EXISTS "Suppression par auteur ou admin" ON public.comments;
CREATE POLICY "Suppression par auteur ou admin" 
ON public.comments FOR DELETE 
USING (
    auth.uid() = user_id 
    OR (auth.jwt() ->> 'email') = 'caillatlucas2304@gmail.com'
);

-- ==========================================
-- SI LA TABLE EXISTE DEJA (Mise à jour incrémentale), 
-- EXECUTEZ CES COMMANDES DANS VOTRE SQL EDITOR :
-- ==========================================
-- ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
-- ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes UUID[] DEFAULT '{}'::UUID[] NOT NULL;
-- ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS deleted_by_user BOOLEAN DEFAULT FALSE;
-- ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Mise a jour pour les connectes" ON public.comments;
-- CREATE POLICY "Mise a jour pour les connectes" ON public.comments FOR UPDATE USING (auth.role() = 'authenticated');

-- ==========================================
-- POUR LES PROJETS (BLOGS) : AJOUT DE LA COLONNE DETAILS
-- EXECUTEZ CETTE COMMANDE DANS VOTRE SUPABASE SQL EDITOR :
-- ==========================================
-- ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS details TEXT;

