-- 0006_embeddings_policy.sql
-- Embeddings carry each item's description text, so visitors must not be able to read
-- the embeddings of HIDDEN jewelry. Only active items (or an admin) are readable.
drop policy if exists "embeddings: public read" on public.jewelry_embeddings;

create policy "embeddings: read active or admin" on public.jewelry_embeddings
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.jewelry j
      where j.id = jewelry_embeddings.jewelry_id and j.is_active
    )
  );
