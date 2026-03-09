
-- Add group chat support columns to chats table
ALTER TABLE public.chats 
  ADD COLUMN name TEXT,
  ADD COLUMN is_group BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN avatar_url TEXT;

-- Create bill_splits table for splitting expenses in group chats
CREATE TABLE public.bill_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual shares for each bill split
CREATE TABLE public.bill_split_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bill_splits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(bill_id, user_id)
);

-- Indexes
CREATE INDEX idx_bill_splits_chat_id ON public.bill_splits(chat_id);
CREATE INDEX idx_bill_split_shares_bill_id ON public.bill_split_shares(bill_id);
CREATE INDEX idx_bill_split_shares_user_id ON public.bill_split_shares(user_id);

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

-- RLS for bill_splits
ALTER TABLE public.bill_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bill splits in their chats"
  ON public.bill_splits FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = bill_splits.chat_id AND chat_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create bill splits in their chats"
  ON public.bill_splits FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = bill_splits.chat_id AND chat_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Creator can update bill splits"
  ON public.bill_splits FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- RLS for bill_split_shares
ALTER TABLE public.bill_split_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares for bills in their chats"
  ON public.bill_split_shares FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.bill_splits bs
    JOIN public.chat_members cm ON cm.chat_id = bs.chat_id
    WHERE bs.id = bill_split_shares.bill_id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Chat members can create shares"
  ON public.bill_split_shares FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bill_splits bs
    JOIN public.chat_members cm ON cm.chat_id = bs.chat_id
    WHERE bs.id = bill_split_shares.bill_id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own shares"
  ON public.bill_split_shares FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for bill_splits updated_at
CREATE TRIGGER update_bill_splits_updated_at 
  BEFORE UPDATE ON public.bill_splits 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow chats to be updated (for group name changes)
CREATE POLICY "Members can update group chat details"
  ON public.chats FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = chats.id AND chat_members.user_id = auth.uid()
  ));
