# Docker Development & Production Environment

This project includes a Docker-based environment with the following services:

- **Node.js App**: Nuxt application running on Node.js
- **Nginx**: Web server and reverse proxy
- **Redis**: In-memory data store
- **LibSQL**: SQLite-compatible database (Turso)

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Clone the repository
2. Make sure Docker is running on your machine
3. Start the environment using the provided script:

Development mode:
```bash
./start-docker.sh dev
```

Production mode:
```bash
./start-docker.sh prod
```

Or use Docker Compose directly:

Development mode:
```bash
export APP_SERVICE=app-dev
docker compose --profile dev up
```

Production mode:
```bash
export APP_SERVICE=app
docker compose --profile prod up
```

## Dockerfile Structure

The project uses a single multi-stage Dockerfile that handles both development and production:

- `base`: Common base image
- `development`: Development environment with hot reloading
- `build`: Stage for building the production app
- `production`: Minimal production image with built assets

## Accessing Services

- **Nuxt App**: 
  - Development: http://localhost:3000
  - Production: http://localhost:3000
- **Nginx**: http://localhost:8080
- **Redis**: localhost:6379
- **LibSQL**: localhost:8089

## Development Workflow

The Docker setup is configured for live development:

- The app directory is mounted as a volume, so changes to your code will be reflected immediately
- Node modules are preserved in a Docker volume to avoid overwriting your local node_modules
- The LibSQL database file is mapped to your local file system

## Useful Commands

```bash
# Start in development mode (with hot reload)
./start-docker.sh dev

# Start in production mode
./start-docker.sh prod

# Start specific service in dev mode
docker compose --profile dev up app-dev

# Stop all services
docker compose down

# View logs
docker compose logs

# View logs for specific service
docker compose logs app-dev

# Rebuild containers
docker compose build

# Access shell in container
docker compose exec app-dev sh
```

## Environment Variables

The following environment variables are configured:

### Development:
- `NODE_ENV=development`
- `REDIS_URL=redis://redis:6379`
- `DATABASE_URL=file:/app/local.db`
- `PORT=3000`
- `HOST=0.0.0.0`

### Production:
- `REDIS_URL=redis://redis:6379`
- `DATABASE_URL=file:/app/local.db`
- `PORT=80`
- `HOST=0.0.0.0` 