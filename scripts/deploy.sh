#!/bin/bash

# TextExtract Pro Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting TextExtract Pro Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before continuing."
        exit 1
    else
        print_error ".env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
source .env

# Validate required environment variables
print_status "Validating environment variables..."
required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set."
        exit 1
    fi
done
print_success "Environment variables validated."

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p ssl
mkdir -p nginx

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Build and start containers
print_status "Building and starting containers..."
if [ "$1" = "prod" ]; then
    print_status "Using production configuration..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
else
    docker-compose up --build -d
fi

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check if main service is running
if docker-compose ps | grep -q "textextract-pro.*Up.*healthy"; then
    print_success "TextExtract Pro is running successfully!"
    print_success "Application is available at: http://localhost:8080"
else
    print_error "Service failed to start properly. Checking logs..."
    docker-compose logs textextract-app
    exit 1
fi

# Display running services
print_status "Running services:"
docker-compose ps

# Display useful information
echo ""
echo "=================================================="
echo "🎉 TextExtract Pro Deployment Complete!"
echo "=================================================="
echo "🌐 Application URL: http://localhost:8080"
echo "📊 Health Check: http://localhost:8080/health"
echo "🐳 Container Status: docker-compose ps"
echo "📋 View Logs: docker-compose logs -f"
echo "🛑 Stop Services: docker-compose down"
echo "=================================================="
echo ""

print_success "Deployment completed successfully! 🚀"