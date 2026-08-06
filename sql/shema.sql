-- =========================================================
-- Anis CH — Blueprint SQL Database Schema (Supabase / PostgreSQL)
-- Multi-language Architecture (French Default / Arabic / English)
-- Execution: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- =========================================================
-- 1) TABLE: PROFILES (إدارة المستخدمين والصلاحيات)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  preferred_lang text default 'fr' check (preferred_lang in ('fr', 'ar', 'en')),
  updated_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Allow users to read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Allow users to update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Allow admin to view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Function & Trigger: Automatic profile creation on Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================
-- 2) TABLE: SOFTWARE_ITEMS (البرمجيات والتطبيقات الهندسية)
-- Primary Language: French (NOT NULL) | Secondary: AR / EN
-- =========================================================
create table if not exists public.software_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('android', 'desktop', 'saas', 'game', 'industrial')),
  badge_label text,
  
  -- Multilingual Fields (FR is default/mandatory)
  name_fr text not null,
  name_ar text,
  name_en text,
  
  description_fr text not null,
  description_ar text,
  description_en text,
  
  version text default 'v1.0.0',
  meta_text text,
  file_url text,
  file_name text,
  external_url text,
  secondary_url text,
  
  is_published boolean not null default true,
  download_count integer default 0,
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  created_at timestamptz not null default now()
);

alter table public.software_items enable row level security;

-- Policies for Software Items
create policy "Public read access for published software"
  on public.software_items for select
  using (is_published = true or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can insert software"
  on public.software_items for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can update software"
  on public.software_items for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can delete software"
  on public.software_items for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- =========================================================
-- 3) TABLE: PORTFOLIO_ITEMS (معرض المشاريع والأعمال)
-- Primary Language: French (NOT NULL)
-- =========================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('electrical', 'domotique', 'app', 'web', 'cnc', 'other')),
  
  -- Titles (FR mandatory)
  title_fr text not null,
  title_ar text,
  title_en text,
  
  description_fr text,
  description_ar text,
  description_en text,
  
  media_url text not null,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  is_published boolean not null default true,
  display_order integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

-- Policies for Portfolio
create policy "Public read access for published portfolio items"
  on public.portfolio_items for select
  using (is_published = true or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can insert portfolio items"
  on public.portfolio_items for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can update portfolio items"
  on public.portfolio_items for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can delete portfolio items"
  on public.portfolio_items for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- =========================================================
-- 4) TABLE: FAVORITES (قائمة المفضلة للمستخدمين)
-- =========================================================
create table if not exists public.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid references public.software_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.favorites enable row level security;

create policy "Users can manage their own favorites"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =========================================================
-- 5) TABLE: CONTACT_MESSAGES (رسائل الطلبات والتواصل)
-- =========================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info text not null,
  service_type text not null,
  details text not null,
  is_read boolean default false,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can insert contact message"
  on public.contact_messages for insert
  with check (true);

create policy "Only admin can read contact messages"
  on public.contact_messages for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Only admin can delete contact messages"
  on public.contact_messages for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));


-- =========================================================
-- 6) INDEXES FOR PERFORMANCE OPTIMIZATION (فهارس للأداء)
-- =========================================================
create index if not exists idx_software_category on public.software_items(category);
create index if not exists idx_software_published on public.software_items(is_published);
create index if not exists idx_portfolio_category on public.portfolio_items(category);
create index if not exists idx_favorites_user on public.favorites(user_id);


-- =========================================================
-- 7) STORAGE BUCKETS & POLICIES (مساحات تخزين الملفات)
-- =========================================================

-- A) Bucket for Software Downloads
insert into storage.buckets (id, name, public)
values ('software-files', 'software-files', true)
on conflict (id) do nothing;

create policy "Public read access for software files"
  on storage.objects for select
  using (bucket_id = 'software-files');

create policy "Admin upload policy for software files"
  on storage.objects for insert
  with check (
    bucket_id = 'software-files'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admin delete policy for software files"
  on storage.objects for delete
  using (
    bucket_id = 'software-files'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- B) Bucket for Portfolio Media (Images/Videos)
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

create policy "Public read access for portfolio media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "Admin upload policy for portfolio media"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio-media'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admin delete policy for portfolio media"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio-media'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =========================================================
-- 8) GRANT ADMIN ROLE COMMAND (تفعيل حساب المشرف)
-- قم بإلغاء التعليق عن السطر أدناه وتنفيذه بعد إنشاء حسابك
-- =========================================================
-- update public.profiles set is_admin = true where email = 'votre_email@example.com';
