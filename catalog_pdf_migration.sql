-- Update catalog_pages table to support PDF files
ALTER TABLE catalog_pages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image';

-- Migrate existing data
UPDATE catalog_pages 
SET file_url = image_url, 
    file_type = 'image' 
WHERE file_url IS NULL;
