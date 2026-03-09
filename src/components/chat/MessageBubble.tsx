import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Tables } from "@/integrations/supabase/types";

interface MessageBubbleProps {
  message: Tables<"messages">;
  isMine: boolean;
  senderName?: string;
  senderAvatar?: string | null;
}

export function MessageBubble({ message, isMine, senderName, senderAvatar }: MessageBubbleProps) {
  const time = format(new Date(message.created_at), "HH:mm");

  return (
    <div className={`flex animate-fade-in ${isMine ? "justify-end" : "justify-start"} mb-1`}>
      {/* Sender avatar for group messages */}
      {senderName && (
        <Avatar className="mr-2 mt-5 h-6 w-6 shrink-0">
          <AvatarImage src={senderAvatar ?? undefined} />
          <AvatarFallback className="bg-accent text-[9px] font-medium">
            {senderName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="max-w-[70%]">
        {/* Sender name label */}
        {senderName && (
          <p className="mb-0.5 pl-1 text-[11px] font-medium text-primary">{senderName}</p>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isMine
              ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md"
              : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md"
          }`}
        >
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Shared image"
              className="mb-1.5 max-h-56 rounded-xl object-cover"
              loading="lazy"
            />
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
                ? <CheckCheck className="h-3 w-3 opacity-60" />
                : <Check className="h-3 w-3 opacity-60" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
