import { useState } from "react";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-popover px-1.5 py-1 shadow-lg animate-scale-in">
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="rounded-full p-1 text-sm transition-transform hover:scale-125 hover:bg-accent"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
