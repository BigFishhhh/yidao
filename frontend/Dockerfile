FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_KEY
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# 构建时 API 走相对路径，由 Nginx 代理
ENV NEXT_PUBLIC_API_BASE=""

RUN npm run build

# --- 生产阶段 ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# standalone 模式只需复制这些
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
