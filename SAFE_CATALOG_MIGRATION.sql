-- Eski catalog_pages tablosunu sil (eğer varsa)
DROP TABLE IF EXISTS catalog_pages CASCADE;

-- catalogs tablosu zaten var, sadece kontrol et
-- Eğer eksik kolonlar varsa ekle
DO $$ 
BEGIN
    -- name kolonu kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalogs' AND column_name = 'name'
    ) THEN
        ALTER TABLE catalogs ADD COLUMN name TEXT NOT NULL DEFAULT 'Katalog';
    END IF;
    
    -- pdf_url kolonu kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalogs' AND column_name = 'pdf_url'
    ) THEN
        ALTER TABLE catalogs ADD COLUMN pdf_url TEXT NOT NULL DEFAULT '';
    END IF;
    
    -- total_pages kolonu kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalogs' AND column_name = 'total_pages'
    ) THEN
        ALTER TABLE catalogs ADD COLUMN total_pages INTEGER DEFAULT 0;
    END IF;
    
    -- created_at kolonu kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'catalogs' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE catalogs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- RLS politikalarını kontrol et ve ekle
DO $$
BEGIN
    -- RLS'i etkinleştir
    ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
    
    -- Mevcut politikaları sil (varsa)
    DROP POLICY IF EXISTS "Allow public read" ON catalogs;
    DROP POLICY IF EXISTS "Allow authenticated insert" ON catalogs;
    DROP POLICY IF EXISTS "Allow authenticated update" ON catalogs;
    DROP POLICY IF EXISTS "Allow authenticated delete" ON catalogs;
    
    -- Yeni politikalar oluştur
    CREATE POLICY "Allow public read" ON catalogs FOR SELECT USING (true);
    CREATE POLICY "Allow authenticated insert" ON catalogs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated update" ON catalogs FOR UPDATE USING (auth.role() = 'authenticated');
    CREATE POLICY "Allow authenticated delete" ON catalogs FOR DELETE USING (auth.role() = 'authenticated');
END $$;
