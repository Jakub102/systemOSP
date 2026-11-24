# ==============================================================================
# Stage 1: Base (PHP 8.3 + rozszerzenia + Composer)
# ==============================================================================
FROM php:8.3-cli AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    libicu-dev \
    && docker-php-ext-configure intl \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring exif pcntl bcmath gd zip intl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ==============================================================================
# Stage 2: Development (lokalny docker-compose z bind-mountem)
# ==============================================================================
FROM base AS dev

COPY . .

RUN chmod +x /var/www/html/entrypoint.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

ENTRYPOINT ["/var/www/html/entrypoint.sh"]
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

# ==============================================================================
# Stage 3: Production (wielowątkowy FrankenPHP + non-root + build-time deps)
# Budowanie: docker build --target prod -t osp-backend:prod ./backend
# ==============================================================================
FROM dunglas/frankenphp:1-php8.3 AS prod

RUN install-php-extensions pdo_mysql mbstring exif pcntl bcmath gd zip intl opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Najpierw zależności (cache warstw Dockera)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --prefer-dist --optimize-autoloader

# Następnie kod aplikacji (bez .env, kluczy Firebase i vendor — pilnuje .dockerignore)
COPY . .

RUN composer dump-autoload --optimize --classmap-authoritative \
    && chmod +x /app/entrypoint.sh \
    && mkdir -p /app/storage/framework/{cache,sessions,views} /app/storage/logs /app/bootstrap/cache \
    && chown -R www-data:www-data /app/storage /app/bootstrap/cache

ENV SERVER_NAME=:8000 \
    APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

USER www-data

ENTRYPOINT ["/app/entrypoint.sh"]
EXPOSE 8000
CMD ["frankenphp", "php-server", "--root=/app/public", "--listen=:8000"]
