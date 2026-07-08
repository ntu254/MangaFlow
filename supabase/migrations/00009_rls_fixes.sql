-- RLS policies for wardrobe_items
drop policy if exists "Users can insert their own wardrobe items" on wardrobe_items;
create policy "Users can insert their own wardrobe items"
  on wardrobe_items for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own wardrobe items" on wardrobe_items;
create policy "Users can view their own wardrobe items"
  on wardrobe_items for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own wardrobe items" on wardrobe_items;
create policy "Users can update their own wardrobe items"
  on wardrobe_items for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own wardrobe items" on wardrobe_items;
create policy "Users can delete their own wardrobe items"
  on wardrobe_items for delete
  to authenticated
  using (auth.uid() = user_id);

-- Storage bucket for wardrobe images
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload wardrobe images" on storage.objects;
create policy "Authenticated users can upload wardrobe images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'wardrobe');

drop policy if exists "Anyone can view wardrobe images" on storage.objects;
create policy "Anyone can view wardrobe images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'wardrobe');
