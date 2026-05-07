#!/bin/bash

# Migration Health Check Script
# Checks the health of migration process and provides remediation recommendations

set -euo pipefail

# Configuration
MIGRATION_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3/specs/001-nuxt4-migration"
HEALTH_LOG="$MIGRATION_DIR/health-check.log"
SOURCE_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3"
TARGET_DIR="/home/mateu/NuxtsProjects/v9PLANESN4BUI4"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check functions
log_health() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    case "$level" in
        "OK")
            echo -e "${GREEN}[OK]${NC} $timestamp - $message" | tee -a "$HEALTH_LOG"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $timestamp - $message" | tee -a "$HEALTH_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $timestamp - $message" | tee -a "$HEALTH_LOG"
            ;;
        *)
            echo -e "${BLUE}[INFO]${NC} $timestamp - $message" | tee -a "$HEALTH_LOG"
            ;;
    esac
}

check_disk_space() {
    log_health "INFO" "Checking disk space..."

    local available_space
    available_space=$(df -BG /home/mateu/NuxtsProjects | awk 'NR==2 {print $4}' | sed 's/G//')

    if [[ $available_space -lt 5 ]]; then
        log_health "ERROR" "Low disk space: ${available_space}GB available (minimum 5GB required)"
        return 1
    elif [[ $available_space -lt 10 ]]; then
        log_health "WARN" "Moderate disk space: ${available_space}GB available (recommend 10GB+)"
        return 0
    else
        log_health "OK" "Good disk space: ${available_space}GB available"
        return 0
    fi
}

check_memory_usage() {
    log_health "INFO" "Checking memory usage..."

    local available_memory
    available_memory=$(free -g | awk 'NR==2{print $7}')
    local total_memory
    total_memory=$(free -g | awk 'NR==2{print $2}')

    if [[ $available_memory -lt 2 ]]; then
        log_health "ERROR" "Low memory: ${available_memory}GB available (minimum 2GB required)"
        return 1
    elif [[ $available_memory -lt 4 ]]; then
        log_health "WARN" "Moderate memory: ${available_memory}GB available of ${total_memory}GB total"
        return 0
    else
        log_health "OK" "Good memory: ${available_memory}GB available of ${total_memory}GB total"
        return 0
    fi
}

check_database_connection() {
    log_health "INFO" "Checking MongoDB connection..."

    if mongosh --eval "db.runCommand('ping')" mongodb://localhost:27017/preveniusdbDev --quiet; then
        log_health "OK" "MongoDB connection successful"
        return 0
    else
        log_health "ERROR" "Cannot connect to MongoDB"
        return 1
    fi
}

check_backup_integrity() {
    log_health "INFO" "Checking backup integrity..."

    local latest_backup=""

    # Try finding any MongoDB backup in user home directory
    latest_backup=$(find $HOME -name "mongodb_backup_*" -type d 2>/dev/null | sort -r | head -1)

    if [[ -z "$latest_backup" ]]; then
        log_health "ERROR" "No MongoDB backup found"
        return 1
    fi

    if [[ ! -d "$latest_backup" ]]; then
        log_health "ERROR" "Backup directory found but is not accessible: $latest_backup"
        return 1
    fi

    local collection_count
    collection_count=$(find "$latest_backup" -name "*.bson" 2>/dev/null | wc -l)

    if [[ $collection_count -eq 0 ]]; then
        log_health "ERROR" "No BSON files found in backup: $latest_backup"
        return 1
    fi

    log_health "OK" "Backup integrity verified: $collection_count collections in $(basename "$latest_backup")"
    return 0
}

check_source_directory() {
    log_health "INFO" "Checking source directory health..."

    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_health "ERROR" "Source directory does not exist: $SOURCE_DIR"
        return 1
    fi

    if [[ ! -f "$SOURCE_DIR/package.json" ]]; then
        log_health "ERROR" "Source package.json not found"
        return 1
    fi

    local source_size
    source_size=$(du -sh "$SOURCE_DIR" | cut -f1)
    log_health "OK" "Source directory healthy: $source_size"
    return 0
}

check_target_directory() {
    log_health "INFO" "Checking target directory..."

    if [[ -d "$TARGET_DIR" ]]; then
        local target_size
        target_size=$(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1 || echo "0")
        log_health "WARN" "Target directory already exists: $target_size"

        # Check if it's a proper copy
        if [[ -f "$TARGET_DIR/package.json" ]]; then
            log_health "WARN" "Target directory contains package.json (may be incomplete copy)"
        fi
        return 0
    else
        log_health "OK" "Target directory does not exist (ready for migration)"
        return 0
    fi
}

