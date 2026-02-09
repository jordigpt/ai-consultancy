-- 1. Asegurar que la tabla existe
CREATE TABLE IF NOT EXISTS public.deep_work_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS (Seguridad)
ALTER TABLE public.deep_work_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Recrear políticas de seguridad
DROP POLICY IF EXISTS "Users can view their own deep work sessions" ON public.deep_work_sessions;
CREATE POLICY "Users can view their own deep work sessions"
ON public.deep_work_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own deep work sessions" ON public.deep_work_sessions;
CREATE POLICY "Users can insert their own deep work sessions"
ON public.deep_work_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own deep work sessions" ON public.deep_work_sessions;
CREATE POLICY "Users can delete their own deep work sessions"
ON public.deep_work_sessions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. FORZAR RECARGA DEL CACHÉ DE API
NOTIFY pgrst, 'reload config';