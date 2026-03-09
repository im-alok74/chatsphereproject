import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string) => void;
}

export function UserSearchDialog({ open, onOpenChange, onSelectUser }: UserSearchDialogProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tables<"profiles">[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${value}%`)
      .neq("user_id", user?.id ?? "")
      .limit(10);

    setResults(data ?? []);
    setSearching(false);
  };

  const handleSelect = (userId: string) => {
    onSelectUser(userId);
    onOpenChange(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {searching && (
            <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>
          )}
          {!searching && query.length >= 2 && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
          )}
          {results.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile.user_id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{profile.username}</p>
                <p className="text-xs text-muted-foreground">
                  {profile.is_online ? "Online" : "Offline"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
