#!/bin/sh
set -e

IS_PROD="false"
if [ "$APP_ENV" = "production" ]; then
    IS_PROD="true"
fi

# W środowisku deweloperskim doinstalowujemy zależności tylko gdy brakuje vendor/autoload.php
if [ "$IS_PROD" = "false" ] && [ ! -f vendor/autoload.php ]; then
    echo "Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist
fi

# Generowanie APP_KEY tylko w środowisku lokalnym (na produkcji APP_KEY musi pochodzić ze zmiennych środowiskowych)
if [ "$IS_PROD" = "false" ] && [ -f .env ]; then
    if ! grep -q "^APP_KEY=base64:" .env; then
        echo "Generating APP_KEY..."
        php artisan key:generate --force
    fi
fi

echo "Waiting for MySQL database to start..."
until php artisan db:show > /dev/null 2>&1; do
    echo "Database is not accepting connections yet... waiting 2 seconds..."
    sleep 2
done

echo "Database connection established successfully!"

echo "Running database migrations..."
php artisan migrate --force

# Słownik ról jest idempotentny i bezpieczny w każdym środowisku
echo "Syncing roles dictionary..."
php artisan db:seed --class=RolesSeeder --force

# Dane demonstracyjne (konta testowe z password123) ładujemy WYŁĄCZNIE w dev lub przy jawnym SEED_DEMO_DATA=true
if [ "$IS_PROD" = "false" ] && [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
    echo "Seeding demo data (if database is empty)..."
    php artisan db:seed --force
fi

if [ "$IS_PROD" = "true" ]; then
    echo "Caching Laravel config and routes for production..."
    php artisan config:cache
    php artisan route:cache
fi

echo "Everything is ready! Starting Laravel backend..."
exec "$@"
