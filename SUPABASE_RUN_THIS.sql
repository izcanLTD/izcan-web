-- SUPABASE SQL EDITOR'DA BU KOMUTU ÇALIŞTIR
-- Bu komut image_url kolonunu nullable yapar

ALTER TABLE catalog_pages ALTER COLUMN image_url DROP NOT NULL;

-- Sonra bu komutları da çalıştır (yeni kolonlar için)
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'image';
ALTER TABLE catalog_pages ADD COLUMN IF NOT EXISTS catalog_name TEXT;

-- Mevcut verileri migrate et
UPDATE catalog_pages SET file_url = image_url, file_type = 'image' WHERE file_url IS NULL AND image_url IS NOT NULL;
UPDATE catalog_pages SET catalog_name = 'Katalog ' || page_number::text WHERE catalog_name IS NULL;
