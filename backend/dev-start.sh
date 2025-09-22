#!/bin/bash
# Development startup script

echo "Starting Co-op Match Development Environment..."

# Load development environment
export $(cat .env.development | xargs)

# Start backend
echo "Starting Backend on http://localhost:8080..."
go run main.go