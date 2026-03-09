import { useState } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Reply, Trash2, SmilePlus, Pin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReactionPicker } from "./ReactionPicker";
import type { Tables } from "@/integrations/supabase/types";
import type { Reaction } from "@/hooks/useReactions";

interface MessageBubbleProps {
  message: Tables<"messages">;
  isMine: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  onReply: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  replyToMessage?: Tables<"messages"> | null;
  replyToSenderName?: string;
  currentUserId?: string;
}

export function MessageBubble({
  message,
  isMine,
  senderName,
  senderAvatar,
  reactions,
  onReact,
  onReply,
  onDelete,
  onPin,
  replyToMessage,
  replyToSenderName,
  currentUserId,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const time = format(new Date(message.created_at), "HH:mm");

  const groupedReactions = reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false };
    acc[r.emoji].count++;
    if (r.user_id === currentUserId) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});

  // Check if this is a voice message
  const isVoice = message.content?.startsWith("🎤 Voice message");

  return (
    <div
      className={`group flex animate-fade-in ${isMine ? "justify-end" : "justify-start"} mb-1`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {senderName && (
        <Avatar className="mr-2 mt-5 h-6 w-6 shrink-0">
          <AvatarImage src={senderAvatar ?? undefined} />
          <AvatarFallback className="bg-accent text-[9px] font-medium">
            {senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="relative max-w-[70%]">
        {senderName && (
          <p className="mb-0.5 pl-1 text-[11px] font-medium text-primary">{senderName}</p>
        )}

        {/* Action buttons (hover) */}
        {showActions && (
          <div className={`absolute -top-3 ${isMine ? "left-0" : "right-0"} z-10 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-0.5 shadow-lg animate-scale-in`}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <SmilePlus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onReply}
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
            {onPin && (
              <button
                onClick={onPin}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-primary"
                title="Pin message"
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}
            {isMine && onDelete && (
              <button
                onClick={onDelete}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {showReactions && (
          <div className={`absolute -top-10 ${isMine ? "right-0" : "left-0"} z-20`}>
            <ReactionPicker onSelect={(emoji) => { onReact(emoji); setShowReactions(false); }} />
          </div>
        )}

        {replyToMessage && (
          <div className={`mb-1 rounded-lg px-3 py-1.5 ${isMine ? "bg-chat-bubble-sent/20" : "bg-accent"} border-l-2 border-primary`}>
            <p className="text-[10px] font-semibold text-primary">{replyToSenderName || "Unknown"}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {replyToMessage.content || "📷 Photo"}
            </p>
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isMine
              ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md"
              : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md"
          }`}
        >
          {message.image_url && !isVoice && (
            <img
              src={message.image_url}
              alt="Shared image"
              className="mb-1.5 max-h-56 rounded-xl object-cover"
              loading="lazy"
            />
          )}

          {/* Voice message player */}
          {isVoice && message.image_url && (
            <div className="mb-1.5">
              <audio controls src={message.image_url} className="h-8 w-48" preload="metadata" />
            </div>
          )}

          {message.content && (
            <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
              {message.content}
            </p>
          )}

          <div className={`mt-0.5 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${isMine ? "opacity-60" : "text-muted-foreground"}`}>
              {time}
            </span>
            {isMine && (
              message.seen
                ? <CheckCheck className="h-3 w-3 text-primary opacity-80" />
                : <Check className="h-3 w-3 opacity-40" />
            )}
          </div>
        </div>

        {Object.keys(groupedReactions).length > 0 && (
          <div className={`mt-0.5 flex flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}>
            {Object.entries(groupedReactions).map(([emoji, { count, hasOwn }]) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs transition-colors ${
                  hasOwn
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-secondary hover:bg-accent"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[10px] text-muted-foreground">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
