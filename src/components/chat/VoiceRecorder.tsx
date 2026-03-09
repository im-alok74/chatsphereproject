import { useState, useRef } from "react";
import { Mic, Square, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VoiceRecorderProps {
  chatId: string;
  onSent: () => void;
}

export function VoiceRecorder({ chatId, onSent }: VoiceRecorderProps) {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      // Microphone permission denied
    }
  };

  const stopAndSend = async () => {
    if (!mediaRecorderRef.current || !user) return;

    const recorder = mediaRecorderRef.current;
    if (timerRef.current) clearInterval(timerRef.current);

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setSending(true);
        setRecording(false);

        const path = `${chatId}/${Date.now()}.webm`;
        await supabase.storage.from("chat-images").upload(path, blob);
        const { data: { publicUrl } } = supabase.storage.from("chat-images").getPublicUrl(path);

        await supabase.from("messages").insert({
          chat_id: chatId,
          sender_id: user.id,
          content: `🎤 Voice message (${formatTime(duration)})`,
          image_url: publicUrl,
        });

        setSending(false);
        setDuration(0);
        onSent();
        resolve();
      };

      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setDuration(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (sending) {
    return (
      <button disabled className="rounded-lg p-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 animate-fade-in">
        <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          {formatTime(duration)}
        </span>
        <button onClick={cancelRecording} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title="Cancel">
          <Square className="h-4 w-4" />
        </button>
        <button onClick={stopAndSend} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "var(--gradient-brand)" }} title="Send">
          <Send className="h-3.5 w-3.5 text-primary-foreground" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      title="Voice message"
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
