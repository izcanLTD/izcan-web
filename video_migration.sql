-- Add Video Support columns
alter table slides add column media_type text default 'image'; -- 'image' or 'video'
alter table slides add column video_url text;

-- Update existing slides to be 'image'
update slides set media_type = 'image' where media_type is null;
