-- Migration Script: Update Patients with User ID
-- Description: Links existing patient records to their corresponding user records
-- Author: Keycloak User Service Architecture Migration
-- Date: 2024
-- Requirements: 3.1, 10.3

-- ============================================================================
-- MIGRATION: Update patients.user_id from users.id
-- ============================================================================

-- This script updates the user_id foreign key in the patients table
-- by joining patients and users on keycloak_id
-- Only updates records where user_id is currently NULL

UPDATE patients p
INNER JOIN users u ON p.keycloakId = u.keycloak_id
SET p.user_id = u.id
WHERE p.user_id IS NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check how many patients were updated
SELECT 
    COUNT(*) AS total_patients_updated,
    'Patients linked to users' AS description
FROM patients
WHERE user_id IS NOT NULL;

-- Show any patients that still don't have user_id
SELECT 
    COUNT(*) AS patients_without_user_id,
    'Patients still missing user_id (should be 0)' AS description
FROM patients
WHERE user_id IS NULL;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, run:
-- UPDATE patients SET user_id = NULL WHERE user_id IS NOT NULL;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This script is idempotent - safe to run multiple times
-- 2. Only updates patients where user_id IS NULL
-- 3. Requires that 001_migrate_existing_users.sql has been run first
-- 4. After this migration, all patients should have a valid user_id
-- 5. If any patients remain without user_id, investigate:
--    - Patient has no keycloakId (data integrity issue)
--    - User record was not created in step 001 (check users table)
-- 6. Once verified, consider making user_id NOT NULL:
--    ALTER TABLE patients MODIFY COLUMN user_id BIGINT NOT NULL;
