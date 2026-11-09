import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ChatEmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  const suggestions = [
    "Write a multi-stage Dockerfile for a Bun app",
    "Explain how a CORS preflight request works",
    "Write a systemd unit for a Node.js service",
    "Compare B-tree and GIN indexes in Postgres",
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="m-auto flex flex-col items-center justify-center text-center max-w-lg w-full mt-[10vh]"
    >
      <div className="mb-8 flex items-center justify-center w-20 h-20 rounded-full glass-panel border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_40px_oklch(0.55_0.15_260/0.15)]">
        <Sparkles size={32} className="text-primary" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
        Ask about code, configs or logs
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
        Replies stream from Gemini on Vertex AI. The conversation lives in this tab only: reloading the page clears it.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 w-full">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-left text-xs px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
