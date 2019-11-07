import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { SuplyTransaction } from 'app/shared/fuelling-point/suply-transaction';
import { AuxiliarActionsManagerService } from 'app/services/auxiliar-actions/auxiliar-actions-manager.service';

@Injectable()
export class FuellingPointTestInternalService {

  constructor (
  private _auxActionsManager: AuxiliarActionsManagerService,
) {
  }

  showTestFuellingPoint(supplyTransaction: SuplyTransaction): Observable<boolean> {
    return Observable.create((observer: Subscriber<boolean>) => {
      this._auxActionsManager.requestFuellingPointTest(supplyTransaction)
      .first().subscribe(response => {
        if (response == true) {
          observer.next(true);
        } else {
          observer.next(false);
        }
      });
    });
  }
}
