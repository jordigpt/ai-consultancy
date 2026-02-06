-- Ejecuta este comando en el Editor SQL de Supabase para corregir el error
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS next_followup_date TIMESTAMP WITH TIME ZONE;