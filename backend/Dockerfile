# Same Bun version as the lockfile and CI.
FROM oven/bun:1.4.0-slim AS install
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4.0-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001 HOST=0.0.0.0
COPY --from=install /app/node_modules node_modules
COPY package.json app.ts index.ts ./
USER bun
EXPOSE 3001
CMD ["bun", "index.ts"]
