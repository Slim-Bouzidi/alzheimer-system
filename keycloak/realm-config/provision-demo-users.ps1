param(
    [string]$KeycloakUrl = 'http://localhost:8081',
    [string]$Realm = 'alzheimer-realm',
    [string]$AdminUser = 'admin',
    [string]$AdminPassword = 'admin',
    [string]$KeycloakContainerName = 'docker-keycloak-1'
)

$ErrorActionPreference = 'Stop'
$script:UseKcadmRoleMapping = $false

function Get-AdminToken {
    param(
        [string]$Url,
        [string]$User,
        [string]$Password
    )

    $body = @{
        username   = $User
        password   = $Password
        grant_type = 'password'
        client_id  = 'admin-cli'
    }

    return (Invoke-RestMethod -Uri "$Url/realms/master/protocol/openid-connect/token" -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded').access_token
}

function Invoke-Keycloak {
    param(
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers,
        [object]$Body,
        [switch]$AllowNotFound
    )

    try {
        $requestParams = @{
            Uri     = $Uri
            Method  = $Method
            Headers = $Headers
        }

        if ($PSBoundParameters.ContainsKey('Body')) {
            $payload = $Body
            if ($Body -isnot [string]) {
                $payload = $Body | ConvertTo-Json -Depth 10
            }

            $requestParams['Body'] = $payload
            $requestParams['ContentType'] = 'application/json'
        }

        $response = Invoke-WebRequest @requestParams
        if ([string]::IsNullOrWhiteSpace($response.Content)) {
            return $null
        }

        return $response.Content | ConvertFrom-Json
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($AllowNotFound -and $statusCode -eq 404) {
            return $null
        }

        throw
    }
}

function Ensure-RealmRole {
    param(
        [string]$RoleName,
        [string]$Description,
        [string]$BaseAdminUrl,
        [hashtable]$Headers
    )

    $existingRole = Invoke-Keycloak -Method Get -Uri "$BaseAdminUrl/roles/$RoleName" -Headers $Headers -AllowNotFound
    if ($null -eq $existingRole) {
        Invoke-Keycloak -Method Post -Uri "$BaseAdminUrl/roles" -Headers $Headers -Body @{ name = $RoleName; description = $Description } | Out-Null
        $existingRole = Invoke-Keycloak -Method Get -Uri "$BaseAdminUrl/roles/$RoleName" -Headers $Headers
        Write-Host "Created role: $RoleName"
    }
    else {
        Write-Host "Role already present: $RoleName"
    }

    return $existingRole
}

function Ensure-User {
    param(
        [hashtable]$UserDefinition,
        [object]$RoleDefinition,
        [string]$BaseAdminUrl,
        [hashtable]$Headers
    )

    $lookupUrl = "$BaseAdminUrl/users?username=$([uri]::EscapeDataString($UserDefinition.username))&exact=true"
    $users = @(Invoke-Keycloak -Method Get -Uri $lookupUrl -Headers $Headers)

    $userBody = @{
        username      = $UserDefinition.username
        email         = $UserDefinition.email
        enabled       = $true
        emailVerified = $true
        firstName     = $UserDefinition.firstName
        lastName      = $UserDefinition.lastName
    }

    if ($users.Count -eq 0) {
        Invoke-Keycloak -Method Post -Uri "$BaseAdminUrl/users" -Headers $Headers -Body $userBody | Out-Null
        $users = @(Invoke-Keycloak -Method Get -Uri $lookupUrl -Headers $Headers)
        Write-Host "Created user: $($UserDefinition.username)"
    }
    else {
        Invoke-Keycloak -Method Put -Uri "$BaseAdminUrl/users/$($users[0].id)" -Headers $Headers -Body $userBody | Out-Null
        Write-Host "Updated user: $($UserDefinition.username)"
    }

    $userId = $users[0].id

    $passwordBody = @{
        type      = 'password'
        value     = $UserDefinition.password
        temporary = $false
    }
    Invoke-Keycloak -Method Put -Uri "$BaseAdminUrl/users/$userId/reset-password" -Headers $Headers -Body $passwordBody | Out-Null
    Write-Host "Reset password for $($UserDefinition.username)"

    $assignedRoles = @(Invoke-Keycloak -Method Get -Uri "$BaseAdminUrl/users/$userId/role-mappings/realm" -Headers $Headers)
    if (-not ($assignedRoles.name -contains $RoleDefinition.name)) {
        if ($script:UseKcadmRoleMapping) {
            & docker exec $KeycloakContainerName /opt/keycloak/bin/kcadm.sh add-roles -r $Realm --uusername $UserDefinition.username --rolename $RoleDefinition.name | Out-Null
        }
        else {
            Invoke-Keycloak -Method Post -Uri "$BaseAdminUrl/users/$userId/role-mappings/realm" -Headers $Headers -Body @($RoleDefinition) | Out-Null
        }

        Write-Host "Assigned role $($RoleDefinition.name) to $($UserDefinition.username)"
    }
    else {
        Write-Host "Role $($RoleDefinition.name) already assigned to $($UserDefinition.username)"
    }
}

$token = Get-AdminToken -Url $KeycloakUrl -User $AdminUser -Password $AdminPassword
$headers = @{ Authorization = "Bearer $token" }
$baseAdminUrl = "$KeycloakUrl/admin/realms/$Realm"

if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        & docker exec $KeycloakContainerName /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user $AdminUser --password $AdminPassword | Out-Null
        $script:UseKcadmRoleMapping = $true
        Write-Host "Using kcadm for role assignment via container $KeycloakContainerName"
    }
    catch {
        Write-Host "kcadm setup failed, falling back to REST role mapping"
    }
}

