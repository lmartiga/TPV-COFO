import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class RunawayPaymentInternalService {

  private _paymentFinalizedRequested: Subject<boolean> = new Subject();

  paymentFinalized(result: boolean) {
    this._paymentFinalizedRequested.next(result);
  }

  onPaymentFinalized(): Observable<boolean> {
    return this._paymentFinalizedRequested.asObservable();
  }
}