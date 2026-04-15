# Keycloak Configuration Quick Start

This guide provides step-by-step instructions to set up Keycloak with the Alzheimer Support System realm configuration.

## Prerequisites

- Docker and Docker Compose installed
- Keycloak 23.0.0 or later
- Custom theme files in `/themes/mytheme/` directory

## Quick Setup (3 Steps)

### Step 1: Start Keycloak with Realm Import

Add to your `docker-compose.yml`:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:23.0.0
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
  ports:
    - "8081:8080"
  volumes:
    - ./keycloak/realm-config:/opt/keycloak/data/import
    - ./themes:/opt/keycloak/themes
  command:
    - start-dev
    - --import-realm
```

Start Keycloak:

```bash
docker-compose up -d keycloak
```

Wait for Keycloak to start (check logs):

```bash
docker-compose logs -f keycloak
# Wait for: "Keycloak 23.0.0 started"
```

### Step 2: Configure admin-cli Client

Run the configuration script:

**Linux/Mac:**
```bash
cd keycloak/realm-config
chmod +x configure-admin-cli.sh
./configure-admin-cli.sh
```

**Windows:**
```powershell
cd keycloak\realm-config
.\configure-admin-cli.ps1
```

**Save the client secret** displayed at the end:

```bash
export KEYCLOAK_ADMIN_SECRET="<your-secret-here>"
```

### Step 3: Verify Configuration

Run the verification script:

```bash
cd keycloak/realm-config
chmod +x verify-configuration.sh
export KEYCLOAK_ADMIN_SECRET="<your-secret-from-step-2>"
./verify-configuration.sh
```

If all tests pass, you're ready to go! ✓

## What Gets Configured

### Realm Settings
- ✓ Realm name: `alzheimer-realm`
- ✓ Display name: "Alzheimer Support System"
- ✓ Email as username: Enabled
- ✓ Login theme: `mytheme`
- ✓ User registration: Disabled (custom flow)

### Clients

#### 1. alzheimer-angular-client (Public)
- ✓ Authorization Code Flow with PKCE
- ✓ Redirect URIs: `http://localhost:4200/*`
- ✓ Web origins: `http://localhost:4200`
- ✓ PKCE method: S256

#### 2. admin-cli (Confidential)
- ✓ Service accounts enabled
- ✓ Client credentials grant
- ✓ Roles: manage-users, view-users, manage-clients

### Realm Roles
- ✓ ADMIN
- ✓ DOCTOR
- ✓ CAREGIVER
- ✓ PATIENT

## Testing the Setup

### Test 1: Access Keycloak Admin Console

```
URL: http://localhost:8081
Username: admin
Password: admin
```

Navigate to: **alzheimer-realm** → Verify settings

### Test 2: Test Custom Theme

```
URL: http://localhost:8081/realms/alzheimer-realm/protocol/openid-connect/auth?client_id=alzheimer-angular-client&response_type=code&redirect_uri=http://localhost:4200
```

You should see the custom login page with "Alzheimer Support System" branding.

### Test 3: Test Client Credentials Grant

```bash
curl -X POST http://localhost:8081/realms/alzheimer-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-cli" \
  -d "client_secret=$KEYCLOAK_ADMIN_SECRET"
```

Should return an access token.

### Test 4: Test User Creation via Admin API

```bash
# Get access token first
TOKEN=$(curl -s -X POST http://localhost:8081/realms/alzheimer-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=admin-cli" \
  -d "client_secret=$KEYCLOAK_ADMIN_SECRET" | jq -r '.access_token')

# Create test user
curl -X POST http://localhost:8081/admin/realms/alzheimer-realm/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "email": "test@example.com",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Test",
    "lastName": "User"
  }'
```

Should return HTTP 201 Created.

## Environment Variables

Add these to your `.env` file or `docker-compose.yml`:

```bash
# Keycloak Admin API
KEYCLOAK_ADMIN_SECRET=<your-secret-from-step-2>
KEYCLOAK_ADMIN_PASSWORD=admin

# User Service Configuration
KEYCLOAK_ADMIN_SERVER_URL=http://localhost:8081
KEYCLOAK_ADMIN_REALM=alzheimer-realm
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli

# JWT Validation (API Gateway)
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=http://localhost:8081/realms/alzheimer-realm
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_JWK_SET_URI=http://localhost:8081/realms/alzheimer-realm/protocol/openid-connect/certs
```

## Troubleshooting

### Issue: Realm not imported

**Solution:**
- Check Keycloak logs: `docker-compose logs keycloak`
- Verify JSON file is valid: `jq . alzheimer-realm.json`
- Ensure volume mount is correct in docker-compose.yml
- Try manual import via Admin Console

### Issue: Custom theme not showing

**Solution:**
- Verify theme files exist: `ls -la themes/mytheme/login/`
- Check theme mount in docker-compose.yml
- Restart Keycloak: `docker-compose restart keycloak`
- Clear browser cache

### Issue: Client secret not working

**Solution:**
- Regenerate secret in Admin Console
- Update environment variable
- Restart User Service
- Verify secret with test curl command

### Issue: Service account roles missing

**Solution:**
- Run configure-admin-cli script again
- Manually assign roles in Admin Console:
  - Clients → admin-cli → Service Account Roles
  - Select realm-management → Assign roles

### Issue: PKCE errors in Angular

**Solution:**
- Verify PKCE method is S256 in client settings
- Check Angular keycloak-js configuration
- Ensure `pkceMethod: 'S256'` in keycloak.init()

## Next Steps

After successful configuration:

1. **Start User Service** with the `KEYCLOAK_ADMIN_SECRET` environment variable
2. **Test registration flow** from Angular frontend
3. **Verify JWT validation** at API Gateway
4. **Test user synchronization** on first API request

## Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth2 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)
- [PKCE Specification](https://oauth.net/2/pkce/)
- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/)

## Support

If you encounter issues:

1. Check the verification script output
2. Review Keycloak logs
3. Verify all environment variables are set
4. Consult the detailed README.md in this directory
