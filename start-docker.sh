#!/bin/bash

# Script to start Docker in development or production mode

MODE=${1:-dev}

if [ "$MODE" == "dev" ]; then
  echo "Starting in DEVELOPMENT mode..."
  export APP_SERVICE=app-dev
  docker compose --profile dev up
elif [ "$MODE" == "prod" ]; then
  echo "Starting in PRODUCTION mode..."
  export APP_SERVICE=app
  docker compose --profile prod up
else
  echo "Unknown mode: $MODE"
  echo "Usage: ./start-docker.sh [dev|prod]"
  exit 1
fi 