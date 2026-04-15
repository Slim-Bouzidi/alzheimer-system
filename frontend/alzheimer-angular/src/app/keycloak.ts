import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'alzheimer-realm',
<<<<<<< HEAD
  clientId: 'alzheimer-frontend'
=======
  clientId: 'alzheimer-angular-client'
>>>>>>> cb099be (user ui update)
});

export default keycloak;
