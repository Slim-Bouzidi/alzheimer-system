# Keycloak Realm Configuration

This directory contains the Keycloak realm configuration for the Alzheimer Support System.

## Configuration File

- **alzheimer-realm.json**: Complete realm configuration including clients, roles, and settings

## Realm Settings

- **Realm Name**: alzheimer-realm
- **Display Name**: Alzheimer Support System
- **Email as Username**: Enabled
- **Login Theme**: mytheme (custom theme located in `/themes/mytheme`)
- **User Registration**: Disabled (custom registration flow via User Service)

## Clients

### 1. alzheimer-angular-client (Public Client)

**Purpose**: Angular frontend application authentication

**Configuration**:
- Client ID: `alzheimer-angular-client`
- Access Type: Public
- Standard Flow: Enabled (Authorization Code Flow)
- Direct Access Grants: Disabled
- Valid Redirect URIs: `http://localhost:4200/*`
- Web Origins: `http://localhost:4200`
- PKCE: S256 (required for security)

**Usage**: This client is used by the Angular frontend to authenticate users via OAuth2 Authorization Code Flow with PKCE.

### 2. admin-cli (Confidential Client)

**Purpose**: User Service backend for programmatic user management

**Configuration**:
- Client ID: `admin-cli`
- Access Type: Confidential
- Service Accounts: Enabled
- Standard Flow: Disabled
- Direct Access Grants: Disabled

**Required Service Account Roles**:
- `realm-management` → `manage-users`
- `realm-management` → `manage-clients`
- `realm-management` → `view-users`

**Important**: After importing the realm, you must:
1. Generate a new client secret for `admin-cli`
2. Store the secret in environment variable `KEYCLOAK_ADMIN_SECRET`
3. Configure the service account roles manually in Keycloak Admin Console

## Realm Roles

The following realm roles are configured:

1. **ADMIN**: Administrator role with full system access
2. **DOCTOR**: Doctor role with access to patient medical data
3. **CAREGIVER**: Caregiver role with access to patient care information
4. **PATIENT**: Patient role with access to own data

## Import Instructions

### Method 1: Import via Keycloak Admin Console

1. Start Keycloak (via Docker Compose or standalone)
2. Login to Keycloak Admin Console: http://localhost:8081
3. Navigate to: **Create Realm** button (top left)
4. Click **Browse** and select `alzheimer-realm.json`
5. Click **Create**

### Method 2: Import via Docker Compose

Add the following to your Keycloak service in `docker-compose.yml`:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:23.0.0
  volumes:
    - ./keycloak/realm-config:/opt/keycloak/data/import
    - ./themes:/opt/keycloak/themes
  command:
    - start-dev
    - --import-realm
```

The `--import-realm` flag will automatically import all JSON files from `/opt/keycloak/data/import` on startup.

### Method 3: Import via Keycloak CLI

```bash
# Using kcadm.sh (Keycloak Admin CLI)
./kcadm.sh config credentials --server http://localhost:8081 --realm master --user admin --password admin
./kcadm.sh create realms -f alzheimer-realm.json
```

## Post-Import Configuration

After importing the realm, complete these manual steps:

### 1. Configure admin-cli Client Secret

```bash
# In Keycloak Admin Console:
# 1. Go to: alzheimer-realm → Clients → admin-cli
# 2. Go to: Credentials tab
# 3. Click "Regenerate Secret"
# 4. Copy the secret and add to your environment:

export KEYCLOAK_ADMIN_SECRET="<generated-secret>"
```

### 2. Assign Service Account Roles

```bash
# In Keycloak Admin Console:
# 1. Go to: alzheimer-realm → Clients → admin-cli
# 2. Go to: Service Account Roles tab
# 3. In "Client Roles" dropdown, select: realm-management
# 4. Assign these roles:
#    - manage-users
#    - manage-clients
#    - view-users
```

### 3. Verify Theme Installation

```bash
# Ensure the custom theme is available:
# 1. Go to: alzheimer-realm → Realm Settings → Themes
# 2. Login Theme dropdown should show "mytheme"
# 3. If not visible, restart Keycloak to reload themes
```

## Testing the Configuration

### Test Angular Client (Authorization Code Flow)

1. Navigate to: http://localhost:4200
2. Click login - should redirect to Keycloak login page with custom theme
3. After login, should redirect back with authorization code
4. Angular app should exchange code for JWT token

### Test admin-cli Client (Service Account)

```bash
# Get access token using client credentials
curl -X POST http://localhost:8081/realms/alzheimer-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-cli" \
  -d "client_secret=<your-secret>"

# Response should include access_token
```

### Test User Creation via Admin API

```bash
# Using the access token from above
curl -X POST http://localhost:8081/admin/realms/alzheimer-realm/users \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "email": "test@example.com",
    "enabled": true,
    "emailVerified": true
  }'
```

## Troubleshooting

### Theme Not Showing

- Verify theme files are in `/opt/keycloak/themes/mytheme/login/`
- Restart Keycloak to reload themes
- Check Keycloak logs for theme loading errors

### Client Secret Not Working

- Regenerate the secret in Keycloak Admin Console
- Update environment variable `KEYCLOAK_ADMIN_SECRET`
- Restart User Service

### Service Account Roles Missing

- Manually assign roles in Keycloak Admin Console
- Verify roles are assigned: Clients → admin-cli → Service Account Roles
- Test with a token request to verify permissions

### PKCE Errors

- Ensure `pkce.code.challenge.method` is set to `S256` in client attributes
- Verify Angular app is sending `code_challenge` and `code_challenge_method` parameters
- Check browser console for PKCE-related errors

## Security Notes

1. **Never commit client secrets to version control**
2. Use environment variables for sensitive configuration
3. In production, use HTTPS for all Keycloak URLs
4. Rotate client secrets regularly
5. Enable brute force protection (already configured in realm)
6. Review and audit service account permissions regularly

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth2 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [PKCE Specification](https://oauth.net/2/pkce/)
- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/)
