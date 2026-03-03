# === Etapa 1: Builder - Instala dependencias y construye la aplicación ===
FROM node:20-slim AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Instala dependencias del sistema necesarias para canvas y otras librerías nativas
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgif-dev \
    libpixman-1-dev \
    libfreetype6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia los archivos de definición de paquetes
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install

# Copia el resto del código fuente de la aplicación
COPY . .

# Define el basePath en tiempo de BUILD (next.config.ts lo lee al compilar, no en runtime)
ARG NEXT_PUBLIC_BASE_PATH=/CRMContactosResiflex
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Construye la aplicación Next.js para producción
# La configuración 'output: standalone' en next.config.js es crucial aquí
RUN npm run build

# === Etapa 2: Runner - Crea la imagen final de producción ===
FROM node:20-slim AS runner

WORKDIR /app

# Instala las dependencias de runtime necesarias para canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libgif7 \
    libpixman-1-0 \
    libfreetype6 \
    && rm -rf /var/lib/apt/lists/*

# Copia los artefactos de la construcción desde la etapa 'builder'
# Copia la carpeta 'public' para que las imágenes y otros assets funcionen
COPY --from=builder /app/public ./public
# Copia la salida 'standalone' que contiene el servidor optimizado y el código necesario
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# --- SOLUCIÓN PERMISOS: Crear carpetas con permisos correctos ---
# Creamos las carpetas donde la app sube fotos y asignamos permisos amplios
# para que el usuario node pueda escribir en ellas
RUN mkdir -p /app/activos_it /app/fotosPersonas && \
    chown -R node:node /app/activos_it /app/fotosPersonas && \
    chmod -R 755 /app/activos_it /app/fotosPersonas
# ----------------------------------------------------------------

# Establece el usuario no-root para ejecutar la aplicación
USER node

# Expone el puerto en el que la aplicación se ejecutará
# Tu docker-compose.override.yml ya mapea el puerto 3000 de Traefik a este contenedor
EXPOSE 3000

# Define el comando para iniciar el servidor de Next.js
# El servidor 'server.js' es generado por la construcción 'standalone'
CMD ["node", "server.js"]