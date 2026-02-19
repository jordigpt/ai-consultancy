-- Add source column to community_annual_members
ALTER TABLE community_annual_members 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Skool';

-- Update existing rows to have 'Skool' if they are null (just in case)
UPDATE community_annual_members 
SET source = 'Skool' 
WHERE source IS NULL;