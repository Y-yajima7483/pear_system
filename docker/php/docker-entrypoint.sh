#!/bin/bash
set -e

# Laravelプロジェクトが存在しない場合は初期化
if [ ! -f "/var/www/app/composer.json" ]; then
    echo "Laravel project not found. Initializing..."
    
    # プロジェクトの初期化
    cd /var/www/app
    composer create-project --prefer-dist laravel/laravel:^13.0 .
    
    cd /var/www/app
    
    # APP_KEYの生成
    php artisan key:generate
    
    echo "Laravel project initialized successfully!"
fi

# 権限の設定
cd /var/www/app
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Composerの依存関係をインストール
if [ -f "composer.json" ]; then
    echo "Installing/updating Composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# キャッシュのクリア（開発環境のみ）
# ※ ヘルスチェックエンドポイントの動的追加処理はここに存在していたが、
#   routes/api.phpに正式なルート定義として移行したため削除済み。
if [ "$APP_ENV" = "local" ]; then
    php artisan config:clear
    php artisan cache:clear
    php artisan route:clear
    php artisan view:clear
fi

# 実行コマンドを実行
exec "$@"
