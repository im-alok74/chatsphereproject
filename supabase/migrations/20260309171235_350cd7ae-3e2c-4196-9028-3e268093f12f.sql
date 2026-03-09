
-- Drop recursive policies on chat_members
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members to chats they belong to" ON public.chat_members;

-- Simple non-recursive SELECT: user can see rows where they are a member
CREATE POLICY "Users can view members of their chats"
ON public.chat_members FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR chat_id IN (SELECT cm.chat_id FROM public.chat_members cm WHERE cm.user_id = auth.uid())
);

-- For INSERT: allow adding self, or if user is already a member of that chat
CREATE POLICY "Users can add members to chats they belong to"
ON public.chat_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR chat_id IN (SELECT cm.chat_id FROM public.chat_members cm WHERE cm.user_id = auth.uid())
);
