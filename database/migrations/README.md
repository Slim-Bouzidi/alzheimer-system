# Database Migration Guide: User-Patient Relationship

## Overview

This directory contains SQL migration scripts for establishing the relationship between users and patients in the Alzheimer Support System. The migration creates user records from existing patient data and links patients to their corresponding users via the `user_id` foreign key.

## Migration Context

**Problem**: The current system stores patient records with `keycloak_id` but lacks a dedicated `users` table. The new architecture introduces a User Service that manages application user data separately from authentication (Keycloak).

**Solution**: These scripts migrate existing patient data to create user records and establish proper foreign key relationships.

## Prerequisites

Before running these migrations:

1. **Backup your database**
   ```bash
   mysqldump -u root -p alzheimer_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Ensure the users table exists**
   - The User Service must be deployed and have created the `users` table
   - Verify: `SHOW TABLES LIKE 'users';`

3. **Verify patients table has required columns**
   - `keycloakId` (existing)
   - `user_id` (should exist but be NULL for existing records)
   - `firstName` and `lastName` (for email generation)

4. **Database connection**
   - MySQL 8.0 or higher
   - User with INSERT, UPDATE, SELECT privileges on both tables

## Migration Scripts

### 001_migrate_existing_users.sql

**Purpose**: Creates user records for all existing patients

**What it does**:
- Extracts patient data from the `patients` table
- Generates email addresses in format: `firstname.lastname@migrated.local`
- Creates user records with role `PATIENT`
- Handles NULL names with defaults: `unknown.user@migrated.local`
- Uses `INSERT IGNORE` for idempotency (safe to run multiple times)

**Requirements**: 10.1, 10.2

**Example output**:
```
Query OK, 150 rows affected (0.05 sec)
Records: 150  Duplicates: 0  Warnings: 0
```

### 002_update_patients_user_id.sql

**Purpose**: Links patient records to their corresponding user records

**What it does**:
- Joins `patients` and `users` tables on `keycloak_id`
- Updates `patients.user_id` with the matching `users.id`
- Only updates records where `user_id IS NULL`
- Idempotent (safe to run multiple times)

**Requirements**: 3.1, 10.3

**Example output**:
```
Query OK, 150 rows affected (0.03 sec)
Rows matched: 150  Changed: 150  Warnings: 0
```

### 003_verify_migration.sql

**Purpose**: Comprehensive verification of migration success

**What it does**:
- Counts total patients and users
- Verifies all patients have `user_id`
- Checks for orphaned records
- Validates foreign key constraints
- Verifies data consistency
- Provides troubleshooting queries

**Requirements**: 12.1, 12.2

**Expected results**:
- `patients_without_user_id` = 0
- `orphaned_patients` = 0
- `migration_status` = 'SUCCESS'

### 004_add_foreign_key_constraint.sql

**Purpose**: Adds foreign key constraint and index to enforce referential integrity

**What it does**:
- Adds `fk_patient_user` foreign key constraint on `patients.user_id` → `users.id`
- Creates `idx_patient_user_id` index for query performance
- Enforces referential integrity at database level
- Prevents deletion of users with associated patients (ON DELETE RESTRICT)
- Idempotent (safe to run multiple times)

**Requirements**: 3.1, 12.2

**Example output**:
```
Foreign key constraint fk_patient_user created successfully
Index idx_patient_user_id created successfully
```

## Execution Steps

### Step 1: Run User Migration

```bash
mysql -u root -p alzheimer_db < database/migrations/001_migrate_existing_users.sql
```

**Expected**: Creates user records for all patients

**Verify**:
```sql
SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local';
```

### Step 2: Update Patient User IDs

```bash
mysql -u root -p alzheimer_db < database/migrations/002_update_patients_user_id.sql
```

**Expected**: Links all patients to users

**Verify**:
```sql
SELECT COUNT(*) FROM patients WHERE user_id IS NOT NULL;
```

### Step 3: Run Verification

```bash
mysql -u root -p alzheimer_db < database/migrations/003_verify_migration.sql
```

**Expected**: All verification queries pass with 0 errors

**Review the output carefully** - any non-zero counts in "SHOULD BE 0" queries indicate issues.

### Step 4: Add Foreign Key Constraint

```bash
mysql -u root -p alzheimer_db < database/migrations/004_add_foreign_key_constraint.sql
```

**Expected**: Foreign key constraint and index created successfully

**Verify**:
```sql
-- Check foreign key exists
SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_NAME = 'patients' AND COLUMN_NAME = 'user_id';

-- Check index exists
SHOW INDEX FROM patients WHERE Key_name = 'idx_patient_user_id';
```

## Rollback Procedures

### Rollback Step 2 (Unlink patients from users)

```sql
UPDATE patients SET user_id = NULL WHERE user_id IS NOT NULL;
```

### Rollback Step 1 (Delete migrated users)

```sql
DELETE FROM users WHERE email LIKE '%@migrated.local';
```

**Warning**: Only rollback if migration failed. Do not rollback after the system is in production use.

## Common Issues and Solutions

### Issue 1: Duplicate Email Addresses

**Symptom**: Multiple patients with same first and last name

**Solution**: Add unique suffix to emails
```sql
UPDATE users 
SET email = CONCAT(
    SUBSTRING_INDEX(email, '@', 1), 
    '.', 
    id, 
    '@migrated.local'
)
WHERE email LIKE '%@migrated.local'
  AND id IN (
      SELECT id FROM (
          SELECT id FROM users 
          GROUP BY email 
          HAVING COUNT(*) > 1
      ) AS duplicates
  );
