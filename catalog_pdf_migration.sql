-- Update catalog_pages table to support PDF files

-- First, make image_url nullable
ALTER TABLE catalog_pages 
ALTER COLUMN image_url DROP NOT NULL;

-- Add new columns
ALTER TABLE catalog_pages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image';

-- Migrate existing data
UPDATE catalog_pages 
SET file_url = image_url, 
    file_type = 'image' 
WHERE file_url IS NULL AND image_url IS NOT NULL;
