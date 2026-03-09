import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useReactions } from "@/hooks/useReactions";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { MessageSearch } from "./MessageSearch";
import { TypingIndicator } from "./TypingIndicator";
import { BillSplitDialog } from "./BillSplitDialog";
import { PollDialog } from "./PollDialog";
import { PinnedMessages } from "./PinnedMessages";
import { ScheduleMessageDialog } from "./ScheduleMessageDialog";
import { SmartReplies } from "./SmartReplies";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, Receipt, Phone, Video, Search, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ChatWithDetails } from "@/hooks/useChats";
import chatSphereLogo from "@/assets/chatsphere-logo.png";
import { toast } from "sonner";

interface ChatWindowProps {
  chat: ChatWithDetails | null;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendImage } = useMessages(chat?.id ?? null);
  const { typingUsers, sendTyping } = useTypingIndicator(chat?.id ?? null);
  const { toggleReaction, getReactionsForMessage } = useReactions(chat?.id ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showBillSplit, setShowBillSplit] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string | null; senderName: string } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  if (!chat) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <img src={chatSphereLogo} alt="" className="h-20 w-20 opacity-30" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Chat<span className="text-primary">Sphere</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = chat.isGroup ? (chat.name ?? "Group Chat") : (chat.otherUser?.username ?? "Unknown");
  const avatarUrl = chat.isGroup ? chat.avatarUrl : chat.otherUser?.avatar_url;
  const avatarInitial = chat.isGroup
    ? (chat.name ?? "G").charAt(0).toUpperCase()
    : (chat.otherUser?.username ?? "?").charAt(0).toUpperCase();
  const subtitle = chat.isGroup
    ? `${chat.members.length} members`
    : (chat.otherUser?.is_online ? "Active now" : "Offline");

  const getSenderProfile = (senderId: string) => chat.members.find((m) => m.user_id === senderId);

  const handleSendMessage = (content: string) => {
    if (replyTo) {
      if (!chat?.id || !user) return;
      supabase.from("messages").insert({
        chat_id: chat.id,
        sender_id: user.id,
        content: content.trim(),
        reply_to_id: replyTo.id,
      }).then();
      setReplyTo(null);
    } else {
      sendMessage(content);
    }
  };

  const handleDelete = async (messageId: string) => {
    await supabase.from("messages").delete().eq("id", messageId);
  };

  const handleReply = (msg: Tables<"messages">) => {
    const sender = getSenderProfile(msg.sender_id);
    setReplyTo({
      id: msg.id,
      content: msg.content,
      senderName: sender?.username || (msg.sender_id === user?.id ? "You" : "Unknown"),
    });
  };

  const handlePin = async (messageId: string) => {
    if (!user) return;
    const { error } = await supabase.from("pinned_messages" as any).insert({
      chat_id: chat.id,
      message_id: messageId,
      pinned_by: user.id,
    } as any);
    if (error) {
      toast.error("Failed to pin message");
    } else {
      toast.success("Message pinned!");
    }
  };

  const getReplyToMessage = (replyToId: string | null) => {
    if (!replyToId) return null;
    return messages.find((m) => m.id === replyToId) ?? null;
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
    setTimeout(() => el?.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background"), 2000);
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-border bg-chat-header px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                {chat.isGroup ? <Users className="h-4 w-4" /> : avatarInitial}
              </AvatarFallback>
            </Avatar>
            {!chat.isGroup && chat.otherUser?.is_online && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-chat-header bg-online" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">
              {typingUsers.length > 0 ? (
                <span className="text-primary italic">
                  {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : "Several people typing..."}
                </span>
              ) : (
                <>
                  {subtitle}
                  {chat.isGroup && (
                    <> · {chat.members.filter((m) => m.is_online).length} online</>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`rounded-lg p-2 transition-colors ${showSearch ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
          {chat.isGroup && (
            <button
              onClick={() => setShowBillSplit(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              title="Split bill"
            >
              <Receipt className="h-4 w-4" />
            </button>
          )}
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Phone className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Video className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <MessageSearch
          chatId={chat.id}
          onSelectMessage={scrollToMessage}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Pinned messages */}
      <PinnedMessages chatId={chat.id} onGoToMessage={scrollToMessage} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="rounded-2xl bg-accent p-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60">Say hello! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine = msg.sender_id === user?.id;
              const senderProfile = chat.isGroup && !isMine ? getSenderProfile(msg.sender_id) : null;
              const showSender = chat.isGroup && !isMine && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);
              const replyToMsg = getReplyToMessage((msg as any).reply_to_id);
              const replyToSender = replyToMsg ? getSenderProfile(replyToMsg.sender_id) : null;

              return (
                <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-300 rounded-lg">
                  <MessageBubble
                    message={msg}
                    isMine={isMine}
                    senderName={showSender ? senderProfile?.username : undefined}
                    senderAvatar={showSender ? senderProfile?.avatar_url : undefined}
                    reactions={getReactionsForMessage(msg.id)}
                    onReact={(emoji) => toggleReaction(msg.id, emoji)}
                    onReply={() => handleReply(msg)}
                    onDelete={isMine ? () => handleDelete(msg.id) : undefined}
                    onPin={() => handlePin(msg.id)}
                    replyToMessage={replyToMsg}
                    replyToSenderName={
                      replyToMsg?.sender_id === user?.id
                        ? "You"
                        : replyToSender?.username
                    }
                    currentUserId={user?.id}
                  />
                </div>
              );
            })}
          </>
        )}
        <TypingIndicator usernames={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Smart replies */}
      <SmartReplies
        messages={messages}
        currentUserId={user?.id}
        onSelect={handleSendMessage}
      />

      {/* Message input */}
      <MessageInput
        chatId={chat.id}
        onSendMessage={handleSendMessage}
        onSendImage={sendImage}
        onTyping={sendTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onOpenPoll={() => setShowPoll(true)}
        onOpenSchedule={() => setShowSchedule(true)}
      />

      {/* Dialogs */}
      {chat.isGroup && (
        <BillSplitDialog
          open={showBillSplit}
          onOpenChange={setShowBillSplit}
          chatId={chat.id}
          members={chat.members}
        />
      )}
      <PollDialog open={showPoll} onOpenChange={setShowPoll} chatId={chat.id} />
      <ScheduleMessageDialog open={showSchedule} onOpenChange={setShowSchedule} chatId={chat.id} />
    </div>
  );
}
