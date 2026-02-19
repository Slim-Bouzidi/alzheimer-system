import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'alzheimer-realm',
  clientId: 'alzheimer-frontend'
});

export default keycloak;
