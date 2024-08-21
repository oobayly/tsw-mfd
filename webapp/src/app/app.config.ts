import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NgxIndexedDBModule } from 'ngx-indexed-db';

import { routes } from './app.routes';
import { indexedDbConfig } from "./app.indexed-db";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(NgxIndexedDBModule.forRoot(indexedDbConfig))
  ]
};
