-- Add WhatsApp configuration to site_content table
-- Run this in Supabase SQL Editor

-- Remove old LinkedIn social link if exists
DELETE FROM site_content WHERE key = 'social_linkedin';

-- Add WhatsApp number field
INSERT INTO site_content (key, value, created_at, updated_at)
VALUES ('whatsapp_number', '', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Add WhatsApp greeting message field
INSERT INTO site_content (key, value, created_at, updated_at)
VALUES ('whatsapp_greeting', 'Merhaba! 👋<br>Size nasıl yardımcı olabiliriz?', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- Verify the changes
SELECT key, value FROM site_content WHERE key IN ('whatsapp_number', 'whatsapp_greeting');
