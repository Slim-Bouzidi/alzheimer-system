export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  keycloakUrl: 'http://localhost:8081',
  keycloakRealm: 'alzheimer-realm',
  keycloakClientId: 'alzheimer-frontend',
  /**
   * All REST calls must stay gateway-relative in the UI.
   * During local development, `proxy.conf.json` forwards `/api` to the gateway on port 8080.
   */
  supportNetworkApiUrl: 'http://localhost:8080/api',
  /**
   * SockJS endpoint for support-network notifications.
   * During local development, `proxy.conf.json` forwards `/ws` to the support-network service on port 8085.
   */
  supportNetworkWebSocketUrl: '/ws',
};

export const environmentProd = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  keycloakUrl: 'http://localhost:8081',
  keycloakRealm: 'alzheimer-realm',
  keycloakClientId: 'alzheimer-frontend',
  supportNetworkApiUrl: 'http://localhost:8080/api',
  supportNetworkWebSocketUrl: '/ws',
};
