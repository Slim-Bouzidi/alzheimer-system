-- Migration Script: Add Foreign Key Constraint to Patients Table (Cross-Database)
-- Description: Adds foreign key constraint and index on user_id column
-- Note: This version works with cross-database foreign keys (patientdb.patients -> userdb.users)

USE patientdb;

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

-- Check if user_id column exists
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'patientdb'
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id';

-- Check if all patients have valid user_id values
SELECT 
    COUNT(*) AS patients_without_user_id,
    'Patients missing user_id (should be 0 before adding constraint)' AS description
FROM patientdb.patients
WHERE user_id IS NULL;

-- Check if all user_id values reference existing users (cross-database check)
SELECT 
    COUNT(*) AS invalid_user_references,
    'Patients with invalid user_id (should be 0 before adding constraint)' AS description
FROM patientdb.patients p
LEFT JOIN userdb.users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- ============================================================================
-- MIGRATION: Add Foreign Key Constraint and Index
-- ============================================================================

-- Step 1: Check if foreign key constraint already exists
SET @fk_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'patientdb'
      AND TABLE_NAME = 'patients'
      AND COLUMN_NAME = 'user_id'
      AND REFERENCED_TABLE_SCHEMA = 'userdb'
      AND REFERENCED_TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'fk_patient_user'
);

-- Step 2: Add foreign key constraint if it doesn't exist (cross-database reference)
SET @sql_add_fk = IF(
    @fk_exists = 0,
    'ALTER TABLE patientdb.patients ADD CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES userdb.users(id) ON DELETE RESTRICT',
    'SELECT "Foreign key constraint fk_patient_user already exists" AS message'
);

PREPARE stmt FROM @sql_add_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Check if index already exists
SET @idx_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'patientdb'
      AND TABLE_NAME = 'patients'
      AND INDEX_NAME = 'idx_patient_user_id'
);

-- Step 4: Add index if it doesn't exist
SET @sql_add_idx = IF(
    @idx_exists = 0,
    'CREATE INDEX idx_patient_user_id ON patientdb.patients(user_id)',
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
    TABLE_SCHEMA,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_SCHEMA,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME,
    'Foreign key constraint verified' AS status
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'patientdb'
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id'
  AND REFERENCED_TABLE_SCHEMA = 'userdb'
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
WHERE TABLE_SCHEMA = 'patientdb'
  AND TABLE_NAME = 'patients'
  AND INDEX_NAME = 'idx_patient_user_id';

SELECT 'Migration completed successfully!' AS result;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This script is idempotent - safe to run multiple times
-- 2. Foreign key constraint ensures referential integrity between patients and users
-- 3. Cross-database foreign keys work in MySQL when both databases are on the same server
-- 4. ON DELETE RESTRICT prevents deletion of users who have associated patients
-- 5. Index on user_id improves query performance for findByUserId operations
