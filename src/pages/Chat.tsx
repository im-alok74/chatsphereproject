import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChats } from "@/hooks/useChats";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const Chat = () => {
  const { user, loading } = useAuth();
  const { chats, loading: chatsLoading, createOrFindChat } = useChats();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const activeChat = chats.find((c) => c.id === activeChatId);

  const handleNewChat = async (otherUserId: string) => {
    const chatId = await createOrFindChat(otherUserId);
    if (chatId) setActiveChatId(chatId);
  };

  // Mobile: show either sidebar or chat window
  if (isMobile) {
    if (activeChatId && activeChat) {
      return (
        <div className="flex h-screen flex-col">
          {/* Mobile back button header */}
          <div className="flex items-center gap-2 border-b border-border px-2 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setActiveChatId(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow chatId={activeChatId} otherUser={activeChat.otherUser} />
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
        />
      </div>
    );
  }

  // Desktop: side-by-side layout
  return (
    <div className="flex h-screen">
      <div className="w-80 shrink-0 lg:w-96">
        <ChatSidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
        />
      </div>
      <ChatWindow
        chatId={activeChatId}
        otherUser={activeChat?.otherUser ?? null}
      />
    </div>
  );
};

export default Chat;
