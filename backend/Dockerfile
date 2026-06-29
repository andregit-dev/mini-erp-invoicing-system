# =========================
# Builder
# =========================
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

RUN mkdir -p dist/prisma/generated/prisma && \
    cp prisma/generated/prisma/*.so.node dist/prisma/generated/prisma/

# =========================
# Runner
# =========================
FROM node:20-bookworm-slim AS runner

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production
# COPY --from=builder /app .
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
