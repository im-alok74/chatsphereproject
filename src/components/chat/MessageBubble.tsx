import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface MessageBubbleProps {
  message: Tables<"messages">;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = format(new Date(message.created_at), "HH:mm");

  return (
    <div
      className={`flex animate-fade-in ${isMine ? "justify-end" : "justify-start"} mb-1`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isMine
            ? "bg-chat-bubble-sent text-chat-bubble-sent-foreground rounded-br-md"
            : "bg-chat-bubble-received text-chat-bubble-received-foreground rounded-bl-md"
        }`}
      >
        {/* Image message */}
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Shared image"
            className="mb-1 max-h-64 rounded-lg object-cover"
            loading="lazy"
          />
        )}

        {/* Text content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
        )}

        {/* Timestamp and seen status */}
        <div
          className={`mt-0.5 flex items-center gap-1 ${
            isMine ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-[10px] ${
              isMine ? "text-chat-bubble-sent-foreground/70" : "text-muted-foreground"
            }`}
          >
            {time}
          </span>
          {isMine && (
            message.seen ? (
              <CheckCheck className="h-3 w-3 text-chat-bubble-sent-foreground/70" />
            ) : (
              <Check className="h-3 w-3 text-chat-bubble-sent-foreground/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
