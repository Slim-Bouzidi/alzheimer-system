export const environment = {
  production: false,
  apiUrl: 'http://localhost:8088/api',
  /**
   * Relative `/api` → `proxy.conf.json` (default gateway http://localhost:8088).
   * If the UI shows "Service Unavailable" (503): start Eureka + support-network-service so the gateway
   * can resolve lb://support-network-service, OR start the gateway with Spring profile `direct`, OR point
   * the proxy target at http://localhost:8082 to hit the microservice only.
   */
  supportNetworkApiUrl: '/api',
  /**
   * SockJS endpoint for STOMP (support-network-service). Not routed through the API gateway by default;
   * must match where the Spring Boot app exposes `/ws` (see WebSocketConfig).
   */
  supportNetworkWebSocketUrl: 'http://localhost:8082/ws',
};

export const environmentProd = {
  production: true,
  apiUrl: 'https://votre-domaine.com/api',
  supportNetworkApiUrl: 'https://votre-domaine.com/api',
  supportNetworkWebSocketUrl: 'https://votre-domaine.com/ws',
};
