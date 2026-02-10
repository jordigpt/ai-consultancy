-- Crear tabla para múltiples roadmaps
CREATE TABLE IF NOT EXISTS public.student_roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.student_roadmaps ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
DROP POLICY IF EXISTS "Users can view their own student roadmaps" ON public.student_roadmaps;
CREATE POLICY "Users can view their own student roadmaps"
ON public.student_roadmaps FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own student roadmaps" ON public.student_roadmaps;
CREATE POLICY "Users can insert their own student roadmaps"
ON public.student_roadmaps FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own student roadmaps" ON public.student_roadmaps;
CREATE POLICY "Users can delete their own student roadmaps"
ON public.student_roadmaps FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- FORZAR RECARGA DEL CACHÉ (IMPORTANTE)
NOTIFY pgrst, 'reload config';