FROM php:8.4-fpm

# 1. Instalacja zależności systemowych
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev

# 2. Czyszczenie pamięci podręcznej APT
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# 3. Instalacja rozszerzeń PHP (dopasowane pod PHP 8.4)
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# 4. Pobranie najnowszego Composera
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 5. Kopiowanie kodu źródłowego
COPY . .

# 6. Nadanie uprawnień do folderów zapisu Laravela
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

# 7. AUTOMATYZACJA STARTU:
CMD sh -c "if [ ! -d 'vendor' ]; then composer install; fi && php artisan serve --host=0.0.0.0 --port=80"