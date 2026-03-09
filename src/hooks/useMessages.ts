import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export function useMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Tables<"messages">[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch all messages for a chat
  const fetchMessages = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    setLoading(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setLoading(false);

    // Mark messages as seen
    if (user) {
      await supabase
        .from("messages")
        .update({ seen: true })
        .eq("chat_id", chatId)
        .neq("sender_id", user.id)
        .eq("seen", false);
    }
  }, [chatId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!chatId) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Tables<"messages">;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          // Auto-mark as seen if we're in the chat
          if (user && newMessage.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ seen: true })
              .eq("id", newMessage.id)
              .then();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const updated = payload.new as Tables<"messages">;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [chatId, user]);

  // Send a text message
  const sendMessage = async (content: string) => {
    if (!chatId || !user || !content.trim()) return;

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim(),
    });
  };

  // Send an image message
  const sendImage = async (file: File) => {
    if (!chatId || !user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${chatId}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("chat-images")
      .getPublicUrl(filePath);

    // Save message with image URL
    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: user.id,
      image_url: publicUrl,
    });
  };

  return { messages, loading, sendMessage, sendImage };
}
