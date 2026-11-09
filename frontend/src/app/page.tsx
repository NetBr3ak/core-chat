"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Bot, Command, SquarePen } from "lucide-react";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";

import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";

// Next.js inlines NEXT_PUBLIC_ variables at build time.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const transport = new DefaultChatTransport({
  api: `${API_URL}/api/chat`,
});

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/** fetch throws a TypeError when the backend is unreachable; the backend's own errors are plain text. */
function describeError(error: Error): string {
  return error instanceof TypeError ? `Could not reach the backend at ${API_URL}.` : error.message;
}

/** Screen readers hear when a reply starts and ends, not every streamed chunk. Errors use role="alert". */
function describeReplyStatus(status: ChatStatus, lastMessage: UIMessage | undefined): string {
  if (status === "submitted" || status === "streaming") return "The assistant is writing a reply.";
  if (status === "ready" && lastMessage?.role === "assistant") return "Reply finished.";
  return "";
}

export default function Home() {
  const { messages, sendMessage, status, error, regenerate, stop, setMessages, clearError } = useChat({ transport });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const lastMessage = messages.at(-1);
  const isWaitingForText = isStreaming && !(lastMessage?.role === "assistant" && getMessageText(lastMessage));

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isStreaming) return;
      sendMessage({ text: trimmed });
      setInput("");
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    },
    [input, isStreaming, sendMessage]
  );

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const startNewChat = () => {
    stop();
    setMessages([]);
    clearError();
    inputRef.current?.focus();
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex flex-col h-[100dvh] w-full overflow-hidden bg-background text-foreground font-sans">
        <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-[0.25] pointer-events-none z-0" />
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[70vw] h-[40vh] bg-primary/[0.08] blur-[120px] rounded-[100%]" />
          <div className="absolute bottom-1/4 -right-[15%] w-[40vw] h-[50vh] bg-accent/10 blur-[130px] rounded-full" />
        </div>

        <header className="absolute top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-6 bg-gradient-to-b from-background/90 to-transparent backdrop-blur-[2px] pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="relative grid place-items-center w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.02] shadow-[0_0_15px_rgba(255,255,255,0.03)_inset]">
               <Command size={14} className="text-primary/80" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <h1 className="font-medium tracking-wide text-sm text-foreground/90">core-chat</h1>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={startNewChat}
              className="pointer-events-auto flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-white/[0.08] hover:border-white/[0.16] bg-background/60 px-3 py-1.5 rounded-full transition-colors"
            >
              <SquarePen size={13} aria-hidden="true" />
              New chat
            </button>
          )}
        </header>

        <div
          role="region"
          aria-label="Conversation"
          // Focusable so keyboard users can scroll a reply that has no links.
          tabIndex={0}
          className="flex-1 w-full max-w-4xl mx-auto z-10 overflow-y-auto scrollbar-premium flex flex-col px-4 md:px-8 pb-36 pt-24 motion-safe:scroll-smooth">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && (
              <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
            )}

            {messages.map((m) => {
              const text = getMessageText(m);
              if (!text) return null;
              return <ChatMessage key={m.id} id={m.id} role={m.role} text={text} />;
            })}

            {isWaitingForText && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex justify-start w-full mt-6"
              >
                <div className="flex max-w-full sm:max-w-[85%] md:max-w-[75%] gap-4">
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.1] text-primary glass-panel">
                    <Bot size={15} className="motion-safe:animate-pulse" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest pl-1">Assistant</span>
                    <div className="px-5 py-4 min-h-[56px] flex items-center glass-panel rounded-[24px] rounded-tl-[8px]">
                      <div className="flex gap-1.5 items-center">
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                        <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <div
                key="error"
                role="alert"
                className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-destructive-foreground/30 bg-destructive/20 px-5 py-4 text-sm"
              >
                <p className="flex-1 min-w-48">{describeError(error)}</p>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="rounded-full border border-white/[0.16] px-4 py-1.5 font-medium hover:bg-white/[0.06] transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <p role="status" className="sr-only">
          {describeReplyStatus(status, lastMessage)}
        </p>

        <ChatComposer
          input={input}
          isStreaming={isStreaming}
          onInputChange={handleInput}
          onSubmit={handleSubmit}
          onStop={stop}
          status={status}
          inputRef={inputRef}
        />

      </main>
    </MotionConfig>
  );
}
