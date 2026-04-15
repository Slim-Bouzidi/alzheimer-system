# PowerShell script to configure admin-cli client service account roles
# This script must be run after importing the realm configuration

param(
    [string]$KeycloakUrl = "http://localhost:8081",
    [string]$AdminUser = "admin",
    [string]$AdminPassword = "admin",
    [string]$Realm = "alzheimer-realm"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Keycloak admin-cli Configuration Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Keycloak URL: $KeycloakUrl"
Write-Host "Realm: $Realm"
Write-Host ""

# Function to get access token
function Get-AdminToken {
    param($Url, $User, $Password)
    
    $body = @{
        username   = $User
        password   = $Password
        grant_type = "password"
        client_id  = "admin-cli"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$Url/realms/master/protocol/openid-connect/token" `
            -Method Post `
            -Body $body `
            -ContentType "application/x-www-form-urlencoded"
        
        return $response.access_token
    }
    catch {
        Write-Host "ERROR: Failed to authenticate with Keycloak" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

Write-Host "Step 1: Authenticating with Keycloak..." -ForegroundColor Yellow
$token = Get-AdminToken -Url $KeycloakUrl -User $AdminUser -Password $AdminPassword
Write-Host "✓ Authentication successful" -ForegroundColor Green
Write-Host ""

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "Step 2: Getting admin-cli client ID..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri "$KeycloakUrl/admin/realms/$Realm/clients" `
        -Method Get `
        -Headers $headers
    
    $adminCliClient = $clients | Where-Object { $_.clientId -eq "admin-cli" }
    
    if (-not $adminCliClient) {
        Write-Host "ERROR: admin-cli client not found in realm $Realm" -ForegroundColor Red
        Write-Host "Please ensure the realm has been imported correctly" -ForegroundColor Red
        exit 1
    }
    
    $clientUuid = $adminCliClient.id
    Write-Host "✓ Found admin-cli client: $clientUuid" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to get clients" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 3: Getting realm-management client ID..." -ForegroundColor Yellow
$realmMgmtClient = $clients | Where-Object { $_.clientId -eq "realm-management" }

if (-not $realmMgmtClient) {
    Write-Host "ERROR: realm-management client not found" -ForegroundColor Red
    exit 1
}

$realmMgmtUuid = $realmMgmtClient.id
Write-Host "✓ Found realm-management client: $realmMgmtUuid" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Getting service account user ID..." -ForegroundColor Yellow
try {
    $serviceAccountUser = Invoke-RestMethod `
        -Uri "$KeycloakUrl/admin/realms/$Realm/clients/$clientUuid/service-account-user" `
        -Method Get `
        -Headers $headers
    
    $serviceAccountUserId = $serviceAccountUser.id
    Write-Host "✓ Found service account user: $serviceAccountUserId" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Service account user not found for admin-cli" -ForegroundColor Red
    Write-Host "Please ensure service accounts are enabled for admin-cli client" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 5: Getting required roles from realm-management..." -ForegroundColor Yellow

$roleNames = @("manage-users", "manage-clients", "view-users")
$rolesToAssign = @()

foreach ($roleName in $roleNames) {
    try {
        $role = Invoke-RestMethod `
            -Uri "$KeycloakUrl/admin/realms/$Realm/clients/$realmMgmtUuid/roles/$roleName" `
            -Method Get `
            -Headers $headers
        
        $rolesToAssign += $role
        Write-Host "  ✓ Found role: $roleName ($($role.id))" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed to get role: $roleName" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "Step 6: Assigning roles to service account..." -ForegroundColor Yellow
try {
    $rolesJson = $rolesToAssign | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod `
        -Uri "$KeycloakUrl/admin/realms/$Realm/users/$serviceAccountUserId/role-mappings/clients/$realmMgmtUuid" `
        -Method Post `
        -Headers $headers `
        -Body $rolesJson | Out-Null
    
    Write-Host "✓ Roles assigned successfully" -ForegroundColor Green
}
catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠ Warning: Some roles may already be assigned (this is OK)" -ForegroundColor Yellow
    }
    else {
        Write-Host "ERROR: Failed to assign roles" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "Step 7: Verifying role assignments..." -ForegroundColor Yellow
try {
    $assignedRoles = Invoke-RestMethod `
        -Uri "$KeycloakUrl/admin/realms/$Realm/users/$serviceAccountUserId/role-mappings/clients/$realmMgmtUuid" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✓ Currently assigned roles:" -ForegroundColor Green
    foreach ($role in $assignedRoles) {
        Write-Host "  - $($role.name)" -ForegroundColor White
    }
}
catch {
    Write-Host "⚠ Warning: Could not verify role assignments" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 8: Getting admin-cli client secret..." -ForegroundColor Yellow
try {
    $secretResponse = Invoke-RestMethod `
        -Uri "$KeycloakUrl/admin/realms/$Realm/clients/$clientUuid/client-secret" `
        -Method Get `
        -Headers $headers
    
    $clientSecret = $secretResponse.value
    
    if (-not $clientSecret) {
        Write-Host "⚠ No client secret found. Generating new secret..." -ForegroundColor Yellow
        
        Invoke-RestMethod `
            -Uri "$KeycloakUrl/admin/realms/$Realm/clients/$clientUuid/client-secret" `
            -Method Post `
            -Headers $headers | Out-Null
        
        $secretResponse = Invoke-RestMethod `
            -Uri "$KeycloakUrl/admin/realms/$Realm/clients/$clientUuid/client-secret" `
            -Method Get `
            -Headers $headers
        
        $clientSecret = $secretResponse.value
    }
    
    Write-Host "✓ Client secret retrieved" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to get client secret" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Configuration Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Save the following client secret to your environment:" -ForegroundColor Yellow
Write-Host ""
Write-Host "`$env:KEYCLOAK_ADMIN_SECRET = `"$clientSecret`"" -ForegroundColor White
Write-Host ""
Write-Host "For permanent configuration, add to your system environment variables" -ForegroundColor Gray
Write-Host "or add to docker-compose.yml environment section" -ForegroundColor Gray
Write-Host ""
Write-Host "Test the configuration with:" -ForegroundColor Yellow
Write-Host ""
Write-Host "curl -X POST $KeycloakUrl/realms/$Realm/protocol/openid-connect/token ``" -ForegroundColor White
Write-Host "  -H `"Content-Type: application/x-www-form-urlencoded`" ``" -ForegroundColor White
Write-Host "  -d `"grant_type=client_credentials`" ``" -ForegroundColor White
Write-Host "  -d `"client_id=admin-cli`" ``" -ForegroundColor White
Write-Host "  -d `"client_secret=$clientSecret`"" -ForegroundColor White
Write-Host ""

# Optionally save to .env file
$saveToEnv = Read-Host "Would you like to save the secret to .env file? (y/n)"
if ($saveToEnv -eq "y" -or $saveToEnv -eq "Y") {
    $envPath = Join-Path $PSScriptRoot "../../.env"
    
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath -Raw
        if ($envContent -match "KEYCLOAK_ADMIN_SECRET=") {
            $envContent = $envContent -replace "KEYCLOAK_ADMIN_SECRET=.*", "KEYCLOAK_ADMIN_SECRET=$clientSecret"
        }
        else {
            $envContent += "`nKEYCLOAK_ADMIN_SECRET=$clientSecret"
        }
        Set-Content -Path $envPath -Value $envContent
    }
    else {
        Set-Content -Path $envPath -Value "KEYCLOAK_ADMIN_SECRET=$clientSecret"
    }
    
    Write-Host "✓ Secret saved to .env file" -ForegroundColor Green
}
