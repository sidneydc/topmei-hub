# Etapa 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servidor estático
FROM node:20-alpine
WORKDIR /app
# 👇 adiciona o curl no container final
RUN apk add --no-cache curl

RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
