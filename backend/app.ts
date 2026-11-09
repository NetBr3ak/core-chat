import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { convertToModelMessages, safeValidateUIMessages, streamText, type LanguageModel, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are core-chat, a general assistant. You run on Google Gemini through Vertex AI.
You have deep expertise in: Linux/Unix, PostgreSQL, Redis, Docker, Kubernetes, Google Cloud Platform, CI/CD, network security, infrastructure monitoring, software architecture, and general software engineering.

## Communication style
- Match the user's language automatically: respond in Polish if they write in Polish, English if they write in English.
- Be thorough and complete. Give full answers, not stubs. If a task requires a 100-line config, write all 100 lines.
- Use a direct, confident tone, like a senior engineer talking to a peer, not a help desk bot.
- For technical content: always use fenced code blocks with the correct language tag (bash, yaml, sql, typescript, etc.).
- When analyzing errors or logs: identify root cause first, then provide the fix with explanation.
- Proactively mention relevant caveats, gotchas, or follow-up steps when they matter.

## Capabilities & approach
- You can help with anything technical: code, scripts, configs, architecture decisions, debugging, cloud infra, security audits, data migrations, etc.
- You can also help with non-technical tasks: writing, analysis, summarization, planning, research.
- You cannot run commands or reach the user's systems. Work only from what the user writes or pastes.
- When a task is ambiguous, make a reasonable assumption, state it briefly, and proceed.
- Never refuse a reasonable request. If something has risks or caveats, mention them but still provide the answer.
- You do not add unnecessary safety disclaimers to normal technical tasks (e.g. no "make sure you back up your database" warnings on every SQL query).

## Output quality
- Prefer complete, working solutions over partial examples.
- For multi-step tasks: use numbered steps or clear section headers.
- When writing code: include imports, handle errors, follow idiomatic patterns for the language/framework.
- Trim small-talk and filler. Get to the point quickly, but don't be terse to the point of being unhelpful.`;

// The client resends the whole conversation with every message; 256 KB holds a long one.
const MAX_BODY_BYTES = 256 * 1024;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const INVALID_REQUEST = "The request does not contain valid chat messages.";

/** The Bun server, which Bun passes to `fetch` as its second argument. */
type Bindings = { requestIP(request: Request): { address: string } | null };

export type AppOptions = { model: LanguageModel; allowedOrigins: string[] };

export function createApp({ model, allowedOrigins }: AppOptions) {
  const app = new Hono<{ Bindings: Bindings }>();
  const isAllowed = createRateLimiter(RATE_LIMIT, RATE_WINDOW_MS);

  app.use(secureHeaders());
  app.use(cors({ origin: allowedOrigins, allowMethods: ["GET", "POST", "OPTIONS"], allowHeaders: ["Content-Type"] }));

  // Cloud Run uses this for its health check.
  app.get("/health", (c) => c.json({ status: "ok", uptime: process.uptime() }));

  app.post(
    "/api/chat",
    async (c, next) => {
      // Behind a reverse proxy every client shares the proxy's address, so this becomes one global limit.
      const client = c.env.requestIP(c.req.raw)?.address ?? "unknown";
      if (isAllowed(client)) return next();
      c.header("Retry-After", String(RATE_WINDOW_MS / 1000));
      return c.text("Too many messages. Wait a minute and try again.", 429);
    },
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => c.text("This conversation is too long. Start a new chat.", 413),
    }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.text(INVALID_REQUEST, 400);
      }
      const messages = await parseMessages(body);
      if (!messages) return c.text(INVALID_REQUEST, 400);

      const result = streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: await convertToModelMessages(messages),
        temperature: 0.7,
        maxOutputTokens: 8192,
        topP: 0.95,
        abortSignal: c.req.raw.signal,
        // The message only: the full error object carries the request body, so the user's text would reach the log.
        onError: ({ error }) => console.error("Model request failed:", error instanceof Error ? error.message : error),
      });

      return result.toUIMessageStreamResponse({
        // Without identity encoding Bun buffered the chunks and the browser
        // reported ERR_INCOMPLETE_CHUNKED_ENCODING (commit 58db3ce).
        headers: { "Content-Encoding": "identity" },
        onError: () => "The model request failed. The server log has the details.",
      });
    },
  );

  return app;
}

/**
 * Returns the conversation as user and assistant text only, or null when the body is not a valid
 * conversation. Dropping system messages and file parts keeps a client from replacing the system
 * prompt or making the server fetch a URL.
 */
export async function parseMessages(body: unknown): Promise<UIMessage[] | null> {
  if (typeof body !== "object" || body === null || !("messages" in body)) return null;
  const validation = await safeValidateUIMessages({ messages: body.messages });
  if (!validation.success) return null;

  const messages = validation.data
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({ ...message, parts: message.parts.filter((part) => part.type === "text") }))
    .filter((message) => message.parts.length > 0);
  return messages.length > 0 ? messages : null;
}

/** Counts requests per key in fixed windows; returns false once a key has used up its window. */
function createRateLimiter(limit: number, windowMs: number) {
  // ponytail: in memory and per process; several instances need a shared store such as Redis.
  const windows = new Map<string, { count: number; resetAt: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const current = windows.get(key);
    if (current && current.resetAt > now) {
      current.count += 1;
      return current.count <= limit;
    }
    if (windows.size >= 10_000) {
      for (const [staleKey, window] of windows) if (window.resetAt <= now) windows.delete(staleKey);
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  };
}
