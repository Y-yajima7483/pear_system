# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docker-based order management system (PEAR System) with:
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + React Hook Form + Zustand
- **Backend**: Laravel 10 (PHP 8.1) with Sanctum authentication
- **Database**: MySQL 8
- **Web Server**: nginx (reverse proxy)

The application appears to be an order/reservation management system with product varieties and pickup scheduling functionality.

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

## Architecture

### Directory Structure
```
/
├── docker/                  # Docker configuration files
│   ├── nginx/              # Nginx reverse proxy config
│   ├── node/               # Next.js Dockerfile and entrypoint
│   ├── php/                # PHP-FPM Dockerfile and entrypoint
│   └── mysql/              # MySQL configuration
├── next/                   # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/          # Utilities and API helpers
│   │   ├── stores/       # Zustand state management
│   │   └── types/        # TypeScript type definitions
│   │   └── config/        # config
│   └── public/            # Static assets
├── laravel/               # Laravel backend application
│   ├── app/
│   │   ├── Http/         # Controllers, Middleware, Requests
│   │   ├── Models/       # Eloquent models (Order, Product, User, Variety)
│   │   └── Services/     # Business logic layer
│   ├── database/         # Migrations and seeders
│   └── routes/           # API route definitions
└── docker-compose.yml
```

### Request Flow
1. All requests hit nginx on port 8080
2. `/` routes proxy to Next.js (internal port 3000)
3. `/api/*` routes proxy to Laravel PHP-FPM
4. Authentication handled via Laravel Sanctum

### Key Models & Features
- **User**: Authentication with Sanctum
- **Product**: Items available for ordering
- **Variety**: Product categories/types
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items within orders

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout (requires auth)
- `GET /api/auth/me` - Get current user info (requires auth)

### Other Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/order` - Get order list
- `GET /api/variety_list` - Get product varieties

## Database

### Migrations
The system includes migrations for:
- Users (with authentication tokens)
- Products (with variety relationships)
- Orders (with customer information)
- Order Items (order line items)
- Varieties (product categories)

### Seeders
- `UserSeeder` - Creates test users
- `VarietySeeder` - Product variety master data
- `ProductSeeder` - Product master data

## Frontend Architecture

### State Management
- Zustand for global state (user, overlay states)
- React Hook Form for form handling
- Custom hooks for API calls (`useGetApi`, `usePostApi`, etc.)

### Component Structure
- Shared UI components in `components/ui/`
- Form inputs in `components/input/`
- Page-specific components co-located with routes
- Tailwind CSS for styling with custom animations

### Key Features
- Fortnight calendar for pickup scheduling
- Order registration dialog with form validation
- Responsive design with mobile support

## Testing

### Laravel Tests
```bash
# Run all tests
docker-compose exec php ./vendor/bin/phpunit

# Run specific test suite
docker-compose exec php ./vendor/bin/phpunit --testsuite=Feature
docker-compose exec php ./vendor/bin/phpunit --testsuite=Unit
```

### Next.js Linting
```bash
# Run ESLint
docker-compose exec next yarn lint
```

## Environment Variables

Key variables in `.env`:
- `NGINX_PORT` - External nginx port (default: 8080)
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` - MySQL credentials
- `APP_ENV`, `APP_DEBUG` - Laravel environment settings
- `NODE_ENV` - Next.js environment

## Development Tips

1. **Hot Reload**: Both Next.js and Laravel support hot reload in development
2. **API Development**: Test Laravel APIs at `http://localhost:8080/api/*`
3. **Database Access**: MySQL available at `localhost:3306` when `DB_PORT` is set
4. **Logs**: Use `docker-compose logs -f [service]` to tail logs during development

## Claude Code Operational Rules

- When seeking user decisions, always use the `AskUserQuestion` tool
- Installing modules or packages is prohibited for security reasons
- Always review the plan file after creating it
- Use Sub agents as needed for reviews and web search information gathering
- Sub agent model selection:
  - **Simple tasks** (search, file exploration, pattern checking, light research) → use `model: "sonnet"` (Sonnet 4.6)
  - **Complex/advanced tasks** (architecture design, complex code analysis, implementation planning, advanced debugging) → use `model: "opus"` (Opus 4.6)