-- =========================================================
-- Anis CH — Blueprint SQL Database Schema (Supabase / PostgreSQL)
-- النسخة v2 — آمنة ومُشدَّدة (Hardened Security Edition)
-- Multi-language Architecture (French Default / Arabic / English)
--
-- هذا السكربت idempotent بالكامل: يمكن تنفيذه على قاعدة بيانات جديدة
-- تمامًا، أو على القاعدة القديمة لترقيتها دون فقدان أي بيانات.
-- التنفيذ: Supabase Dashboard -> SQL Editor -> Run
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================
-- 0) دالة أمان مركزية: is_admin()
-- تُستخدم بدل تكرار "exists(select ... from profiles ...)" في كل سياسة،
-- وهذا يمنع مشكلة الـ Recursive RLS التي كانت تسبب حلقات تحقق داخلية
-- عند استعلام سياسة على profiles من داخل سياسة أخرى لنفس الجدول.
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;


-- =========================================================
-- 1) TABLE: PROFILES (إدارة المستخدمين والصلاحيات)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'pro', 'enterprise')),
  preferred_lang text default 'fr' check (preferred_lang in ('fr', 'ar', 'en')),
  updated_at timestamptz default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists subscription_plan text not null default 'free';
do $$ begin
  alter table public.profiles add constraint profiles_subscription_plan_check
    check (subscription_plan in ('free', 'pro', 'enterprise'));
exception when duplicate_object then null; end $$;

alter table public.profiles enable row level security;

drop policy if exists "Allow users to read their own profile" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Allow admin to view all profiles" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- 🔒 إصلاح ثغرة خطيرة: السياسة القديمة كانت تسمح لأي مستخدم بتعديل
-- عمود is_admin و subscription_plan في صف نفسه، أي كان بإمكان أي زائر
-- مسجَّل منح نفسه صلاحية "مشرف" بسهولة عبر update() من المتصفح!
drop policy if exists "Allow users to update their own profile" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.subscription_plan := old.subscription_plan;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_privileged_columns on public.profiles;
create trigger trg_protect_privileged_columns
  before update on public.profiles
  for each row execute procedure public.protect_privileged_columns();

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, is_admin, subscription_plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    false,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =========================================================
-- 2) TABLE: SOFTWARE_ITEMS
-- =========================================================
create table if not exists public.software_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('android', 'desktop', 'saas', 'game', 'industrial')),
  badge_label text,

  name_fr text not null,
  name_ar text,
  name_en text,

  description_fr text not null,
  description_ar text,
  description_en text,

  version text default 'v1.0.0',
  meta_text text,

  -- 🔒 يخزّن الآن "مسار" الملف داخل bucket خاص (private)، وليس رابطًا
  -- عامًا. التحميل الفعلي يمر عبر Edge Function موقِّعة ومؤقتة الصلاحية.
  file_url text,
  file_name text,
  external_url text,
  secondary_url text,

  required_plan text not null default 'free' check (required_plan in ('free', 'pro', 'enterprise')),

  is_published boolean not null default true,
  download_count integer default 0,
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  created_at timestamptz not null default now()
);

alter table public.software_items add column if not exists required_plan text not null default 'free';
do $$ begin
  alter table public.software_items add constraint software_items_required_plan_check
    check (required_plan in ('free', 'pro', 'enterprise'));
exception when duplicate_object then null; end $$;

alter table public.software_items enable row level security;

drop policy if exists "Public read access for published software" on public.software_items;
create policy "software_select_public"
  on public.software_items for select
  using (is_published = true or public.is_admin());

drop policy if exists "Only admin can insert software" on public.software_items;
create policy "software_insert_admin"
  on public.software_items for insert
  with check (public.is_admin());

drop policy if exists "Only admin can update software" on public.software_items;
create policy "software_update_admin"
  on public.software_items for update
  using (public.is_admin());

drop policy if exists "Only admin can delete software" on public.software_items;
create policy "software_delete_admin"
  on public.software_items for delete
  using (public.is_admin());


-- =========================================================
-- 3) TABLE: PORTFOLIO_ITEMS
-- =========================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('electrical', 'domotique', 'app', 'web', 'cnc', 'other')),

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

drop policy if exists "Public read access for published portfolio items" on public.portfolio_items;
create policy "portfolio_select_public"
  on public.portfolio_items for select
  using (is_published = true or public.is_admin());

drop policy if exists "Only admin can insert portfolio items" on public.portfolio_items;
create policy "portfolio_insert_admin"
  on public.portfolio_items for insert
  with check (public.is_admin());

drop policy if exists "Only admin can update portfolio items" on public.portfolio_items;
create policy "portfolio_update_admin"
  on public.portfolio_items for update
  using (public.is_admin());

drop policy if exists "Only admin can delete portfolio items" on public.portfolio_items;
create policy "portfolio_delete_admin"
  on public.portfolio_items for delete
  using (public.is_admin());


