# Searchable Docs

A Nuxt-based application with a Docker-based development and production environment.

## Table of Contents

- [Searchable Docs](#searchable-docs)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [File Structure](#file-structure)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
    - [Using Docker](#using-docker)
    - [Local Development (without Docker)](#local-development-without-docker)
  - [Docker Environment](#docker-environment)
    - [Services](#services)
    - [Dockerfile Structure](#dockerfile-structure)
  - [Development Workflow](#development-workflow)
  - [Accessing Services](#accessing-services)
  - [Useful Commands](#useful-commands)
  - [Environment Variables](#environment-variables)
    - [Development:](#development)
    - [Production:](#production)
  - [Building for Production](#building-for-production)

## Project Overview

This project provides a comprehensive setup for developing and deploying a Nuxt application with the following services:

- **Nuxt App**: Web application running on Node.js
- **Redis**: In-memory data store
- **LibSQL**: SQLite-compatible database (Turso)
- **Nginx**: Web server and reverse proxy
- **Ollama**: AI model service
- **Drizzle Studio**: Database management UI

## File Structure

```
├── app/               # Nuxt application source code
│   ├── components/    # Vue components
│   ├── pages/         # Nuxt pages
│   ├── layouts/       # Nuxt layouts
│   └── ...
├── drizzle/           # Database migration files
├── public/            # Static files
├── scripts/           # Utility scripts
│   └── migrate.ts     # Database migration script
├── server/            # Server-side code
│   └── db/            # Database models and configuration
├── docker-compose.yml # Docker Compose configuration
├── Dockerfile         # Main application Dockerfile
├── Dockerfile.migrator # Database migration Dockerfile
├── Dockerfile.drizzle-studio # Drizzle Studio Dockerfile
├── nginx/             # Nginx configuration
│   └── default.conf   # Default Nginx configuration
└── ...
```

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local development outside Docker)
- [pnpm](https://pnpm.io/installation) (preferred package manager)

## Getting Started

1. Clone the repository
2. Make sure Docker is running on your machine

### Using Docker

Start the environment using Docker Compose:

Development mode:
```bash
docker compose --profile dev up
```

Production mode:
```bash
docker compose --profile prod up
```

### Local Development (without Docker)

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Docker Environment

The project uses a multi-container Docker environment with the following services:

### Services

| Service        | Description                        | Ports |
| -------------- | ---------------------------------- | ----- |
| app-dev        | Development app with hot reloading | 3000  |
| app            | Production app                     | 3000  |
| migrator       | Database migration service         | -     |
| ollama         | AI model service                   | 11434 |
| nginx          | Web server (production)            | 8080  |
| nginx-dev      | Web server (development)           | 8080  |
| redis          | In-memory data store               | 6379  |
| libsql         | SQLite-compatible database         | 8089  |
| drizzle-studio | Database management UI             | 4983  |

### Dockerfile Structure

The project uses multiple Dockerfiles:

- **Dockerfile**: Multi-stage Dockerfile for the main application
  - `base`: Common base image
  - `development`: Development environment with hot reloading
  - `build`: Stage for building the production app
  - `production`: Minimal production image with built assets

- **Dockerfile.migrator**: For running database migrations

- **Dockerfile.drizzle-studio**: For running Drizzle Studio (database UI)

## Development Workflow

The Docker setup is configured for live development:

- The app directory is mounted as a volume, so changes to your code will be reflected immediately
- Node modules are preserved in a Docker volume to avoid overwriting your local node_modules
- The database data is persisted in Docker volumes

## Accessing Services

- **Nuxt App**: 
  - Development: http://localhost:3000
  - Production: http://localhost:3000
- **Nginx**: http://localhost:8080
- **Redis**: localhost:6379
- **LibSQL**: localhost:8089
- **Drizzle Studio**: http://localhost:4983
- **Ollama**: http://localhost:11434

## Useful Commands

```bash
# Start in development mode (with hot reload)
docker compose --profile dev up

# Start in production mode
docker compose --profile prod up

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
- `DATABASE_URL=http://libsql:8080`
- `PORT=3000`
- `HOST=0.0.0.0`
- `OLLAMA_BASE_URL=http://ollama:11434`

### Production:
- `REDIS_URL=redis://redis:6379`
- `DATABASE_URL=http://libsql:8080`
- `OLLAMA_BASE_URL=http://ollama:11434`
- `PORT=80`
- `HOST=0.0.0.0`

## Building for Production

```bash
# Build the application
pnpm build

# Preview production build locally
pnpm preview
```

For more information on Nuxt, check out the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction).
