# Build stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine

# Install OpenSSL for Prisma engine
RUN apk add --no-cache openssl

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 创建数据目录和上传目录
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

# 启动脚本：先迁移数据库（如果是 SQLite），再启动
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm start"]
