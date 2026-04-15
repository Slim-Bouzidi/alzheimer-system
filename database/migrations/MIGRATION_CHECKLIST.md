# Migration Execution Checklist

## Pre-Migration Checklist

### Environment Preparation
- [ ] Verify MySQL server is running and accessible
- [ ] Confirm database credentials are correct
- [ ] Test database connection: `mysql -h localhost -u root -p -e "SELECT 1;"`
- [ ] Verify sufficient disk space for backup
- [ ] Check current database size: `SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS "Size (MB)" FROM information_schema.tables WHERE table_schema = 'alzheimer_db';`

### Database State Verification
- [ ] Verify `users` table exists: `SHOW TABLES LIKE 'users';`
- [ ] Verify `patients` table exists: `SHOW TABLES LIKE 'patients';`
- [ ] Check `patients` table has `user_id` column: `DESCRIBE patients;`
- [ ] Count existing patients: `SELECT COUNT(*) FROM patients;`
- [ ] Count existing users: `SELECT COUNT(*) FROM users;`
- [ ] Verify patients have `keycloakId`: `SELECT COUNT(*) FROM patients WHERE keycloakId IS NULL;` (should be 0)

### Service State
- [ ] User Service is deployed and operational
- [ ] Patient Service is running
- [ ] API Gateway is configured
- [ ] All services can connect to database

### Backup Preparation
- [ ] Create backup directory: `mkdir -p database/migrations/backups`
- [ ] Verify backup tool is available: `which mysqldump`
- [ ] Test backup command (dry run)
- [ ] Ensure backup location has sufficient space

### Communication
- [ ] Notify team of planned maintenance window
- [ ] Schedule migration during low-traffic period
- [ ] Prepare rollback plan
- [ ] Assign roles (executor, verifier, communicator)

## Migration Execution Checklist

