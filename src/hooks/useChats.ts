import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export interface ChatWithDetails {
  id: string;
  otherUser: Tables<"profiles">;
  lastMessage: Tables<"messages"> | null;
  unreadCount: number;
}

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;

    // Get all chat IDs user belongs to
    const { data: memberships } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", user.id);

    if (!memberships?.length) {
      setChats([]);
      setLoading(false);
      return;
    }

    const chatIds = memberships.map((m) => m.chat_id);

    // For each chat, get the other member's profile and latest message
    const chatDetails: ChatWithDetails[] = [];

    for (const chatId of chatIds) {
      // Get other member
      const { data: members } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chatId)
        .neq("user_id", user.id);

      if (!members?.length) continue;

      const otherUserId = members[0].user_id;

      // Get other user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", otherUserId)
        .single();

      if (!profile) continue;

      // Get latest message
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(1);

      // Count unread messages
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", chatId)
        .eq("seen", false)
        .neq("sender_id", user.id);

      chatDetails.push({
        id: chatId,
        otherUser: profile,
        lastMessage: messages?.[0] ?? null,
        unreadCount: count ?? 0,
      });
    }

    // Sort by latest message time
    chatDetails.sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? "";
      const bTime = b.lastMessage?.created_at ?? "";
      return bTime.localeCompare(aTime);
    });

    setChats(chatDetails);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Subscribe to new messages to refresh chat list
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("chat-list-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchChats]);

  // Create or find existing chat with another user
  const createOrFindChat = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    // Check if chat already exists between these two users
    const { data: myChats } = await supabase
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", user.id);

    if (myChats) {
      for (const membership of myChats) {
        const { data: otherMember } = await supabase
          .from("chat_members")
          .select("user_id")
          .eq("chat_id", membership.chat_id)
          .eq("user_id", otherUserId)
          .single();

        if (otherMember) {
          return membership.chat_id;
        }
      }
    }

    // Create new chat - use RPC or direct insert
    // First create the chat
    const { data: newChat, error: chatError } = await supabase
      .from("chats")
      .insert({})
      .select()
      .single();

    if (chatError || !newChat) return null;

    // Add both members
    const { error: memberError } = await supabase
      .from("chat_members")
      .insert([
        { chat_id: newChat.id, user_id: user.id },
        { chat_id: newChat.id, user_id: otherUserId },
      ]);

    if (memberError) return null;

    await fetchChats();
    return newChat.id;
  };

  return { chats, loading, fetchChats, createOrFindChat };
}
