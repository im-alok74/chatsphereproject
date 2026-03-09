import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Moon, Sun, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { emoji: "🟢", label: "Online" },
  { emoji: "🔴", label: "Busy" },
  { emoji: "🌙", label: "Away" },
  { emoji: "💼", label: "At work" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "📚", label: "Studying" },
];

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { profile, updateProfile, signOut } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (profile && open) {
      setUsername(profile.username ?? "");
      setBio((profile as any).bio ?? "");
      setStatusMessage((profile as any).status_message ?? "");
    }
  }, [profile, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.user_id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await updateProfile({ avatar_url: publicUrl });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!username.trim() || username.length < 3) return;
    setSaving(true);
    await updateProfile({
      username: username.trim(),
      bio: bio.trim(),
      status_message: statusMessage.trim(),
    });
    setSaving(false);
    toast.success("Profile updated!");
    onOpenChange(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete user data then sign out
      if (profile) {
        await supabase.from("profiles").delete().eq("user_id", profile.user_id);
      }
      await signOut();
      toast.success("Account deleted successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete account");
    }
    setDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Profile Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Avatar */}
          <div className="flex justify-center">
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
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bio / About me</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Tell something about yourself..."
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-primary/30"
            />
            <p className="text-right text-[10px] text-muted-foreground">{bio.length}/160</p>
          </div>

          {/* Status Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setStatusMessage(s.label === statusMessage ? "" : s.label)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    statusMessage === s.label
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
            <input
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              maxLength={50}
              placeholder="Or type a custom status..."
              className="mt-1.5 h-9 w-full rounded-xl border border-border bg-secondary px-4 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-3">
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              <span className="text-sm font-medium text-foreground">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                theme === "dark" ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform ${
                  theme === "dark" ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="h-10 w-full rounded-xl text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          {/* Danger Zone */}
          <div className="rounded-xl border border-destructive/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-destructive">Danger Zone</p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete my account
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-xs text-destructive">This will permanently delete your account and all your data. This action cannot be undone.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-8 flex-1 rounded-lg border border-border text-xs font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="h-8 flex-1 rounded-lg bg-destructive text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
