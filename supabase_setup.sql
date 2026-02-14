-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Products Table
create table products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  category text not null, -- 'kapi', 'dolap', 'panel', 'aksesuar'
  description text,
  image_url text,
  is_featured boolean default false
);

-- Create Site Content Table (Key-Value store for text)
create table site_content (
  key text primary key,
  value text, -- JSON or simple text
  section text -- 'hero', 'about', 'contact', 'footer'
);

-- Turn on Row Level Security (RLS)
alter table products enable row level security;
alter table site_content enable row level security;

-- Policies for Products
-- Everyone can read products
create policy "Public Products are viewable by everyone"
  on products for select
  using ( true );

-- Only authenticated users (admins) can insert/update/delete
create policy "Admins can insert products"
  on products for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update products"
  on products for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete products"
  on products for delete
  using ( auth.role() = 'authenticated' );

-- Policies for Site Content
create policy "Public Content is viewable by everyone"
  on site_content for select
  using ( true );

create policy "Admins can update content"
  on site_content for update
  using ( auth.role() = 'authenticated' );

-- Storage Bucket Setup (You might need to do this manually in dashboard if this script fails on bucket creation rights)
insert into storage.buckets (id, name, public) 
values ('images', 'images', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Public Access to Images"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Admins can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

create policy "Admins can update images"
  on storage.objects for update
  using ( bucket_id = 'images' and auth.role() = 'authenticated' );

create policy "Admins can delete images"
  on storage.objects for delete
  using ( bucket_id = 'images' and auth.role() = 'authenticated' );

-- Initial Content Seeding
insert into site_content (key, value, section) values
('hero_title_1', 'Kapı ve Mobilya Çözümlerinde Güvenilir Üretici', 'hero'),
('hero_subtitle_1', 'Modern tasarım, yüksek kalite ve güçlü üretim altyapısı ile mekanlarınıza değer katıyoruz.', 'hero'),
('about_title', 'Tecrübe ve Kalitenin Adresi', 'about'),
('about_text', 'İzcan Orman Ürünleri olarak, yılların verdiği tecrübe ile sektörde öncü bir rol üstleniyoruz.', 'about'),
('contact_address', 'Organize Sanayi Bölgesi, 3. Cadde No:12 Bursa, Türkiye', 'contact'),
('contact_phone', '+90 555 123 45 67', 'contact'),
('contact_email', 'info@izcanormanurunleri.com', 'contact')
on conflict (key) do nothing;
