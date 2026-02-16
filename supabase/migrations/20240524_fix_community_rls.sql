-- Asegurar que la tabla existe
CREATE TABLE IF NOT EXISTS public.community_annual_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  amount_paid NUMERIC DEFAULT 348,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que la columna en user_settings existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'community_monthly_count') THEN
        ALTER TABLE public.user_settings ADD COLUMN community_monthly_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Resetear RLS para evitar conflictos
ALTER TABLE public.community_annual_members ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen para evitar duplicados
DROP POLICY IF EXISTS "Users can manage their own community members" ON public.community_annual_members;
DROP POLICY IF EXISTS "community_select" ON public.community_annual_members;
DROP POLICY IF EXISTS "community_insert" ON public.community_annual_members;
DROP POLICY IF EXISTS "community_update" ON public.community_annual_members;
DROP POLICY IF EXISTS "community_delete" ON public.community_annual_members;

-- Crear políticas explícitas (Best Practice)
CREATE POLICY "community_select" ON public.community_annual_members
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "community_insert" ON public.community_annual_members
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_update" ON public.community_annual_members
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "community_delete" ON public.community_annual_members
FOR DELETE TO authenticated USING (auth.uid() = user_id);