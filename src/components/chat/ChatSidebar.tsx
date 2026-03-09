import { useState } from "react";
import { Search, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatWithDetails } from "@/hooks/useChats";
import { formatDistanceToNow } from "date-fns";
import { UserSearchDialog } from "./UserSearchDialog";

interface ChatSidebarProps {
  chats: ChatWithDetails[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: (userId: string) => void;
}

export function ChatSidebar({ chats, activeChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
  const { profile, signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Filter chats by search term
  const filtered = chats.filter((c) =>
    c.otherUser.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full w-full flex-col border-r border-chat-sidebar-border bg-chat-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-chat-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {profile?.username?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-foreground">{profile?.username}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSearch(true)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No chats yet</p>
            <Button
              variant="link"
              className="mt-1 text-xs text-primary"
              onClick={() => setShowSearch(true)}
            >
              Start a conversation
            </Button>
          </div>
        ) : (
          filtered.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                activeChatId === chat.id ? "bg-accent" : ""
              }`}
            >
              {/* Avatar with online indicator */}
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                    {chat.otherUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {chat.otherUser.is_online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-chat-sidebar bg-online" />
                )}
              </div>

              {/* Chat info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {chat.otherUser.username}
                  </span>
                  {chat.lastMessage && (
                    <span className="shrink-0 text-xs text-muted-foreground">
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
                      : "No messages yet"}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* User search dialog */}
      <UserSearchDialog
        open={showSearch}
        onOpenChange={setShowSearch}
        onSelectUser={onNewChat}
      />
    </div>
  );
}
