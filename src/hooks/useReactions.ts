import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export function useReactions(chatId: string | null) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const fetchReactions = useCallback(async () => {
    if (!chatId) return;
    const { data } = await supabase
      .from("message_reactions")
      .select("*")
      .in(
        "message_id",
        (await supabase.from("messages").select("id").eq("chat_id", chatId)).data?.map(m => m.id) ?? []
      );
    setReactions((data as Reaction[]) ?? []);
  }, [chatId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`reactions-${chatId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, () => {
        fetchReactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, fetchReactions]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions.find(
      (r) => r.message_id === messageId && r.user_id === user.id && r.emoji === emoji
    );
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("message_reactions").insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });
    }
  }, [user, reactions]);

  const getReactionsForMessage = useCallback((messageId: string) => {
    return reactions.filter((r) => r.message_id === messageId);
  }, [reactions]);

  return { reactions, toggleReaction, getReactionsForMessage };
}
