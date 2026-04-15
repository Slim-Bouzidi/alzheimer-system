#!/bin/bash

# Script to configure admin-cli client service account roles
# This script must be run after importing the realm configuration

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8081}"
ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"
REALM="alzheimer-realm"

echo "=========================================="
echo "Keycloak admin-cli Configuration Script"
echo "=========================================="
echo ""
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo ""

# Check if kcadm.sh is available
if ! command -v kcadm.sh &> /dev/null; then
    echo "ERROR: kcadm.sh not found in PATH"
    echo "Please ensure Keycloak bin directory is in your PATH or run this script from Keycloak installation directory"
    exit 1
fi

echo "Step 1: Authenticating with Keycloak..."
kcadm.sh config credentials \
    --server "$KEYCLOAK_URL" \
    --realm master \
    --user "$ADMIN_USER" \
    --password "$ADMIN_PASSWORD"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to authenticate with Keycloak"
    exit 1
fi

echo "✓ Authentication successful"
echo ""

echo "Step 2: Getting admin-cli client ID..."
CLIENT_UUID=$(kcadm.sh get clients -r "$REALM" --fields id,clientId | \
    jq -r '.[] | select(.clientId=="admin-cli") | .id')

if [ -z "$CLIENT_UUID" ]; then
    echo "ERROR: admin-cli client not found in realm $REALM"
    echo "Please ensure the realm has been imported correctly"
    exit 1
fi

echo "✓ Found admin-cli client: $CLIENT_UUID"
echo ""

echo "Step 3: Getting realm-management client ID..."
REALM_MGMT_UUID=$(kcadm.sh get clients -r "$REALM" --fields id,clientId | \
    jq -r '.[] | select(.clientId=="realm-management") | .id')

if [ -z "$REALM_MGMT_UUID" ]; then
    echo "ERROR: realm-management client not found"
    exit 1
fi

echo "✓ Found realm-management client: $REALM_MGMT_UUID"
echo ""

echo "Step 4: Getting service account user ID..."
SERVICE_ACCOUNT_USER=$(kcadm.sh get clients/"$CLIENT_UUID"/service-account-user -r "$REALM" | \
    jq -r '.id')

if [ -z "$SERVICE_ACCOUNT_USER" ]; then
    echo "ERROR: Service account user not found for admin-cli"
    echo "Please ensure service accounts are enabled for admin-cli client"
    exit 1
fi

echo "✓ Found service account user: $SERVICE_ACCOUNT_USER"
echo ""

echo "Step 5: Getting required roles from realm-management..."

# Get manage-users role
MANAGE_USERS_ROLE=$(kcadm.sh get clients/"$REALM_MGMT_UUID"/roles/manage-users -r "$REALM")
MANAGE_USERS_ID=$(echo "$MANAGE_USERS_ROLE" | jq -r '.id')
MANAGE_USERS_NAME=$(echo "$MANAGE_USERS_ROLE" | jq -r '.name')

# Get manage-clients role
MANAGE_CLIENTS_ROLE=$(kcadm.sh get clients/"$REALM_MGMT_UUID"/roles/manage-clients -r "$REALM")
MANAGE_CLIENTS_ID=$(echo "$MANAGE_CLIENTS_ROLE" | jq -r '.id')
MANAGE_CLIENTS_NAME=$(echo "$MANAGE_CLIENTS_ROLE" | jq -r '.name')

# Get view-users role
VIEW_USERS_ROLE=$(kcadm.sh get clients/"$REALM_MGMT_UUID"/roles/view-users -r "$REALM")
VIEW_USERS_ID=$(echo "$VIEW_USERS_ROLE" | jq -r '.id')
VIEW_USERS_NAME=$(echo "$VIEW_USERS_ROLE" | jq -r '.name')

echo "✓ Found required roles:"
echo "  - manage-users: $MANAGE_USERS_ID"
echo "  - manage-clients: $MANAGE_CLIENTS_ID"
echo "  - view-users: $VIEW_USERS_ID"
echo ""

echo "Step 6: Assigning roles to service account..."

# Create JSON payload with all roles
ROLES_JSON=$(cat <<EOF
[
  {
    "id": "$MANAGE_USERS_ID",
    "name": "$MANAGE_USERS_NAME",
    "composite": false,
    "clientRole": true,
    "containerId": "$REALM_MGMT_UUID"
  },
  {
    "id": "$MANAGE_CLIENTS_ID",
    "name": "$MANAGE_CLIENTS_NAME",
    "composite": false,
    "clientRole": true,
    "containerId": "$REALM_MGMT_UUID"
  },
  {
    "id": "$VIEW_USERS_ID",
    "name": "$VIEW_USERS_NAME",
    "composite": false,
    "clientRole": true,
    "containerId": "$REALM_MGMT_UUID"
  }
]
EOF
)

# Assign roles
echo "$ROLES_JSON" | kcadm.sh create \
    users/"$SERVICE_ACCOUNT_USER"/role-mappings/clients/"$REALM_MGMT_UUID" \
    -r "$REALM" \
    -f -

if [ $? -eq 0 ]; then
    echo "✓ Roles assigned successfully"
else
    echo "⚠ Warning: Some roles may already be assigned (this is OK)"
fi

echo ""

echo "Step 7: Verifying role assignments..."
ASSIGNED_ROLES=$(kcadm.sh get \
    users/"$SERVICE_ACCOUNT_USER"/role-mappings/clients/"$REALM_MGMT_UUID" \
    -r "$REALM" | jq -r '.[].name')

echo "✓ Currently assigned roles:"
echo "$ASSIGNED_ROLES" | while read -r role; do
    echo "  - $role"
done

echo ""

echo "Step 8: Getting admin-cli client secret..."
CLIENT_SECRET=$(kcadm.sh get clients/"$CLIENT_UUID"/client-secret -r "$REALM" | jq -r '.value')

if [ -z "$CLIENT_SECRET" ] || [ "$CLIENT_SECRET" = "null" ]; then
    echo "⚠ No client secret found. Generating new secret..."
    kcadm.sh create clients/"$CLIENT_UUID"/client-secret -r "$REALM"
    CLIENT_SECRET=$(kcadm.sh get clients/"$CLIENT_UUID"/client-secret -r "$REALM" | jq -r '.value')
fi

echo "✓ Client secret retrieved"
echo ""

echo "=========================================="
echo "Configuration Complete!"
echo "=========================================="
echo ""
echo "IMPORTANT: Save the following client secret to your environment:"
echo ""
echo "export KEYCLOAK_ADMIN_SECRET=\"$CLIENT_SECRET\""
echo ""
echo "Add this to your .env file or docker-compose.yml environment variables"
echo ""
echo "Test the configuration with:"
echo ""
echo "curl -X POST $KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"grant_type=client_credentials\" \\"
echo "  -d \"client_id=admin-cli\" \\"
echo "  -d \"client_secret=$CLIENT_SECRET\""
echo ""
