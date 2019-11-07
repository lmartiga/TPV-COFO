import './polyfills.ts';
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { TPVModule } from './app/tpv.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  if(window){
    window.console.log=function(){};
    window.console.debug= function(){};
    window.console.error= function(){};
  }
}
platformBrowserDynamic().bootstrapModule(TPVModule);
