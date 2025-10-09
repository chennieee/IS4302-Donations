#!/bin/bash

# Backend startup script for the donations platform

set -e

echo "Starting Donations Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo ".env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Create necessary directories
mkdir -p data logs

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run database migrations
echo "Running database migrations..."
npm run migrate

# Start the services
echo "Starting backend services..."

# Start backend API in background
echo "Starting API server..."
npm start &
API_PID=$!

# Wait a moment for API to start
sleep 3

# Start indexer in background
echo "Starting blockchain indexer..."
npm run indexer &
INDEXER_PID=$!

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    kill $API_PID 2>/dev/null || true
    kill $INDEXER_PID 2>/dev/null || true
    wait
    echo "Services stopped"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "Backend services started successfully!"
echo "API server running on port ${PORT:-3001}"
echo "Indexer processing blockchain events"
echo "Check health at http://localhost:${PORT:-3001}/api/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait