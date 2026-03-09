import { useState, useRef } from "react";
import { Send, Image as ImageIcon, BarChart3, Clock } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { VoiceRecorder } from "./VoiceRecorder";

interface MessageInputProps {
  chatId: string | null;
  onSendMessage: (content: string) => void;
  onSendImage: (file: File) => void;
  onTyping?: (isTyping: boolean) => void;
  replyTo?: { id: string; content: string | null; senderName: string } | null;
  onCancelReply?: () => void;
  onOpenPoll?: () => void;
  onOpenSchedule?: () => void;
}

export function MessageInput({ chatId, onSendMessage, onSendImage, onTyping, replyTo, onCancelReply, onOpenPoll, onOpenSchedule }: MessageInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
    onTyping?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping?.(e.target.value.length > 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendImage(file);
      e.target.value = "";
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  // Allow SmartReplies to set text
  const setTextFromOutside = (val: string) => {
    setText(val);
  };

  return (
    <div className="border-t border-border bg-chat-header px-3 py-2.5">
      {/* Reply preview */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-accent px-3 py-2 animate-fade-in">
          <div className="h-full w-0.5 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-primary">{replyTo.senderName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {replyTo.content || "📷 Photo"}
            </p>
          </div>
          <button onClick={onCancelReply} className="shrink-0 text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Action buttons */}
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <EmojiPicker onSelect={handleEmojiSelect} />
          {onOpenPoll && (
            <button
              type="button"
              onClick={onOpenPoll}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Create poll"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
          )}
          {onOpenSchedule && (
            <button
              type="button"
              onClick={onOpenSchedule}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Schedule message"
            >
              <Clock className="h-5 w-5" />
            </button>
          )}
          {chatId && (
            <VoiceRecorder chatId={chatId} onSent={() => {}} />
          )}
        </div>

        {/* Text input */}
        <div className="flex-1">
          <textarea
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="max-h-28 min-h-[38px] w-full resize-none rounded-2xl border border-border bg-secondary px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Send */}
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-30"
          style={{ background: text.trim() ? "var(--gradient-brand)" : undefined }}
        >
          <Send className={`h-4 w-4 ${text.trim() ? "text-primary-foreground" : "text-muted-foreground"}`} />
        </button>
      </form>
    </div>
  );
}
