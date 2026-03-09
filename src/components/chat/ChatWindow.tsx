import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { BillSplitDialog } from "./BillSplitDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Users, Receipt, Phone, Video, MoreVertical } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { ChatWithDetails } from "@/hooks/useChats";
import chatSphereLogo from "@/assets/chatsphere-logo.png";

interface ChatWindowProps {
  chat: ChatWithDetails | null;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendImage } = useMessages(chat?.id ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showBillSplit, setShowBillSplit] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Empty state
  if (!chat) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <img src={chatSphereLogo} alt="" className="h-20 w-20 opacity-30" />
            <div className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/10 blur-xl" />
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

  // Find sender profile for group messages
  const getSenderProfile = (senderId: string) => chat.members.find((m) => m.user_id === senderId);

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
              {subtitle}
              {chat.isGroup && (
                <> · {chat.members.filter((m) => m.is_online).length} online</>
              )}
            </p>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex gap-1">
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
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  senderName={showSender ? senderProfile?.username : undefined}
                  senderAvatar={showSender ? senderProfile?.avatar_url : undefined}
                />
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <MessageInput onSendMessage={sendMessage} onSendImage={sendImage} />

      {/* Bill split dialog for group chats */}
      {chat.isGroup && (
        <BillSplitDialog
          open={showBillSplit}
          onOpenChange={setShowBillSplit}
          chatId={chat.id}
          members={chat.members}
        />
      )}
    </div>
  );
}
