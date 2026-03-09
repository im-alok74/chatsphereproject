
-- Fix overly permissive INSERT policies
DROP POLICY "Authenticated users can create chats" ON public.chats;
CREATE POLICY "Authenticated users can create chats"
  ON public.chats FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = chats.id AND chat_members.user_id = auth.uid()
    )
  );

DROP POLICY "Authenticated users can add chat members" ON public.chat_members;
CREATE POLICY "Users can add members to chats they belong to"
  ON public.chat_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid()
    )
  );
