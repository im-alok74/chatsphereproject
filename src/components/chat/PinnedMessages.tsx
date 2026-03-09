import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pin, X } from "lucide-react";
import { format } from "date-fns";

interface PinnedMessagesProps {
  chatId: string;
  onGoToMessage: (messageId: string) => void;
}

interface PinnedMsg {
  id: string;
  message_id: string;
  pinned_at: string;
  message?: { content: string | null; sender_id: string; created_at: string };
}

export function PinnedMessages({ chatId, onGoToMessage }: PinnedMessagesProps) {
  const [pins, setPins] = useState<PinnedMsg[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchPins = async () => {
      const { data } = await supabase
        .from("pinned_messages" as any)
        .select("id, message_id, pinned_at")
        .eq("chat_id", chatId)
        .order("pinned_at", { ascending: false });

      if (data && data.length > 0) {
        // Fetch message content for each pin
        const msgIds = (data as any[]).map((p: any) => p.message_id);
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, content, sender_id, created_at")
          .in("id", msgIds);

        const enriched = (data as any[]).map((p: any) => ({
          ...p,
          message: (msgs as any[])?.find((m: any) => m.id === p.message_id),
        }));
        setPins(enriched);
      } else {
        setPins([]);
      }
    };

    fetchPins();
  }, [chatId]);

  if (pins.length === 0) return null;

  const handleUnpin = async (pinId: string) => {
    await supabase.from("pinned_messages" as any).delete().eq("id", pinId);
    setPins((prev) => prev.filter((p) => p.id !== pinId));
  };

  return (
    <div className="border-b border-border bg-accent/50 px-4 py-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 text-xs font-medium text-primary"
      >
        <Pin className="h-3 w-3" />
        {pins.length} pinned message{pins.length > 1 ? "s" : ""}
      </button>

      {expanded && (
        <div className="mt-1.5 space-y-1 animate-fade-in">
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="flex items-center justify-between rounded-lg bg-secondary px-3 py-1.5"
            >
              <button
                onClick={() => onGoToMessage(pin.message_id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-xs text-foreground">
                  {pin.message?.content || "📷 Photo"}
                </p>
              </button>
              <button
                onClick={() => handleUnpin(pin.id)}
                className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
