-- 1. Agregar columna para el contador de miembros mensuales en user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS community_monthly_count INTEGER DEFAULT 0;

-- 2. Crear la tabla para miembros anuales
CREATE TABLE IF NOT EXISTS public.community_annual_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar seguridad (RLS)
ALTER TABLE public.community_annual_members ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso (CRUD) para que cada usuario solo vea/edite sus datos
CREATE POLICY "Users can view their own community members" 
ON public.community_annual_members FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own community members" 
ON public.community_annual_members FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community members" 
ON public.community_annual_members FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community members" 
ON public.community_annual_members FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);