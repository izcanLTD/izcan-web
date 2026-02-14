-- Slides Table
create table slides (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  image_url text not null,
  title text,
  subtitle text,
  link_text text,
  link_url text,
  display_order integer default 0
);

-- Gallery Table
create table gallery (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  image_url text not null,
  caption text,
  display_order integer default 0
);

-- RLS for Slides
alter table slides enable row level security;
create policy "Public Slides are viewable by everyone" on slides for select using ( true );
create policy "Admins can manage slides" on slides for all using ( auth.role() = 'authenticated' );

-- RLS for Gallery
alter table gallery enable row level security;
create policy "Public Gallery is viewable by everyone" on gallery for select using ( true );
create policy "Admins can manage gallery" on gallery for all using ( auth.role() = 'authenticated' );

-- Initial Seed for Slides (Optional, but good for testing)
-- You can run this if you want default slides
/*
insert into slides (image_url, title, subtitle, display_order) values
('https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1920&auto=format&fit=crop', 'Kapı ve Mobilya Çözümlerinde Güvenilir Üretici', 'Modern tasarım, yüksek kalite ve güçlü üretim altyapısı ile mekanlarınıza değer katıyoruz.', 1),
('https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=1920&auto=format&fit=crop', 'Özgün Tasarım Dolap Kapakları', 'Evinizin tarzını yansıtan özel üretim dolap kapakları ve panel sistemleri.', 2);
*/
