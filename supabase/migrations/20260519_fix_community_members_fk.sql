-- Fix community_members user_id foreign key constraint to point to public.users instead of auth.users
ALTER TABLE public.community_members 
  DROP CONSTRAINT IF EXISTS community_members_user_id_fkey;

ALTER TABLE public.community_members 
  ADD CONSTRAINT community_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;
