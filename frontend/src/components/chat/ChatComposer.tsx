import { motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";
import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  input: string;
  isStreaming: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  status: "streaming" | "submitted" | "ready" | "error";
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatComposer({
  input,
  isStreaming,
  onInputChange,
  onSubmit,
  onStop,
  status,
  inputRef,
}: ChatComposerProps) {
  // The textarea is disabled while a reply streams; give focus back when it ends or fails.
  useEffect(() => {
    if (status === "ready" || status === "error") inputRef.current?.focus();
  }, [status, inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="absolute bottom-0 inset-x-0 z-50 p-4 pb-6 md:pb-8 flex justify-center bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
      <motion.form
        layout="position"
        onSubmit={onSubmit}
        className="pointer-events-auto relative w-full max-w-3xl flex items-end gap-2 p-2 rounded-3xl glass border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.3),_0_0_0_1px_rgba(255,255,255,0.02)_inset] transition-all hover:border-white/[0.15] focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-3xl bg-primary/5 transition-opacity duration-500 z-0",
            input.length > 0 ? "opacity-100" : "opacity-0"
          )}
        />

        <textarea
          ref={inputRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Message"
          placeholder="Ask a question or paste a log"
          disabled={isStreaming}
          rows={1}
          className="w-full relative z-10 bg-transparent px-4 py-3.5 text-sm md:text-base text-foreground placeholder:text-muted-foreground resize-none outline-none overflow-y-auto scrollbar-premium max-h-[200px]"
          spellCheck={false}
        />

        <div className="relative z-10 mb-1.5 mr-1.5 shrink-0 flex items-center">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop the reply"
              className="grid place-items-center w-9 h-9 rounded-full bg-foreground text-background transition-all hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
            >
              <Square size={13} fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="grid place-items-center w-9 h-9 rounded-full bg-foreground text-background transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(255,255,255,0.1)]"
            >
              <ArrowUp size={18} strokeWidth={2.5} className="mr-[0.5px]" aria-hidden="true" />
            </button>
          )}
        </div>
      </motion.form>
    </div>
  );
}
