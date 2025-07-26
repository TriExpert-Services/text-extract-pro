#!/bin/bash

# Health Check Script for TextExtract Pro
# This script performs comprehensive health checks

set -e

echo "🔍 Performing Health Checks for TextExtract Pro..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
APP_URL="http://localhost:8080"
HEALTH_ENDPOINT="$APP_URL/health"
MAX_RETRIES=5
RETRY_DELAY=5

print_check() {
    echo -e "🔍 Checking: $1"
}

print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

# Function to check if service is responsive
check_service_health() {
    local url=$1
    local service_name=$2
    local retries=0
    
    print_check "$service_name Health"
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_pass "$service_name is healthy"
            return 0
        else
            retries=$((retries + 1))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo "Attempt $retries/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    print_fail "$service_name is not responding after $MAX_RETRIES attempts"
    return 1
}

# Function to check Docker container status
check_container_status() {
    print_check "Docker Container Status"
    
    if docker-compose ps | grep -q "textextract-pro.*Up"; then
        print_pass "Container is running"
        
        # Check if container is healthy
        if docker-compose ps | grep -q "textextract-pro.*healthy"; then
            print_pass "Container is healthy"
        else
            print_warn "Container is running but not marked as healthy"
        fi
    else
        print_fail "Container is not running"
        return 1
    fi
}

# Function to check resource usage
check_resource_usage() {
    print_check "Resource Usage"
    
    # Get container stats
    local stats=$(docker stats textextract-pro --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" | tail -n 1)
    
    if [ -n "$stats" ]; then
        print_pass "Resource stats: $stats"
    else
        print_warn "Could not retrieve resource statistics"
    fi
}

# Function to check logs for errors
check_logs() {
    print_check "Recent Logs"
    
    local error_count=$(docker-compose logs --tail=100 textextract-app 2>/dev/null | grep -i error | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        print_pass "No recent errors in logs"
    else
        print_warn "Found $error_count error(s) in recent logs"
        echo "Recent errors:"
        docker-compose logs --tail=50 textextract-app | grep -i error | tail -5
    fi
}

# Function to check disk space
check_disk_space() {
    print_check "Disk Space"
    
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 80 ]; then
        print_pass "Disk usage: ${disk_usage}%"
    elif [ "$disk_usage" -lt 90 ]; then
        print_warn "Disk usage: ${disk_usage}% (Consider cleanup)"
    else
        print_fail "Disk usage: ${disk_usage}% (Critical - cleanup required)"
    fi
}

# Main health check execution
main() {
    echo "========================================"
    echo "📋 TextExtract Pro Health Check Report"
    echo "========================================"
    echo "⏰ Timestamp: $(date)"
    echo "🌐 Checking URL: $APP_URL"
    echo ""
    
    local failed_checks=0
    
    # Perform all checks
    check_container_status || ((failed_checks++))
    echo ""
    
    check_service_health "$HEALTH_ENDPOINT" "Main Application" || ((failed_checks++))
    echo ""
    
    check_service_health "$APP_URL" "Web Interface" || ((failed_checks++))
    echo ""
    
    check_resource_usage
    echo ""
    
    check_logs
    echo ""
    
    check_disk_space
    echo ""
    
    # Summary
    echo "========================================"
    if [ $failed_checks -eq 0 ]; then
        echo -e "${GREEN}🎉 All Health Checks Passed!${NC}"
        echo "✅ TextExtract Pro is running optimally"
    else
        echo -e "${RED}⚠️  $failed_checks Health Check(s) Failed${NC}"
        echo "❌ Please review the failed checks above"
        exit 1
    fi
    echo "========================================"
}

# Run main function
main