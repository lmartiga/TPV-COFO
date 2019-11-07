import { Injectable, ComponentRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { SlideOverService } from 'app/services/slide-over/slide-over.service';
import { GradesChangePricesComponent } from 'app/components/business-specific/grades-change-prices/grades-change-prices.component';

@Injectable()
export class GradesChangePricesInternalService {

  constructor( private _slider: SlideOverService) { }

  gradesChangePrices(): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      const componentRef: ComponentRef<GradesChangePricesComponent> =
        this._slider.openFromComponent(GradesChangePricesComponent);
      componentRef.instance.onFinish().subscribe((response: boolean) => {
        observer.next(response);
      });
    });
  }
  
}
