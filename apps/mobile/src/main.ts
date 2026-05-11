import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideIonicAngular({ mode: 'ios', innerHTMLTemplatesEnabled: false }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
