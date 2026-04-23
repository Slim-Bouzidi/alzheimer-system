import Keycloak from 'keycloak-js';
import { environment } from '../environments/environment';

const keycloak = new Keycloak({
  url: environment.keycloakUrl,
  realm: environment.keycloakRealm,
  clientId: environment.keycloakClientId,
});

export default keycloak;
