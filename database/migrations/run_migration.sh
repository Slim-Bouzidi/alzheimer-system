#!/bin/bash

# Migration Execution Script
# Description: Automated execution of user-patient migration with verification
# Author: Keycloak User Service Architecture Migration
# Date: 2024

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-alzheimer_db}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if MySQL is available
check_mysql() {
    print_info "Checking MySQL connection..."
    if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" -e "SELECT 1;" > /dev/null 2>&1; then
        print_success "MySQL connection successful"
        return 0
    else
        print_error "Cannot connect to MySQL"
        return 1
    fi
}

# Create backup
create_backup() {
    print_header "Creating Database Backup"
    
    mkdir -p "${BACKUP_DIR}"
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    print_info "Backing up database to: ${BACKUP_FILE}"
    
    if mysqldump -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        "${DB_NAME}" > "${BACKUP_FILE}"; then
        print_success "Backup created successfully"
        echo "Backup location: ${BACKUP_FILE}"
    else
        print_error "Backup failed"
        exit 1
    fi
}

# Execute SQL script
execute_sql() {
    local script_file=$1
    local description=$2
    
    print_header "${description}"
    print_info "Executing: ${script_file}"
    
    if mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        "${DB_NAME}" < "${script_file}"; then
        print_success "${description} completed"
        return 0
    else
        print_error "${description} failed"
        return 1
    fi
}

# Verify migration
verify_migration() {
    print_header "Verifying Migration"
    
    # Check patients without user_id
    local patients_without_user=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM patients WHERE user_id IS NULL;" "${DB_NAME}")
    
    if [ "${patients_without_user}" -eq 0 ]; then
        print_success "All patients have user_id"
    else
        print_error "${patients_without_user} patients are missing user_id"
        return 1
    fi
    
    # Check orphaned patients
    local orphaned=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id IS NOT NULL AND u.id IS NULL;" "${DB_NAME}")
    
    if [ "${orphaned}" -eq 0 ]; then
        print_success "No orphaned patient records"
    else
        print_error "${orphaned} orphaned patient records found"
        return 1
    fi
    
    # Check total counts
    local total_patients=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM patients;" "${DB_NAME}")
    local total_users=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM users;" "${DB_NAME}")
    local migrated_users=$(mysql -h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" \
        -N -e "SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local';" "${DB_NAME}")
    
    print_info "Total patients: ${total_patients}"
    print_info "Total users: ${total_users}"
    print_info "Migrated users: ${migrated_users}"
    
    print_success "Migration verification passed"
    return 0
}

# Main execution
main() {
    print_header "User-Patient Migration Script"
    echo "Database: ${DB_NAME}"
    echo "Host: ${DB_HOST}:${DB_PORT}"
    echo "User: ${DB_USER}"
    echo ""
    
    # Check if password is provided
    if [ -z "${DB_PASSWORD}" ]; then
        print_error "DB_PASSWORD environment variable is not set"
        echo "Usage: DB_PASSWORD=your_password ./run_migration.sh"
        exit 1
    fi
    
    # Check MySQL connection
    if ! check_mysql; then
        exit 1
    fi
    
    # Confirm execution
    print_warning "This script will modify the database. A backup will be created."
    read -p "Do you want to continue? (yes/no): " confirm
    if [ "${confirm}" != "yes" ]; then
        print_info "Migration cancelled"
        exit 0
    fi
    
    # Create backup
    create_backup
    
    # Execute migration scripts
    if ! execute_sql "${SCRIPT_DIR}/001_migrate_existing_users.sql" "Step 1: Migrate Existing Users"; then
        print_error "Migration failed at step 1"
        exit 1
    fi
    
    if ! execute_sql "${SCRIPT_DIR}/002_update_patients_user_id.sql" "Step 2: Update Patient User IDs"; then
        print_error "Migration failed at step 2"
        exit 1
    fi
    
    # Verify migration
    if ! verify_migration; then
        print_error "Migration verification failed"
        print_warning "Check the verification script output for details"
        execute_sql "${SCRIPT_DIR}/003_verify_migration.sql" "Step 3: Detailed Verification"
        exit 1
    fi
    
    # Run full verification
    execute_sql "${SCRIPT_DIR}/003_verify_migration.sql" "Step 3: Detailed Verification"
    
    print_header "Migration Completed Successfully"
    print_success "All migration steps completed"
    print_success "All verification checks passed"
    print_info "Backup location: ${BACKUP_FILE}"
    
    echo ""
    print_info "Next steps:"
    echo "  1. Review the verification output above"
    echo "  2. Test application functionality"
    echo "  3. Monitor service logs"
    echo "  4. Consider making user_id NOT NULL:"
    echo "     ALTER TABLE patients MODIFY COLUMN user_id BIGINT NOT NULL;"
}

# Run main function
main
