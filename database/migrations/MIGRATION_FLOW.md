# Migration Flow Diagram

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-MIGRATION STATE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  patients table  │                                          │
│  ├──────────────────┤                                          │
│  │ id               │                                          │
│  │ keycloakId       │ ◄─── Existing field                     │
│  │ user_id (NULL)   │ ◄─── New field, not populated           │
│  │ firstName        │                                          │
│  │ lastName         │                                          │
│  │ ...              │                                          │
│  └──────────────────┘                                          │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │   users table    │                                          │
│  ├──────────────────┤                                          │
│  │ (empty or few    │ ◄─── No migrated users yet              │
│  │  manual users)   │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                              ↓
                    [BACKUP DATABASE]
                              ↓
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│              STEP 1: 001_migrate_existing_users.sql             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  patients table  │                                          │
│  ├──────────────────┤                                          │
│  │ id: 1            │                                          │
│  │ keycloakId: abc  │ ───┐                                     │
│  │ firstName: John  │    │                                     │
│  │ lastName: Doe    │    │  Extract data                       │
│  └──────────────────┘    │                                     │
│                          │                                     │
│                          ↓                                     │
│                                                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │  INSERT INTO users                       │                 │
│  │  (keycloak_id, email, role, created_at)  │                 │
│  │  VALUES                                   │                 │
│  │  ('abc',                                  │                 │
│  │   'john.doe@migrated.local',             │ ◄─── Generated  │
│  │   'PATIENT',                              │                 │
│  │   NOW())                                  │                 │
│  └──────────────────────────────────────────┘                 │
│                          ↓                                     │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │   users table    │                                          │
│  ├──────────────────┤                                          │
│  │ id: 101          │ ◄─── New user record created            │
│  │ keycloak_id: abc │                                          │
│  │ email: john.doe@ │                                          │
│  │   migrated.local │                                          │
│  │ role: PATIENT    │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│            STEP 2: 002_update_patients_user_id.sql              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  patients table  │         │   users table    │            │
│  ├──────────────────┤         ├──────────────────┤            │
│  │ id: 1            │         │ id: 101          │            │
│  │ keycloakId: abc  │ ◄─────► │ keycloak_id: abc │            │
│  │ user_id: NULL    │   JOIN  │ email: john.doe@ │            │
│  │ firstName: John  │         │   migrated.local │            │
│  │ lastName: Doe    │         │ role: PATIENT    │            │
│  └──────────────────┘         └──────────────────┘            │
│         ↓                                                       │
│         │  UPDATE patients                                     │
│         │  SET user_id = 101                                   │
│         │  WHERE keycloakId = 'abc'                            │
│         ↓                                                       │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  patients table  │                                          │
│  ├──────────────────┤                                          │
│  │ id: 1            │                                          │
│  │ keycloakId: abc  │                                          │
│  │ user_id: 101     │ ◄─── NOW POPULATED!                     │
│  │ firstName: John  │                                          │
│  │ lastName: Doe    │                                          │
│  └──────────────────┘                                          │
│         │                                                       │
│         │ Foreign Key                                          │
│         ↓                                                       │
│  ┌──────────────────┐                                          │
│  │   users table    │                                          │
│  ├──────────────────┤                                          │
│  │ id: 101          │ ◄─── Referenced by patient              │
│  │ keycloak_id: abc │                                          │
│  │ email: john.doe@ │                                          │
│  │   migrated.local │                                          │
│  │ role: PATIENT    │                                          │
│  └──────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│              STEP 3: 003_verify_migration.sql                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ Count total patients                                        │
│  ✓ Count patients with user_id                                 │
│  ✓ Count patients without user_id (should be 0)                │
│  ✓ Verify all patients have matching users                     │
│  ✓ Check for orphaned patients (should be 0)                   │
│  ✓ Count total users                                           │
│  ✓ Count migrated users                                        │
│  ✓ Verify keycloak_id uniqueness                               │
│  ✓ Verify email uniqueness                                     │
│  ✓ Check foreign key constraint                                │
│  ✓ Verify keycloak_id consistency                              │
│  ✓ Find inconsistent mappings (should be 0)                    │
│  ✓ Generate migration summary report                           │
│                                                                 │
│  Expected Result: migration_status = 'SUCCESS'                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                              ↓
                              ↓

┌─────────────────────────────────────────────────────────────────┐
│                    POST-MIGRATION STATE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  patients table  │                                          │
│  ├──────────────────┤                                          │
│  │ id: 1            │                                          │
│  │ keycloakId: abc  │                                          │
│  │ user_id: 101     │ ◄─── ✓ POPULATED                        │
│  │ firstName: John  │                                          │
│  │ lastName: Doe    │                                          │
│  └──────────────────┘                                          │
│         │                                                       │
│         │ FK: fk_patient_user                                  │
│         ↓                                                       │
│  ┌──────────────────┐                                          │
│  │   users table    │                                          │
│  ├──────────────────┤                                          │
│  │ id: 101          │ ◄─── ✓ USER RECORD EXISTS               │
│  │ keycloak_id: abc │                                          │
│  │ email: john.doe@ │                                          │
│  │   migrated.local │                                          │
│  │ role: PATIENT    │                                          │
│  └──────────────────┘                                          │
│                                                                 │
│  ✓ All patients linked to users                                │
│  ✓ Foreign key constraint enforced                             │
│  ✓ Data integrity verified                                     │
│  ✓ Ready for production use                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Transformation Example

### Before Migration

