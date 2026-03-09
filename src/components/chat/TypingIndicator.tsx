interface TypingIndicatorProps {
  usernames: string[];
}

export function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : usernames.length === 2
      ? `${usernames[0]} and ${usernames[1]} are typing`
      : `${usernames[0]} and ${usernames.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-1 animate-fade-in">
      <div className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
      <span className="text-[11px] text-muted-foreground italic">{text}</span>
    </div>
  );
}