check_node_version() {
    log_health "INFO" "Checking Node.js version..."

    local node_version
    node_version=$(node --version 2>/dev/null || echo "unknown")

    if [[ "$node_version" == "unknown" ]]; then
        log_health "ERROR" "Node.js not found"
        return 1
    fi

    # Check if version supports Nuxt 4 (should be Node.js 18+)
    local major_version
    major_version=$(echo "$node_version" | sed 's/v//' | cut -d. -f1)

    if [[ $major_version -lt 18 ]]; then
        log_health "ERROR" "Node.js version $node_version is too old for Nuxt 4 (requires 18+)"
        return 1
    else
        log_health "OK" "Node.js version $node_version supports Nuxt 4"
        return 0
    fi
}

check_package_manager() {
    log_health "INFO" "Checking package manager..."

    if command -v pnpm >/dev/null 2>&1; then
        local pnpm_version
        pnpm_version=$(pnpm --version 2>/dev/null || echo "unknown")
        log_health "OK" "PNPM available: v$pnpm_version"
        return 0
    elif command -v npm >/dev/null 2>&1; then
        local npm_version
        npm_version=$(npm --version 2>/dev/null || echo "unknown")
        log_health "WARN" "PNPM not found, using npm: v$npm_version"
        return 0
    else
        log_health "ERROR" "No package manager found (need pnpm or npm)"
        return 1
    fi
}

check_migration_progress() {
    log_health "INFO" "Checking migration progress..."

    if [[ -f "$MIGRATION_DIR/migration-log.md" ]]; then
        local completed_tasks
        completed_tasks=$(grep -c "✅ COMPLETED" "$MIGRATION_DIR/migration-log.md" 2>/dev/null || echo "0")
        local total_tasks
        total_tasks=$(grep -c "T[0-9]" "$MIGRATION_DIR/tasks.md" 2>/dev/null || echo "80")

        if [[ $completed_tasks -gt 0 ]]; then
            log_health "OK" "Migration in progress: $completed_tasks/$total_tasks tasks completed"
        else
            log_health "WARN" "Migration appears ready to start (no completed tasks in log)"
        fi
        return 0
    else
        log_health "WARN" "No migration log found"
        return 0
    fi
}

generate_health_report() {
    log_health "INFO" "Generating comprehensive health report..."

    echo "=== Nuxt 3 to Nuxt 4 Migration Health Report ==="
    echo "Generated: $(date '+%Y-%m-%d %H:%M:%S UTC')"
    echo ""
    echo "=== System Resources ==="
    check_disk_space || true
    check_memory_usage || true

    echo ""
    echo "=== Database & Backups ==="
    check_database_connection || true
    check_backup_integrity || true

    echo ""
    echo "=== Directory Status ==="
    check_source_directory || true
    check_target_directory || true

    echo ""
    echo "=== Development Environment ==="
    check_node_version || true
    check_package_manager || true

    echo ""
    echo "=== Migration Progress ==="
    check_migration_progress || true

    echo ""
    echo "=== Recommendations ==="

    # Provide specific recommendations based on checks
    local available_space
    available_space=$(df -BG /home/mateu/NuxtsProjects | awk 'NR==2 {print $4}' | sed 's/G//')

    if [[ $available_space -lt 10 ]]; then
        echo "• Consider cleaning up old files to free disk space"
    fi

    local available_memory
    available_memory=$(free -g | awk 'NR==2{print $7}')
    if [[ $available_memory -lt 4 ]]; then
        echo "• Close unnecessary applications during migration"
    fi

    if [[ -d "$TARGET_DIR" ]]; then
        echo "• Target directory exists - ensure you want to continue or clean it first"
    fi

    echo "• Always verify backups before proceeding with migration"
    echo "• Run monitoring scripts during migration process"
}

# Main execution
main() {
    local command="${1:-report}"

    # Create health log directory
    mkdir -p "$MIGRATION_DIR/scripts"
    touch "$HEALTH_LOG"

    case "$command" in
        "check")
            log_health "INFO" "Running individual health checks..."
            local failed_checks=0

            check_disk_space || ((failed_checks++))
            check_memory_usage || ((failed_checks++))
            check_database_connection || ((failed_checks++))
            check_backup_integrity || ((failed_checks++))
            check_source_directory || ((failed_checks++))
            check_target_directory || ((failed_checks++))
            check_node_version || ((failed_checks++))
            check_package_manager || ((failed_checks++))

            if [[ $failed_checks -eq 0 ]]; then
                log_health "OK" "All health checks passed"
                return 0
            else
                log_health "ERROR" "$failed_checks health checks failed"
                return 1
            fi
            ;;
        "report")
            generate_health_report
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo "Commands:"
            echo "  check         Run all health checks"
            echo "  report        Generate comprehensive health report"
            echo "  help          Show this help message"
            ;;
        *)
            log_health "ERROR" "Unknown command: $command"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

main "$@"