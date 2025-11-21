// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { App } from './app/app';

// bootstrapApplication(App, appConfig )
//   .catch((err) => console.error(err));


import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch  } from '@angular/common/http';

bootstrapApplication(App, {
  ...appConfig,
  providers: [
    provideHttpClient(withFetch()),
    ...(appConfig.providers || []),
    importProvidersFrom(BrowserAnimationsModule) // ✅ correct way to add it
  ],
})
.catch((err) => console.error(err));
