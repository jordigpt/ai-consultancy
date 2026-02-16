-- Create community_annual_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_annual_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.community_annual_members ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first to avoid conflicts if re-running)
DROP POLICY IF EXISTS "Users can manage their own community members" ON public.community_annual_members;

CREATE POLICY "Users can manage their own community members" ON public.community_annual_members
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure user_settings has the community_monthly_count column
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS community_monthly_count INTEGER DEFAULT 0;

-- Refresh schema cache (notify PostgREST)
NOTIFY pgrst, 'reload schema';