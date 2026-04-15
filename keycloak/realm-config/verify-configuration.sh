#!/bin/bash

# Script to verify Keycloak realm configuration
# Tests that all clients, roles, and settings are correctly configured

set -e

KEYCLOAK_URL="${KEYCLOAK_URL:-http://localhost:8081}"
REALM="alzheimer-realm"
CLIENT_ID="${KEYCLOAK_CLIENT_ID:-admin-cli}"
CLIENT_SECRET="${KEYCLOAK_ADMIN_SECRET}"

echo "=========================================="
echo "Keycloak Configuration Verification"
echo "=========================================="
echo ""
echo "Keycloak URL: $KEYCLOAK_URL"
echo "Realm: $REALM"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        print_result 0 "$description (HTTP $status)"
        return 0
    else
        print_result 1 "$description (Expected HTTP $expected_status, got $status)"
        return 1
    fi
}

echo "Test 1: Keycloak Server Availability"
echo "--------------------------------------"
test_endpoint "$KEYCLOAK_URL/realms/master" 200 "Keycloak server is running"
echo ""

echo "Test 2: Realm Existence"
echo "--------------------------------------"
test_endpoint "$KEYCLOAK_URL/realms/$REALM" 200 "Realm '$REALM' exists"
echo ""

echo "Test 3: Realm Configuration"
echo "--------------------------------------"
REALM_CONFIG=$(curl -s "$KEYCLOAK_URL/realms/$REALM")

# Check login theme
if echo "$REALM_CONFIG" | jq -e '.loginTheme == "mytheme"' > /dev/null 2>&1; then
    print_result 0 "Login theme is set to 'mytheme'"
else
    print_result 1 "Login theme is not set to 'mytheme'"
fi

# Check email as username
if echo "$REALM_CONFIG" | jq -e '.registrationEmailAsUsername == true' > /dev/null 2>&1; then
    print_result 0 "Email as username is enabled"
else
    print_result 1 "Email as username is not enabled"
fi

echo ""

echo "Test 4: OIDC Configuration"
echo "--------------------------------------"
test_endpoint "$KEYCLOAK_URL/realms/$REALM/.well-known/openid-configuration" 200 "OIDC discovery endpoint"
test_endpoint "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/certs" 200 "JWKS endpoint"
echo ""

echo "Test 5: Client Credentials Grant (admin-cli)"
echo "--------------------------------------"

if [ -z "$CLIENT_SECRET" ]; then
    echo -e "${YELLOW}⚠ SKIP${NC}: CLIENT_SECRET not provided (set KEYCLOAK_ADMIN_SECRET environment variable)"
    echo ""
else
    TOKEN_RESPONSE=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=client_credentials" \
        -d "client_id=$CLIENT_ID" \
        -d "client_secret=$CLIENT_SECRET")
    
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')
    
    if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
        print_result 0 "Client credentials grant successful"
        
        # Decode JWT to check roles
        JWT_PAYLOAD=$(echo "$ACCESS_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null || echo "{}")
        
        # Check if service account has required roles
        if echo "$JWT_PAYLOAD" | jq -e '.resource_access."realm-management".roles | contains(["manage-users"])' > /dev/null 2>&1; then
            print_result 0 "Service account has 'manage-users' role"
        else
            print_result 1 "Service account missing 'manage-users' role"
        fi
        
        if echo "$JWT_PAYLOAD" | jq -e '.resource_access."realm-management".roles | contains(["view-users"])' > /dev/null 2>&1; then
            print_result 0 "Service account has 'view-users' role"
        else
            print_result 1 "Service account missing 'view-users' role"
        fi
    else
        print_result 1 "Client credentials grant failed"
        echo "Response: $TOKEN_RESPONSE"
    fi
    echo ""
fi

echo "Test 6: Realm Roles"
echo "--------------------------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    ROLES=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$REALM/roles")
    
    for role in "ADMIN" "DOCTOR" "CAREGIVER" "PATIENT"; do
        if echo "$ROLES" | jq -e ".[] | select(.name == \"$role\")" > /dev/null 2>&1; then
            print_result 0 "Realm role '$role' exists"
        else
            print_result 1 "Realm role '$role' not found"
        fi
    done
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Cannot verify roles without access token"
fi
echo ""

echo "Test 7: Client Configuration"
echo "--------------------------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    CLIENTS=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        "$KEYCLOAK_URL/admin/realms/$REALM/clients")
    
    # Check alzheimer-angular-client
    ANGULAR_CLIENT=$(echo "$CLIENTS" | jq '.[] | select(.clientId == "alzheimer-angular-client")')
    
    if [ -n "$ANGULAR_CLIENT" ]; then
        print_result 0 "Client 'alzheimer-angular-client' exists"
        
        # Check if public client
        if echo "$ANGULAR_CLIENT" | jq -e '.publicClient == true' > /dev/null 2>&1; then
            print_result 0 "Angular client is public"
        else
            print_result 1 "Angular client is not public"
        fi
        
        # Check if standard flow enabled
        if echo "$ANGULAR_CLIENT" | jq -e '.standardFlowEnabled == true' > /dev/null 2>&1; then
            print_result 0 "Angular client has standard flow enabled"
        else
            print_result 1 "Angular client standard flow not enabled"
        fi
        
        # Check PKCE
        if echo "$ANGULAR_CLIENT" | jq -e '.attributes."pkce.code.challenge.method" == "S256"' > /dev/null 2>&1; then
            print_result 0 "Angular client has PKCE S256 enabled"
        else
            print_result 1 "Angular client PKCE not configured correctly"
        fi
    else
        print_result 1 "Client 'alzheimer-angular-client' not found"
    fi
    
    # Check admin-cli client
    ADMIN_CLIENT=$(echo "$CLIENTS" | jq '.[] | select(.clientId == "admin-cli")')
    
    if [ -n "$ADMIN_CLIENT" ]; then
        print_result 0 "Client 'admin-cli' exists"
        
        # Check if confidential
        if echo "$ADMIN_CLIENT" | jq -e '.publicClient == false' > /dev/null 2>&1; then
            print_result 0 "Admin client is confidential"
        else
            print_result 1 "Admin client is not confidential"
        fi
        
        # Check if service accounts enabled
        if echo "$ADMIN_CLIENT" | jq -e '.serviceAccountsEnabled == true' > /dev/null 2>&1; then
            print_result 0 "Admin client has service accounts enabled"
        else
            print_result 1 "Admin client service accounts not enabled"
        fi
    else
        print_result 1 "Client 'admin-cli' not found"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Cannot verify clients without access token"
fi
echo ""

echo "Test 8: Custom Theme"
echo "--------------------------------------"

# Test if login page uses custom theme
LOGIN_PAGE=$(curl -s "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/auth?client_id=alzheimer-angular-client&response_type=code&redirect_uri=http://localhost:4200")

if echo "$LOGIN_PAGE" | grep -q "Alzheimer Support System"; then
    print_result 0 "Custom theme is active (found 'Alzheimer Support System' title)"
else
    print_result 1 "Custom theme may not be active"
fi
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Configuration is correct.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the configuration.${NC}"
    exit 1
fi
