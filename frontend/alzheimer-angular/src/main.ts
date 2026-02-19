import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import keycloak from './app/keycloak';

keycloak.init({
  onLoad: 'login-required',
  checkLoginIframe: false
}).then(() => {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}).catch((error) => console.error('Keycloak init failed', error));
