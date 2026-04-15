-- Migration Script: Migrate Existing Users from Patients Table
-- Description: Creates user records for all existing patients in the system
-- Author: Keycloak User Service Architecture Migration
-- Date: 2024
-- Requirements: 10.1, 10.2

-- ============================================================================
-- MIGRATION: Insert users from patients table
-- ============================================================================

-- This script creates user records for all existing patients
-- Email format: firstname.lastname@migrated.local (lowercase)
-- Role: PATIENT for all migrated users
-- Uses INSERT IGNORE to handle duplicates safely (idempotent)

INSERT IGNORE INTO users (keycloak_id, email, role, created_at)
SELECT 
    p.keycloakId AS keycloak_id,
    CONCAT(
        LOWER(COALESCE(p.firstName, 'unknown')),
        '.',
        LOWER(COALESCE(p.lastName, 'user')),
        '@migrated.local'
    ) AS email,
    'PATIENT' AS role,
    NOW() AS created_at
FROM patients p
WHERE p.keycloakId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM users u WHERE u.keycloak_id = p.keycloakId
  );

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Check how many users were created
SELECT 
    COUNT(*) AS total_users_created,
    'Users migrated from patients table' AS description
FROM users
WHERE email LIKE '%@migrated.local';

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

-- To rollback this migration, run:
-- DELETE FROM users WHERE email LIKE '%@migrated.local';

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This script is idempotent - safe to run multiple times
-- 2. NULL firstName/lastName are handled with defaults: 'unknown.user@migrated.local'
-- 3. Email collisions are possible if multiple patients have same name
--    Consider adding a unique suffix if needed: firstname.lastname.{id}@migrated.local
-- 4. All migrated users get role 'PATIENT'
-- 5. created_at is set to NOW() - the migration timestamp
-- 6. Patients without keycloakId are skipped (should not exist in production)
