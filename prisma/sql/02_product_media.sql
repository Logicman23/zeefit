-- ---------------------------------------------------------------------------
-- Storage bucket for product imagery, plus the policies that decide who may
-- write to it. Run once, over the DIRECT connection.
--
-- Uploads go from the browser straight to Supabase Storage using the caller's
-- own session, so the rules below are the real enforcement — there is no server
-- action in between to check a permission. That makes these policies the
-- storage-side mirror of lib/auth/permissions.ts:
--   media:upload -> any active staff member (ADMIN or EDITOR)
--   media:delete -> ADMIN only
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,                                   -- product photos are public by nature
  5242880,                                -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- Anyone may read: these end up on public product pages.
drop policy if exists "public reads product media" on storage.objects;
create policy "public reads product media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-media');


-- Upload: any signed-in user holding an active staff profile.
-- A storefront customer with an auth.users row has no profile, so cannot write.
drop policy if exists "staff upload product media" on storage.objects;
create policy "staff upload product media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-media'
    and exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.is_active
    )
  );


drop policy if exists "staff replace product media" on storage.objects;
create policy "staff replace product media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  )
  with check (
    bucket_id = 'product-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  );


-- Delete is ADMIN-only, matching media:delete. An Editor who uploads the wrong
-- image replaces it rather than removing it.
drop policy if exists "admins delete product media" on storage.objects;
create policy "admins delete product media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-media'
    and exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.is_active and p.role = 'ADMIN'
    )
  );
