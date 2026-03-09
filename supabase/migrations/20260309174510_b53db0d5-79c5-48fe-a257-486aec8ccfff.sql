
-- Add message reactions table
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions in their chats" ON public.message_reactions
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.messages m WHERE m.id = message_reactions.message_id AND is_chat_member(auth.uid(), m.chat_id)
));

CREATE POLICY "Users can add reactions" ON public.message_reactions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.messages m WHERE m.id = message_reactions.message_id AND is_chat_member(auth.uid(), m.chat_id)
));

CREATE POLICY "Users can remove their reactions" ON public.message_reactions
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Add reply_to_id to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Add DELETE policy for messages (own messages only)
CREATE POLICY "Users can delete their own messages" ON public.messages
FOR DELETE TO authenticated
USING (auth.uid() = sender_id);

-- Enable realtime for message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
