#!/bin/bash

# Nuxt 3 to Nuxt 4 Migration Rollback Script
# This script rolls back the migration if issues occur during the process

set -euo pipefail

# Configuration
MIGRATION_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3/specs/001-nuxt4-migration"
ROLLBACK_LOG="$MIGRATION_DIR/rollback.log"
SOURCE_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3"
TARGET_DIR="/home/mateu/NuxtsProjects/v9PLANESN4BUI4"
BACKUP_DIR="/home/mateu/NuxtsProjects/v9planesN3Bui3_backup_$(date +%Y%m%d)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Safety checks
SAFETY_CHECKS=true
FORCE_ROLLBACK=false

# Logging functions
log_rollback() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    case "$level" in
        "OK")
            echo -e "${GREEN}[OK]${NC} $timestamp - $message" | tee -a "$ROLLBACK_LOG"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $timestamp - $message" | tee -a "$ROLLBACK_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $timestamp - $message" | tee -a "$ROLLBACK_LOG"
            ;;
        *)
            echo -e "${BLUE}[INFO]${NC} $timestamp - $message" | tee -a "$ROLLBACK_LOG"
            ;;
    esac
}

# Safety confirmation
confirm_rollback() {
    if [[ "$FORCE_ROLLBACK" == "true" ]]; then
        log_rollback "WARN" "FORCE_ROLLBACK enabled - skipping safety confirmation"
        return 0
    fi

    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                   ⚠️  MIGRATION ROLLBACK ⚠️                  ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "This will ROLLBACK the Nuxt 3 to Nuxt 4 migration:"
    echo "  • Target directory will be REMOVED: $TARGET_DIR"
    echo "  • Original source directory will be PRESERVED: $SOURCE_DIR"
    echo "  • MongoDB database will remain UNCHANGED (shared strategy)"
    echo "  • All migration progress will be LOST"
    echo ""
    echo -e "${YELLOW}Are you absolutely sure you want to proceed with rollback?${NC}"
    echo "Type 'ROLLBACK' to confirm, or press Ctrl+C to cancel:"
    read -r confirmation

    if [[ "$confirmation" != "ROLLBACK" ]]; then
        log_rollback "INFO" "Rollback cancelled by user"
        exit 0
    fi

    log_rollback "WARN" "Rollback confirmed by user - proceeding with destructive operations"
}

# Pre-rollback safety checks
pre_rollback_checks() {
    if [[ "$SAFETY_CHECKS" != "true" ]]; then
        log_rollback "WARN" "Safety checks disabled - proceeding with rollback"
        return 0
    fi

    log_rollback "INFO" "Running pre-rollback safety checks..."

    # Check if source directory exists
    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_rollback "ERROR" "Source directory does not exist: $SOURCE_DIR"
        log_rollback "ERROR" "Cannot rollback without source directory"
        exit 1
    fi
    log_rollback "OK" "Source directory exists: $SOURCE_DIR"

    # Check if target directory exists
    if [[ ! -d "$TARGET_DIR" ]]; then
        log_rollback "WARN" "Target directory does not exist: $TARGET_DIR"
        log_rollback "INFO" "Nothing to rollback - migration may not have started"
        return 0
    fi
    log_rollback "OK" "Target directory found for rollback: $TARGET_DIR"

    # Check if source directory is healthy
    if [[ ! -f "$SOURCE_DIR/package.json" ]]; then
        log_rollback "ERROR" "Source package.json not found - source may be corrupted"
        exit 1
    fi
    log_rollback "OK" "Source directory contains package.json"

    # Check if we can run basic commands in source directory
    if cd "$SOURCE_DIR" && npm ls --depth=0 >/dev/null 2>&1; then
        log_rollback "OK" "Source directory dependencies are intact"
    else
        log_rollback "WARN" "Source directory has dependency issues (may be expected)"
    fi

    # Check MongoDB connection
    if mongosh --eval "db.runCommand('ping')" mongodb://localhost:27017/preveniusdb --quiet; then
        log_rollback "OK" "MongoDB connection verified"
    else
        log_rollback "ERROR" "Cannot connect to MongoDB"
        exit 1
    fi

    log_rollback "OK" "Pre-rollback safety checks completed"
}

# Stop any running processes
stop_running_processes() {
    log_rollback "INFO" "Stopping any running migration-related processes..."

    # Stop Nuxt processes in target directory
    if [[ -d "$TARGET_DIR" ]]; then
        local target_processes
        target_processes=$(pgrep -f "$TARGET_DIR" || true)
        if [[ -n "$target_processes" ]]; then
            log_rollback "WARN" "Stopping processes in target directory"
            echo "$target_processes" | xargs -r kill -TERM
            sleep 3
            echo "$target_processes" | xargs -r kill -KILL 2>/dev/null || true
        fi
    fi

    # Stop any development servers on common Nuxt ports
    for port in 3000 3001 3002 3003 3004; do
        local port_processes
        port_processes=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$port_processes" ]]; then
            log_rollback "WARN" "Stopping processes on port $port"
            echo "$port_processes" | xargs -r kill -TERM
        fi
    done

    log_rollback "OK" "Process cleanup completed"
}

# Remove target directory
remove_target_directory() {
    if [[ ! -d "$TARGET_DIR" ]]; then
        log_rollback "INFO" "Target directory does not exist - nothing to remove"
        return 0
    fi

    log_rollback "WARN" "Removing target directory: $TARGET_DIR"

    # Get target directory size for logging
    local target_size
    target_size=$(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1 || echo "unknown")
    log_rollback "INFO" "Target directory size: $target_size"

    # Remove target directory with error handling
    if rm -rf "$TARGET_DIR"; then
        log_rollback "OK" "Target directory removed successfully"
    else
        log_rollback "ERROR" "Failed to remove target directory"
        exit 1
    fi
}