**patients table:**
| id | keycloakId | user_id | firstName | lastName |
|----|------------|---------|-----------|----------|
| 1  | abc-123    | NULL    | John      | Doe      |
| 2  | def-456    | NULL    | Jane      | Smith    |
| 3  | ghi-789    | NULL    | Bob       | Johnson  |

**users table:**
| id | keycloak_id | email | role |
|----|-------------|-------|------|
| (empty) | | | |

### After Step 1 (001_migrate_existing_users.sql)

**patients table:** (unchanged)
| id | keycloakId | user_id | firstName | lastName |
|----|------------|---------|-----------|----------|
| 1  | abc-123    | NULL    | John      | Doe      |
| 2  | def-456    | NULL    | Jane      | Smith    |
| 3  | ghi-789    | NULL    | Bob       | Johnson  |

**users table:** (new records created)
| id  | keycloak_id | email                    | role    |
|-----|-------------|--------------------------|---------|
| 101 | abc-123     | john.doe@migrated.local  | PATIENT |
| 102 | def-456     | jane.smith@migrated.local| PATIENT |
| 103 | ghi-789     | bob.johnson@migrated.local| PATIENT |

### After Step 2 (002_update_patients_user_id.sql)

**patients table:** (user_id populated)
| id | keycloakId | user_id | firstName | lastName |
|----|------------|---------|-----------|----------|
| 1  | abc-123    | 101     | John      | Doe      |
| 2  | def-456    | 102     | Jane      | Smith    |
| 3  | ghi-789    | 103     | Bob       | Johnson  |

**users table:** (unchanged)
| id  | keycloak_id | email                    | role    |
|-----|-------------|--------------------------|---------|
| 101 | abc-123     | john.doe@migrated.local  | PATIENT |
| 102 | def-456     | jane.smith@migrated.local| PATIENT |
| 103 | ghi-789     | bob.johnson@migrated.local| PATIENT |

### Relationships Established

```
Patient 1 (id=1) ──[user_id=101]──► User 101 (keycloak_id=abc-123)
Patient 2 (id=2) ──[user_id=102]──► User 102 (keycloak_id=def-456)
Patient 3 (id=3) ──[user_id=103]──► User 103 (keycloak_id=ghi-789)
```

## Rollback Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLLBACK PROCEDURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Remove user_id references                             │
│  ┌──────────────────────────────────────────┐                 │
│  │ UPDATE patients SET user_id = NULL       │                 │
│  └──────────────────────────────────────────┘                 │
│                          ↓                                     │
│  ┌──────────────────┐                                          │
│  │  patients table  │                                          │
│  ├──────────────────┤                                          │
│  │ user_id: NULL    │ ◄─── Unlinked                           │
│  └──────────────────┘                                          │
│                                                                 │
│  Step 2: Delete migrated users                                 │
│  ┌──────────────────────────────────────────┐                 │
│  │ DELETE FROM users                        │                 │
│  │ WHERE email LIKE '%@migrated.local'      │                 │
│  └──────────────────────────────────────────┘                 │
│                          ↓                                     │
│  ┌──────────────────┐                                          │
│  │   users table    │                                          │
│  ├──────────────────┤                                          │
│  │ (migrated users  │ ◄─── Deleted                            │
│  │  removed)        │                                          │
│  └──────────────────┘                                          │
│                                                                 │
│  Result: Back to pre-migration state                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Error Scenarios

### Scenario 1: Duplicate Names

```
patients table:
┌────┬────────────┬──────────┬──────────┐
│ id │ keycloakId │firstName │ lastName │
├────┼────────────┼──────────┼──────────┤
│ 1  │ abc-123    │ John     │ Doe      │
│ 2  │ def-456    │ John     │ Doe      │ ◄─── Same name!
└────┴────────────┴──────────┴──────────┘

Generated emails:
- john.doe@migrated.local (for patient 1)
- john.doe@migrated.local (for patient 2) ◄─── DUPLICATE!

Solution: Add unique suffix
- john.doe.1@migrated.local
- john.doe.2@migrated.local
```

### Scenario 2: NULL Names

```
patients table:
┌────┬────────────┬──────────┬──────────┐
│ id │ keycloakId │firstName │ lastName │
├────┼────────────┼──────────┼──────────┤
│ 1  │ abc-123    │ NULL     │ NULL     │ ◄─── Missing names
└────┴────────────┴──────────┴──────────┘

Generated email:
- unknown.user@migrated.local ◄─── Default fallback
```

### Scenario 3: Missing keycloak_id

```
patients table:
┌────┬────────────┬──────────┬──────────┐
│ id │ keycloakId │firstName │ lastName │
├────┼────────────┼──────────┼──────────┤
│ 1  │ NULL       │ John     │ Doe      │ ◄─── No keycloak_id
└────┴────────────┴──────────┴──────────┘

Result: Patient skipped (cannot create user without keycloak_id)
Action: Manual intervention required
```

## Success Indicators

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERIFICATION CHECKLIST                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ patients_without_user_id = 0                                │
│  ✓ orphaned_patients = 0                                       │
│  ✓ patients_with_user_id = total_patients                      │
│  ✓ patients_with_valid_users = total_patients                  │
│  ✓ No duplicate keycloak_id in users                           │
│  ✓ No duplicate emails (or resolved)                           │
│  ✓ Foreign key constraint exists                               │
│  ✓ consistent_keycloak_ids = total_patients                    │
│  ✓ Inconsistent mappings = 0                                   │
│  ✓ migration_status = 'SUCCESS'                                │
│                                                                 │
│  Result: ✅ MIGRATION SUCCESSFUL                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
