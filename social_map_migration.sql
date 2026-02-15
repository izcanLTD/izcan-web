-- Add social media and map location settings to site_content table

INSERT INTO site_content (key, value, section) VALUES
('social_instagram', 'https://instagram.com/', 'social'),
('social_facebook', 'https://facebook.com/', 'social'),
('social_linkedin', 'https://linkedin.com/', 'social'),
('map_latitude', '40.1885', 'location'),
('map_longitude', '29.0610', 'location')
ON CONFLICT (key) DO NOTHING;
