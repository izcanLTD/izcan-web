-- Create catalog_pages table for flipbook catalog
CREATE TABLE IF NOT EXISTS catalog_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_number INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE catalog_pages ENABLE ROW LEVEL SECURITY;

-- Allow public to read catalog pages
CREATE POLICY "Allow public read access" ON catalog_pages
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert" ON catalog_pages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON catalog_pages
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON catalog_pages
    FOR DELETE USING (auth.role() = 'authenticated');
