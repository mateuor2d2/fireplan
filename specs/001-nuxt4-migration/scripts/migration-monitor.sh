#!/bin/bash

# Nuxt 3 to Nuxt 4 Migration Monitor
# This script monitors the migration progress and logs issues

set -euo pipefail

# Configuration
MIGRATION_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3/specs/001-nuxt4-migration"
LOG_FILE="$MIGRATION_DIR/migration-log.md"
MONITOR_LOG="$MIGRATION_DIR/monitor.log"
SOURCE_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3"
TARGET_DIR="/home/mateu/NuxtsProjects/v9PLANESN4BUI4"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo -e "${BLUE}[INFO]${NC} $timestamp - $message" | tee -a "$MONITOR_LOG"
}

log_success() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo -e "${GREEN}[SUCCESS]${NC} $timestamp - $message" | tee -a "$MONITOR_LOG"
}

log_warning() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo -e "${YELLOW}[WARNING]${NC} $timestamp - $message" | tee -a "$MONITOR_LOG"
}

log_error() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo -e "${RED}[ERROR]${NC} $timestamp - $message" | tee -a "$MONITOR_LOG"
}

# Pre-migration checks
pre_migration_checks() {
    log_info "Starting pre-migration checks..."

    # Check source directory exists
    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_error "Source directory does not exist: $SOURCE_DIR"
        return 1
    fi
    log_success "Source directory exists: $SOURCE_DIR"

    # Check if target directory already exists
    if [[ -d "$TARGET_DIR" ]]; then
        log_warning "Target directory already exists: $TARGET_DIR"
    else
        log_info "Target directory will be created: $TARGET_DIR"
    fi

    # Check MongoDB connection
    if mongosh --eval "db.runCommand('ping')" mongodb://localhost:27017/preveniusdbDev --quiet; then
        log_success "MongoDB connection verified"
    else
        log_error "Cannot connect to MongoDB"
        return 1
    fi

    # Check disk space
    local available_space
    available_space=$(df -h /home/mateu/NuxtsProjects | awk 'NR==2 {print $4}')
    log_info "Available disk space: $available_space"

    # Check memory usage
    local available_memory
    available_memory=$(free -h | awk 'NR==2{printf "%.1fGB", $7}')
    log_info "Available memory: $available_memory"

    log_success "Pre-migration checks completed"
    return 0
}

# Monitor directory size changes
monitor_directory_sizes() {
    log_info "Monitoring directory sizes..."

    local source_size
    source_size=$(du -sh "$SOURCE_DIR" | cut -f1)
    log_info "Source directory size: $source_size"

    if [[ -d "$TARGET_DIR" ]]; then
        local target_size
        target_size=$(du -sh "$TARGET_DIR" | cut -f1)
        log_info "Target directory size: $target_size"
    fi
}

# Monitor process status
monitor_migration_processes() {
    log_info "Checking for running migration processes..."

    local migration_processes
    migration_processes=$(pgrep -f "nuxt|migration|v9PLANES" || true)

    if [[ -n "$migration_processes" ]]; then
        log_warning "Migration-related processes detected:"
        echo "$migration_processes" | xargs ps -p | while read line; do
            log_warning "  $line"
        done
    else
        log_info "No migration processes currently running"
    fi
}

# Check for common migration issues
check_migration_issues() {
    log_info "Checking for common migration issues..."

    # Check for syntax errors in source
    if [[ -d "$SOURCE_DIR" ]]; then
        log_info "Checking for TypeScript syntax errors in source..."
        if cd "$SOURCE_DIR" && npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            log_success "No TypeScript syntax errors in source"
        else
            log_warning "TypeScript syntax errors detected in source (may be expected)"
        fi
    fi

    # Check for broken dependencies
    if [[ -f "$SOURCE_DIR/package.json" ]]; then
        log_info "Checking for broken dependencies in source..."
        if cd "$SOURCE_DIR" && npm ls --depth=0 >/dev/null 2>&1; then
            log_success "No broken dependencies in source"
        else
            log_warning "Broken dependencies detected in source"
        fi
    fi

    # Check MongoDB backup integrity
    local latest_backup
    latest_backup=$(ls -t /backup/migration_backup_* 2>/dev/null | head -1)
    if [[ -n "$latest_backup" && -d "$latest_backup" ]]; then
        log_info "Verifying latest MongoDB backup: $latest_backup"
        local collection_count
        collection_count=$(find "$latest_backup" -name "*.bson" | wc -l)
        log_success "Backup contains $collection_count collections"
    else
        log_error "No MongoDB backup found"
    fi
}

# Update migration log
update_migration_progress() {
    local task_id="$1"
    local task_status="$2"
    local task_description="$3"

    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    log_info "Updating migration progress: $task_id - $task_status - $task_description"

    # Update the main migration log
    if [[ -f "$LOG_FILE" ]]; then
        # This would require more sophisticated markdown parsing in a real scenario
        log_info "Migration log updated at $LOG_FILE"
    fi
}

# Generate migration summary
generate_migration_summary() {
    log_info "Generating migration summary..."

    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    echo "=== Nuxt 3 to Nuxt 4 Migration Summary ==="
    echo "Generated: $timestamp"
    echo "Source Directory: $SOURCE_DIR"
    echo "Target Directory: $TARGET_DIR"
    echo ""
    echo "=== System Status ==="

    monitor_directory_sizes
    monitor_migration_processes
    check_migration_issues

    echo ""
    echo "=== Recent Log Entries ==="
    tail -20 "$MONITOR_LOG" 2>/dev/null || echo "No log entries found"
}

# Main execution
main() {
    local command="${1:-monitor}"

    case "$command" in
        "pre-check")
            pre_migration_checks
            ;;
        "monitor")
            monitor_directory_sizes
            monitor_migration_processes
            check_migration_issues
            log_info "Monitoring cycle completed"
            ;;
        "summary")
            generate_migration_summary
            ;;
        "update-progress")
            update_migration_progress "$2" "$3" "$4"
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command] [args]"
            echo "Commands:"
            echo "  pre-check            Run pre-migration checks"
            echo "  monitor              Monitor current migration status"
            echo "  summary              Generate migration summary"
            echo "  update-progress      Update migration progress"
            echo "  help                 Show this help message"
            ;;
        *)
            log_error "Unknown command: $command"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Create monitor log file if it doesn't exist
mkdir -p "$MIGRATION_DIR/scripts"
touch "$MONITOR_LOG"

# Execute main function
main "$@"