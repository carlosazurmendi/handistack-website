# syntax=docker/dockerfile:1
# Multi-stage build for the Handistack site (Next.js standalone + Payload).
# Image is pulled to the GCP VPS via Dockhand from GitHub.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# ---- builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build needs a value to satisfy config parsing; real secrets are injected at runtime.
ENV NEXT_TELEMETRY_DISABLED=1
ENV PAYLOAD_DB_PUSH=false
RUN pnpm payload generate:importmap || true
RUN pnpm build

# ---- runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Listen on 80 to match the Traefik service port; bind allowed for non-root via setcap.
ENV PORT=80
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN apk add --no-cache libcap \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs \
  && setcap 'cap_net_bind_service=+ep' "$(readlink -f "$(which node)")"

# Standalone server + static assets + public files.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Writable media dir (mount a volume here in prod for persistence).
RUN mkdir -p ./public/media && chown -R nextjs:nodejs ./public/media

USER nextjs
EXPOSE 80
CMD ["node", "server.js"]
