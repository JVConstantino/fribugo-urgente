FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache caddy

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG APP_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV APP_URL=${APP_URL:-https://friburgourgente.com.br}
ENV OG_SERVER_PORT=4174

COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY server /app/server

EXPOSE 80
CMD ["sh", "-c", "node /app/server/og-server.mjs & caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
