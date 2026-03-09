import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface SmartRepliesProps {
  messages: Tables<"messages">[];
  currentUserId: string | undefined;
  onSelect: (reply: string) => void;
}

export function SmartReplies({ messages, currentUserId, onSelect }: SmartRepliesProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const fetchSuggestions = async () => {
    if (messages.length < 2) return;
    setLoading(true);
    setVisible(true);

    const recentMsgs = messages.slice(-6).map((m) => ({
      content: m.content || "📷 Photo",
      isMine: m.sender_id === currentUserId,
    }));

    try {
      const { data, error } = await supabase.functions.invoke("smart-replies", {
        body: { messages: recentMsgs },
      });

      if (error) throw error;
      setSuggestions(data?.suggestions ?? []);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  };

  // Auto-fetch when last message is from the other person
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.sender_id !== currentUserId && messages.length >= 2) {
      fetchSuggestions();
    } else {
      setVisible(false);
    }
  }, [messages.length]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 animate-fade-in">
      <Sparkles className="h-3 w-3 shrink-0 text-primary" />
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      ) : (
        suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              onSelect(s);
              setVisible(false);
            }}
            className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {s}
          </button>
        ))
      )}
    </div>
  );
}
