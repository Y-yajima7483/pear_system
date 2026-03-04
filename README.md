## Commands

### Initial Setup
```bash
# Copy environment variables
cp .env.example .env

# Build and start all containers
docker-compose build --no-cache
docker-compose up -d

# Laravel setup (after containers are running)
docker-compose exec php php artisan key:generate
docker-compose exec php php artisan migrate
docker-compose exec php php artisan db:seed
```

### Development Commands

#### Docker Operations
```bash
# Start/stop containers
docker-compose up -d
docker-compose down
docker-compose restart [service]  # nginx, next, php, mysql

# View logs
docker-compose logs -f next     # Next.js logs
docker-compose logs -f php      # Laravel logs
docker-compose logs -f mysql    # MySQL logs
docker-compose logs -f nginx    # Nginx logs
```

#### Laravel Commands
```bash
# Artisan commands
docker-compose exec php php artisan migrate
docker-compose exec php php artisan db:seed
docker-compose exec php php artisan tinker
docker-compose exec php php artisan cache:clear
docker-compose exec php php artisan config:clear

# Code quality
docker-compose exec php ./vendor/bin/pint        # Laravel code formatter
docker-compose exec php ./vendor/bin/phpunit     # Run tests
```

#### Next.js Commands
```bash
# Package management
docker-compose exec next yarn install
docker-compose exec next yarn add [package]

# Development
docker-compose exec next yarn dev      # Start dev server
docker-compose exec next yarn build    # Build for production
docker-compose exec next yarn lint     # Run ESLint
```