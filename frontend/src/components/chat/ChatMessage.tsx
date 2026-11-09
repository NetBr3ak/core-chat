import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  id: string;
  role: UIMessage["role"];
  text: string;
}

export function ChatMessage({ id, role, text }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      key={id}
      layout
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", bounce: 0, mass: 0.8 }}
      className={cn(
        "flex w-full group mt-6",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex max-w-full sm:max-w-[85%] md:max-w-[75%] gap-4", isUser && "flex-row-reverse")}>
        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm mt-1",
            isUser
              ? "bg-gradient-to-b from-primary/20 to-primary/5 border-primary/30 text-primary"
              : "bg-gradient-to-b from-white/[0.08] to-transparent border-white/[0.1] text-foreground/80 glass-panel"
          )}
        >
          {isUser ? <User size={15} aria-hidden="true" /> : <Bot size={15} aria-hidden="true" />}
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-col gap-1.5",
            isUser ? "items-end" : "items-start"
          )}
        >
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest pl-1">
            {isUser ? "You" : "Assistant"}
          </span>
          <div
            className={cn(
              "max-w-full px-5 py-4 text-[14.5px] leading-relaxed relative",
              isUser
                ? "bg-primary text-primary-foreground rounded-[24px] rounded-tr-[8px] shadow-[0_4px_20px_oklch(0.55_0.15_260/0.15)]"
                : "glass-panel text-foreground rounded-[24px] rounded-tl-[8px]"
            )}
          >
            {!isUser && (
              <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
            )}
            {isUser ? (
              <p className="whitespace-pre-wrap break-words relative z-10 selection:bg-primary/40 leading-7">
                {text}
              </p>
            ) : (
              <div className="relative z-10 break-words selection:bg-primary/40 prose-message">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      // A fenced block without a language has no class, but its text ends with a newline.
                      const isBlock = className?.startsWith("language-") || String(children).endsWith("\n");
                      if (isBlock) {
                        // tabIndex: keyboard users can scroll a wide block.
                        return (
                          <code
                            tabIndex={0}
                            className={cn(
                              "block w-full overflow-x-auto text-[13px] font-mono leading-6",
                              "bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 my-3",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code
                          className="font-mono text-[13px] bg-white/[0.08] border border-white/[0.06] rounded px-1.5 py-0.5"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    a({ children, href }) {
                      return (
                        <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 underline underline-offset-2">
                          {children}
                        </a>
                      );
                    },
                    pre({ children }) {
                      return <pre className="not-prose my-0 bg-transparent">{children}</pre>;
                    },
                    p({ children }) {
                      return <p className="my-1.5 leading-7">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="my-2 pl-4 list-disc space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="my-2 pl-4 list-decimal space-y-1">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="leading-7">{children}</li>;
                    },
                    strong({ children }) {
                      return <strong className="font-semibold text-foreground">{children}</strong>;
                    },
                    h1({ children }) {
                      return <h1 className="text-lg font-semibold mt-4 mb-2">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-base font-semibold mt-3 mb-1.5">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
                          {children}
                        </blockquote>
                      );
                    },
                    table({ children }) {
                      return (
                        <div tabIndex={0} className="overflow-x-auto my-3">
                          <table className="min-w-full text-[13px] border-collapse">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-left font-semibold">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="border border-white/[0.06] px-3 py-1.5">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {text}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

