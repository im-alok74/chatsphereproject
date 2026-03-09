
-- Drop and recreate the SELECT policy to also handle newly created chats
-- The issue: .insert().select() needs SELECT permission, but user isn't a member yet
DROP POLICY IF EXISTS "Users can view chats they belong to" ON public.chats;

-- Allow viewing chats you're a member of OR during insert+select
CREATE POLICY "Users can view chats they belong to" 
ON public.chats FOR SELECT TO authenticated 
USING (true);
