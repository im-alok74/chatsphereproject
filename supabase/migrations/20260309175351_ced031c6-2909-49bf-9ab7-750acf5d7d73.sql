-- Polls table
CREATE TABLE public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  is_anonymous boolean NOT NULL DEFAULT false,
  closes_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view polls" ON public.polls FOR SELECT TO authenticated
  USING (is_chat_member(auth.uid(), chat_id));
CREATE POLICY "Members can create polls" ON public.polls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND is_chat_member(auth.uid(), chat_id));

-- Poll votes
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view votes" ON public.poll_votes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_votes.poll_id AND is_chat_member(auth.uid(), p.chat_id)));
CREATE POLICY "Members can vote" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_votes.poll_id AND is_chat_member(auth.uid(), p.chat_id)));
CREATE POLICY "Users can change vote" ON public.poll_votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.poll_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Pinned messages
CREATE TABLE public.pinned_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL,
  pinned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chat_id, message_id)
);

ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pins" ON public.pinned_messages FOR SELECT TO authenticated
  USING (is_chat_member(auth.uid(), chat_id));
CREATE POLICY "Members can pin" ON public.pinned_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = pinned_by AND is_chat_member(auth.uid(), chat_id));
CREATE POLICY "Members can unpin" ON public.pinned_messages FOR DELETE TO authenticated
  USING (is_chat_member(auth.uid(), chat_id));

-- Scheduled messages
CREATE TABLE public.scheduled_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled" ON public.scheduled_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);
CREATE POLICY "Users can create scheduled" ON public.scheduled_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND is_chat_member(auth.uid(), chat_id));
CREATE POLICY "Users can update own scheduled" ON public.scheduled_messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own scheduled" ON public.scheduled_messages FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Enable realtime for polls and votes
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_messages;