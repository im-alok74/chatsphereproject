import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export interface ChatWithDetails {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatarUrl: string | null;
  members: Tables<"profiles">[];
  otherUser: Tables<"profiles"> | null; // For 1-on-1 chats
  lastMessage: Tables<"messages"> | null;
  unreadCount: number;
}

export function useChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;

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
    const chatDetails: ChatWithDetails[] = [];

    for (const chatId of chatIds) {
      // Fetch chat info
      const { data: chatInfo } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (!chatInfo) continue;

      // Get all members' profiles
      const { data: memberRows } = await supabase
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chatId);

      const memberIds = memberRows?.map((m) => m.user_id) ?? [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", memberIds);

      const members = profiles ?? [];
      const otherMembers = members.filter((p) => p.user_id !== user.id);

      // Latest message
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: false })
        .limit(1);

      // Unread count
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("chat_id", chatId)
        .eq("seen", false)
        .neq("sender_id", user.id);

      chatDetails.push({
        id: chatId,
        isGroup: chatInfo.is_group,
        name: chatInfo.name,
        avatarUrl: chatInfo.avatar_url,
        members,
        otherUser: !chatInfo.is_group && otherMembers.length > 0 ? otherMembers[0] : null,
        lastMessage: messages?.[0] ?? null,
        unreadCount: count ?? 0,
      });
    }

    chatDetails.sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? "";
      const bTime = b.lastMessage?.created_at ?? "";
      return bTime.localeCompare(aTime);
    });

    setChats(chatDetails);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-list-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchChats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchChats]);

  // Create 1-on-1 chat
  const createOrFindChat = async (otherUserId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Try to find existing 1-on-1 chat
      const { data: myChats, error: myChatsError } = await supabase
        .from("chat_members")
        .select("chat_id")
        .eq("user_id", user.id);

      if (!myChatsError && myChats) {
        for (const membership of myChats) {
          const { data: chatInfo } = await supabase
            .from("chats")
            .select("is_group")
            .eq("id", membership.chat_id)
            .maybeSingle();
          
          if (!chatInfo || chatInfo.is_group) continue;

          const { data: otherMember } = await supabase
            .from("chat_members")
            .select("user_id")
            .eq("chat_id", membership.chat_id)
            .eq("user_id", otherUserId)
            .maybeSingle();

          if (otherMember) return membership.chat_id;
        }
      }

      // Create new chat — insert chat first, then add members
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({ is_group: false })
        .select()
        .single();

      if (chatError || !newChat) {
        console.error("Failed to create chat:", chatError);
        return null;
      }

      // Insert current user first (so they become a member), then the other user
      const { error: memberError1 } = await supabase
        .from("chat_members")
        .insert({ chat_id: newChat.id, user_id: user.id });

      if (memberError1) {
        console.error("Failed to add self to chat:", memberError1);
        return null;
      }

      const { error: memberError2 } = await supabase
        .from("chat_members")
        .insert({ chat_id: newChat.id, user_id: otherUserId });

      if (memberError2) {
        console.error("Failed to add other user to chat:", memberError2);
      }

      await fetchChats();
      return newChat.id;
    } catch (err) {
      console.error("createOrFindChat error:", err);
      return null;
    }
  };

  // Create group chat
  const createGroupChat = async (name: string, memberUserIds: string[]): Promise<string | null> => {
    if (!user) return null;

    const { data: newChat, error } = await supabase
      .from("chats")
      .insert({ is_group: true, name })
      .select()
      .single();

    if (error || !newChat) return null;

    const allMembers = [user.id, ...memberUserIds];
    await supabase.from("chat_members").insert(
      allMembers.map((uid) => ({ chat_id: newChat.id, user_id: uid }))
    );

    await fetchChats();
    return newChat.id;
  };

  return { chats, loading, fetchChats, createOrFindChat, createGroupChat };
}
