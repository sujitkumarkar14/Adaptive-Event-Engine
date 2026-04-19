# Stage 1: Native Node Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# Exclude heavy dependencies not required for Vite bundling
RUN npm ci

COPY . .
# Leverage Vite compilation to restrict bundle size
RUN npm run build

# Stage 2: Unprivileged Nginx Runtime
FROM nginx:1.25-alpine
# Replace default config with our hardened React fallback setup
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Run as non-root user for Google Cloud Run security requirements
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx
# Map to 8080 (Cloud Run expected inbound)
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
