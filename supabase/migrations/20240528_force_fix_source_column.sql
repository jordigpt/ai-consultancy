-- Asegurar que la columna existe
ALTER TABLE public.community_annual_members 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'Skool';

-- Forzar recarga del caché de esquema de API
NOTIFY pgrst, 'reload schema';