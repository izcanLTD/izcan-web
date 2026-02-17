-- Add WhatsApp configuration to site_content table
-- Run this in Supabase SQL Editor

-- Remove old LinkedIn social link if exists
DELETE FROM site_content WHERE key = 'social_linkedin';

-- Add WhatsApp number field
INSERT INTO site_content (key, value)
VALUES ('whatsapp_number', '')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add WhatsApp greeting message field
INSERT INTO site_content (key, value)
VALUES ('whatsapp_greeting', 'Merhaba! 👋<br>Size nasıl yardımcı olabiliriz?')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verify the changes
SELECT key, value FROM site_content WHERE key IN ('whatsapp_number', 'whatsapp_greeting');
