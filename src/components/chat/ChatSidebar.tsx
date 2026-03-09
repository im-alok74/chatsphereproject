import { useState } from "react";
import { Search, LogOut, Plus, Users, Settings, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ChatWithDetails } from "@/hooks/useChats";
import { formatDistanceToNow } from "date-fns";
import { UserSearchDialog } from "./UserSearchDialog";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { ProfileSettingsDialog } from "./ProfileSettingsDialog";
import chatSphereLogo from "@/assets/chatsphere-logo.png";

interface ChatSidebarProps {
  chats: ChatWithDetails[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: (userId: string) => void;
  onNewGroup: (name: string, memberIds: string[]) => void;
}

export function ChatSidebar({ chats, activeChatId, onSelectChat, onNewChat, onNewGroup }: ChatSidebarProps) {
  const { profile, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const filtered = chats.filter((c) => {
    const displayName = c.isGroup ? (c.name ?? "Group") : (c.otherUser?.username ?? "");
    return displayName.toLowerCase().includes(search.toLowerCase());
  });

  const getChatDisplayName = (chat: ChatWithDetails) => {
    if (chat.isGroup) return chat.name ?? "Group Chat";
    return chat.otherUser?.username ?? "Unknown";
  };

  const getChatAvatar = (chat: ChatWithDetails) => {
    if (chat.isGroup) return chat.avatarUrl;
    return chat.otherUser?.avatar_url;
  };

  const getChatInitials = (chat: ChatWithDetails) => {
    if (chat.isGroup) return (chat.name ?? "G").charAt(0).toUpperCase();
    return (chat.otherUser?.username ?? "?").charAt(0).toUpperCase();
  };

  const isOnline = (chat: ChatWithDetails) => {
    if (chat.isGroup) return chat.members.some((m) => m.is_online && m.user_id !== profile?.user_id);
    return chat.otherUser?.is_online ?? false;
  };

  return (
    <div className="flex h-full w-full flex-col bg-chat-sidebar">
      {/* Brand header */}
      <div className="flex items-center justify-between border-b border-chat-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src={chatSphereLogo} alt="ChatSphere" className="h-7 w-7" />
          <h1 className="font-display text-lg font-bold text-foreground">
            Chat<span className="text-primary">Sphere</span>
          </h1>
        </div>
        <div className="flex gap-0.5">
          <button onClick={() => setShowUserSearch(true)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="New chat">
            <MessageCircle className="h-4 w-4" />
          </button>
          <button onClick={() => setShowGroupCreate(true)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" title="New group">
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl bg-accent pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageCircle className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No conversations</p>
            <p className="mt-1 text-xs opacity-70">Start chatting with someone</p>
          </div>
        ) : (
          filtered.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                activeChatId === chat.id
                  ? "bg-accent shadow-sm"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={getChatAvatar(chat) ?? undefined} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                    {chat.isGroup ? <Users className="h-5 w-5" /> : getChatInitials(chat)}
                  </AvatarFallback>
                </Avatar>
                {isOnline(chat) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-chat-sidebar bg-online" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {getChatDisplayName(chat)}
                  </span>
                  {chat.lastMessage && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs text-muted-foreground">
                    {chat.lastMessage?.content
                      ? chat.lastMessage.content
                      : chat.lastMessage?.image_url
                      ? "📷 Photo"
                      : "Start a conversation"}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Bottom profile bar */}
      <div className="border-t border-chat-sidebar-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {profile?.username?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">{profile?.username}</p>
              <p className="text-[10px] text-muted-foreground">{(profile as any)?.status_message || "Online"}</p>
            </div>
          </button>
          <div className="flex gap-0.5">
            <button onClick={() => setShowProfile(true)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Settings className="h-4 w-4" />
            </button>
            <button onClick={signOut} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <UserSearchDialog open={showUserSearch} onOpenChange={setShowUserSearch} onSelectUser={onNewChat} />
      <CreateGroupDialog open={showGroupCreate} onOpenChange={setShowGroupCreate} onCreateGroup={onNewGroup} />
      <ProfileSettingsDialog open={showProfile} onOpenChange={setShowProfile} />
    </div>
  );
}
