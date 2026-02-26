FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    icu-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    mysql-client \
    ca-certificates

RUN docker-php-ext-install \
    intl \
    mysqli \
    pdo_mysql \
    zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-interaction --optimize-autoloader

EXPOSE 8080
CMD ["php", "spark", "serve", "--host", "0.0.0.0", "--port", "8080"]
