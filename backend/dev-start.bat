@echo off
REM Development startup script for Windows

echo Starting Co-op Match Development Environment...

REM Set development environment variables
set CORS_ORIGIN=http://localhost:5173
set API_BASE_URL=http://localhost:8080
set FRONTEND_URL=http://localhost:5173

echo Starting Backend on http://localhost:8080...
go run main.go