-- =========================================================
-- 4) TABLE: FAVORITES
-- =========================================================
create table if not exists public.favorites (
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid references public.software_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.favorites enable row level security;

drop policy if exists "Users can manage their own favorites" on public.favorites;
create policy "favorites_owner_all"
  on public.favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =========================================================
-- 5) TABLE: CONTACT_MESSAGES
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

drop policy if exists "Anyone can insert contact message" on public.contact_messages;
create policy "contact_insert_anyone"
  on public.contact_messages for insert
  with check (
    length(name) between 1 and 200
    and length(contact_info) between 1 and 200
    and length(details) between 1 and 5000
  );

drop policy if exists "Only admin can read contact messages" on public.contact_messages;
create policy "contact_select_admin"
  on public.contact_messages for select
  using (public.is_admin());

-- 🔒 كانت هذه السياسة غائبة تمامًا في النسخة القديمة، ما جعل زر
-- "تعليم كمقروء" في لوحة التحكم غير فعّال فعليًا.
drop policy if exists "contact_update_admin" on public.contact_messages;
create policy "contact_update_admin"
  on public.contact_messages for update
  using (public.is_admin());

drop policy if exists "Only admin can delete contact messages" on public.contact_messages;
create policy "contact_delete_admin"
  on public.contact_messages for delete
  using (public.is_admin());


-- =========================================================
-- 6) TABLE: DOWNLOAD_LOGS (سجلّ تدقيق أمني لكل عملية تحميل)
-- =========================================================
create table if not exists public.download_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  item_id uuid references public.software_items(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.download_logs enable row level security;

drop policy if exists "download_logs_select_admin" on public.download_logs;
create policy "download_logs_select_admin"
  on public.download_logs for select
  using (public.is_admin());
-- الإدراج يتم فقط عبر Edge Function بصلاحية service_role (تتجاوز RLS).


-- =========================================================
-- 7) INDEXES
-- =========================================================
create index if not exists idx_software_category on public.software_items(category);
create index if not exists idx_software_published on public.software_items(is_published);
create index if not exists idx_portfolio_category on public.portfolio_items(category);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_contact_is_read on public.contact_messages(is_read);
create index if not exists idx_download_logs_item on public.download_logs(item_id);
create index if not exists idx_download_logs_user on public.download_logs(user_id);


-- =========================================================
-- 8) STORAGE BUCKETS & POLICIES
-- 🔒 تغيير جوهري: باكِت البرمجيات أصبح PRIVATE. لا أحد يستطيع تخمين
-- أو اعتراض رابط الملف. التحميل يمر إجباريًا عبر Edge Function
-- تتحقق من الهوية والخطة وتولّد رابطًا موقّعًا صالحًا 60 ثانية فقط.
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('software-files', 'software-files', false, 209715200)
on conflict (id) do update set public = false, file_size_limit = 209715200;

drop policy if exists "Public read access for software files" on storage.objects;
drop policy if exists "software_files_read_admin" on storage.objects;
create policy "software_files_read_admin"
  on storage.objects for select
  using (bucket_id = 'software-files' and public.is_admin());

drop policy if exists "Admin upload policy for software files" on storage.objects;
create policy "software_files_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'software-files' and public.is_admin());

drop policy if exists "Admin delete policy for software files" on storage.objects;
create policy "software_files_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'software-files' and public.is_admin());

-- معرض الأعمال يبقى عامًا (media تسويقية، بلا خصوصية)
insert into storage.buckets (id, name, public, file_size_limit)
values ('portfolio-media', 'portfolio-media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "Public read access for portfolio media" on storage.objects;
create policy "portfolio_media_read_public"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

drop policy if exists "Admin upload policy for portfolio media" on storage.objects;
create policy "portfolio_media_insert_admin"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-media' and public.is_admin());

drop policy if exists "Admin delete policy for portfolio media" on storage.objects;
create policy "portfolio_media_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'portfolio-media' and public.is_admin());


-- =========================================================
-- دالة مساعدة تُستدعى من Edge Function (service_role فقط) لزيادة
-- عدّاد التحميلات بأمان دون تعريض الجدول لتعديل من العميل مباشرة
-- =========================================================
create or replace function public.increment_download_count(p_item_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.software_items
  set download_count = coalesce(download_count, 0) + 1
  where id = p_item_id;
$$;

revoke all on function public.increment_download_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_download_count(uuid) to service_role;


-- =========================================================
-- 9) تفعيل حساب المشرف الأول
-- نفّذ السطر التالي يدويًا (بعد تعديل البريد) من SQL Editor
-- بعد إنشاء حسابك عبر نموذج التسجيل في الموقع:
-- =========================================================
-- update public.profiles set is_admin = true where email = 'votre_email@example.com';
