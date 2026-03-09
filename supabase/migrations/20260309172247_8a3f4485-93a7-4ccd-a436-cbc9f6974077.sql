
-- Drop the restrictive INSERT policy and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;

CREATE POLICY "Authenticated users can create chats"
ON public.chats FOR INSERT
TO authenticated
WITH CHECK (true);
