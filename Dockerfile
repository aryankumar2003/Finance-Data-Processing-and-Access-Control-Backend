FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY . .
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma generate

RUN npm run build

FROM node:22-alpine AS runner
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 appuser

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist             ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=builder /app/src/prisma      ./src/prisma

COPY prisma.config.ts ./

USER appuser

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
