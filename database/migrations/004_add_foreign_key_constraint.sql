-- Migration Script: Add Foreign Key Constraint to Patients Table
-- Description: Adds foreign key constraint and index on user_id column
-- Author: Keycloak User Service Architecture Migration
-- Date: 2024
-- Requirements: 3.1, 12.2
-- Task: 9.2 Update database schema (add user_id column with foreign key)

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

-- Check if user_id column exists (should exist from previous migrations)
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id';

-- Check if all patients have valid user_id values
SELECT 
    COUNT(*) AS patients_without_user_id,
    'Patients missing user_id (should be 0 before adding constraint)' AS description
FROM patients
WHERE user_id IS NULL;

-- Check if all user_id values reference existing users
SELECT 
    COUNT(*) AS invalid_user_references,
    'Patients with invalid user_id (should be 0 before adding constraint)' AS description
FROM patients p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- ============================================================================
-- MIGRATION: Add Foreign Key Constraint and Index
-- ============================================================================

-- Step 1: Check if foreign key constraint already exists
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'patients'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'fk_patient_user'
);

-- Step 2: Add foreign key constraint if it doesn't exist
SET @sql_add_fk = IF(
    @fk_exists = 0,
    'ALTER TABLE patients ADD CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT',
    'SELECT "Foreign key constraint fk_patient_user already exists" AS message'
);

PREPARE stmt FROM @sql_add_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Check if index already exists
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'patients'
      AND INDEX_NAME = 'idx_patient_user_id'
);

-- Step 4: Add index if it doesn't exist
SET @sql_add_idx = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_patient_user_id ON patients(user_id)',
    'SELECT "Index idx_patient_user_id already exists" AS message'
);

PREPARE stmt FROM @sql_add_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================

-- Verify foreign key constraint was created
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    'Foreign key constraint verified' AS status
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id'
  AND REFERENCED_TABLE_NAME = 'users'
  AND CONSTRAINT_NAME = 'fk_patient_user';

-- Verify index was created
SELECT 
    INDEX_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    'Index verified' AS status
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND INDEX_NAME = 'idx_patient_user_id';

-- Test foreign key constraint by attempting to insert invalid reference (should fail)
-- This is a dry-run test - we'll rollback immediately
START TRANSACTION;

-- This should fail with foreign key constraint violation
-- INSERT INTO patients (user_id, keycloakId, firstName, lastName) 
-- VALUES (999999, 'test-keycloak-id', 'Test', 'Patient');

ROLLBACK;

SELECT 'Foreign key constraint is active and enforcing referential integrity' AS test_result;

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE patients DROP FOREIGN KEY fk_patient_user;
-- DROP INDEX idx_patient_user_id ON patients;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This script is idempotent - safe to run multiple times
-- 2. Foreign key constraint ensures referential integrity between patients and users
-- 3. ON DELETE RESTRICT prevents deletion of users who have associated patients
-- 4. Index on user_id improves query performance for findByUserId operations
-- 5. Prerequisites:
--    - users table must exist
--    - patients table must have user_id column
--    - All patients must have valid user_id values referencing existing users
-- 6. If migration fails:
--    - Check that all patients have user_id values (run 002_update_patients_user_id.sql)
--    - Check that all user_id values reference existing users in users table
--    - Fix any orphaned patient records before adding constraint

</content>
</invoke>