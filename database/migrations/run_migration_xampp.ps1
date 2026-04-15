# XAMPP MySQL Migration Script
# Run this script to execute the foreign key constraint migration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Task 9 Migration: Add Foreign Key Constraint" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# XAMPP MySQL path (adjust if your XAMPP is installed elsewhere)
$mysqlPath = "C:\xampp\mysql\bin\mysql.exe"

# Check if MySQL exists
if (-not (Test-Path $mysqlPath)) {
    Write-Host "ERROR: MySQL not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Please update the `$mysqlPath variable in this script with your XAMPP MySQL path" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found MySQL at: $mysqlPath" -ForegroundColor Green
Write-Host ""

# Prompt for MySQL root password
$password = Read-Host "Enter MySQL root password (press Enter if no password)"

Write-Host ""
Write-Host "Running migration on patientdb database..." -ForegroundColor Yellow
Write-Host ""

# Run the migration
if ($password -eq "") {
    & $mysqlPath -u root patientdb < "database/migrations/004_add_foreign_key_constraint.sql"
} else {
    & $mysqlPath -u root -p$password patientdb < "database/migrations/004_add_foreign_key_constraint.sql"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test registration with PATIENT role" -ForegroundColor White
    Write-Host "2. Verify patient record is created in database" -ForegroundColor White
    Write-Host "3. Check patient appears in patient list" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Migration failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error message above and:" -ForegroundColor Yellow
    Write-Host "1. Ensure XAMPP MySQL is running" -ForegroundColor White
    Write-Host "2. Verify patientdb database exists" -ForegroundColor White
    Write-Host "3. Check that patients table has user_id column" -ForegroundColor White
}
