#!/bin/sh

echo "Checking and resolving Composer dependencies... (this may take a few minutes)"
if [ -d vendor ]; then
    composer install --no-interaction --quiet --ignore-platform-reqs
else
    composer install --no-interaction --quiet
fi

if ! grep -q "APP_KEY=base64:" .env || [ -z "$(grep APP_KEY .env | cut -d= -f2)" ]; then
    echo "Generating APP_KEY..."
    php artisan key:generate
fi

echo "Waiting for MySQL database to start..."
until php artisan db:show > /dev/null 2>&1; do
    echo "Database is not accepting connections yet... waiting 2 seconds..."
    sleep 2
done

echo "Database connection established successfully!"

echo "Running database migrations..."
php artisan migrate --force

echo "Seeding database with test data (if empty)..."
php artisan db:seed --force

echo "Everything is ready! Starting Laravel server..."
exec "$@"