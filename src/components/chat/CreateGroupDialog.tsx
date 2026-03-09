import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Check } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
}

export function CreateGroupDialog({ open, onOpenChange, onCreateGroup }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"select" | "name">("select");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tables<"profiles">[]>([]);
  const [selected, setSelected] = useState<Tables<"profiles">[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setStep("select");
      setQuery("");
      setResults([]);
      setSelected([]);
      setGroupName("");
    }
  }, [open]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) { setResults([]); return; }
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

  const toggleUser = (profile: Tables<"profiles">) => {
    setSelected((prev) =>
      prev.some((p) => p.user_id === profile.user_id)
        ? prev.filter((p) => p.user_id !== profile.user_id)
        : [...prev, profile]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selected.length < 1) return;
    onCreateGroup(groupName.trim(), selected.map((p) => p.user_id));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {step === "select" ? "Add members" : "Name your group"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <>
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {selected.map((p) => (
                  <button
                    key={p.user_id}
                    onClick={() => toggleUser(p)}
                    className="flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
                  >
                    {p.username}
                    <span className="text-primary/60">×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search users..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-10 w-full rounded-xl bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="max-h-56 overflow-y-auto">
              {searching && <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>}
              {results.map((profile) => {
                const isSelected = selected.some((p) => p.user_id === profile.user_id);
                return (
                  <button
                    key={profile.id}
                    onClick={() => toggleUser(profile)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                        {profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium text-foreground">{profile.username}</span>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            {selected.length > 0 && (
              <button
                onClick={() => setStep("name")}
                className="h-10 w-full rounded-xl text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                Next — {selected.length} selected
              </button>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Group name</label>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Weekend Trip 🏖️"
                className="h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                autoFocus
              />
            </div>

            {/* Member preview */}
            <div className="flex flex-wrap gap-2 py-2">
              {selected.map((p) => (
                <div key={p.user_id} className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-secondary text-[10px] font-medium">{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{p.username}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep("select")} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-foreground transition-colors hover:bg-accent">
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!groupName.trim()}
                className="flex-1 h-10 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-50"
                style={{ background: "var(--gradient-brand)" }}
              >
                Create group
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
