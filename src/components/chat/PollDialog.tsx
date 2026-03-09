import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
}

export function PollDialog({ open, onOpenChange, chatId }: PollDialogProps) {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (i: number) => {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, val: string) => {
    setOptions(options.map((o, idx) => (idx === i ? val : o)));
  };

  const handleCreate = async () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !user) return;
    setCreating(true);

    const cleanOptions = options.filter((o) => o.trim()).map((o) => o.trim());

    // Create poll
    const { error } = await supabase.from("polls" as any).insert({
      chat_id: chatId,
      created_by: user.id,
      question: question.trim(),
      options: cleanOptions,
    } as any);

    if (error) {
      toast.error("Failed to create poll");
    } else {
      // Also send a message about the poll
      await supabase.from("messages").insert({
        chat_id: chatId,
        sender_id: user.id,
        content: `📊 Poll: ${question.trim()}\n${cleanOptions.map((o, i) => `${i + 1}. ${o}`).join("\n")}`,
      });
      toast.success("Poll created!");
      setQuestion("");
      setOptions(["", ""]);
      onOpenChange(false);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Poll</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              placeholder="Ask something..."
              className="h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  maxLength={100}
                  placeholder={`Option ${i + 1}`}
                  className="h-9 flex-1 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button onClick={addOption} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add option
              </button>
            )}
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !question.trim() || options.filter((o) => o.trim()).length < 2}
            className="h-10 w-full rounded-xl text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            {creating ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
