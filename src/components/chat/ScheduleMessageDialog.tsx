import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Clock } from "lucide-react";

interface ScheduleMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
}

export function ScheduleMessageDialog({ open, onOpenChange, chatId }: ScheduleMessageDialogProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    if (!content.trim() || !date || !time || !user) return;
    const scheduledAt = new Date(`${date}T${time}`);
    if (scheduledAt <= new Date()) {
      toast.error("Please pick a future date/time");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("scheduled_messages" as any).insert({
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim(),
      scheduled_at: scheduledAt.toISOString(),
    } as any);

    if (error) {
      toast.error("Failed to schedule message");
    } else {
      toast.success("Message scheduled!");
      setContent("");
      setDate("");
      setTime("");
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Schedule Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Type your message..."
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-9 w-full rounded-xl border border-border bg-secondary px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-secondary px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <button
            onClick={handleSchedule}
            disabled={saving || !content.trim() || !date || !time}
            className="h-10 w-full rounded-xl text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            {saving ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
