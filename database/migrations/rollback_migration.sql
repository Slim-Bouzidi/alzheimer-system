-- Rollback Script: User-Patient Migration
-- Description: Reverts the user-patient migration to pre-migration state
-- Author: Keycloak User Service Architecture Migration
-- Date: 2024
-- WARNING: Use only if migration failed or needs to be re-run

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- This script should ONLY be used if:
-- 1. Migration failed and needs to be re-run from scratch
-- 2. Data integrity issues were discovered immediately after migration
-- 3. You need to restore to pre-migration state for testing

-- DO NOT USE THIS SCRIPT if:
-- 1. The system is already in production use after migration
-- 2. New users have been created since migration
-- 3. Application services are actively using the user_id relationships

-- ============================================================================
-- STEP 1: Remove user_id references from patients
-- ============================================================================

-- This removes the foreign key relationship but preserves patient records
UPDATE patients 
SET user_id = NULL 
WHERE user_id IS NOT NULL;

-- Verification: Check that all patients have NULL user_id
SELECT 
    COUNT(*) AS patients_with_user_id,
    'Should be 0 after rollback' AS description
FROM patients 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- STEP 2: Delete migrated users
-- ============================================================================

-- This deletes only users created during migration (identified by @migrated.local email)
-- WARNING: This will NOT delete users created through normal registration

DELETE FROM users 
WHERE email LIKE '%@migrated.local';

-- Verification: Check that migrated users are deleted
SELECT 
    COUNT(*) AS migrated_users_remaining,
    'Should be 0 after rollback' AS description
FROM users 
WHERE email LIKE '%@migrated.local';

-- ============================================================================
-- STEP 3: Verify rollback
-- ============================================================================

-- Check total patients (should be unchanged)
SELECT 
    COUNT(*) AS total_patients,
    'Total patients (should match pre-migration count)' AS description
FROM patients;

-- Check patients with user_id (should be 0)
SELECT 
    COUNT(*) AS patients_with_user_id,
    'Patients with user_id (should be 0)' AS description
FROM patients 
WHERE user_id IS NOT NULL;

-- Check remaining users
SELECT 
    COUNT(*) AS total_users,
    'Remaining users (non-migrated users only)' AS description
FROM users;

-- Check for any migrated users still present
SELECT 
    COUNT(*) AS migrated_users,
    'Migrated users (should be 0)' AS description
FROM users 
WHERE email LIKE '%@migrated.local';

-- ============================================================================
-- ROLLBACK SUMMARY
-- ============================================================================

SELECT 
    'ROLLBACK SUMMARY' AS report_section,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM patients WHERE user_id IS NOT NULL) AS patients_with_user_id,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local') AS migrated_users,
    CASE 
        WHEN (SELECT COUNT(*) FROM patients WHERE user_id IS NOT NULL) = 0 
         AND (SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local') = 0
        THEN 'ROLLBACK COMPLETE'
        ELSE 'ROLLBACK INCOMPLETE'
    END AS rollback_status;

-- ============================================================================
-- EXPECTED RESULTS AFTER ROLLBACK
-- ============================================================================

-- 1. patients_with_user_id = 0
-- 2. migrated_users = 0
-- 3. total_patients = original count (unchanged)
-- 4. total_users = count of manually created users only
-- 5. rollback_status = 'ROLLBACK COMPLETE'

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This rollback is safe to run multiple times (idempotent)
-- 2. Patient records are preserved - only the user_id link is removed
-- 3. Only migrated users (with @migrated.local emails) are deleted
-- 4. Users created through normal registration are NOT affected
-- 5. After rollback, you can re-run the migration scripts from the beginning
-- 6. If you need to restore from backup instead:
--    mysql -u root -p alzheimer_db < backup_YYYYMMDD_HHMMSS.sql

-- ============================================================================
-- AFTER ROLLBACK
-- ============================================================================

-- To re-run migration after rollback:
-- 1. Verify rollback completed successfully (rollback_status = 'ROLLBACK COMPLETE')
-- 2. Run: database/migrations/001_migrate_existing_users.sql
-- 3. Run: database/migrations/002_update_patients_user_id.sql
-- 4. Run: database/migrations/003_verify_migration.sql

-- ============================================================================
-- EMERGENCY RESTORE FROM BACKUP
-- ============================================================================

-- If rollback is not sufficient, restore from backup:
-- 1. Stop all application services
-- 2. Drop and recreate database:
--    DROP DATABASE alzheimer_db;
--    CREATE DATABASE alzheimer_db;
-- 3. Restore from backup:
--    mysql -u root -p alzheimer_db < backup_YYYYMMDD_HHMMSS.sql
-- 4. Restart application services
