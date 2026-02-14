-- Add Video Support columns to Gallery
alter table gallery add column media_type text default 'image'; -- 'image' or 'video'
alter table gallery add column video_url text;

-- Update existing gallery items to be 'image'
update gallery set media_type = 'image' where media_type is null;
