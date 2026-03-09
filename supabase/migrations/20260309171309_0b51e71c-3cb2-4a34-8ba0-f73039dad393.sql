
-- Create a security definer function to check chat membership without recursion
CREATE OR REPLACE FUNCTION public.is_chat_member(_user_id uuid, _chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE user_id = _user_id AND chat_id = _chat_id
  )
$$;

-- Drop and recreate chat_members policies using the function
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members to chats they belong to" ON public.chat_members;

-- SELECT: user can see their own memberships + members of chats they belong to
CREATE POLICY "Users can view members of their chats"
ON public.chat_members FOR SELECT
TO authenticated
USING (public.is_chat_member(auth.uid(), chat_id));

-- INSERT: user can add themselves or add others to chats they belong to
CREATE POLICY "Users can add members to chats they belong to"
ON public.chat_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR public.is_chat_member(auth.uid(), chat_id)
);

-- Also fix chats policies that reference chat_members (could also recurse)
DROP POLICY IF EXISTS "Users can view chats they belong to" ON public.chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Members can update group chat details" ON public.chats;

CREATE POLICY "Users can view chats they belong to"
ON public.chats FOR SELECT TO authenticated
USING (public.is_chat_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create chats"
ON public.chats FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Members can update group chat details"
ON public.chats FOR UPDATE TO authenticated
USING (public.is_chat_member(auth.uid(), id));

-- Fix messages policies
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their chats for seen status" ON public.messages;

CREATE POLICY "Users can view messages in their chats"
ON public.messages FOR SELECT TO authenticated
USING (public.is_chat_member(auth.uid(), chat_id));

CREATE POLICY "Users can send messages to their chats"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id AND public.is_chat_member(auth.uid(), chat_id));

CREATE POLICY "Users can update messages in their chats for seen status"
ON public.messages FOR UPDATE TO authenticated
USING (public.is_chat_member(auth.uid(), chat_id));

-- Fix bill_splits policies
DROP POLICY IF EXISTS "Users can view bill splits in their chats" ON public.bill_splits;
DROP POLICY IF EXISTS "Users can create bill splits in their chats" ON public.bill_splits;
DROP POLICY IF EXISTS "Creator can update bill splits" ON public.bill_splits;

CREATE POLICY "Users can view bill splits in their chats"
ON public.bill_splits FOR SELECT TO authenticated
USING (public.is_chat_member(auth.uid(), chat_id));

CREATE POLICY "Users can create bill splits in their chats"
ON public.bill_splits FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND public.is_chat_member(auth.uid(), chat_id));

CREATE POLICY "Creator can update bill splits"
ON public.bill_splits FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

-- Fix bill_split_shares policies
DROP POLICY IF EXISTS "Users can view shares for bills in their chats" ON public.bill_split_shares;
DROP POLICY IF EXISTS "Chat members can create shares" ON public.bill_split_shares;
DROP POLICY IF EXISTS "Users can update their own shares" ON public.bill_split_shares;

CREATE POLICY "Users can view shares for bills in their chats"
ON public.bill_split_shares FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.bill_splits bs
  WHERE bs.id = bill_split_shares.bill_id
  AND public.is_chat_member(auth.uid(), bs.chat_id)
));

CREATE POLICY "Chat members can create shares"
ON public.bill_split_shares FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bill_splits bs
  WHERE bs.id = bill_split_shares.bill_id
  AND public.is_chat_member(auth.uid(), bs.chat_id)
));

CREATE POLICY "Users can update their own shares"
ON public.bill_split_shares FOR UPDATE TO authenticated
USING (auth.uid() = user_id);
