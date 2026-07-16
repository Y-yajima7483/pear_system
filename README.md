## Commands

### Initial Setup
```bash
# Copy environment variables
cp .env.example .env
cp laravel/.env.example laravel/.env

# Build and start all containers
docker compose build --no-cache
docker compose up -d

# Laravel setup (after containers are running)
docker compose exec php php artisan key:generate
docker compose exec php php artisan migrate
docker compose exec php php artisan db:seed
```

The canonical development URL is [http://localhost:8080](http://localhost:8080).
Next.js port 3000 is internal to the Docker network; browser API and Sanctum
authentication traffic must go through nginx on port 8080. The equivalent
`http://127.0.0.1:8080` origin is also allowed for local testing.

### Development Commands

#### Docker Operations
```bash
# Start/stop containers
docker compose up -d
docker compose down
docker compose restart [service]  # nginx, next, php, mysql

# View logs
docker compose logs -f next     # Next.js logs
docker compose logs -f php      # Laravel logs
docker compose logs -f mysql    # MySQL logs
docker compose logs -f nginx    # Nginx logs
```

#### Laravel Commands
```bash
# Artisan commands
docker compose exec php php artisan migrate
docker compose exec php php artisan db:seed
docker compose exec php php artisan tinker
docker compose exec php php artisan cache:clear
docker compose exec php php artisan config:clear

# Code quality
docker compose exec php ./vendor/bin/pint        # Laravel code formatter
docker compose exec php ./vendor/bin/phpunit     # Run tests
```

#### Next.js Commands
```bash
# Checks inside the existing container
docker compose exec next yarn build
docker compose exec next yarn lint
```
