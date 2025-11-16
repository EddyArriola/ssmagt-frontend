# Dockerfile para Angular Frontend
FROM node:20-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
RUN npm ci --frozen-lockfile && npm cache clean --force

# Etapa de build
FROM base AS builder
WORKDIR /app

# Argumentos de build
ARG API_URL=http://localhost:3000
ARG ENVIRONMENT=production

# Copiar código fuente
COPY . .

# Configurar variables de entorno para el build
ENV API_URL=$API_URL
ENV ENVIRONMENT=$ENVIRONMENT

# Build de la aplicación Angular para producción
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine AS production

# Instalar wget para health checks
RUN apk add --no-cache wget

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos build de Angular
COPY --from=builder /app/dist/ssmagt-frontend/browser /usr/share/nginx/html

# Copiar script de inicio
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S angular -u 1001

# Cambiar ownership de archivos necesarios
RUN chown -R angular:nodejs /usr/share/nginx/html
RUN chown angular:nodejs /docker-entrypoint.sh

# Configurar directorio para PID de nginx
RUN mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/cache/nginx/proxy_temp \
    && mkdir -p /var/cache/nginx/fastcgi_temp \
    && mkdir -p /var/cache/nginx/uwsgi_temp \
    && mkdir -p /var/cache/nginx/scgi_temp \
    && chown -R angular:nodejs /var/cache/nginx \
    && chmod 755 /var/cache/nginx

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Variables de entorno
ENV API_URL=$API_URL
ENV ENVIRONMENT=$ENVIRONMENT

# Comando de inicio
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]