import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'alzheimer-realm',
  clientId: 'alzheimer-angular-client'
});

export default keycloak;
