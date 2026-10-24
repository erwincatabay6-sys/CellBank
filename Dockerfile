FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

FROM caddy:2-alpine
WORKDIR /srv

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist ./dist

ENV PORT=8080
EXPOSE 8080