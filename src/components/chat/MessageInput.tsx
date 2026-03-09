import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Smile, Paperclip } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendImage: (file: File) => void;
}

export function MessageInput({ onSendMessage, onSendImage }: MessageInputProps) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendImage(file);
      e.target.value = "";
    }
  };

  return (
    <div className="border-t border-border bg-chat-header px-3 py-2.5">
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
        </div>

        {/* Text input */}
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
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
