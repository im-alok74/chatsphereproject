import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTypingIndicator(chatId: string | null) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`typing-${chatId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: string[] = [];
        Object.entries(state).forEach(([userId, presences]) => {
          if (userId !== user.id) {
            const latest = (presences as any[])?.[0];
            if (latest?.is_typing) {
              typing.push(latest.username || "Someone");
            }
          }
        });
        setTypingUsers(typing);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [chatId, user]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !user || !profile) return;

    channelRef.current.track({
      is_typing: isTyping,
      username: profile.username,
    });

    // Auto-stop typing after 3s
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isTyping) {
      timeoutRef.current = setTimeout(() => {
        channelRef.current?.track({
          is_typing: false,
          username: profile.username,
        });
      }, 3000);
    }
  }, [user, profile]);

  return { typingUsers, sendTyping };
}
