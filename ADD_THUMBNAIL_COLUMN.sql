-- Add thumbnail_url column to catalogs table
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update RLS policies (no changes needed, just for reference)
-- Public can read, authenticated can insert/update/delete
