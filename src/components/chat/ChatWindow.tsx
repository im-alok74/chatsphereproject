import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface ChatWindowProps {
  chatId: string | null;
  otherUser: Tables<"profiles"> | null;
}

export function ChatWindow({ chatId, otherUser }: ChatWindowProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, sendImage } = useMessages(chatId);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Empty state - no chat selected
  if (!chatId || !otherUser) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center bg-background text-muted-foreground">
        <MessageCircle className="mb-4 h-16 w-16 opacity-20" />
        <h2 className="text-lg font-medium">Your messages</h2>
        <p className="mt-1 text-sm">Select a chat or start a new conversation</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              {otherUser.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {otherUser.is_online && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-online" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{otherUser.username}</p>
          <p className="text-xs text-muted-foreground">
            {otherUser.is_online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === user?.id}
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <MessageInput onSendMessage={sendMessage} onSendImage={sendImage} />
    </div>
  );
}
