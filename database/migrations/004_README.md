# Migration 004: Add Foreign Key Constraint

## Overview

This migration adds a foreign key constraint and index to the `patients` table's `user_id` column, establishing referential integrity between patients and users.

## Task Reference

- **Spec**: keycloak-user-service-architecture
- **Task**: 9.2 Update database schema (add user_id column with foreign key)
- **Requirements**: 3.1, 12.2

## What This Migration Does

1. **Adds Foreign Key Constraint**: Creates `fk_patient_user` constraint linking `patients.user_id` to `users.id`
2. **Adds Index**: Creates `idx_patient_user_id` index on `user_id` column for query performance
3. **Enforces Referential Integrity**: Ensures all patient records reference valid users
4. **Prevents Orphaned Records**: ON DELETE RESTRICT prevents deletion of users with associated patients

## Prerequisites

Before running this migration, ensure:

1. ✅ Users table exists with data
2. ✅ Patients table has `user_id` column
3. ✅ All patients have valid `user_id` values (run migration 002 first)
4. ✅ No orphaned patient records (user_id references non-existent users)

## How to Run

### Option 1: Using MySQL Command Line

```bash
mysql -u root -p patientdb < database/migrations/004_add_foreign_key_constraint.sql
```

### Option 2: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open `004_add_foreign_key_constraint.sql`
4. Execute the script

### Option 3: Using Docker

```bash
docker exec -i alzheimer-mysql mysql -uroot -prootpassword patientdb < database/migrations/004_add_foreign_key_constraint.sql
```

## Verification

After running the migration, verify:

1. **Foreign Key Exists**:
```sql
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'patientdb'
  AND TABLE_NAME = 'patients'
  AND CONSTRAINT_NAME = 'fk_patient_user';
```

Expected result: One row showing the constraint

2. **Index Exists**:
```sql
SHOW INDEX FROM patients WHERE Key_name = 'idx_patient_user_id';
```

Expected result: One row showing the index

3. **Constraint is Enforced**:
```sql
-- This should fail with foreign key constraint violation
INSERT INTO patients (user_id, keycloakId, firstName, lastName) 
VALUES (999999, 'test-invalid', 'Test', 'Patient');
```

Expected result: Error 1452 - Cannot add or update a child row: a foreign key constraint fails

## Rollback

If you need to rollback this migration:

```sql
-- Remove foreign key constraint
ALTER TABLE patients DROP FOREIGN KEY fk_patient_user;

-- Remove index
DROP INDEX idx_patient_user_id ON patients;
```

## Impact

### Performance
- ✅ **Improved Query Performance**: Index speeds up `findByUserId` queries
- ⚠️ **Slight Insert/Update Overhead**: Foreign key validation adds minimal overhead

### Data Integrity
- ✅ **Referential Integrity**: Prevents orphaned patient records
- ✅ **Cascade Protection**: Cannot delete users with associated patients
- ✅ **Data Consistency**: Ensures all patients reference valid users

### Application Behavior
- ✅ **No Breaking Changes**: Application code already validates user existence
- ✅ **Better Error Messages**: Database-level constraint provides clear error messages
- ✅ **Prevents Data Corruption**: Impossible to create patients with invalid user_id

## Troubleshooting

### Error: Cannot add foreign key constraint

**Cause**: Some patients have `user_id` values that don't reference existing users

**Solution**:
```sql
-- Find orphaned patients
SELECT p.id, p.user_id, p.firstName, p.lastName
FROM patients p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- Fix by either:
-- 1. Create missing user records
-- 2. Update patient records with valid user_id
-- 3. Delete orphaned patient records (if appropriate)
```

### Error: Duplicate key name 'idx_patient_user_id'

**Cause**: Index already exists

**Solution**: The script is idempotent and will skip index creation if it exists. No action needed.

### Error: Constraint 'fk_patient_user' already exists

**Cause**: Foreign key constraint already exists

**Solution**: The script is idempotent and will skip constraint creation if it exists. No action needed.

## Testing

After migration, test the following scenarios:

1. **Create Patient with Valid User ID** (should succeed):
```sql
INSERT INTO patients (user_id, keycloakId, firstName, lastName)
SELECT id, UUID(), 'Test', 'Patient' FROM users LIMIT 1;
```

2. **Create Patient with Invalid User ID** (should fail):
```sql
INSERT INTO patients (user_id, keycloakId, firstName, lastName)
VALUES (999999, UUID(), 'Invalid', 'Patient');
```

3. **Delete User with Patients** (should fail):
```sql
DELETE FROM users WHERE id IN (SELECT user_id FROM patients LIMIT 1);
```

4. **Query Patient by User ID** (should be fast):
```sql
SELECT * FROM patients WHERE user_id = 1;
```

## Related Files

- `001_migrate_existing_users.sql` - Creates user records
- `002_update_patients_user_id.sql` - Links patients to users
- `003_verify_migration.sql` - Verifies data integrity
- `004_add_foreign_key_constraint.sql` - This migration (adds constraint)

## Next Steps

After this migration:

1. ✅ Patient Service can safely create patients with user_id
2. ✅ User Service can create users and trigger patient creation
3. ✅ Registration flow works end-to-end
4. ✅ Data integrity is enforced at database level

## Notes

- This migration is **idempotent** - safe to run multiple times
- The constraint uses `ON DELETE RESTRICT` to prevent accidental user deletion
- The index improves performance for `findByUserId` queries
- This completes Task 9.2 of the keycloak-user-service-architecture spec