```

### Issue 2: Patients Without keycloak_id

**Symptom**: Some patients don't have `keycloak_id` set

**Solution**: Investigate and fix data integrity
```sql
-- Find patients without keycloak_id
SELECT * FROM patients WHERE keycloakId IS NULL;

-- These patients cannot be migrated automatically
-- Manual intervention required to assign keycloak_id or create users
```

### Issue 3: Foreign Key Constraint Missing

**Symptom**: No foreign key constraint on `patients.user_id`

**Solution**: Run migration 004
```bash
mysql -u root -p alzheimer_db < database/migrations/004_add_foreign_key_constraint.sql
```

Or manually add the constraint:
```sql
ALTER TABLE patients 
ADD CONSTRAINT fk_patient_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE RESTRICT;

CREATE INDEX idx_patient_user_id ON patients(user_id);
```

### Issue 4: Orphaned Patients

**Symptom**: `patients.user_id` points to non-existent user

**Solution**: Re-run migration or create missing users
```sql
-- Find orphaned patients
SELECT p.* 
FROM patients p 
LEFT JOIN users u ON p.user_id = u.id 
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- Fix by re-running 001 and 002, or manually create users
```

## Post-Migration Steps

### 1. Make user_id NOT NULL

After verifying all patients have `user_id`:

```sql
ALTER TABLE patients 
MODIFY COLUMN user_id BIGINT NOT NULL;
```

### 2. Update Application Configuration

Ensure all services are configured to use the new user relationships:
- User Service: Deployed and operational
- Patient Service: Updated to validate `user_id`
- API Gateway: Routes configured for User Service

### 3. Monitor Logs

Check service logs for any errors related to user lookups:
```bash
docker-compose logs -f user-service
docker-compose logs -f patient-service
```

### 4. Test User-Patient Relationships

```sql
-- Test query: Get patient with user details
SELECT 
    p.id AS patient_id,
    p.firstName,
    p.lastName,
    u.id AS user_id,
    u.email,
    u.role,
    u.keycloak_id
FROM patients p
INNER JOIN users u ON p.user_id = u.id
LIMIT 10;
```

## Migration Checklist

- [ ] Database backup completed
- [ ] Users table exists and is accessible
- [ ] Patients table has `user_id` column
- [ ] Ran 001_migrate_existing_users.sql
- [ ] Verified user records created
- [ ] Ran 002_update_patients_user_id.sql
- [ ] Verified all patients have `user_id`
- [ ] Ran 003_verify_migration.sql
- [ ] All verification queries passed
- [ ] Ran 004_add_foreign_key_constraint.sql
- [ ] Foreign key constraint exists
- [ ] Index on user_id exists
- [ ] No orphaned records
- [ ] No duplicate emails (or resolved)
- [ ] Made `user_id` NOT NULL (optional, after constraint)
- [ ] Tested application functionality
- [ ] Monitored logs for errors
- [ ] Documented any issues encountered

## Support

If you encounter issues during migration:

1. **Check verification queries** in `003_verify_migration.sql`
2. **Review troubleshooting section** in the verification script
3. **Check service logs** for User Service and Patient Service
4. **Restore from backup** if necessary
5. **Contact the development team** with specific error messages

## Migration Timeline

Recommended execution during maintenance window:

1. **T-0**: Announce maintenance window
2. **T+5min**: Stop application services
3. **T+10min**: Backup database
4. **T+15min**: Run migration scripts
5. **T+20min**: Run verification
6. **T+25min**: Fix any issues
7. **T+30min**: Start services
8. **T+35min**: Test functionality
9. **T+40min**: Monitor logs
10. **T+60min**: End maintenance window

**Estimated downtime**: 30-60 minutes depending on data volume

## Data Volume Considerations

- **< 1,000 patients**: Migration completes in seconds
- **1,000 - 10,000 patients**: Migration completes in under 1 minute
- **> 10,000 patients**: Consider batching updates

For large datasets, modify scripts to use batching:
```sql
-- Example: Update in batches of 1000
UPDATE patients p
INNER JOIN users u ON p.keycloakId = u.keycloak_id
SET p.user_id = u.id
WHERE p.user_id IS NULL
LIMIT 1000;
```

## Security Notes

1. **Migrated emails** use `@migrated.local` domain to distinguish from real user registrations
2. **Passwords** remain in Keycloak - no password data is migrated
3. **All migrated users** have role `PATIENT` - adjust manually if needed
4. **keycloak_id** is preserved for authentication continuity
5. **Foreign key constraints** prevent orphaned records

## References

- Requirements: 10.1, 10.2, 3.1, 10.3, 12.1, 12.2
- Design Document: `.kiro/specs/keycloak-user-service-architecture/design.md`
- Tasks: `.kiro/specs/keycloak-user-service-architecture/tasks.md`
