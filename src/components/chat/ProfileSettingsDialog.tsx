import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { profile, updateProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.user_id}/avatar.${ext}`;

    // Upload to avatars bucket
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await updateProfile({ avatar_url: publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!username.trim() || username.length < 3) return;
    setSaving(true);
    await updateProfile({ username: username.trim() });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Avatar with upload */}
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-bold">
                {profile?.username?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-foreground" /> : <Camera className="h-6 w-6 text-foreground" />}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Username field */}
          <div className="w-full space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="h-10 w-full rounded-xl text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