$roles = @(
    @{ name = 'ADMIN'; description = 'Administrator role with full system access' },
    @{ name = 'DOCTOR'; description = 'Doctor role with access to patient medical data' },
    @{ name = 'SOIGNANT'; description = 'Soignant role with access to care coordination and monitoring flows' },
    @{ name = 'CAREGIVER'; description = 'Caregiver role with access to patient care information' },
    @{ name = 'PATIENT'; description = 'Patient role with access to own data' },
    @{ name = 'LIVREUR'; description = 'Livreur role with access to logistics and delivery operations' }
)

$users = @(
    @{ username = 'admin'; email = 'admin@alzheimer.fr'; password = 'admin123'; firstName = 'Admin'; lastName = 'System'; role = 'ADMIN' },
    @{ username = 'doctor'; email = 'doctor@alzheimer.fr'; password = 'doctor123'; firstName = 'Marc'; lastName = 'Lefebvre'; role = 'DOCTOR' },
    @{ username = 'soignant'; email = 'soignant@alzheimer.fr'; password = 'soignant123'; firstName = 'Claire'; lastName = 'Bernard'; role = 'SOIGNANT' },
    @{ username = 'aidant'; email = 'aidant@alzheimer.fr'; password = 'aidant123'; firstName = 'Nadia'; lastName = 'Ben Ali'; role = 'CAREGIVER' },
    @{ username = 'patient'; email = 'patient@alzheimer.fr'; password = 'patient123'; firstName = 'Alice'; lastName = 'Robert'; role = 'PATIENT' },
    @{ username = 'livreur'; email = 'livreur@alzheimer.fr'; password = 'livreur123'; firstName = 'Malek'; lastName = 'Delivery'; role = 'LIVREUR' }
)

$roleLookup = @{}
foreach ($role in $roles) {
    $roleLookup[$role.name] = Ensure-RealmRole -RoleName $role.name -Description $role.description -BaseAdminUrl $baseAdminUrl -Headers $headers
}

foreach ($user in $users) {
    Ensure-User -UserDefinition $user -RoleDefinition $roleLookup[$user.role] -BaseAdminUrl $baseAdminUrl -Headers $headers
}

Write-Host ''
Write-Host 'Provisioning complete. Demo accounts available:'
foreach ($user in $users) {
    Write-Host ("- {0} / {1} -> {2}" -f $user.username, $user.password, $user.role)
}