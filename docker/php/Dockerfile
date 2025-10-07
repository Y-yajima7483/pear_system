FROM php:8.2-fpm-alpine

# 必要な拡張機能とツールをインストール
RUN apk add --no-cache \
    bash \
    git \
    zip \
    unzip \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    postgresql-dev \
    tzdata && \
    cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && \
    echo "Asia/Tokyo" > /etc/timezone && \
    apk del tzdata

# PHP拡張機能をインストール
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mbstring \
    zip \
    intl \
    bcmath \
    opcache

# Composerをコピー
COPY --from=composer /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER 1
ENV COMPOSER_HOME /composer
ENV PATH $PATH:/composer/vendor/bin

COPY ./laravel /var/www/app

# OPcache設定
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.max_accelerated_files=10000" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.revalidate_freq=0" >> /usr/local/etc/php/conf.d/opcache.ini && \
    echo "opcache.validate_timestamps=1" >> /usr/local/etc/php/conf.d/opcache.ini

# PHP設定
RUN echo "memory_limit=256M" >> /usr/local/etc/php/conf.d/memory.ini && \
    echo "upload_max_filesize=20M" >> /usr/local/etc/php/conf.d/upload.ini && \
    echo "post_max_size=20M" >> /usr/local/etc/php/conf.d/upload.ini

# エントリポイントスクリプトをコピー
COPY /docker/php/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /var/www/app
# www-dataユーザーのUID/GIDを1000に変更（ホストとの権限問題回避）
RUN apk add --no-cache shadow && \
    usermod -u 1000 www-data && \
    groupmod -g 1000 www-data

EXPOSE 9000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]