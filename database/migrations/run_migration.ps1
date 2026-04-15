# Migration Execution Script (PowerShell)
# Description: Automated execution of user-patient migration with verification
# Author: Keycloak User Service Architecture Migration
# Date: 2024

param(
    [string]$DbHost = "localhost",
    [int]$DbPort = 3306,
    [string]$DbName = "alzheimer_db",
    [string]$DbUser = "root",
    [string]$DbPassword = ""
)

# Configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupDir = Join-Path $ScriptDir "backups"

# Functions
function Write-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

# Check if MySQL is available
function Test-MySqlConnection {
    Write-Info "Checking MySQL connection..."
    
    $mysqlCmd = "mysql"
    if (-not (Get-Command $mysqlCmd -ErrorAction SilentlyContinue)) {
        Write-Error-Custom "MySQL client not found in PATH"
        Write-Info "Please install MySQL client or add it to PATH"
        return $false
    }
    
    try {
        $testQuery = "SELECT 1;"
        $result = & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword -e $testQuery 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "MySQL connection successful"
            return $true
        } else {
            Write-Error-Custom "Cannot connect to MySQL"
            return $false
        }
    } catch {
        Write-Error-Custom "Cannot connect to MySQL: $_"
        return $false
    }
}

# Create backup
function New-DatabaseBackup {
    Write-Header "Creating Database Backup"
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $BackupDir "backup_$timestamp.sql"
    
    Write-Info "Backing up database to: $backupFile"
    
    try {
        & mysqldump -h$DbHost -P$DbPort -u$DbUser -p$DbPassword $DbName > $backupFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backup created successfully"
            Write-Host "Backup location: $backupFile"
            return $backupFile
        } else {
            Write-Error-Custom "Backup failed"
            exit 1
        }
    } catch {
        Write-Error-Custom "Backup failed: $_"
        exit 1
    }
}

# Execute SQL script
function Invoke-SqlScript {
    param(
        [string]$ScriptFile,
        [string]$Description
    )
    
    Write-Header $Description
    Write-Info "Executing: $ScriptFile"
    
    try {
        & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword $DbName < $ScriptFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$Description completed"
            return $true
        } else {
            Write-Error-Custom "$Description failed"
            return $false
        }
    } catch {
        Write-Error-Custom "$Description failed: $_"
        return $false
    }
}

# Verify migration
function Test-Migration {
    Write-Header "Verifying Migration"
    
    # Check patients without user_id
    $query1 = "SELECT COUNT(*) FROM patients WHERE user_id IS NULL;"
    $patientsWithoutUser = & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword -N -e $query1 $DbName
    
    if ($patientsWithoutUser -eq 0) {
        Write-Success "All patients have user_id"
    } else {
        Write-Error-Custom "$patientsWithoutUser patients are missing user_id"
        return $false
    }
    
    # Check orphaned patients
    $query2 = "SELECT COUNT(*) FROM patients p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id IS NOT NULL AND u.id IS NULL;"
    $orphaned = & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword -N -e $query2 $DbName
    
    if ($orphaned -eq 0) {
        Write-Success "No orphaned patient records"
    } else {
        Write-Error-Custom "$orphaned orphaned patient records found"
        return $false
    }
    
    # Check total counts
    $totalPatients = & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword -N -e "SELECT COUNT(*) FROM patients;" $DbName
    $totalUsers = & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword -N -e "SELECT COUNT(*) FROM users;" $DbName
    $migratedUsers = & mysql -h$DbHost -P$DbPort -u$DbUser -p$DbPassword -N -e "SELECT COUNT(*) FROM users WHERE email LIKE '%@migrated.local';" $DbName
    
    Write-Info "Total patients: $totalPatients"
    Write-Info "Total users: $totalUsers"
    Write-Info "Migrated users: $migratedUsers"
    
    Write-Success "Migration verification passed"
    return $true
}

# Main execution
function Main {
    Write-Header "User-Patient Migration Script"
    Write-Host "Database: $DbName"
    Write-Host "Host: ${DbHost}:${DbPort}"
    Write-Host "User: $DbUser"
    Write-Host ""
    
    # Check if password is provided
    if ([string]::IsNullOrEmpty($DbPassword)) {
        Write-Error-Custom "Database password is required"
        Write-Host "Usage: .\run_migration.ps1 -DbPassword 'your_password'"
        Write-Host "   or: .\run_migration.ps1 -DbHost localhost -DbPort 3306 -DbName alzheimer_db -DbUser root -DbPassword 'your_password'"
        exit 1
    }
    
    # Check MySQL connection
    if (-not (Test-MySqlConnection)) {
        exit 1
    }
    
    # Confirm execution
    Write-Warning-Custom "This script will modify the database. A backup will be created."
    $confirm = Read-Host "Do you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "Migration cancelled"
        exit 0
    }
    
    # Create backup
    $backupFile = New-DatabaseBackup
    
    # Execute migration scripts
    $script1 = Join-Path $ScriptDir "001_migrate_existing_users.sql"
    if (-not (Invoke-SqlScript -ScriptFile $script1 -Description "Step 1: Migrate Existing Users")) {
        Write-Error-Custom "Migration failed at step 1"
        exit 1
    }
    
    $script2 = Join-Path $ScriptDir "002_update_patients_user_id.sql"
    if (-not (Invoke-SqlScript -ScriptFile $script2 -Description "Step 2: Update Patient User IDs")) {
        Write-Error-Custom "Migration failed at step 2"
        exit 1
    }
    
    # Verify migration
    if (-not (Test-Migration)) {
        Write-Error-Custom "Migration verification failed"
        Write-Warning-Custom "Check the verification script output for details"
        $script3 = Join-Path $ScriptDir "003_verify_migration.sql"
        Invoke-SqlScript -ScriptFile $script3 -Description "Step 3: Detailed Verification"
        exit 1
    }
    
    # Run full verification
    $script3 = Join-Path $ScriptDir "003_verify_migration.sql"
    Invoke-SqlScript -ScriptFile $script3 -Description "Step 3: Detailed Verification"
    
    Write-Header "Migration Completed Successfully"
    Write-Success "All migration steps completed"
    Write-Success "All verification checks passed"
    Write-Info "Backup location: $backupFile"
    
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. Review the verification output above"
    Write-Host "  2. Test application functionality"
    Write-Host "  3. Monitor service logs"
    Write-Host "  4. Consider making user_id NOT NULL:"
    Write-Host "     ALTER TABLE patients MODIFY COLUMN user_id BIGINT NOT NULL;"
}

# Run main function
Main
