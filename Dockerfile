FROM node:22-slim AS base
WORKDIR /app

RUN corepack enable && \
  apt-get update && \
  apt-get install -y --no-install-recommends \
  libc6 \
  libstdc++6 \
  openssl \
  && rm -rf /var/lib/apt/lists/*

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install && \
  pnpm dlx nuxi prepare

# Run development server
CMD ["pnpm", "run", "dev"]

# Build stage
FROM base AS build
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the entire project
COPY . ./

# Build the project
RUN pnpm run build

# Production stage
FROM node:22-slim AS production
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output/ ./

# Change the port and host
ENV PORT 80
ENV HOST 0.0.0.0

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
