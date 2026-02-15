-- New catalog system: Each PDF is a separate catalog with multiple pages

-- Drop old table and create new structure
DROP TABLE IF EXISTS catalog_pages CASCADE;

-- Create catalogs table (one row per PDF)
CREATE TABLE catalogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    total_pages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read" ON catalogs FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON catalogs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON catalogs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON catalogs FOR DELETE USING (auth.role() = 'authenticated');
