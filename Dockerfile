FROM node:22-slim AS base

# --- deps stage ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# --- builder stage ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Placeholder secrets for build-time type generation (not used at runtime)
ENV PAYLOAD_SECRET=build-placeholder
ENV DATABASE_URL=file:/tmp/build-placeholder.db
ENV NEXT_PUBLIC_SERVER_URL=https://magazine.happyharem.com

RUN npm run build

# --- runner stage ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# SQLite data directory (mounted as a volume in production)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# libsql native bindings (linux-x64-gnu for Debian slim) are not traced by
# Next.js standalone analysis — copy them explicitly.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/libsql ./node_modules/libsql
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