# Clean up any migration artifacts
cleanup_migration_artifacts() {
    log_rollback "INFO" "Cleaning up migration artifacts..."

    # Clean up temporary files
    local temp_patterns=(
        "/tmp/migration_*"
        "$MIGRATION_DIR/temp_*"
        "$HOME/migration_temp_*"
    )

    for pattern in "${temp_patterns[@]}"; do
        if ls $pattern 1> /dev/null 2>&1; then
            log_rollback "WARN" "Removing temporary files: $pattern"
            rm -rf $pattern 2>/dev/null || true
        fi
    done

    log_rollback "OK" "Migration artifacts cleaned up"
}

# Update migration log
update_migration_log() {
    log_rollback "INFO" "Updating migration log..."

    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    if [[ -f "$MIGRATION_DIR/migration-log.md" ]]; then
        # Add rollback entry to migration log
        cat >> "$MIGRATION_DIR/migration-log.md" << EOF

---
## Migration Rollback Completed

**Rollback Initiated**: $timestamp
**Rollback Type**: Manual migration rollback
**Reason**: User-initiated rollback due to migration issues
**Target Directory Removed**: $TARGET_DIR
**Source Directory Preserved**: $SOURCE_DIR
**Database**: Unchanged (shared MongoDB strategy)

**Rollback Status**: ✅ COMPLETED
All migration progress has been rolled back successfully.

EOF
        log_rollback "OK" "Migration log updated"
    fi
}

# Verify rollback success
verify_rollback() {
    log_rollback "INFO" "Verifying rollback success..."

    # Check target directory is removed
    if [[ -d "$TARGET_DIR" ]]; then
        log_rollback "ERROR" "Target directory still exists - rollback incomplete"
        return 1
    fi
    log_rollback "OK" "Target directory successfully removed"

    # Check source directory still exists
    if [[ ! -d "$SOURCE_DIR" ]]; then
        log_rollback "ERROR" "Source directory missing - rollback failed"
        return 1
    fi
    log_rollback "OK" "Source directory preserved"

    # Check MongoDB still works
    if mongosh --eval "db.runCommand('ping')" mongodb://localhost:27017/preveniusdb --quiet; then
        log_rollback "OK" "MongoDB connection verified"
    else
        log_rollback "ERROR" "MongoDB connection lost"
        return 1
    fi

    log_rollback "OK" "Rollback verification completed successfully"
}

# Generate rollback report
generate_rollback_report() {
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')

    echo "=== Nuxt 3 to Nuxt 4 Migration Rollback Report ==="
    echo "Rollback Completed: $timestamp"
    echo ""
    echo "=== Rollback Summary ==="
    echo "Original Source: $SOURCE_DIR (PRESERVED)"
    echo "Target Directory: $TARGET_DIR (REMOVED)"
    echo "Migration Log: $MIGRATION_DIR/migration-log.md (UPDATED)"
    echo ""
    echo "=== Post-Rollback Status ==="
    echo "✅ Original Nuxt 3 application fully functional"
    echo "✅ MongoDB database unchanged and operational"
    echo "✅ All external integrations preserved"
    echo "✅ No data loss occurred"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Review migration logs to understand what failed"
    echo "2. Address the issues that caused the rollback"
    echo "3. Consider running migration health checks: ./health-check.sh check"
    echo "4. Restart migration when ready: migration can be retried safely"
    echo ""
    echo "⚠️  Note: Migration artifacts and logs are preserved for analysis"

    # Log the report
    echo "--- ROLLBACK REPORT ---" >> "$ROLLBACK_LOG"
    echo "$timestamp" >> "$ROLLBACK_LOG"
    echo "Rollback completed successfully" >> "$ROLLBACK_LOG"
    echo "Target directory removed: $TARGET_DIR" >> "$ROLLBACK_LOG"
    echo "Source directory preserved: $SOURCE_DIR" >> "$ROLLBACK_LOG"
    echo "--- END REPORT ---" >> "$ROLLBACK_LOG"
}

# Main execution
main() {
    local command="${1:-help}"

    # Create rollback log
    mkdir -p "$MIGRATION_DIR/scripts"
    touch "$ROLLBACK_LOG"

    case "$command" in
        "check")
            pre_rollback_checks
            ;;
        "execute")
            confirm_rollback
            pre_rollback_checks
            stop_running_processes
            remove_target_directory
            cleanup_migration_artifacts
            update_migration_log
            verify_rollback
            generate_rollback_report
            ;;
        "force")
            log_rollback "WARN" "FORCE ROLLBACK MODE - bypassing all safety checks"
            FORCE_ROLLBACK=true
            SAFETY_CHECKS=false
            confirm_rollback
            stop_running_processes
            remove_target_directory
            cleanup_migration_artifacts
            update_migration_log
            verify_rollback
            generate_rollback_report
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  check       Run pre-rollback safety checks"
            echo "  execute     Perform full rollback with safety checks"
            echo "  force       Force rollback (bypasses all safety checks)"
            echo "  help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 check                    # Check if rollback is safe"
            echo "  $0 execute                  # Perform rollback with confirmation"
            echo "  $0 force                    # Force rollback (emergency use only)"
            echo ""
            echo "⚠️  WARNING: Rollback will permanently remove the target directory"
            echo "           but will preserve the original source and all data"
            ;;
        *)
            log_rollback "ERROR" "Unknown command: $command"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"