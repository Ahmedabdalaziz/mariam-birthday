-- =====================================================================
--  🎂 سكربت إعداد قاعدة بيانات عيد ميلاد Mariam
--  حطي المحتوى ده كله في: Supabase → SQL Editor → New query → Run
--  ينفع تنفذه أكتر من مرة، مش هيبوظ حاجة
-- =====================================================================

-- 1) جدول الرسايل 💌
create table if not exists public.birthday_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  message text not null,
  memory text default '',
  hearts int not null default 5 check (hearts between 1 and 5),
  photo_url text
);

-- 2) تشغيل Row Level Security
alter table public.birthday_messages enable row level security;

-- 3) صلاحيات القراءة والكتابة (للزوار بدون تسجيل دخول)
drop policy if exists "anyone can read messages" on public.birthday_messages;
create policy "anyone can read messages"
  on public.birthday_messages for select to anon, authenticated using (true);

drop policy if exists "anyone can send messages" on public.birthday_messages;
create policy "anyone can send messages"
  on public.birthday_messages for insert to anon, authenticated with check (true);

-- 4) باكدج الصور 📸 (عام → أي حد يشوف صورته من لينك مباشر)
insert into storage.buckets (id, name, public)
values ('birthday-photos', 'birthday-photos', true)
on conflict (id) do update set public = true;

-- 5) صلاحيات رفع وعرض الصور
drop policy if exists "anyone can upload photos" on storage.objects;
create policy "anyone can upload photos"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'birthday-photos');

drop policy if exists "anyone can view photos" on storage.objects;
create policy "anyone can view photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'birthday-photos');

-- 6) تشغيل Realtime (عشان الرسايل الجديدة تظهر لحظيًا في صفحة مريم)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'birthday_messages'
  ) then
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      alter publication supabase_realtime add table public.birthday_messages;
    else
      create publication supabase_realtime for table public.birthday_messages;
    end if;
  end if;
end $$;

-- خلاص — رجع للموقع وجرّب تبعت رسالة
