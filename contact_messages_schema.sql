-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    replied_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit form)
CREATE POLICY "Allow public insert" ON contact_messages
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Allow authenticated read" ON contact_messages
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only authenticated users can update
CREATE POLICY "Allow authenticated update" ON contact_messages
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "Allow authenticated delete" ON contact_messages
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
