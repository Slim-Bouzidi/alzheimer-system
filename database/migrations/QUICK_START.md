# Quick Start Guide: User-Patient Migration

## TL;DR - Fast Execution

### Linux/Mac

```bash
cd database/migrations
chmod +x run_migration.sh
DB_PASSWORD=your_password ./run_migration.sh
```

### Windows (PowerShell)

```powershell
cd database\migrations
.\run_migration.ps1 -DbPassword "your_password"
```

### Manual Execution

```bash
# 1. Backup
mysqldump -u root -p alzheimer_db > backup.sql

# 2. Run migrations
mysql -u root -p alzheimer_db < 001_migrate_existing_users.sql
mysql -u root -p alzheimer_db < 002_update_patients_user_id.sql
mysql -u root -p alzheimer_db < 003_verify_migration.sql
```

## What This Does

1. **Creates user records** for all existing patients
2. **Links patients to users** via `user_id` foreign key
3. **Verifies** data integrity and migration success

## Expected Results

- All patients have `user_id` set
- No orphaned records
- Migration status: SUCCESS

## If Something Goes Wrong

### Rollback

```bash
mysql -u root -p alzheimer_db < rollback_migration.sql
```

### Restore from Backup

```bash
mysql -u root -p alzheimer_db < backup.sql
```

## Configuration Options

### Custom Database Settings (Bash)

```bash
DB_HOST=localhost \
DB_PORT=3306 \
DB_NAME=alzheimer_db \
DB_USER=root \
DB_PASSWORD=your_password \
./run_migration.sh
```

### Custom Database Settings (PowerShell)

```powershell
.\run_migration.ps1 `
  -DbHost "localhost" `
  -DbPort 3306 `
  -DbName "alzheimer_db" `
  -DbUser "root" `
  -DbPassword "your_password"
```

## Verification Checklist

After migration, verify:

- [ ] All patients have `user_id`: `SELECT COUNT(*) FROM patients WHERE user_id IS NULL;` → Should be 0
- [ ] No orphaned records: `SELECT COUNT(*) FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id IS NOT NULL AND u.id IS NULL;` → Should be 0
- [ ] User count matches: `SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local';` → Should equal patient count
- [ ] Application services start successfully
- [ ] Can create new patients with user relationships
- [ ] Can query patients by user_id

## Common Issues

### Issue: "Cannot connect to MySQL"

**Solution**: Check MySQL is running and credentials are correct

```bash
# Test connection
mysql -h localhost -u root -p -e "SELECT 1;"
```

### Issue: "Duplicate email addresses"

**Solution**: Some patients have the same name. Run:

```sql
SELECT email, COUNT(*) 
FROM users 
WHERE email LIKE '%@migrated.local'
GROUP BY email 
HAVING COUNT(*) > 1;
```

Then add unique suffixes if needed (see README.md).

### Issue: "Foreign key constraint fails"

**Solution**: Ensure users table exists and User Service is deployed

```sql
SHOW TABLES LIKE 'users';
DESCRIBE users;
```

## Post-Migration

### Make user_id Required

After verifying migration success:

```sql
ALTER TABLE patients 
MODIFY COLUMN user_id BIGINT NOT NULL;
```

### Add Foreign Key Constraint (if missing)

```sql
ALTER TABLE patients 
ADD CONSTRAINT fk_patient_user 
FOREIGN KEY (user_id) REFERENCES users(id) 
ON DELETE RESTRICT;

CREATE INDEX idx_patient_user_id ON patients(user_id);
```

## Support

- **Full documentation**: See `README.md`
- **Verification queries**: See `003_verify_migration.sql`
- **Rollback procedure**: See `rollback_migration.sql`

## Migration Time Estimates

| Patient Count | Estimated Time |
|--------------|----------------|
| < 1,000      | < 10 seconds   |
| 1,000 - 10,000 | < 1 minute   |
| > 10,000     | 1-5 minutes    |

## Safety Features

✓ **Automatic backup** before migration  
✓ **Idempotent scripts** - safe to run multiple times  
✓ **Verification checks** after each step  
✓ **Rollback script** for emergency recovery  
✓ **No data loss** - only adds relationships  

## Requirements Validated

- ✓ 10.1: Migrate existing patient data
- ✓ 10.2: Generate emails for existing patients
- ✓ 10.3: Link patients to users via user_id
- ✓ 12.1: Data integrity verification
- ✓ 12.2: Foreign key constraints

## Next Steps After Migration

1. ✓ Verify all checks pass
2. ✓ Test application functionality
3. ✓ Monitor service logs
4. ✓ Make `user_id` NOT NULL
5. ✓ Update documentation
6. ✓ Notify team of completion
