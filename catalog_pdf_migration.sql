-- Complete migration for catalog_pages table to support PDF uploads
-- Run this entire script in Supabase SQL Editor

-- Step 1: Make image_url nullable (if it exists and is NOT NULL)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalog_pages' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE catalog_pages ALTER COLUMN image_url DROP NOT NULL;
    END IF;
END $$;

-- Step 2: Add new columns if they don't exist
ALTER TABLE catalog_pages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS catalog_name TEXT;

-- Step 3: Migrate existing data
UPDATE catalog_pages 
SET file_url = image_url, 
    file_type = 'image' 
WHERE file_url IS NULL AND image_url IS NOT NULL;

-- Step 4: Set default catalog name for existing entries
UPDATE catalog_pages 
SET catalog_name = 'Katalog ' || page_number::text
WHERE catalog_name IS NULL;
