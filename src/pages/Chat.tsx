import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/hooks/useChats";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";

const Chat = () => {
  const { user, loading } = useAuth();
  const { chats, loading: chatsLoading, createOrFindChat, createGroupChat } = useChats();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const handleNewChat = async (otherUserId: string) => {
    const chatId = await createOrFindChat(otherUserId);
    if (chatId) setActiveChatId(chatId);
  };

  const handleNewGroup = async (name: string, memberIds: string[]) => {
    const chatId = await createGroupChat(name, memberIds);
    if (chatId) setActiveChatId(chatId);
  };

  if (isMobile) {
    if (activeChatId && activeChat) {
      return (
        <div className="flex h-screen flex-col bg-background">
          <div className="flex items-center gap-2 border-b border-border bg-chat-header px-2 py-1.5">
            <button
              onClick={() => setActiveChatId(null)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow chat={activeChat} />
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen bg-background">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onNewGroup={handleNewGroup}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-80 shrink-0 border-r border-border lg:w-96">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          onNewGroup={handleNewGroup}
        />
      </div>
      <ChatWindow chat={activeChat} />
    </div>
  );
};

export default Chat;
