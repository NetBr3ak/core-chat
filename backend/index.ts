import { createVertex } from "@ai-sdk/google-vertex/edge";
import { createApp } from "./app";

const apiKey = process.env.GOOGLE_VERTEX_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_VERTEX_API_KEY is not set. Copy .env.example to .env and add a Vertex AI API key.");
  process.exit(1);
}

// Express mode: with an API key the provider calls the global Vertex AI endpoint,
// so GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION have no effect.
const vertex = createVertex({ apiKey });

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim());

const app = createApp({ model: vertex("gemini-3.1-flash-lite-preview"), allowedOrigins });

export default {
  // Loopback by default: the backend has no login, so anyone who reaches it spends the key's quota.
  // The Docker image sets HOST=0.0.0.0, because Docker forwards a published port from outside the container.
  hostname: process.env.HOST || "127.0.0.1",
  port: Number(process.env.PORT) || 3001,
  fetch: app.fetch,
};
