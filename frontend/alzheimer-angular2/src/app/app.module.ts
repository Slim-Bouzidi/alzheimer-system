import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TRANSLATE_HTTP_LOADER_CONFIG, TranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { firstValueFrom } from 'rxjs';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { SupportNetworkApiInterceptor } from './interceptors/support-network-api.interceptor';

export function appInitTranslate(translate: TranslateService) {
  return () => {
    translate.addLangs(['en', 'fr']);
    translate.setDefaultLang('en');
    return firstValueFrom(translate.use('en')).catch(() => null);
  };
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      fallbackLang: 'en',
      loader: { provide: TranslateLoader, useClass: TranslateHttpLoader },
    }),
    ToastrModule.forRoot()
  ],
  providers: [
    provideClientHydration(),
    providePrimeNG({
      theme: {
        preset: Aura
      },
      ripple: true
    }),
    AuthService,
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: { prefix: '/assets/i18n/', suffix: '.json' },
    },
    { provide: APP_INITIALIZER, useFactory: appInitTranslate, deps: [TranslateService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: SupportNetworkApiInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
