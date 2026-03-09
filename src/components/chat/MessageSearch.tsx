import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface MessageSearchProps {
  chatId: string;
  onSelectMessage: (messageId: string) => void;
  onClose: () => void;
}

export function MessageSearch({ chatId, onSelectMessage, onClose }: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tables<"messages">[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .ilike("content", `%${value}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    setResults(data ?? []);
    setSearching(false);
  }, [chatId]);

  return (
    <div className="border-b border-border bg-chat-header px-4 py-2 animate-fade-in">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search in conversation..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          autoFocus
        />
        <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto">
          {results.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelectMessage(msg.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-accent"
            >
              <span className="truncate text-foreground">{msg.content}</span>
              <span className="shrink-0 text-muted-foreground">
                {new Date(msg.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
      {searching && <p className="mt-2 text-xs text-muted-foreground">Searching...</p>}
      {!searching && query.length >= 2 && results.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No results found</p>
      )}
    </div>
  );
}
