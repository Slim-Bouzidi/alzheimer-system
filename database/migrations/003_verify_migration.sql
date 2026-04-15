-- Migration Verification Script: Data Integrity Checks
-- Description: Comprehensive verification queries for user-patient migration
-- Author: Keycloak User Service Architecture Migration
-- Date: 2024
-- Requirements: 12.1, 12.2

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Count total patients
SELECT 
    COUNT(*) AS total_patients,
    'Total number of patient records' AS description
FROM patients;

-- Query 2: Count patients with user_id
SELECT 
    COUNT(*) AS patients_with_user_id,
    'Patients successfully linked to users' AS description
FROM patients
WHERE user_id IS NOT NULL;

-- Query 3: Count patients without user_id (should be 0)
SELECT 
    COUNT(*) AS patients_without_user_id,
    'Patients missing user_id (SHOULD BE 0)' AS description
FROM patients
WHERE user_id IS NULL;

-- Query 4: Verify all patients have matching users
SELECT 
    COUNT(*) AS patients_with_valid_users,
    'Patients with valid user references' AS description
FROM patients p
INNER JOIN users u ON p.user_id = u.id;

-- Query 5: Check for orphaned patients (user_id points to non-existent user)
SELECT 
    COUNT(*) AS orphaned_patients,
    'Patients with invalid user_id (SHOULD BE 0)' AS description
FROM patients p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- Query 6: Count total users
SELECT 
    COUNT(*) AS total_users,
    'Total number of user records' AS description
FROM users;

-- Query 7: Count migrated users (from patients)
SELECT 
    COUNT(*) AS migrated_users,
    'Users created from patient migration' AS description
FROM users
WHERE email LIKE '%@migrated.local';

-- Query 8: Count users by role
SELECT 
    role,
    COUNT(*) AS count,
    'User count by role' AS description
FROM users
GROUP BY role
ORDER BY role;

-- Query 9: Verify keycloak_id uniqueness in users
SELECT 
    keycloak_id,
    COUNT(*) AS duplicate_count,
    'Duplicate keycloak_id in users (SHOULD BE EMPTY)' AS description
FROM users
GROUP BY keycloak_id
HAVING COUNT(*) > 1;

-- Query 10: Verify email uniqueness in users
SELECT 
    email,
    COUNT(*) AS duplicate_count,
    'Duplicate email in users (SHOULD BE EMPTY)' AS description
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Query 11: Check foreign key constraint integrity
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'patients'
  AND COLUMN_NAME = 'user_id'
  AND REFERENCED_TABLE_NAME = 'users';

-- Query 12: Verify keycloak_id consistency between patients and users
SELECT 
    COUNT(*) AS consistent_keycloak_ids,
    'Patients where keycloak_id matches user keycloak_id' AS description
FROM patients p
INNER JOIN users u ON p.user_id = u.id
WHERE p.keycloakId = u.keycloak_id;

-- Query 13: Find inconsistent keycloak_id mappings (should be 0)
SELECT 
    p.id AS patient_id,
    p.keycloakId AS patient_keycloak_id,
    u.keycloak_id AS user_keycloak_id,
    'Inconsistent keycloak_id mapping (SHOULD BE EMPTY)' AS description
FROM patients p
INNER JOIN users u ON p.user_id = u.id
WHERE p.keycloakId != u.keycloak_id;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Comprehensive migration summary
SELECT 
    'MIGRATION SUMMARY' AS report_section,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM patients WHERE user_id IS NOT NULL) AS patients_linked,
    (SELECT COUNT(*) FROM patients WHERE user_id IS NULL) AS patients_unlinked,
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local') AS migrated_users,
    CASE 
        WHEN (SELECT COUNT(*) FROM patients WHERE user_id IS NULL) = 0 
        THEN 'SUCCESS'
        ELSE 'INCOMPLETE'
    END AS migration_status;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- After successful migration:
-- 1. patients_without_user_id = 0
-- 2. orphaned_patients = 0
-- 3. patients_with_user_id = total_patients
-- 4. patients_with_valid_users = total_patients
-- 5. No duplicate keycloak_id in users
-- 6. No duplicate email in users (unless name collisions exist)
-- 7. Foreign key constraint exists on patients.user_id -> users.id
-- 8. consistent_keycloak_ids = total_patients
-- 9. Inconsistent keycloak_id mapping query returns 0 rows
-- 10. migration_status = 'SUCCESS'

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If patients_without_user_id > 0:
--   1. Check if those patients have keycloakId: SELECT * FROM patients WHERE user_id IS NULL;
--   2. Check if users exist for those keycloak_ids: 
--      SELECT p.*, u.* FROM patients p LEFT JOIN users u ON p.keycloakId = u.keycloak_id WHERE p.user_id IS NULL;
--   3. Re-run 001_migrate_existing_users.sql and 002_update_patients_user_id.sql

-- If duplicate emails exist:
--   1. Identify duplicates: SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
--   2. Consider adding unique suffix: UPDATE users SET email = CONCAT(email, '.', id) WHERE email IN (...);

-- If orphaned_patients > 0:
--   1. This indicates data corruption - user_id points to deleted user
--   2. Investigate: SELECT p.* FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id IS NOT NULL AND u.id IS NULL;
--   3. Fix by re-running migration or manually creating missing users

-- If foreign key constraint is missing:
--   1. Add constraint: ALTER TABLE patients ADD CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
--   2. Create index: CREATE INDEX idx_patient_user_id ON patients(user_id);
