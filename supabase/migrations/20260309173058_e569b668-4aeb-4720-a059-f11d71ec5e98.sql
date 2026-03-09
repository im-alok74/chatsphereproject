
-- Fix ALL RLS policies to be PERMISSIVE instead of RESTRICTIVE

-- CHATS table
DROP POLICY IF EXISTS "Users can view chats they belong to" ON public.chats;
CREATE POLICY "Users can view chats they belong to" ON public.chats FOR SELECT TO authenticated USING (is_chat_member(auth.uid(), id));

DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;
CREATE POLICY "Authenticated users can create chats" ON public.chats FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Members can update group chat details" ON public.chats;
CREATE POLICY "Members can update group chat details" ON public.chats FOR UPDATE TO authenticated USING (is_chat_member(auth.uid(), id));

-- CHAT_MEMBERS table
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
CREATE POLICY "Users can view members of their chats" ON public.chat_members FOR SELECT TO authenticated USING (is_chat_member(auth.uid(), chat_id));

DROP POLICY IF EXISTS "Users can add members to chats they belong to" ON public.chat_members;
CREATE POLICY "Users can add members to chats they belong to" ON public.chat_members FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR is_chat_member(auth.uid(), chat_id));

-- MESSAGES table
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT TO authenticated USING (is_chat_member(auth.uid(), chat_id));

DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
CREATE POLICY "Users can send messages to their chats" ON public.messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND is_chat_member(auth.uid(), chat_id));

DROP POLICY IF EXISTS "Users can update messages in their chats for seen status" ON public.messages;
CREATE POLICY "Users can update messages in their chats for seen status" ON public.messages FOR UPDATE TO authenticated USING (is_chat_member(auth.uid(), chat_id));

-- PROFILES table
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- BILL_SPLITS table
DROP POLICY IF EXISTS "Users can view bill splits in their chats" ON public.bill_splits;
CREATE POLICY "Users can view bill splits in their chats" ON public.bill_splits FOR SELECT TO authenticated USING (is_chat_member(auth.uid(), chat_id));

DROP POLICY IF EXISTS "Users can create bill splits in their chats" ON public.bill_splits;
CREATE POLICY "Users can create bill splits in their chats" ON public.bill_splits FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by) AND is_chat_member(auth.uid(), chat_id));

DROP POLICY IF EXISTS "Creator can update bill splits" ON public.bill_splits;
CREATE POLICY "Creator can update bill splits" ON public.bill_splits FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- BILL_SPLIT_SHARES table
DROP POLICY IF EXISTS "Users can view shares for bills in their chats" ON public.bill_split_shares;
CREATE POLICY "Users can view shares for bills in their chats" ON public.bill_split_shares FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM bill_splits bs WHERE bs.id = bill_split_shares.bill_id AND is_chat_member(auth.uid(), bs.chat_id)));

DROP POLICY IF EXISTS "Chat members can create shares" ON public.bill_split_shares;
CREATE POLICY "Chat members can create shares" ON public.bill_split_shares FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM bill_splits bs WHERE bs.id = bill_split_shares.bill_id AND is_chat_member(auth.uid(), bs.chat_id)));

DROP POLICY IF EXISTS "Users can update their own shares" ON public.bill_split_shares;
CREATE POLICY "Users can update their own shares" ON public.bill_split_shares FOR UPDATE TO authenticated USING (auth.uid() = user_id);