### Phase 1: Backup
- [ ] **CRITICAL**: Create database backup
  ```bash
  mysqldump -u root -p alzheimer_db > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Verify backup file was created
- [ ] Check backup file size is reasonable
- [ ] Test backup file integrity: `head -n 20 backup_*.sql`
- [ ] Store backup in safe location
- [ ] Record backup filename and timestamp

### Phase 2: Stop Services (Optional)
- [ ] Stop Angular frontend (if needed)
- [ ] Stop API Gateway (if needed)
- [ ] Stop Patient Service (if needed)
- [ ] Stop User Service (if needed)
- [ ] Verify services are stopped: `docker-compose ps`

### Phase 3: Execute Migration Scripts

#### Step 1: Migrate Existing Users
- [ ] Run `001_migrate_existing_users.sql`
  ```bash
  mysql -u root -p alzheimer_db < database/migrations/001_migrate_existing_users.sql
  ```
- [ ] Check for errors in output
- [ ] Verify users were created:
  ```sql
  SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local';
  ```
- [ ] Record number of users created: ___________
- [ ] Compare with patient count (should match)

#### Step 2: Update Patient User IDs
- [ ] Run `002_update_patients_user_id.sql`
  ```bash
  mysql -u root -p alzheimer_db < database/migrations/002_update_patients_user_id.sql
  ```
- [ ] Check for errors in output
- [ ] Verify patients were updated:
  ```sql
  SELECT COUNT(*) FROM patients WHERE user_id IS NOT NULL;
  ```
- [ ] Record number of patients updated: ___________
- [ ] Verify no patients without user_id:
  ```sql
  SELECT COUNT(*) FROM patients WHERE user_id IS NULL;
  ```
  (should be 0)

#### Step 3: Verify Migration
- [ ] Run `003_verify_migration.sql`
  ```bash
  mysql -u root -p alzheimer_db < database/migrations/003_verify_migration.sql
  ```
- [ ] Review all verification query results
- [ ] Verify `patients_without_user_id = 0`
- [ ] Verify `orphaned_patients = 0`
- [ ] Verify `migration_status = 'SUCCESS'`
- [ ] Check for duplicate emails (resolve if found)
- [ ] Verify foreign key constraint exists
- [ ] Verify keycloak_id consistency

### Phase 4: Post-Migration Validation

#### Data Integrity Checks
- [ ] Verify total patient count unchanged
- [ ] Verify all patients have user_id
- [ ] Verify no orphaned records
- [ ] Test sample queries:
  ```sql
  SELECT p.*, u.* 
  FROM patients p 
  INNER JOIN users u ON p.user_id = u.id 
  LIMIT 5;
  ```
- [ ] Verify keycloak_id matches between patients and users

#### Application Testing
- [ ] Start User Service
- [ ] Start Patient Service
- [ ] Start API Gateway
- [ ] Start Angular frontend
- [ ] Verify all services started successfully
- [ ] Check service logs for errors

#### Functional Testing
- [ ] Test user lookup by keycloak_id
- [ ] Test patient lookup by user_id
- [ ] Test creating new patient with user_id
- [ ] Test user-patient relationship queries
- [ ] Test authentication flow
- [ ] Test registration flow (if applicable)

## Post-Migration Checklist

### Database Optimization
- [ ] Make `user_id` NOT NULL (after verification):
  ```sql
  ALTER TABLE patients MODIFY COLUMN user_id BIGINT NOT NULL;
  ```
- [ ] Add foreign key constraint (if missing):
  ```sql
  ALTER TABLE patients 
  ADD CONSTRAINT fk_patient_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE RESTRICT;
  ```
- [ ] Create index on user_id (if missing):
  ```sql
  CREATE INDEX idx_patient_user_id ON patients(user_id);
  ```
- [ ] Analyze tables for optimization:
  ```sql
  ANALYZE TABLE patients, users;
  ```

### Monitoring
- [ ] Monitor User Service logs for 1 hour
- [ ] Monitor Patient Service logs for 1 hour
- [ ] Monitor API Gateway logs for 1 hour
- [ ] Check for any error patterns
- [ ] Monitor database performance
- [ ] Check query execution times

### Documentation
- [ ] Document migration completion time
- [ ] Record any issues encountered
- [ ] Document resolutions applied
- [ ] Update system documentation
- [ ] Record final patient count: ___________
- [ ] Record final user count: ___________
- [ ] Record migrated user count: ___________

### Communication
- [ ] Notify team of successful migration
- [ ] Update status page (if applicable)
- [ ] Send completion report to stakeholders
- [ ] Schedule post-migration review meeting

### Cleanup
- [ ] Archive migration logs
- [ ] Store backup in long-term storage
- [ ] Clean up temporary files
- [ ] Update runbooks with lessons learned

## Rollback Checklist (If Needed)

### Decision Point
- [ ] Determine if rollback is necessary
- [ ] Identify specific issues requiring rollback
- [ ] Get approval from team lead
- [ ] Notify stakeholders of rollback decision

### Rollback Execution
- [ ] Stop all application services
- [ ] Run rollback script:
  ```bash
  mysql -u root -p alzheimer_db < database/migrations/rollback_migration.sql
  ```
- [ ] Verify rollback completed successfully
- [ ] Check `patients_with_user_id = 0`
- [ ] Check `migrated_users = 0`
- [ ] Verify rollback_status = 'ROLLBACK COMPLETE'

### Alternative: Restore from Backup
- [ ] Stop all application services
- [ ] Drop database:
  ```sql
  DROP DATABASE alzheimer_db;
  CREATE DATABASE alzheimer_db;
  ```
- [ ] Restore from backup:
  ```bash
  mysql -u root -p alzheimer_db < backup_YYYYMMDD_HHMMSS.sql
  ```
- [ ] Verify data restored correctly
- [ ] Start application services
- [ ] Test basic functionality

### Post-Rollback
- [ ] Document reason for rollback
- [ ] Identify root cause of failure
- [ ] Plan corrective actions
- [ ] Schedule retry (if applicable)
- [ ] Notify stakeholders

## Sign-Off

### Migration Team

**Executor**: _________________ Date: _______ Time: _______
- Responsible for running migration scripts
- Signature: _________________

**Verifier**: _________________ Date: _______ Time: _______
- Responsible for verification checks
- Signature: _________________

**Database Administrator**: _________________ Date: _______ Time: _______
- Responsible for database health
- Signature: _________________

**Team Lead**: _________________ Date: _______ Time: _______
- Final approval
- Signature: _________________

### Migration Results

**Start Time**: _________________
**End Time**: _________________
**Duration**: _________________
**Status**: [ ] Success [ ] Failed [ ] Rolled Back

**Patients Migrated**: _________________
**Users Created**: _________________
**Issues Encountered**: _________________

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

### Approval

**Approved for Production**: [ ] Yes [ ] No

**Approver**: _________________ Date: _______ Time: _______

**Signature**: _________________

---

## Quick Reference Commands

### Check Migration Status
```sql
SELECT 
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM patients WHERE user_id IS NOT NULL) AS patients_linked,
    (SELECT COUNT(*) FROM patients WHERE user_id IS NULL) AS patients_unlinked,
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local') AS migrated_users,
    CASE 
        WHEN (SELECT COUNT(*) FROM patients WHERE user_id IS NULL) = 0 
        THEN 'SUCCESS'
        ELSE 'INCOMPLETE'
    END AS status;
```

### Find Problematic Records
```sql
-- Patients without user_id
SELECT * FROM patients WHERE user_id IS NULL;

-- Orphaned patients
SELECT p.* 
FROM patients p 
LEFT JOIN users u ON p.user_id = u.id 
WHERE p.user_id IS NOT NULL AND u.id IS NULL;

-- Duplicate emails
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

### Emergency Contacts

**Database Administrator**: _________________
**Team Lead**: _________________
**On-Call Engineer**: _________________
**Escalation Contact**: _________________

---

**Document Version**: 1.0
**Last Updated**: 2024
**Next Review**: After migration completion
